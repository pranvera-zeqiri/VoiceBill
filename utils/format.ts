import { InvoiceItem, InvoiceStatus } from '@/types';

const MONTHS = [
  'janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor',
  'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor',
];
const WEEKDAYS = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë'];

const pad = (n: number) => String(n).padStart(2, '0');

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const uid = () => Math.random().toString(36).slice(2, 9);
export const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------- Dates ---------- */
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};

export const daysSince = (iso: string) =>
  Math.round((parseISO(todayISO()).getTime() - parseISO(iso).getTime()) / 86400000);

export const formatDate = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatMonthYear = (iso: string) => {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDayLabel = (iso: string) => {
  const n = daysSince(iso);
  if (n === 0) return 'sot';
  if (n === 1) return 'dje';
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const todayLabel = () => {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const currentMonthName = () => capitalize(MONTHS[new Date().getMonth()]);

/* ---------- Text ---------- */
export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export const formatTimer = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
export const formatDuration = (s: number) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

/* ---------- Money ---------- */
const withCommas = (n: number, decimals: number) => {
  const [i, d] = Math.abs(n).toFixed(decimals).split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}€${int}${d ? '.' + d : ''}`;
};

/** Always 2 decimals: €218.30 */
export const formatMoney = (n: number) => withCommas(n, 2);

/** No decimals for whole numbers: €3,480 */
export const formatMoneyCompact = (n: number) => withCommas(n, Number.isInteger(n) ? 0 : 2);

export const calcTotals = (items: InvoiceItem[], vatRate: number) => {
  const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  const vat = round2((subtotal * vatRate) / 100);
  return { subtotal, vat, total: round2(subtotal + vat) };
};

export const itemDetail = (i: InvoiceItem) =>
  `${i.quantity} ${i.unit} × ${formatMoneyCompact(i.unitPrice)}`;

export const statusLabel: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  pending: 'Në pritje',
  paid: 'Paguar',
  overdue: 'E vonuar',
};