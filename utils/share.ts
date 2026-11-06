import { Invoice } from '@/types';
import { calcTotals, formatDate, formatMoney } from '@/utils/format';
import { Share } from 'react-native';

/** Opens the native share sheet (WhatsApp, Email, SMS...). Returns true if shared. */
export async function shareInvoice(
  invoice: Invoice,
  customerName: string,
  businessName: string
): Promise<boolean> {
  const t = calcTotals(invoice.items, invoice.vatRate);
  const lines = invoice.items.map(
    (i) =>
      `• ${i.title} (${i.quantity} ${i.unit} × ${formatMoney(i.unitPrice)}) — ${formatMoney(
        i.quantity * i.unitPrice
      )}`
  );
  const message = [
    `Fatura #${invoice.number} — ${businessName}`,
    `Për: ${customerName}`,
    `Data: ${formatDate(invoice.date)}`,
    '',
    ...lines,
    '',
    `Nëntotali: ${formatMoney(t.subtotal)}`,
    ...(invoice.vatRate > 0 ? [`TVA ${invoice.vatRate}%: ${formatMoney(t.vat)}`] : []),
    `Totali: ${formatMoney(t.total)}`,
  ].join('\n');

  const result = await Share.share({ message, title: `Fatura #${invoice.number}` });
  return result.action === Share.sharedAction;
}

export async function shareReminder(
  invoice: Invoice,
  customerName: string
): Promise<boolean> {
  const total = calcTotals(invoice.items, invoice.vatRate).total;
  const message = `Përshëndetje ${customerName}, ju kujtojmë se fatura #${invoice.number} prej ${formatMoney(
    total
  )} është ende e papaguar. Faleminderit!`;
  const result = await Share.share({ message });
  return result.action === Share.sharedAction;
}