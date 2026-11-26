import { supabase } from '@/lib/supabase';
import { File } from 'expo-file-system';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types';
import { daysAgoISO, todayISO, toISO } from '@/utils/format';

type InvoiceItemInput = Pick<
  InvoiceItem,
  'title' | 'quantity' | 'unit' | 'unitPrice' | 'needsConfirm'
>;

export interface CreateInvoiceInput {
  customerId: string;
  number: string;
  title: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  vatRate: number;
  fromVoice?: boolean;
  audioSeconds?: number;
  items: InvoiceItemInput[];
}

export interface ExtractedInvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface ExtractedVoiceInvoice {
  client_name: string;
  service_summary: string;
  hours_worked: number;
  materials_cost: number;
  items: ExtractedInvoiceItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  transcript: string;
  duration_formatted: string;
  duration_seconds: number;
}

interface InvoiceItemRecord {
  id?: string | number;
  title: string;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  needs_confirm?: boolean | null;
}

interface InvoiceRecord {
  id: string | number;
  number: string | number;
  customer_id: string | number;
  title: string;
  date: string;
  created_at?: string | null;
  due_date: string;
  status: InvoiceStatus;
  vat_rate?: number | null;
  from_voice?: boolean | null;
  audio_seconds?: number | null;
  customers?: { name?: string | null } | null;
  invoice_items?: InvoiceItemRecord[] | null;
}

function mapInvoice(record: InvoiceRecord): Invoice {
  const statuses: InvoiceStatus[] = ['draft', 'pending', 'paid', 'overdue'];
  if (!statuses.includes(record.status)) {
    throw new Error(`Status i panjohur i faturës: ${String(record.status)}`);
  }

  return {
    id: String(record.id),
    number: String(record.number),
    customerId: String(record.customer_id),
    title: record.title,
    date: record.created_at ? toISO(new Date(record.created_at)) : record.date,
    createdAt: record.created_at ?? undefined,
    dueDate: record.due_date,
    status: record.status,
    customerName: record.customers?.name ?? undefined,
    vatRate: record.vat_rate ?? 0,
    fromVoice: record.from_voice ?? undefined,
    audioSeconds: record.audio_seconds ?? undefined,
    items: (record.invoice_items ?? []).map((item, index) => ({
      id: item.id === undefined ? `${record.id}-${index}` : String(item.id),
      title: item.title,
      quantity: item.quantity,
      unit: item.unit ?? 'shërbim',
      unitPrice: item.unit_price,
      needsConfirm: item.needs_confirm ?? undefined,
    })),
  };
}

async function requireAuthenticatedUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) throw new Error('Duhet të kyçeni për të menaxhuar faturat.');
  return data.session.user;
}

async function invokeVoiceFunction<T>(body: FormData | Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('voice-invoice', { body });
  if (error) {
    if (error.context instanceof Response) {
      const payload = (await error.context.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? error.message);
    }
    if (error.name === 'FunctionsFetchError') {
      const cause =
        error.context instanceof Error
          ? error.context.message
          : typeof error.context === 'string'
            ? error.context
            : '';
      console.error('Edge Function network request failed:', error.context);
      throw new Error(
        cause
          ? `Nuk u lidh me Supabase Edge Function (${cause}). Kontrollo internetin dhe provo përsëri.`
          : 'Nuk u lidh me Supabase Edge Function. Kontrollo internetin dhe provo përsëri.'
      );
    }
    throw error;
  }
  if (!data) throw new Error('Supabase Edge Function nuk ktheu përgjigje.');
  return data;
}

