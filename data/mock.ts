import { Customer, Invoice, InvoiceItem, InvoiceStatus } from '@/types';
import { daysAgoISO } from '@/utils/format';

export const seedCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Familja Berisha',
    phone: '+383 44 123 456',
    email: 'berisha.familja@gmail.com',
    address: 'Rr. Mbretëresha Teutë 12, Pejë',
    since: '2026-03-12',
    avgPayDays: 3,
  },
  {
    id: 'c2',
    name: 'Dardan Kryeziu',
    phone: '+383 45 222 333',
    email: 'dardan.kryeziu@gmail.com',
    address: 'Rr. Bajram Curri 5, Pejë',
    since: '2026-01-20',
    avgPayDays: 5,
  },
  {
    id: 'c3',
    name: 'Lulzim Gashi',
    phone: '+383 49 765 432',
    email: 'lulzim.gashi@hotmail.com',
    address: 'Lagjja Kapeshnicë, Pejë',
    since: '2025-11-04',
    avgPayDays: 12,
  },
  {
    id: 'c4',
    name: 'Avni Morina',
    phone: '+383 44 987 654',
    email: 'avni.morina@gmail.com',
    address: 'Rr. Deçani 30, Pejë',
    since: '2026-06-18',
    avgPayDays: 7,
  },
  {
    id: 'c5',
    name: 'Besa Krasniqi',
    phone: '+383 48 555 210',
    email: 'besa.krasniqi@gmail.com',
    address: 'Rr. Rexhep Mala 8, Pejë',
    since: '2026-08-02',
    avgPayDays: 2,
  },
];

const item = (
  id: string,
  title: string,
  quantity: number,
  unit: string,
  unitPrice: number,
  needsConfirm = false
): InvoiceItem => ({ id, title, quantity, unit, unitPrice, needsConfirm });

const single = (id: string, title: string, price: number): InvoiceItem[] => [
  item(`${id}-1`, title, 1, 'shërbim', price),
];

const inv = (
  n: number,
  customerId: string,
  title: string,
  daysAgo: number,
  dueDaysAgo: number,
  status: InvoiceStatus,
  items: InvoiceItem[],
  vatRate = 0,
  extra: Partial<Invoice> = {}
): Invoice => ({
  id: `inv-${n}`,
  number: String(n).padStart(4, '0'),
  customerId,
  title,
  date: daysAgoISO(daysAgo),
  dueDate: daysAgoISO(dueDaysAgo),
  status,
  items,
  vatRate,
  ...extra,
});

export const seedInvoices: Invoice[] = [
  inv(
    47, 'c1', 'Instalim elektrik', 0, -14, 'pending',
    [
      item('47-1', 'Punë dore', 4, 'orë', 25),
      item('47-2', 'Priza', 2, 'copë', 12),
      item('47-3', 'Ndërprerës', 1, 'copë', 11),
      item('47-4', 'Llamba LED', 5, 'copë', 10),
    ],
    18,
    { fromVoice: true, audioSeconds: 24 }
  ),
  inv(46, 'c2', 'Riparim tubash', 1, -13, 'paid', single('46', 'Riparim tubash', 380)),
  inv(45, 'c1', 'Riparim bojleri', 3, -11, 'paid', single('45', 'Riparim bojleri', 700)),
  inv(43, 'c3', 'Bojatisje, 2 dhoma', 5, 5, 'overdue', single('43', 'Bojatisje, 2 dhoma', 560)),
  inv(41, 'c4', 'Riparim çative', 4, -10, 'draft', single('41', 'Riparim çative', 420)),
  inv(40, 'c5', 'Montim kuzhine', 5, -9, 'paid', single('40', 'Montim kuzhine', 940)),
  inv(39, 'c2', 'Zëvendësim kaldaje', 15, 1, 'paid', single('39', 'Zëvendësim kaldaje', 380)),
  inv(38, 'c3', 'Instalim klime', 18, 4, 'paid', single('38', 'Instalim klime', 380)),
  inv(37, 'c1', 'Rinovim banjo', 20, 6, 'paid', single('37', 'Rinovim banjo', 520)),
  inv(36, 'c3', 'Riparim dere', 35, 21, 'paid', single('36', 'Riparim dere', 300)),
  inv(34, 'c1', 'Punë elektrike', 40, 26, 'paid', single('34', 'Punë elektrike', 421.7)),
];