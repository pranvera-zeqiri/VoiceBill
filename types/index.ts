import { Feather } from '@expo/vector-icons';
import React from 'react';

export type FeatherName = React.ComponentProps<typeof Feather>['name'];

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue';

export interface InvoiceItem {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  needsConfirm?: boolean;
}

export interface Invoice {
  id: string;
  number: string; // "0047"
  customerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  items: InvoiceItem[];
  vatRate: number; // 0, 8, 18
  fromVoice?: boolean;
  audioSeconds?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  since: string; // YYYY-MM-DD
  avgPayDays: number;
}

export interface User {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  taxId: string;
}

export interface Settings {
  notifications: boolean;
  autoReminders: boolean;
  autoVat: boolean;
  vatRate: number;
}