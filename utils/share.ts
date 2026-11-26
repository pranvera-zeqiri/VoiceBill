import { Invoice } from '@/types';
import { calcTotals, formatDate, formatMoney, formatSavedDate, formatTime } from '@/utils/format';
import { Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function generateAndShareInvoicePdf(
  invoice: Invoice,
  customerName: string,
  businessName: string,
  paymentDetails?: { bankName?: string; iban?: string }
) {
  const totals = calcTotals(invoice.items, invoice.vatRate);
  const workHours = invoice.items
    .filter((item) => item.unit.toLocaleLowerCase('sq-AL').includes('orë'))
    .reduce((sum, item) => sum + item.quantity, 0);
  const rows = invoice.items.map((item) => {
    const subtotal = item.quantity * item.unitPrice;
    return `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
        <td>${escapeHtml(formatMoney(item.unitPrice))}</td>
        <td>${escapeHtml(formatMoney(subtotal))}</td>
      </tr>`;
  }).join('');
  const paymentDetailsHtml = paymentDetails?.iban
    ? `<div class="box">
        <h2>Pagesa bankare</h2>
        ${paymentDetails.bankName ? `<div><strong>Banka:</strong> ${escapeHtml(paymentDetails.bankName)}</div>` : ''}
        <div style="margin-top:8px"><strong>IBAN:</strong> ${escapeHtml(paymentDetails.iban)}</div>
      </div>`
    : '';

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #1c1917; padding: 28px; }
          .top { display:flex; justify-content:space-between; align-items:flex-start; }
          h1 { margin:0 0 8px; font-size:28px; }
          .muted { color:#78716c; }
          .status { display:inline-block; margin-top:10px; padding:8px 12px; border-radius:14px;
            background:${invoice.status === 'paid' ? '#dcfce7' : '#ffedd5'};
            color:${invoice.status === 'paid' ? '#047857' : '#9a3412'}; font-weight:bold; }
          .box { background:#faf5ee; border-radius:12px; padding:16px; margin:20px 0; }
          table { width:100%; border-collapse:collapse; margin-top:10px; }
          th { background:#1c1917; color:white; text-align:left; padding:10px; }
          td { border-bottom:1px solid #e7e5e4; padding:10px; }
          td:last-child, th:last-child { text-align:right; }
          .total { margin-left:auto; width:260px; }
          .row { display:flex; justify-content:space-between; padding:6px 0; }
          .grand { border-top:2px solid #1c1917; margin-top:8px; padding-top:12px; font-size:18px;
            font-weight:bold; }
        </style>
      </head>
      <body>
        <div class="top">
          <div><h1>Faturë #${escapeHtml(invoice.number)}</h1><div class="muted">${escapeHtml(businessName)}</div></div>
          <div class="status">${invoice.status === 'paid' ? 'E paguar' : 'E papaguar'}</div>
        </div>
        <div class="box">
          <div><strong>Klienti:</strong> ${escapeHtml(customerName)}</div>
          <div style="margin-top:8px"><strong>Data:</strong> ${escapeHtml(invoice.createdAt ? formatSavedDate(invoice.createdAt) : formatDate(invoice.date))}</div>
          <div style="margin-top:8px"><strong>Ora:</strong> ${escapeHtml(invoice.createdAt ? formatTime(invoice.createdAt) : '--:--')}</div>
        </div>
        <h2>Përshkrimi i punës</h2>
        <p>${escapeHtml(invoice.title)}</p>
        ${workHours > 0 ? `<p class="muted">Orët e punës: ${escapeHtml(workHours)} orë</p>` : ''}
        <table>
          <thead><tr><th>Artikulli</th><th>Sasia</th><th>Çmimi për njësi</th><th>Nëntotali</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">
          <div class="row"><span>Nëntotali</span><strong>${escapeHtml(formatMoney(totals.subtotal))}</strong></div>
          ${totals.vat > 0 ? `<div class="row"><span>TVSH ${escapeHtml(invoice.vatRate)}%</span><strong>${escapeHtml(formatMoney(totals.vat))}</strong></div>` : ''}
          <div class="row grand"><span>Totali në EUR</span><span>${escapeHtml(formatMoney(totals.total))}</span></div>
        </div>
        ${paymentDetailsHtml}
      </body>
    </html>`;

  const file = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(file.uri, {
    UTI: '.pdf',
    mimeType: 'application/pdf',
    dialogTitle: `Fatura #${invoice.number}`,
  });
  return file.uri;
}

/** Opens the native share sheet (WhatsApp, Email, SMS...). Returns true if shared. */
export async function shareInvoice(
  invoice: Invoice,
  customerName: string,
  businessName: string,
  paymentDetails?: { bankName?: string; iban?: string }
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
    `Data: ${invoice.createdAt ? formatSavedDate(invoice.createdAt) : formatDate(invoice.date)}`,
    `Ora: ${invoice.createdAt ? formatTime(invoice.createdAt) : '--:--'}`,
    ...(paymentDetails?.iban
      ? [
          ...(paymentDetails.bankName ? [`Banka: ${paymentDetails.bankName}`] : []),
          `IBAN: ${paymentDetails.iban}`,
        ]
      : []),
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