import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types';

type InvoiceItemInput = Pick<InvoiceItem, 'title' | 'quantity' | 'unit' | 'unitPrice'>;

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
  due_date: string;
  status: InvoiceStatus;
  vat_rate?: number | null;
  from_voice?: boolean | null;
  audio_seconds?: number | null;
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
    date: record.date,
    dueDate: record.due_date,
    status: record.status,
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

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Përdoruesi nuk është i kyçur.');

    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', authData.user.id)
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
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Përdoruesi nuk është i kyçur.');

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
        user_id: authData.user.id,
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
      unit: item.unit,
      unit_price: item.unitPrice,
    }));
    const invoiceRecord: InvoiceRecord = {
      ...(newInvoice as InvoiceRecord),
      invoice_items: fallbackItems,
    };
    return mapInvoice(invoiceRecord);
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