export const invoiceService = {
  async transcribeAudioSegment(audioUri: string): Promise<string> {
    const audioFile = new File(audioUri);
    if (!audioFile.exists || audioFile.size === 0) return '';

    const formData = new FormData();
    formData.append('audio', audioFile, audioFile.name || 'voice-segment.m4a');
    formData.append('transcribe_only', 'true');
    const data = await invokeVoiceFunction<{ transcript?: string }>(formData);
    if (typeof data.transcript !== 'string') {
      throw new Error('Supabase Edge Function ktheu transkript të pavlefshëm.');
    }
    return data.transcript.trim();
  },

  async extractInvoiceFromTranscript(
    transcript: string,
    durationSeconds: number
  ): Promise<ExtractedVoiceInvoice> {
    const data = await invokeVoiceFunction<ExtractedVoiceInvoice>({
      extract_only: true,
      transcript,
      duration_seconds: Math.max(0, Math.floor(durationSeconds)),
    });
    if (!Array.isArray(data.items) || typeof data.transcript !== 'string') {
      throw new Error('Supabase Edge Function ktheu të dhëna të pavlefshme. Kontrollo deploy-in e voice-invoice.');
    }
    return data;
  },

  async transcribeAndExtractInvoice(audioUri: string, durationSeconds: number): Promise<ExtractedVoiceInvoice> {
    const audioFile = new File(audioUri);
    if (!audioFile.exists || audioFile.size === 0) {
      throw new Error('Skedari i regjistrimit nuk ekziston ose është bosh. Regjistroje përsëri.');
    }

    const formData = new FormData();
    formData.append('audio', audioFile, audioFile.name || 'voice-invoice.m4a');
    formData.append('duration_seconds', String(Math.max(0, Math.floor(durationSeconds))));

    const data = await invokeVoiceFunction<ExtractedVoiceInvoice>(formData);
    if (!data || !Array.isArray(data.items) || typeof data.transcript !== 'string') {
      throw new Error('Supabase Edge Function ktheu të dhëna të pavlefshme. Kontrollo deploy-in e voice-invoice.');
    }
    return data;
  },

  async getInvoices(): Promise<Invoice[]> {
    const user = await requireAuthenticatedUser();

    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), customers(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const records: InvoiceRecord[] = data ?? [];
    return records.map(mapInvoice);
  },

  async getInvoiceDetails(invoiceId: string) {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*),
        invoice_items (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;
    return invoice;
  },

  async createInvoice(invoiceData: CreateInvoiceInput): Promise<Invoice> {
    try {
      const user = await requireAuthenticatedUser();

      const { items, customerId, dueDate, vatRate, fromVoice, audioSeconds, ...invoiceFields } =
        invoiceData;
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceFields,
          customer_id: customerId,
          due_date: dueDate,
          vat_rate: vatRate,
          from_voice: fromVoice,
          audio_seconds: audioSeconds,
          user_id: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(
            items.map((item) => ({
              invoice_id: newInvoice.id,
              title: item.title,
              quantity: item.quantity,
              unit: item.unit || 'shërbim',
              unit_price: item.unitPrice,
              needs_confirm: item.needsConfirm ?? false,
            }))
          );

        if (itemsError) {
          const { error: rollbackError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', newInvoice.id);
          if (rollbackError) {
            throw new Error(
              `Zërat e faturës nuk u ruajtën (${itemsError.message}) dhe fatura e paplotë nuk u fshi (${rollbackError.message}).`
            );
          }
          throw itemsError;
        }
      }

      const fallbackItems: InvoiceItemRecord[] = items.map((item, index) => ({
        id: `${newInvoice.id}-${index}`,
        title: item.title,
        quantity: item.quantity,
        unit: item.unit || 'shërbim',
        unit_price: item.unitPrice,
        needs_confirm: item.needsConfirm ?? false,
      }));
      const invoiceRecord: InvoiceRecord = {
        ...(newInvoice as InvoiceRecord),
        invoice_items: fallbackItems,
      };
      return mapInvoice(invoiceRecord);
    } catch (error) {
      console.error('SUPABASE_ERROR:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async createVoiceInvoice(
    draft: ExtractedVoiceInvoice,
    items: InvoiceItemInput[]
  ): Promise<Invoice> {
    const user = await requireAuthenticatedUser();

    const clientName = draft.client_name.trim();
    if (!clientName) throw new Error('AI nuk e identifikoi klientin. Plotëso emrin e klientit.');
    if (!items.length) throw new Error('Shto të paktën një zë faturë para ruajtjes.');

    const { data: existingCustomer, error: customerLookupError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', clientName)
      .maybeSingle();
    if (customerLookupError) throw customerLookupError;

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer, error: customerInsertError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: clientName,
          phone: '',
          email: '',
          address: '',
        })
        .select('id')
        .single();
      if (customerInsertError) throw customerInsertError;
      customerId = newCustomer.id;
    }

    const { data: latestInvoice, error: numberError } = await supabase
      .from('invoices')
      .select('number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (numberError) throw numberError;
    const nextNumber = Math.max(0, Number(latestInvoice?.number) || 0) + 1;

    return this.createInvoice({
      customerId: String(customerId),
      number: String(nextNumber).padStart(4, '0'),
      title: draft.service_summary.trim() || items[0].title,
      date: todayISO(),
      dueDate: daysAgoISO(-14),
      status: 'pending',
      vatRate: draft.vat_rate,
      fromVoice: true,
      audioSeconds: draft.duration_seconds,
      items,
    });
  },

  async updateInvoiceStatus(invoiceId: string, status: 'draft' | 'pending' | 'paid' | 'overdue') {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInvoice(invoiceId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
    return true;
  },
};