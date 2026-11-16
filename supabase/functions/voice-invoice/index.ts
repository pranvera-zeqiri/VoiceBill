const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const invoiceSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'client_name',
    'service_summary',
    'hours_worked',
    'materials_cost',
    'items',
    'subtotal',
    'vat_rate',
    'vat_amount',
    'total',
  ],
  properties: {
    client_name: { type: 'string' },
    service_summary: { type: 'string' },
    hours_worked: { type: 'number' },
    materials_cost: { type: 'number' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'quantity', 'unit', 'unit_price', 'total'],
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          unit_price: { type: 'number' },
          total: { type: 'number' },
        },
      },
    },
    subtotal: { type: 'number' },
    vat_rate: { type: 'number' },
    vat_amount: { type: 'number' },
    total: { type: 'number' },
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function positiveNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

async function ensureAuthenticated(request: Request) {
  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!authorization || !supabaseUrl || !anonKey) {
    throw new Error('Sesioni i përdoruesit nuk u verifikua. Kyçu sërish në aplikacion.');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: anonKey },
  });
  if (!response.ok) throw new Error('Sesioni ka skaduar. Kyçu sërish në aplikacion.');
}

async function transcribe(audio: File, apiKey: string, useGroq: boolean) {
  const form = new FormData();
  form.append('file', audio, audio.name || 'voice-invoice.m4a');
  form.append('model', useGroq ? 'whisper-large-v3' : 'whisper-1');
  form.append('response_format', 'json');

  const response = await fetch(
    useGroq
      ? 'https://api.groq.com/openai/v1/audio/transcriptions'
      : 'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    }
  );
  if (!response.ok) {
    console.error('Transcription provider returned an error:', response.status, await response.text());
    throw new Error('Transkriptimi i audios dështoi. Provo përsëri.');
  }
  const result = (await response.json()) as { text?: string };
  return result.text?.trim() ?? '';
}

async function extractInvoice(transcript: string, apiKey: string, useGroq: boolean) {
  const response = await fetch(
    useGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useGroq ? 'openai/gpt-oss-120b' : 'gpt-4o-mini',
        temperature: 0,
        response_format: useGroq
          ? { type: 'json_object' }
          : {
              type: 'json_schema',
              json_schema: { name: 'voice_invoice', strict: true, schema: invoiceSchema },
            },
        messages: [
          {
            role: 'system',
            content:
              'Extract invoice data from the transcript. Detect its language automatically and preserve names and item descriptions in that language. Return only JSON matching the requested fields. Do not invent a client, quantity, or price; use empty client_name and 0 for unknown numeric values. Include every billable service/material as an item. Use EUR amounts as numbers, set vat_rate to 18 when not stated, and calculate all totals consistently.',
          },
          { role: 'user', content: transcript },
        ],
      }),
    }
  );
  if (!response.ok) {
    console.error('Extraction provider returned an error:', response.status, await response.text());
    throw new Error('Nxjerrja e të dhënave të faturës dështoi. Provo përsëri.');
  }

  const result = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI nuk ktheu të dhëna për faturën.');

  let parsed: {
    client_name?: unknown;
    service_summary?: unknown;
    hours_worked?: unknown;
    materials_cost?: unknown;
    items?: {
      name?: unknown;
      quantity?: unknown;
      unit?: unknown;
      unit_price?: unknown;
    }[];
    vat_rate?: unknown;
  };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI ktheu të dhëna të pavlefshme. Provo përsëri.');
  }

  const items = (Array.isArray(parsed.items) ? parsed.items : [])
    .filter((item) => typeof item.name === 'string' && item.name.trim())
    .map((item) => {
      const quantity = Math.max(positiveNumber(item.quantity, 1), 0.01);
      const unitPrice = positiveNumber(item.unit_price);
      return {
        name: (item.name as string).trim(),
        quantity,
        unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim() : 'copë',
        unit_price: unitPrice,
        total: Math.round(quantity * unitPrice * 100) / 100,
      };
    });
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const vatRate = positiveNumber(parsed.vat_rate, 18);
  const vatAmount = Math.round(subtotal * vatRate) / 100;

  return {
    client_name: typeof parsed.client_name === 'string' ? parsed.client_name.trim() : '',
    service_summary:
      typeof parsed.service_summary === 'string' && parsed.service_summary.trim()
        ? parsed.service_summary.trim()
        : items.map((item) => item.name).join(', '),
    hours_worked: positiveNumber(parsed.hours_worked),
    materials_cost: positiveNumber(parsed.materials_cost),
    items,
    subtotal,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total: Math.round((subtotal + vatAmount) * 100) / 100,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    await ensureAuthenticated(request);

    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return jsonResponse(
        { error: 'Në Supabase duhet të shtosh OPENAI_API_KEY ose GROQ_API_KEY si Edge Function secret.' },
        500
      );
    }
    const useGroq = !Deno.env.get('OPENAI_API_KEY') && Boolean(Deno.env.get('GROQ_API_KEY'));

    let transcript: string;
    let durationSeconds: number;
    if (request.headers.get('content-type')?.includes('application/json')) {
      const payload = (await request.json()) as {
        extract_only?: unknown;
        transcript?: unknown;
        duration_seconds?: unknown;
      };
      if (payload.extract_only !== true || typeof payload.transcript !== 'string' || !payload.transcript.trim()) {
        return jsonResponse({ error: 'Transkripti për nxjerrjen e faturës mungon.' }, 400);
      }
      transcript = payload.transcript.trim();
      durationSeconds = Math.floor(positiveNumber(payload.duration_seconds));
    } else {
      const formData = await request.formData();
      const audio = formData.get('audio');
      if (!(audio instanceof File) || !audio.type.startsWith('audio/')) {
        return jsonResponse({ error: 'Skedari audio mungon ose nuk është format audio.' }, 400);
      }
      if (audio.size === 0 || audio.size > 25 * 1024 * 1024) {
        return jsonResponse({ error: 'Regjistrimi duhet të jetë më i vogël se 25 MB.' }, 413);
      }

      durationSeconds = Math.floor(positiveNumber(formData.get('duration_seconds')));
      transcript = await transcribe(audio, apiKey, useGroq);
      if (formData.get('transcribe_only') === 'true') {
        return jsonResponse({ transcript });
      }
      if (!transcript) throw new Error('Nuk u njoh të folurit në regjistrim.');
    }

    const invoice = await extractInvoice(transcript, apiKey, useGroq);

    return jsonResponse({
      ...invoice,
      transcript,
      duration_formatted: formatDuration(durationSeconds),
      duration_seconds: durationSeconds,
    });
  } catch (error) {
    console.error('voice-invoice function failed:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Pati një gabim gjatë analizimit të audios.' },
      500
    );
  }
});
