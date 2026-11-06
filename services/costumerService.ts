import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';
import { todayISO } from '@/utils/format';

export interface NewCustomerInput {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string | null;
}

function mapCustomer(record: CustomerRecord): Customer {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone ?? '',
    email: record.email ?? '',
    address: record.address ?? '',
    since: record.created_at?.slice(0, 10) ?? todayISO(),
    avgPayDays: 0,
  };
}

async function requireAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Duhet të kyçeni për të menaxhuar klientët.');
  return data.user;
}

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    await requireAuthenticatedUser();

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const records: CustomerRecord[] = data ?? [];
    return records.map(mapCustomer);
  },

  async addCustomer(input: NewCustomerInput): Promise<Customer> {
    const name = input.name.trim();
    if (!name) throw new Error('Emri i klientit është i detyrueshëm.');

    const user = await requireAuthenticatedUser();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name,
        phone: input.phone.trim(),
        email: input.email.trim(),
        address: input.address?.trim() ?? '',
      })
      .select('id, name, phone, email, address, created_at')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Supabase nuk ktheu klientin e krijuar.');

    return mapCustomer(data);
  },
};
