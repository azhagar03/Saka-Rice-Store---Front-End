import { useState, useEffect } from 'react';
import { getRiceItems, getSales, getSaleById, createSale, updateSale, deleteSale } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Printer, Eye, X, ChevronLeft, ChevronRight, History,
  Search, Receipt, ShoppingBag, User, Phone, MapPin, CreditCard,
  FileText, Tag, Percent, CheckCircle, Clock, AlertCircle,
  Download, FileSpreadsheet, Calendar, Languages, Wallet, TrendingUp, AlertTriangle
} from 'lucide-react';

const GST_RATES = [0, 5, 12, 18];
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'credit'];
const PAYMENT_STATUSES = ['paid', 'pending', 'partial'];
const ITEMS_PER_A4 = 15;
const PERIODS = [
  { label: 'Today',      value: 'day'    },
  { label: 'This Week',  value: 'week'   },
  { label: 'This Month', value: 'month'  },
  { label: 'This Year',  value: 'year'   },
  { label: 'Custom',     value: 'custom' },
];

// ── Tamil label maps ──────────────────────────────────────────────────────────
const TAMIL = {
  taxInvoice:     'வரி விலைப்பட்டியல்',
  billTo:         'வாங்குபவர்',
  paymentDetails: 'கட்டண விவரங்கள்',
  riceItem:       'அரிசி வகை',
  type:           'வகை',
  qty:            'அளவு',
  rate:           'விலை',
  disc:           'தள்ளுபடி',
  amount:         'தொகை',
  subtotal:       'கூட்டுத்தொகை',
  discount:       'தள்ளுபடி',
  cgst:           'மத்திய சரக்கு வரி',
  sgst:           'மாநில சரக்கு வரி',
  totalGst:       'மொத்த சரக்கு வரி',
  grandTotal:     'மொத்தத் தொகை',
  amountWords:    'தொகை வார்த்தைகளில்',
  paid:           'கட்டணம் செலுத்தப்பட்டது',
  pending:        'நிலுவை',
  partial:        'பகுதி',
  cash:           'பண மதிப்பு',
  card:           'அட்டை',
  upi:            'யுபிஐ',
  credit:         'கடன்',
  status:         'நிலை',
  method:         'முறை',
  by:             'செய்தவர்',
  page:           'பக்கம்',
  continued:      'அடுத்த பக்கத்தில் தொடர்கிறது',
  customerSeal:   'வாங்குபவரின் முத்திரை & கையொப்பம்',
  forShop:        'சாக்கா அரிசி கடைக்காக',
  computerGenerated: 'கணினி மூலம் உருவாக்கப்பட்ட விலைப்பட்டியல்',
  total:          'மொத்தம்',
  invoices:       'விலைப்பட்டியல்கள்',
  salesReport:    'விற்பனை அறிக்கை',
  period:         'காலகட்டம்',
  generated:      'உருவாக்கப்பட்ட தேதி',
  customer:       'வாடிக்கையாளர்',
  phone:          'தொலைபேசி',
  items:          'பொருட்கள்',
  date:           'தேதி',
  amountPaid:     'செலுத்திய தொகை',
  balance:        'இருப்பு',
};

// ── Number-to-words (English) ─────────────────────────────────────────────────
const ones  = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tensW = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function numToWords(n) {
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numToWords(-n);
  let w = '';
  if (Math.floor(n/10000000) > 0) { w += numToWords(Math.floor(n/10000000)) + ' Crore '; n %= 10000000; }
  if (Math.floor(n/100000)   > 0) { w += numToWords(Math.floor(n/100000))   + ' Lakh ';  n %= 100000;   }
  if (Math.floor(n/1000)     > 0) { w += numToWords(Math.floor(n/1000))     + ' Thousand '; n %= 1000;   }
  if (Math.floor(n/100)      > 0) { w += numToWords(Math.floor(n/100))      + ' Hundred '; n %= 100;     }
  if (n >= 20) { w += tensW[Math.floor(n/10)] + ' '; n %= 10; }
  if (n > 0)   w += ones[n] + ' ';
  return w.trim();
}
function amountWords(amt) {
  const int = Math.floor(amt);
  const dec = Math.round((amt - int) * 100);
  let w = numToWords(int) + ' Rupees';
  if (dec > 0) w += ' and ' + numToWords(dec) + ' Paise';
  return w + ' Only';
}

// ── Tamil number-to-words ─────────────────────────────────────────────────────
const tOnes  = ['','ஒன்று','இரண்டு','மூன்று','நான்கு','ஐந்து','ஆறு','ஏழு','எட்டு','ஒன்பது','பத்து','பதினொன்று','பன்னிரண்டு','பதின்மூன்று','பதினான்கு','பதினைந்து','பதினாறு','பதினேழு','பதினெட்டு','பத்தொன்பது'];
const tTens  = ['','','இருபது','முப்பது','நாற்பது','ஐம்பது','அறுபது','எழுபது','எண்பது','தொண்ணூறு'];
function numToWordsTamil(n) {
  if (n === 0) return 'சுழியம்';
  if (n < 0) return 'கழித்தல் ' + numToWordsTamil(-n);
  let w = '';
  if (Math.floor(n/10000000) > 0) { w += numToWordsTamil(Math.floor(n/10000000)) + ' கோடி '; n %= 10000000; }
  if (Math.floor(n/100000)   > 0) { w += numToWordsTamil(Math.floor(n/100000))   + ' லட்சம் '; n %= 100000; }
  if (Math.floor(n/1000)     > 0) { w += numToWordsTamil(Math.floor(n/1000))     + ' ஆயிரம் '; n %= 1000; }
  if (Math.floor(n/100)      > 0) { w += numToWordsTamil(Math.floor(n/100))      + ' நூறு '; n %= 100; }
  if (n >= 20) { w += tTens[Math.floor(n/10)] + ' '; n %= 10; }
  if (n > 0) w += tOnes[n] + ' ';
  return w.trim();
}
function amountWordsTamil(amt) {
  const int = Math.floor(amt);
  const dec = Math.round((amt - int) * 100);
  let w = numToWordsTamil(int) + ' ரூபாய்';
  if (dec > 0) w += ' மற்றும் ' + numToWordsTamil(dec) + ' பைசா';
  return w + ' மட்டும்';
}

const chunkArray = (arr, size) => {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  if (pages.length === 0) pages.push([]);
  return pages;
};

// ── Generate bilingual A4 invoice HTML ────────────────────────────────────────
function generateInvoiceHTML(sale, lang = 'english') {
  const isTamil = lang === 'tamil';
  const date    = new Date(sale.createdAt);
  const pages   = chunkArray(sale.items || [], ITEMS_PER_A4);
  const total   = pages.length;
  const gstAmt  = sale.tax > 0 ? ((sale.subtotal - (sale.discount||0)) * sale.tax / 100) : 0;
  const cgst    = gstAmt / 2;
  const netAmt  = sale.totalAmount || 0;
  const paid    = sale.amountPaid || (sale.paymentStatus === 'paid' ? netAmt : 0);
  const balance = Math.max(0, netAmt - paid);

  const displayName    = isTamil && sale.customerNameTamil    ? sale.customerNameTamil    : sale.customerName;
  const displayAddress = isTamil && sale.customerAddressTamil ? sale.customerAddressTamil : (sale.customerAddress || '');

  const L = (en, ta) => isTamil ? ta : en;

  const pageHTML = pages.map((pageItems, pi) => {
    const isLast    = pi === total - 1;
    const emptyRows = Math.max(0, ITEMS_PER_A4 - pageItems.length);

    const rows = pageItems.map((item, i) => `
      <tr>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;text-align:center;">${(pi * ITEMS_PER_A4) + i + 1}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;font-weight:600;">${item.riceName}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;color:#666;">${item.riceType}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;text-align:right;">${item.quantity} kg</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;text-align:right;">₹${item.pricePerKg?.toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;text-align:right;color:#16a34a;">${item.itemDiscount > 0 ? '-₹'+item.itemDiscount?.toFixed(2) : '—'}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;text-align:right;font-weight:700;">₹${item.totalPrice?.toFixed(2)}</td>
      </tr>`).join('');

    const emptyRowsHTML = Array(emptyRows).fill(`<tr>${Array(7).fill('<td style="border:1px solid #eee;padding:6px 8px;">&nbsp;</td>').join('')}</tr>`).join('');

    const footer = isLast ? `
      <div style="display:grid;grid-template-columns:1fr auto;border-top:2px solid #d4831e;margin-top:0;">
        <div style="padding:12px 16px;border-right:1px solid #ddd;">
          <div style="font-size:10px;color:#888;margin-bottom:4px;">${L('Amount in Words', TAMIL.amountWords)}</div>
          <div style="font-weight:700;font-size:11px;">${isTamil ? amountWordsTamil(netAmt) : amountWords(netAmt)}</div>
          <div style="margin-top:12px;font-size:10px;font-weight:700;color:#888;">E &amp; O E</div>
        </div>
        <div style="padding:12px 16px;min-width:240px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="font-size:11px;color:#555;padding:4px 0;border-bottom:1px solid #eee;">${L('Subtotal', TAMIL.subtotal)}</td>
                <td style="font-size:11px;font-weight:700;text-align:right;padding:4px 0;border-bottom:1px solid #eee;">₹${sale.subtotal?.toFixed(2)}</td></tr>
            ${sale.discount > 0 ? `<tr><td style="font-size:11px;color:#16a34a;padding:4px 0;border-bottom:1px solid #eee;">${L('Discount', TAMIL.discount)}</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#16a34a;padding:4px 0;border-bottom:1px solid #eee;">-₹${sale.discount?.toFixed(2)}</td></tr>` : ''}
            ${sale.tax > 0 ? `
            <tr><td style="font-size:11px;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">${L(`CGST (${sale.tax/2}%)`, `${TAMIL.cgst} (${sale.tax/2}%)`)}</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">₹${cgst.toFixed(2)}</td></tr>
            <tr><td style="font-size:11px;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">${L(`SGST (${sale.tax/2}%)`, `${TAMIL.sgst} (${sale.tax/2}%)`)}</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">₹${cgst.toFixed(2)}</td></tr>
            ` : ''}
            <tr style="background:#d4831e;"><td style="font-size:13px;font-weight:800;padding:6px 4px;color:white;">${L('Grand Total', TAMIL.grandTotal)}</td>
                <td style="font-size:13px;font-weight:900;text-align:right;color:white;padding:6px 4px;">₹${netAmt.toFixed(2)}</td></tr>
            ${paid > 0 ? `<tr><td style="font-size:11px;color:#166534;padding:4px 0;border-bottom:1px solid #eee;">${L('Amount Paid', TAMIL.amountPaid)}</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#166534;padding:4px 0;border-bottom:1px solid #eee;">₹${paid.toFixed(2)}</td></tr>` : ''}
            ${balance > 0 ? `<tr style="background:#fef2f2;"><td style="font-size:12px;font-weight:800;color:#b91c1c;padding:5px 4px;">${L('Balance Due', TAMIL.balance)}</td>
                <td style="font-size:12px;font-weight:900;text-align:right;color:#b91c1c;padding:5px 4px;">₹${balance.toFixed(2)}</td></tr>` : ''}
          </table>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 16px;border-top:1px solid #ddd;font-size:11px;font-weight:700;">
        <span>${L("Customer's Seal & Signature", TAMIL.customerSeal)}</span>
        <span>${L('For Saka Rice Shop', TAMIL.forShop)}</span>
      </div>
      <div style="text-align:center;padding:8px;border-top:1px solid #eee;font-size:10px;color:#999;">
        ${L('This is a Computer Generated Invoice — No signature required', TAMIL.computerGenerated)}
      </div>` : `
      <div style="text-align:right;padding:8px 16px;border-top:1px solid #ddd;font-size:10px;color:#888;">
        ${L('Continued on next page...', TAMIL.continued)} &nbsp;&nbsp; ${L('Page', TAMIL.page)} ${pi+1} of ${total}
      </div>`;

    return `
      <div style="width:210mm;min-height:297mm;background:#fff;font-family:'Noto Sans Tamil','Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:10mm;box-sizing:border-box;page-break-after:${isLast?'auto':'always'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #d4831e;margin-bottom:20px;">
          <div>
            <div style="font-size:24px;font-weight:900;color:#d4831e;font-family:Georgia,serif;">🌾 ${isTamil ? 'சாக்கா அரிசி கடை' : 'Saka Rice Shop'}</div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">${isTamil ? 'உயர்தர அரிசி வியாபாரிகள்' : 'Premium Rice Traders & Wholesalers'}</div>
            <div style="font-size:11px;color:#555;margin-top:5px;">GSTIN: 33XXXXX0000X1ZX &nbsp;|&nbsp; +91 99999 99999</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;">${L('Tax Invoice', TAMIL.taxInvoice)}</div>
            <div style="font-size:22px;font-weight:900;">#${sale.invoiceNumber}</div>
            <div style="font-size:11px;color:#888;margin-top:3px;">${date.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
            <div style="margin-top:5px;display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sale.paymentStatus==='paid'?'#dcfce7':'#fef9c3'};color:${sale.paymentStatus==='paid'?'#166534':'#854d0e'};">${isTamil ? (TAMIL[sale.paymentStatus]||sale.paymentStatus) : sale.paymentStatus?.toUpperCase()}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;padding:14px;background:#fdf8f3;border-radius:8px;border:1px solid #f0e0c8;">
          <div>
            <div style="font-size:9px;color:#d4831e;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;margin-bottom:5px;">${L('Bill To', TAMIL.billTo)}</div>
            <div style="font-weight:800;font-size:14px;">${displayName}</div>
            ${sale.customerPhone ? `<div style="font-size:12px;color:#555;margin-top:3px;">📞 ${sale.customerPhone}</div>` : ''}
            ${displayAddress ? `<div style="font-size:12px;color:#555;margin-top:2px;">📍 ${displayAddress}</div>` : ''}
            ${sale.customerCity ? `<div style="font-size:11px;color:#888;margin-top:1px;">${sale.customerCity}</div>` : ''}
          </div>
          <div>
            <div style="font-size:9px;color:#d4831e;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;margin-bottom:5px;">${L('Payment Details', TAMIL.paymentDetails)}</div>
            <div style="font-size:12px;font-weight:700;text-transform:capitalize;">${isTamil ? (TAMIL[sale.paymentMethod]||sale.paymentMethod) : sale.paymentMethod}</div>
            <div style="font-size:11px;color:#555;margin-top:2px;">${L('Status', TAMIL.status)}: ${isTamil ? (TAMIL[sale.paymentStatus]||sale.paymentStatus) : sale.paymentStatus}</div>
            ${sale.amountPaid > 0 ? `<div style="font-size:11px;color:#166534;font-weight:700;margin-top:2px;">${L('Paid', TAMIL.paid)}: ₹${(sale.amountPaid||0).toFixed(2)}</div>` : ''}
            ${(sale.balanceAmount||0) > 0 ? `<div style="font-size:11px;color:#b91c1c;font-weight:700;margin-top:2px;">${L('Balance', TAMIL.balance)}: ₹${(sale.balanceAmount||0).toFixed(2)}</div>` : ''}
            ${sale.soldBy ? `<div style="font-size:11px;color:#555;margin-top:2px;">${L('By', TAMIL.by)}: ${sale.soldBy}</div>` : ''}
            <div style="font-size:11px;color:#888;margin-top:2px;">${L('Page', TAMIL.page)} ${pi+1} / ${total}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
          <thead>
            <tr style="background:#d4831e;">
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:center;width:32px;">#</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:left;">${L('Rice Item', TAMIL.riceItem)}</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:left;width:70px;">${L('Type', TAMIL.type)}</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:65px;">${L('Qty', TAMIL.qty)}</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:72px;">${L('Rate', TAMIL.rate)}</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:72px;">${L('Disc', TAMIL.disc)}</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:80px;">${L('Amount', TAMIL.amount)}</th>
            </tr>
          </thead>
          <tbody>${rows}${emptyRowsHTML}</tbody>
        </table>
        ${footer}
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Invoice #${sale.invoiceNumber}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;font-family:'Noto Sans Tamil','Segoe UI',Arial,sans-serif;}
    @media print{@page{size:A4;margin:0;}body{margin:0;}}</style>
  </head><body>${pageHTML}</body></html>`;
}

// ── Generate bilingual Sales Report HTML ──────────────────────────────────────
function generateReportHTML(sales, periodLabel, lang = 'english') {
  const isTamil = lang === 'tamil';
  const L = (en, ta) => isTamil ? ta : en;
  const pages  = chunkArray(sales, ITEMS_PER_A4);
  const total  = pages.length;
  const date   = new Date().toLocaleDateString('en-IN');

  const grandTotal    = sales.reduce((s,i) => s+(i.totalAmount||0), 0);
  const grandSubtotal = sales.reduce((s,i) => s+(i.subtotal||0), 0);
  const grandDisc     = sales.reduce((s,i) => s+(i.discount||0), 0);
  const grandGst      = sales.reduce((s,i) => s+((i.subtotal-(i.discount||0))*(i.tax||0)/100), 0);
  const grandPaid     = sales.reduce((s,i) => s+(i.amountPaid||(i.paymentStatus==='paid'?i.totalAmount:0)||0), 0);
  const grandBalance  = grandTotal - grandPaid;

  const pageHTML = pages.map((pageSales, pi) => {
    const isLast    = pi === total - 1;
    const emptyRows = Math.max(0, ITEMS_PER_A4 - pageSales.length);

    const rows = pageSales.map((sale, i) => {
      const gst     = (sale.subtotal-(sale.discount||0))*(sale.tax||0)/100;
      const paid    = sale.amountPaid||(sale.paymentStatus==='paid'?sale.totalAmount:0)||0;
      const balance = Math.max(0, (sale.totalAmount||0) - paid);
      const displayName = isTamil && sale.customerNameTamil ? sale.customerNameTamil : sale.customerName;
      return `<tr style="background:${((pi*ITEMS_PER_A4+i)%2===0)?'#fff':'#fdf8f3'};">
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;font-weight:700;color:#d4831e;">#${sale.invoiceNumber}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;">${new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;font-weight:600;">${displayName}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;color:#666;">${sale.customerPhone||'—'}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;">₹${sale.subtotal?.toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;color:#16a34a;">${sale.discount>0?'-₹'+sale.discount?.toFixed(2):'—'}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;font-weight:700;">₹${sale.totalAmount?.toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;color:#166534;font-weight:700;">₹${paid.toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;color:${balance>0?'#b91c1c':'#166534'};font-weight:700;">${balance>0?`₹${balance.toFixed(2)}`:'✓'}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:center;text-transform:capitalize;">${sale.paymentMethod}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:center;">
          <span style="padding:2px 7px;border-radius:12px;font-size:9px;font-weight:700;background:${sale.paymentStatus==='paid'?'#dcfce7':sale.paymentStatus==='pending'?'#fef9c3':'#fee2e2'};color:${sale.paymentStatus==='paid'?'#166534':sale.paymentStatus==='pending'?'#854d0e':'#991b1b'};">${isTamil?(TAMIL[sale.paymentStatus]||sale.paymentStatus):sale.paymentStatus}</span>
        </td>
      </tr>`;
    }).join('');

    const emptyRowsHTML = Array(emptyRows).fill(`<tr>${Array(11).fill('<td style="border:1px solid #eee;padding:5px 7px;">&nbsp;</td>').join('')}</tr>`).join('');

    const footer = isLast ? `
      <tfoot>
        <tr style="background:#d4831e;">
          <td colspan="3" style="border:1px solid #b45309;padding:7px 8px;font-size:11px;font-weight:800;color:white;">${L('TOTAL','மொத்தம்')} (${sales.length} ${L('invoices', TAMIL.invoices)})</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:10px;font-weight:800;text-align:right;color:white;">₹${grandSubtotal.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:10px;font-weight:800;text-align:right;color:#bbf7d0;">-₹${grandDisc.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:12px;font-weight:900;text-align:right;color:white;">₹${grandTotal.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:11px;font-weight:800;text-align:right;color:#bbf7d0;">₹${grandPaid.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:11px;font-weight:800;text-align:right;color:#fecaca;">₹${Math.max(0,grandBalance).toFixed(2)}</td>
          <td colspan="3" style="border:1px solid #b45309;padding:7px 8px;"></td>
        </tr>
      </tfoot>` : `<tfoot><tr><td colspan="11" style="border-top:2px solid #ddd;padding:7px 8px;font-size:10px;color:#888;text-align:right;">${L('Continued on next page...',TAMIL.continued)} (${L('Page',TAMIL.page)} ${pi+1}/${total})</td></tr></tfoot>`;

    return `
      <div style="width:210mm;min-height:297mm;background:#fff;font-family:'Noto Sans Tamil','Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:10mm;box-sizing:border-box;page-break-after:${isLast?'auto':'always'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #d4831e;margin-bottom:16px;">
          <div>
            <div style="font-size:22px;font-weight:900;color:#d4831e;font-family:Georgia,serif;">🌾 ${isTamil?'சாக்கா அரிசி கடை':'Saka Rice Shop'}</div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">${L('Sales Report', TAMIL.salesReport)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;">${L('Period', TAMIL.period)}</div>
            <div style="font-size:14px;font-weight:800;color:#1a1a1a;margin-top:2px;">${periodLabel}</div>
            <div style="font-size:11px;color:#888;margin-top:3px;">${L('Generated',TAMIL.generated)}: ${date}</div>
            <div style="font-size:11px;color:#888;margin-top:2px;">${L('Page',TAMIL.page)} ${pi+1} / ${total}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#d4831e;">
              ${[L('Inv #','இல #'),L('Date',TAMIL.date),L('Customer',TAMIL.customer),L('Phone',TAMIL.phone),L('Subtotal',TAMIL.subtotal),L('Discount',TAMIL.discount),L('Total',TAMIL.total),L('Paid',TAMIL.paid),L('Balance',TAMIL.balance),'Method','Status'].map(h=>`
              <th style="padding:7px 6px;font-size:9px;font-weight:800;text-transform:uppercase;color:white;text-align:left;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}${emptyRowsHTML}</tbody>
          ${footer}
        </table>
        ${isLast ? `
        <div style="margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
          ${[[L('Total Invoices','மொத்த இல'),sales.length,'#1a1a1a'],[L('Grand Total',TAMIL.grandTotal),'₹'+grandTotal.toFixed(2),'#d4831e'],[L('Total Paid',TAMIL.paid),'₹'+grandPaid.toFixed(2),'#166534'],[L('Total Balance',TAMIL.balance),'₹'+Math.max(0,grandBalance).toFixed(2),'#b91c1c']].map(([l,v,c],i)=>`
          <div style="padding:12px 14px;border-right:${i<3?'1px solid #ddd':'none'};background:${i===3&&grandBalance>0?'#fef2f2':i===3?'#f0fdf4':'#fff'};">
            <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${l}</div>
            <div style="font-size:16px;font-weight:900;color:${c};">${v}</div>
          </div>`).join('')}
        </div>
        <div style="text-align:center;margin-top:16px;font-size:10px;color:#999;">${L('Computer Generated Sales Report — Saka Rice Shop','கணினி மூலம் உருவாக்கப்பட்ட விற்பனை அறிக்கை — சாக்கா அரிசி கடை')}</div>` : ''}
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${L('Sales Report','விற்பனை அறிக்கை')} — Saka Rice Shop</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;font-family:'Noto Sans Tamil','Segoe UI',Arial,sans-serif;}
    @media print{@page{size:A4 landscape;margin:0;}body{margin:0;}}</style>
  </head><body>${pageHTML}</body></html>`;
}

// ── CSV export ─────────────────────────────────────────────────────────────────
function exportToCSV(sales, periodLabel) {
  const rows = [
    ['SAKA RICE SHOP — SALES REPORT'],
    [`Period: ${periodLabel}`],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['Invoice #','Date','Customer','Phone','Subtotal','Discount','GST %','Grand Total','Amount Paid','Balance','Method','Status'],
    ...sales.map(s => {
      const paid    = s.amountPaid||(s.paymentStatus==='paid'?s.totalAmount:0)||0;
      const balance = Math.max(0,(s.totalAmount||0)-paid);
      return [s.invoiceNumber, new Date(s.createdAt).toLocaleDateString('en-IN'), s.customerName, s.customerPhone||'',
        s.subtotal?.toFixed(2), s.discount||0, s.tax||0, s.totalAmount?.toFixed(2),
        paid.toFixed(2), balance.toFixed(2), s.paymentMethod, s.paymentStatus];
    }),
    [],
    ['','','','','TOTALS',
      sales.reduce((a,s)=>a+(s.subtotal||0),0).toFixed(2),
      sales.reduce((a,s)=>a+(s.discount||0),0).toFixed(2),'',
      sales.reduce((a,s)=>a+(s.totalAmount||0),0).toFixed(2),
      sales.reduce((a,s)=>a+(s.amountPaid||(s.paymentStatus==='paid'?s.totalAmount:0)||0),0).toFixed(2),
      sales.reduce((a,s)=>a+Math.max(0,(s.totalAmount||0)-(s.amountPaid||(s.paymentStatus==='paid'?s.totalAmount:0)||0)),0).toFixed(2),
      '',''],
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SalesReport_${periodLabel.replace(/\s+/g,'_')}_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function openPrint(html) {
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { toast.error('Please allow popups'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 900);
}

// ══════════════════════════════════════════════════════════════════════════════
// InvoiceModal — view single invoice
// ══════════════════════════════════════════════════════════════════════════════
function InvoiceModal({ sale, onClose }) {
  const [printLang, setPrintLang] = useState('english');
  const date    = new Date(sale.createdAt);
  const gstAmt  = sale.tax > 0 ? ((sale.subtotal - (sale.discount||0)) * sale.tax / 100) : 0;
  const cgst    = gstAmt / 2;
  const paid    = sale.amountPaid || (sale.paymentStatus === 'paid' ? sale.totalAmount : 0) || 0;
  const balance = Math.max(0, (sale.totalAmount||0) - paid);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-brand-500 rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Invoice #{sale.invoiceNumber}</h2>
            <p className="text-xs text-white/80 font-semibold">{sale.customerName} • {date.toLocaleDateString('en-IN')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-white/30">
              {['english','tamil'].map(l => (
                <button key={l} onClick={() => setPrintLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize transition-all ${printLang===l?'bg-white text-brand-600':'text-white/70 hover:bg-white/20'}`}>
                  {l === 'english' ? '🇬🇧 EN' : '🇮🇳 TN'}
                </button>
              ))}
            </div>
            <button onClick={() => openPrint(generateInvoiceHTML(sale, printLang))} className="bg-white text-brand-600 hover:bg-brand-50 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Customer</p>
              <p className="text-gray-900 font-bold text-sm">{sale.customerName}</p>
              {sale.customerNameTamil && <p className="text-gray-500 text-xs mt-0.5">{sale.customerNameTamil}</p>}
              {sale.customerPhone && <p className="text-gray-600 text-xs mt-1">📞 {sale.customerPhone}</p>}
              {sale.customerAddress && <p className="text-gray-600 text-xs mt-1">📍 {sale.customerAddress}</p>}
              {sale.customerCity && <p className="text-gray-500 text-xs mt-0.5">{sale.customerCity}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</p>
              <p className="text-gray-900 font-bold text-sm capitalize">{sale.paymentMethod}</p>
              <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${sale.paymentStatus==='paid'?'bg-green-100 text-green-700':sale.paymentStatus==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{sale.paymentStatus}</span>
              {paid > 0 && <p className="text-xs text-green-600 font-bold mt-1">Paid: ₹{paid.toFixed(2)}</p>}
              {balance > 0 && <p className="text-xs text-red-600 font-bold mt-0.5">Balance: ₹{balance.toFixed(2)}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Details</p>
              <p className="text-gray-900 font-bold text-sm">{date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
              <p className="text-gray-500 text-xs mt-1">{date.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
              {sale.soldBy && <p className="text-gray-500 text-xs mt-1">By: {sale.soldBy}</p>}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-brand-500">{['#','Item','Qty','Rate','Disc','Amount'].map(h=><th key={h} className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${i%2===0?'bg-white':'bg-gray-50'}`}>
                    <td className="py-3 px-4 text-gray-400 font-bold text-xs">{i+1}</td>
                    <td className="py-3 px-4"><p className="text-gray-900 font-bold">{item.riceName}</p><p className="text-gray-500 text-xs">{item.riceType}</p></td>
                    <td className="py-3 px-4 font-bold font-mono text-gray-700">{item.quantity} kg</td>
                    <td className="py-3 px-4 font-bold font-mono text-gray-700">₹{item.pricePerKg?.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold font-mono text-green-600">{item.itemDiscount>0?`-₹${item.itemDiscount?.toFixed(2)}`:'—'}</td>
                    <td className="py-3 px-4 font-bold font-mono text-brand-600">₹{item.totalPrice?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex justify-between px-4 py-3 border-b border-gray-200"><span className="text-gray-600 font-semibold text-sm">Subtotal</span><span className="font-bold font-mono text-gray-900">₹{sale.subtotal?.toFixed(2)}</span></div>
              {sale.discount > 0 && <div className="flex justify-between px-4 py-3 border-b border-gray-200"><span className="text-green-700 font-bold text-sm flex items-center gap-1"><Tag className="w-3 h-3" /> Discount</span><span className="font-bold font-mono text-green-700">-₹{sale.discount?.toFixed(2)}</span></div>}
              {sale.tax > 0 && <><div className="flex justify-between px-4 py-2 border-b border-gray-100"><span className="text-blue-700 font-bold text-xs">CGST ({sale.tax/2}%)</span><span className="font-bold font-mono text-blue-700 text-xs">₹{cgst.toFixed(2)}</span></div>
              <div className="flex justify-between px-4 py-2 border-b border-gray-200"><span className="text-blue-700 font-bold text-xs">SGST ({sale.tax/2}%)</span><span className="font-bold font-mono text-blue-700 text-xs">₹{cgst.toFixed(2)}</span></div></>}
              <div className="flex justify-between px-4 py-4 bg-brand-500"><span className="font-bold text-white text-base">Grand Total</span><span className="font-bold font-mono text-white text-lg">₹{sale.totalAmount?.toFixed(2)}</span></div>
              {paid > 0 && <div className="flex justify-between px-4 py-2 border-t border-gray-200"><span className="text-green-700 font-bold text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Paid</span><span className="font-bold font-mono text-green-700">₹{paid.toFixed(2)}</span></div>}
              {balance > 0 && <div className="flex justify-between px-4 py-2 bg-red-50 border-t border-red-200"><span className="text-red-700 font-bold text-sm flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Balance Due</span><span className="font-bold font-mono text-red-700">₹{balance.toFixed(2)}</span></div>}
            </div>
          </div>
          {sale.notes && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-amber-800 font-semibold">{sale.notes}</p></div>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EditSaleModal — full edit with Tamil fields
// ══════════════════════════════════════════════════════════════════════════════
function EditSaleModal({ sale, riceItems, onClose, onSaved }) {
  const [customer, setCustomer] = useState({
    name: sale.customerName, phone: sale.customerPhone||'', address: sale.customerAddress||'',
    city: sale.customerCity||'', nameTamil: sale.customerNameTamil||'', addressTamil: sale.customerAddressTamil||''
  });
  const [items, setItems]           = useState(sale.items.map(i=>({rice:i.rice?._id||i.rice,quantity:i.quantity,itemDiscount:i.itemDiscount||0})));
  const [overallDiscount, setOverallDiscount] = useState(sale.discount||0);
  const [gstRate, setGstRate]       = useState(sale.tax||0);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod||'cash');
  const [paymentStatus, setPaymentStatus] = useState(sale.paymentStatus||'paid');
  const [amountPaid, setAmountPaid] = useState(sale.amountPaid||0);
  const [notes, setNotes]           = useState(sale.notes||'');
  const [saving, setSaving]         = useState(false);

  const getRice    = id => riceItems.find(r=>r._id===id);
  const addItem    = () => setItems(p=>[...p,{rice:'',quantity:'',itemDiscount:0}]);
  const removeItem = i  => setItems(p=>p.filter((_,idx)=>idx!==i));
  const updateItem = (i,k,v) => setItems(p=>p.map((it,idx)=>idx===i?{...it,[k]:v}:it));

  const calcItemTotal = item => {
    const rice = getRice(item.rice);
    if (!rice||!item.quantity) return 0;
    return Math.max(0,Number(item.quantity)*rice.pricePerKg-Number(item.itemDiscount||0));
  };
  const subtotal      = items.reduce((s,it)=>s+calcItemTotal(it),0);
  const afterDiscount = Math.max(0,subtotal-Number(overallDiscount));
  const gstAmount     = afterDiscount*gstRate/100;
  const grandTotal    = afterDiscount+gstAmount;
  const paidAmt       = Number(amountPaid)||0;
  const balanceAmt    = Math.max(0,grandTotal-paidAmt);

  // Auto-set amountPaid when status = paid
  useEffect(()=>{ if(paymentStatus==='paid') setAmountPaid(grandTotal.toFixed(2)); },[paymentStatus,grandTotal]);

  const handleSave = async () => {
    if (!customer.name.trim()) return toast.error('Customer name is required');
    const validItems = items.filter(it=>it.rice&&it.quantity>0);
    if (!validItems.length) return toast.error('Add at least one item');
    setSaving(true);
    try {
      const payload = {
        customerName:customer.name.trim(), customerPhone:customer.phone.trim(), customerAddress:customer.address.trim(),
        customerCity:customer.city.trim(), customerNameTamil:customer.nameTamil.trim(), customerAddressTamil:customer.addressTamil.trim(),
        items:validItems.map(it=>({rice:it.rice,quantity:Number(it.quantity),itemDiscount:Number(it.itemDiscount||0)})),
        discount:Number(overallDiscount), tax:gstRate, paymentMethod, paymentStatus,
        amountPaid:paidAmt, notes,
      };
      const res = await updateSale(sale._id, payload);
      toast.success(`Invoice #${sale.invoiceNumber} updated!`);
      onSaved(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message||'Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b bg-brand-500 rounded-t-2xl">
          <div><h2 className="font-bold text-white text-lg">Edit Invoice #{sale.invoiceNumber}</h2><p className="text-white/70 text-xs">Stock will be auto-adjusted on save</p></div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Customer Info */}
          <div>
            <p className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><User className="w-4 h-4 text-brand-500"/>Customer Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name (English) *</label><input className="input-field" value={customer.name} onChange={e=>setCustomer(c=>({...c,name:e.target.value}))}/></div>
              <div><label className="label">Name (Tamil)</label><input className="input-field" placeholder="தமிழ் பெயர்" value={customer.nameTamil} onChange={e=>setCustomer(c=>({...c,nameTamil:e.target.value}))}/></div>
              <div><label className="label">Phone</label><input className="input-field" value={customer.phone} onChange={e=>setCustomer(c=>({...c,phone:e.target.value}))}/></div>
              <div><label className="label">City</label><input className="input-field" placeholder="City / நகரம்" value={customer.city} onChange={e=>setCustomer(c=>({...c,city:e.target.value}))}/></div>
              <div><label className="label">Address (English)</label><input className="input-field" value={customer.address} onChange={e=>setCustomer(c=>({...c,address:e.target.value}))}/></div>
              <div><label className="label">Address (Tamil)</label><input className="input-field" placeholder="முகவரி தமிழில்" value={customer.addressTamil} onChange={e=>setCustomer(c=>({...c,addressTamil:e.target.value}))}/></div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-900 text-sm flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-brand-500"/>Items</p>
              <button type="button" onClick={addItem} className="btn-primary text-xs px-3 py-1.5"><Plus className="w-3 h-3"/>Add Item</button>
            </div>
            {items.map((item,idx) => {
              const rice = getRice(item.rice);
              const balance = rice ? rice.totalStock - rice.soldStock : 0;
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 items-center mb-2">
                  <div className="col-span-4"><select className="input-field" value={item.rice} onChange={e=>updateItem(idx,'rice',e.target.value)}>
                    <option value="">Select Rice</option>
                    {riceItems.map(r=><option key={r._id} value={r._id}>{r.name} — ₹{r.pricePerKg}/kg</option>)}
                  </select></div>
                  <div className="col-span-2"><div className={`text-sm font-bold px-3 py-2 rounded-xl ${balance>0?'text-green-700 bg-green-50':'text-red-700 bg-red-50'}`}>{rice?`${balance.toFixed(1)} kg`:'—'}</div></div>
                  <div className="col-span-2"><input type="number" className="input-field" placeholder="Qty" min="0.1" step="0.1" value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)}/></div>
                  <div className="col-span-2"><input type="number" className="input-field" placeholder="Disc ₹" min="0" value={item.itemDiscount} onChange={e=>updateItem(idx,'itemDiscount',e.target.value)}/></div>
                  <div className="col-span-1"><p className="text-sm font-bold font-mono text-brand-600">₹{calcItemTotal(item).toFixed(2)}</p></div>
                  <div className="col-span-1 flex justify-end">{items.length>1&&<button type="button" onClick={()=>removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>}</div>
                </div>
              );
            })}
          </div>

          {/* GST + Discount + Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div><label className="label">GST Rate</label>
                <div className="flex gap-2">{[0,5,12,18].map(rate=>(
                  <button key={rate} type="button" onClick={()=>setGstRate(rate)} className={`px-3 py-2 rounded-xl text-sm font-bold border-2 ${gstRate===rate?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>
                    {rate===0?'None':`${rate}%`}
                  </button>
                ))}</div>
              </div>
              <div><label className="label">Overall Discount (₹)</label>
                <input type="number" className="input-field" min="0" step="0.01" value={overallDiscount} onChange={e=>setOverallDiscount(e.target.value)}/></div>
            </div>
            <div className="space-y-3">
              <div><label className="label">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash','card','upi','credit'].map(m=>(
                    <button key={m} type="button" onClick={()=>setPaymentMethod(m)} className={`py-2 rounded-xl text-sm font-bold capitalize border-2 ${paymentMethod===m?'bg-brand-500 text-white border-brand-500':'bg-white text-gray-700 border-gray-300'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div><label className="label">Payment Status</label>
                <div className="flex gap-2">
                  {['paid','pending','partial'].map(s=>(
                    <button key={s} type="button" onClick={()=>setPaymentStatus(s)} className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize border-2 ${paymentStatus===s?s==='paid'?'bg-green-600 text-white border-green-600':s==='pending'?'bg-amber-500 text-white border-amber-500':'bg-red-500 text-white border-red-500':'bg-white text-gray-700 border-gray-300'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Amount Paid (₹)</label>
              <div className="relative"><Wallet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="number" className="input-field pl-9" min="0" step="0.01" value={amountPaid}
                  onChange={e=>{ setAmountPaid(e.target.value); if(Number(e.target.value)>=grandTotal) setPaymentStatus('paid'); else if(Number(e.target.value)>0) setPaymentStatus('partial'); else setPaymentStatus('pending'); }}/>
              </div>
            </div>
            <div className="flex items-end"><div className={`w-full p-3 rounded-xl font-bold text-sm flex items-center justify-between ${balanceAmt>0?'bg-red-50 border border-red-200 text-red-700':'bg-green-50 border border-green-200 text-green-700'}`}>
              <span>Balance Due</span><span className="font-mono text-base">₹{balanceAmt.toFixed(2)}</span>
            </div></div>
          </div>

          <div><label className="label">Notes</label><textarea className="input-field" rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></div>

          {/* Total bar */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-4 text-sm flex-wrap">
              <span className="text-gray-600">Subtotal: <strong className="font-mono">₹{subtotal.toFixed(2)}</strong></span>
              {Number(overallDiscount)>0&&<span className="text-green-600">Disc: <strong>-₹{Number(overallDiscount).toFixed(2)}</strong></span>}
              {gstRate>0&&<span className="text-blue-600">GST: <strong>+₹{gstAmount.toFixed(2)}</strong></span>}
              <span className="text-brand-600 font-bold">Total: <strong className="text-lg">₹{grandTotal.toFixed(2)}</strong></span>
              <span className={`font-bold ${balanceAmt>0?'text-red-600':'text-green-600'}`}>Balance: <strong>₹{balanceAmt.toFixed(2)}</strong></span>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6">{saving?'Saving...':'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NewBillForm
// ══════════════════════════════════════════════════════════════════════════════
function NewBillForm({ riceItems, onSuccess }) {
  const [customer, setCustomer] = useState({ name:'', phone:'', address:'', city:'', nameTamil:'', addressTamil:'' });
  const [items, setItems]       = useState([{ rice:'', quantity:'', itemDiscount:0 }]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [gstRate, setGstRate]   = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  const addItem    = () => setItems(p=>[...p,{rice:'',quantity:'',itemDiscount:0}]);
  const removeItem = i  => setItems(p=>p.filter((_,idx)=>idx!==i));
  const updateItem = (i,k,v) => setItems(p=>p.map((it,idx)=>idx===i?{...it,[k]:v}:it));
  const getRice    = id => riceItems.find(r=>r._id===id);

  const calcItemTotal = item => {
    const rice = getRice(item.rice);
    if (!rice||!item.quantity) return 0;
    return Math.max(0,Number(item.quantity)*rice.pricePerKg-Number(item.itemDiscount||0));
  };
  const subtotal      = items.reduce((s,it)=>s+calcItemTotal(it),0);
  const afterDiscount = Math.max(0,subtotal-Number(overallDiscount));
  const gstAmount     = afterDiscount*gstRate/100;
  const grandTotal    = afterDiscount+gstAmount;
  const paidAmt       = Number(amountPaid)||0;
  const balanceAmt    = Math.max(0,grandTotal-paidAmt);

  useEffect(()=>{ if(paymentStatus==='paid') setAmountPaid(grandTotal.toFixed(2)); },[paymentStatus]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!customer.name.trim()) return toast.error('Customer name is required');
    const validItems = items.filter(it=>it.rice&&it.quantity>0);
    if (!validItems.length) return toast.error('Add at least one item');
    setSaving(true);
    try {
      const adminName = sessionStorage.getItem('saka_admin_name') || 'Admin';
      const payload = {
        customerName:customer.name.trim(), customerPhone:customer.phone.trim(), customerAddress:customer.address.trim(),
        customerCity:customer.city.trim(), customerNameTamil:customer.nameTamil.trim(), customerAddressTamil:customer.addressTamil.trim(),
        items:validItems.map(it=>({rice:it.rice,quantity:Number(it.quantity),itemDiscount:Number(it.itemDiscount||0)})),
        discount:Number(overallDiscount), tax:gstRate, paymentMethod, paymentStatus,
        amountPaid:paidAmt, notes, soldBy:adminName,
      };
      const res = await createSale(payload);
      toast.success(`Bill #${res.data.data.invoiceNumber} created!`);
      onSuccess(res.data.data);
      setCustomer({name:'',phone:'',address:'',city:'',nameTamil:'',addressTamil:''});
      setItems([{rice:'',quantity:'',itemDiscount:0}]);
      setOverallDiscount(0); setGstRate(0); setPaymentMethod('cash'); setPaymentStatus('paid'); setAmountPaid(0); setNotes('');
    } catch (err) { toast.error(err.response?.data?.message||'Failed to create bill'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <div className="card p-5">
        <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-brand-500"/> Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Customer Name (English) *</label>
            <div className="relative"><User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Full name" value={customer.name} onChange={e=>setCustomer(c=>({...c,name:e.target.value}))} required/>
            </div></div>
          <div><label className="label">Customer Name (Tamil)</label>
            <div className="relative"><Languages className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="தமிழ் பெயர்" value={customer.nameTamil} onChange={e=>setCustomer(c=>({...c,nameTamil:e.target.value}))}/>
            </div></div>
          <div><label className="label">Phone Number</label>
            <div className="relative"><Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Mobile number" value={customer.phone} onChange={e=>setCustomer(c=>({...c,phone:e.target.value}))}/>
            </div></div>
          <div><label className="label">City</label>
            <div className="relative"><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="City / நகரம்" value={customer.city} onChange={e=>setCustomer(c=>({...c,city:e.target.value}))}/>
            </div></div>
          <div><label className="label">Address (English)</label>
            <div className="relative"><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Customer address" value={customer.address} onChange={e=>setCustomer(c=>({...c,address:e.target.value}))}/>
            </div></div>
          <div><label className="label">Address (Tamil)</label>
            <div className="relative"><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="முகவரி தமிழில்" value={customer.addressTamil} onChange={e=>setCustomer(c=>({...c,addressTamil:e.target.value}))}/>
            </div></div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-brand-500"/>Bill Items <span className="text-xs text-gray-400 font-normal">({items.length} items)</span></h3>
          <button type="button" onClick={addItem} className="btn-primary text-xs px-3 py-1.5"><Plus className="w-3 h-3"/> Add Item</button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-1">{['Rice Item','Stock (kg)','Qty (kg)','Item Disc (₹)','Amount',''].map(l=>(
            <div key={l} className={l===''?'col-span-1':l==='Rice Item'?'col-span-4':'col-span-2'}><p className="label">{l}</p></div>
          ))}</div>
          {items.map((item,idx) => {
            const rice    = getRice(item.rice);
            const balance = rice ? rice.totalStock - rice.soldStock : 0;
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 items-center">
                <div className="col-span-4"><select className="input-field" value={item.rice} onChange={e=>updateItem(idx,'rice',e.target.value)}>
                  <option value="">Select Rice</option>
                  {riceItems.map(r=><option key={r._id} value={r._id}>{r.name} — ₹{r.pricePerKg}/kg</option>)}
                </select></div>
                <div className="col-span-2"><div className={`text-sm font-bold px-3 py-2 rounded-xl ${balance>0?'text-green-700 bg-green-50':'text-red-700 bg-red-50'}`}>{rice?`${balance.toFixed(1)} kg`:'—'}</div></div>
                <div className="col-span-2"><input type="number" className="input-field" placeholder="0.0" min="0.1" step="0.1" value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)}/></div>
                <div className="col-span-2"><div className="relative"><Tag className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="number" className="input-field pl-8" placeholder="0" min="0" step="0.01" value={item.itemDiscount} onChange={e=>updateItem(idx,'itemDiscount',e.target.value)}/>
                </div></div>
                <div className="col-span-1"><p className="text-sm font-bold font-mono text-brand-600">₹{calcItemTotal(item).toFixed(2)}</p></div>
                <div className="col-span-1 flex justify-end">{items.length>1&&<button type="button" onClick={()=>removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GST & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Percent className="w-4 h-4 text-brand-500"/> GST &amp; Discount</h3>
          <div className="space-y-4">
            <div><label className="label">GST Rate</label>
              <div className="flex gap-2 flex-wrap">
                {GST_RATES.map(rate=>(
                  <button key={rate} type="button" onClick={()=>setGstRate(rate)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${gstRate===rate?'bg-blue-600 text-white border-blue-600 shadow':'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                    {rate===0?'No GST':`${rate}%`}
                  </button>
                ))}
              </div>
              {gstRate>0&&<p className="text-xs text-blue-600 font-bold mt-2">CGST {gstRate/2}% + SGST {gstRate/2}% = ₹{gstAmount.toFixed(2)}</p>}
            </div>
            <div><label className="label">Overall Discount (₹)</label>
              <div className="relative"><Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="number" className="input-field pl-9" placeholder="0.00" min="0" step="0.01" value={overallDiscount} onChange={e=>setOverallDiscount(e.target.value)}/>
              </div></div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-500"/> Payment</h3>
          <div className="space-y-4">
            <div><label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m=>(
                  <button key={m} type="button" onClick={()=>setPaymentMethod(m)}
                    className={`py-2.5 rounded-xl text-sm font-bold capitalize border-2 transition-all ${paymentMethod===m?'bg-brand-500 text-white border-brand-500':'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>{m}</button>
                ))}
              </div></div>
            <div><label className="label">Payment Status</label>
              <div className="flex gap-2">
                {PAYMENT_STATUSES.map(s=>(
                  <button key={s} type="button" onClick={()=>{ setPaymentStatus(s); if(s==='paid') setAmountPaid(grandTotal.toFixed(2)); if(s==='pending') setAmountPaid(0); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize border-2 transition-all ${paymentStatus===s?s==='paid'?'bg-green-600 text-white border-green-600':s==='pending'?'bg-amber-500 text-white border-amber-500':'bg-red-500 text-white border-red-500':'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>{s}</button>
                ))}
              </div></div>
          </div>
        </div>
      </div>

      {/* Amount Paid */}
      <div className="card p-5">
        <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-brand-500"/> Payment Amount</h3>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div><label className="label">Amount Paid (₹)</label>
            <div className="relative"><Wallet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type="number" className="input-field pl-9" placeholder="0.00" min="0" step="0.01" value={amountPaid}
                onChange={e=>{ setAmountPaid(e.target.value); const v=Number(e.target.value); if(v>=grandTotal) setPaymentStatus('paid'); else if(v>0) setPaymentStatus('partial'); else setPaymentStatus('pending'); }}/>
            </div></div>
          <div className={`p-4 rounded-xl border font-bold text-center ${balanceAmt>0?'bg-red-50 border-red-200':'bg-green-50 border-green-200'}`}>
            <p className="text-xs uppercase tracking-wide mb-1 opacity-70">Balance Due</p>
            <p className={`text-xl font-mono ${balanceAmt>0?'text-red-700':'text-green-700'}`}>₹{balanceAmt.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl border bg-brand-50 border-brand-200 font-bold text-center">
            <p className="text-xs uppercase tracking-wide mb-1 text-brand-600 opacity-70">Grand Total</p>
            <p className="text-xl font-mono text-brand-600">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="label">Notes (Optional)</label>
        <textarea className="input-field" rows={2} placeholder="Any additional notes..." value={notes} onChange={e=>setNotes(e.target.value)}/>
      </div>

      {/* Summary + Submit */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-6">
            <div className="text-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Subtotal</p><p className="text-lg font-bold font-mono text-gray-900">₹{subtotal.toFixed(2)}</p></div>
            {Number(overallDiscount)>0&&<div className="text-center"><p className="text-xs font-bold text-green-600 uppercase tracking-wide">Discount</p><p className="text-lg font-bold font-mono text-green-600">-₹{Number(overallDiscount).toFixed(2)}</p></div>}
            {gstRate>0&&<div className="text-center"><p className="text-xs font-bold text-blue-600 uppercase tracking-wide">GST ({gstRate}%)</p><p className="text-lg font-bold font-mono text-blue-600">+₹{gstAmount.toFixed(2)}</p></div>}
            <div className="text-center border-l pl-6 border-gray-200"><p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Grand Total</p><p className="text-2xl font-bold font-mono text-brand-600">₹{grandTotal.toFixed(2)}</p></div>
            {balanceAmt>0&&<div className="text-center border-l pl-6 border-gray-200"><p className="text-xs font-bold text-red-600 uppercase tracking-wide">Balance Due</p><p className="text-xl font-bold font-mono text-red-600">₹{balanceAmt.toFixed(2)}</p></div>}
          </div>
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-base disabled:opacity-60">
            {saving?<span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating...</span>
              :<span className="flex items-center gap-2"><Receipt className="w-5 h-5"/>Create Invoice</span>}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── InvoiceCreatedView ────────────────────────────────────────────────────────
function InvoiceCreatedView({ sale, onNewBill, onViewHistory }) {
  const [printLang, setPrintLang] = useState('english');
  const paid    = sale.amountPaid||(sale.paymentStatus==='paid'?sale.totalAmount:0)||0;
  const balance = Math.max(0,(sale.totalAmount||0)-paid);

  return (
    <div className="space-y-5">
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-7 h-7 text-green-600"/></div>
          <div>
            <p className="font-bold text-green-800 text-lg">Invoice #{sale.invoiceNumber} Created!</p>
            <p className="text-green-700 text-sm">{sale.customerName} • ₹{sale.totalAmount?.toFixed(2)} • {sale.paymentStatus}</p>
            {balance > 0 && <p className="text-amber-700 text-xs font-bold mt-0.5">⚠ Balance Due: ₹{balance.toFixed(2)}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex rounded-xl overflow-hidden border-2 border-brand-200">
            {['english','tamil'].map(l=>(
              <button key={l} onClick={()=>setPrintLang(l)}
                className={`px-3 py-2 text-xs font-bold capitalize transition-all ${printLang===l?'bg-brand-500 text-white':'text-gray-700 hover:bg-gray-50'}`}>
                {l==='english'?'🇬🇧 English':'🇮🇳 Tamil'}
              </button>
            ))}
          </div>
          <button onClick={()=>openPrint(generateInvoiceHTML(sale,printLang))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-brand-500 text-white hover:bg-brand-600 transition-all">
            <Printer className="w-4 h-4"/> Print Invoice
          </button>
          <button onClick={onNewBill} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border-2 border-gray-300 text-gray-700 hover:border-brand-400 transition-all"><Receipt className="w-4 h-4"/> New Bill</button>
          <button onClick={onViewHistory} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border-2 border-gray-300 text-gray-700 hover:border-brand-400 transition-all"><History className="w-4 h-4"/> All Invoices</button>
        </div>
      </div>

      {/* Payment summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Grand Total</p><p className="text-2xl font-bold font-mono text-brand-600">₹{sale.totalAmount?.toFixed(2)}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">Amount Paid</p><p className="text-2xl font-bold font-mono text-green-600">₹{paid.toFixed(2)}</p></div>
        <div className={`card p-4 text-center ${balance>0?'bg-red-50 border-red-200':''}`}><p className={`text-xs font-bold uppercase tracking-wide mb-1 ${balance>0?'text-red-600':'text-gray-500'}`}>Balance Due</p><p className={`text-2xl font-bold font-mono ${balance>0?'text-red-600':'text-green-600'}`}>₹{balance.toFixed(2)}</p></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// InvoiceHistory — with full edit/delete, bilingual print, balance column
// ══════════════════════════════════════════════════════════════════════════════
function InvoiceHistory({ refresh, riceItems }) {
  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [period, setPeriod]         = useState('month');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewSale, setViewSale]     = useState(null);
  const [editSale, setEditSale]     = useState(null);
  const [printLang, setPrintLang]   = useState('english');

  const periodLabel = period !== 'custom'
    ? PERIODS.find(p=>p.value===period)?.label || period
    : `${startDate||'…'} → ${endDate||'…'}`;

  const buildParams = (override={}) => {
    const params = { page, limit:15, ...override };
    if (period !== 'custom') params.period = period;
    else { if (startDate) params.startDate = startDate; if (endDate) params.endDate = endDate; }
    if (search) params.search = search;
    return params;
  };

  const load = () => {
    setLoading(true);
    getSales(buildParams())
      .then(r=>{ setSales(r.data.data); setPagination(r.data.pagination); })
      .catch(()=>toast.error('Failed to load invoices'))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[page, period, refresh]);

  const handleSearch = e => { e.preventDefault(); setPage(1); load(); };

  const fetchAll = async () => {
    const r = await getSales(buildParams({page:1,limit:9999}));
    return r.data.data;
  };

  const handleDelete = async (id, invoiceNo) => {
    if (!window.confirm(`Delete Invoice #${invoiceNo}? Stock will be restored. This cannot be undone.`)) return;
    try { await deleteSale(id); toast.success(`Invoice #${invoiceNo} deleted. Stock restored.`); load(); }
    catch { toast.error('Failed to delete invoice'); }
  };

  const handleView = async id => {
    try { const res = await getSaleById(id); setViewSale(res.data.data); }
    catch { toast.error('Failed to load invoice'); }
  };

  const handleExportCSV = async () => { const all = await fetchAll(); exportToCSV(all, periodLabel); toast.success('CSV exported!'); };
  const handlePrintReport = async () => { const all = await fetchAll(); openPrint(generateReportHTML(all, periodLabel, printLang)); };

  // Totals for current page
  const totalAmt     = sales.reduce((s,i)=>s+(i.totalAmount||0),0);
  const totalPaid    = sales.reduce((s,i)=>s+(i.amountPaid||(i.paymentStatus==='paid'?i.totalAmount:0)||0),0);
  const totalBalance = sales.reduce((s,i)=>s+Math.max(0,(i.totalAmount||0)-(i.amountPaid||(i.paymentStatus==='paid'?i.totalAmount:0)||0)),0);

  const statusIcon = s => s==='paid'?<CheckCircle className="w-3 h-3"/>:s==='pending'?<Clock className="w-3 h-3"/>:<AlertCircle className="w-3 h-3"/>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-brand-500"/></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Total Amount</p><p className="text-xl font-bold font-mono text-brand-600">₹{totalAmt.toLocaleString('en-IN',{maximumFractionDigits:0})}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-500"/></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Amount Paid</p><p className="text-xl font-bold font-mono text-green-600">₹{totalPaid.toLocaleString('en-IN',{maximumFractionDigits:0})}</p></div>
        </div>
        <div className={`card p-4 flex items-center gap-3 ${totalBalance>0?'border-red-200 bg-red-50':''}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalBalance>0?'bg-red-100':'bg-gray-100'}`}><AlertTriangle className={`w-5 h-5 ${totalBalance>0?'text-red-500':'text-gray-400'}`}/></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Balance Due</p><p className={`text-xl font-bold font-mono ${totalBalance>0?'text-red-600':'text-green-600'}`}>₹{totalBalance.toLocaleString('en-IN',{maximumFractionDigits:0})}</p></div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p=>(
              <button key={p.value} type="button" onClick={()=>{ setPeriod(p.value); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${period===p.value?'bg-brand-500 text-white border-brand-500 shadow':'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
                <Calendar className="w-3.5 h-3.5"/>{p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Language selector for print */}
            <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
              {['english','tamil'].map(l=>(
                <button key={l} type="button" onClick={()=>setPrintLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize ${printLang===l?'bg-brand-500 text-white':'text-gray-600 hover:bg-gray-50'}`}>
                  {l==='english'?'🇬🇧 EN':'🇮🇳 TN'}
                </button>
              ))}
            </div>
            <button type="button" onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 transition-all">
              <Printer className="w-4 h-4"/> Print / PDF
            </button>
            <button type="button" onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 transition-all">
              <FileSpreadsheet className="w-4 h-4"/> Export Excel
            </button>
          </div>
        </div>

        {period==='custom' && (
          <div className="flex gap-3 items-end flex-wrap">
            <div><label className="label">From</label><input type="date" className="input-field" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
            <div><label className="label">To</label><input type="date" className="input-field" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
            <button type="button" onClick={()=>{ setPage(1); load(); }} className="btn-primary">Apply</button>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label">Search</label>
            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Invoice #, name, phone, address, city…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <button type="submit" className="btn-primary"><Search className="w-4 h-4"/> Search</button>
          <button type="button" className="btn-secondary" onClick={()=>{ setSearch(''); setPage(1); setTimeout(load,0); }}>Clear</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Invoices — <span className="text-brand-600">{periodLabel}</span><span className="text-gray-400 font-normal ml-2">({pagination.total||0} records)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Invoice #','Customer','Items','Total','Paid','Balance','Payment','Status','Date',''].map(h=>(
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"/></td></tr>
              ) : sales.length===0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400 font-bold">No invoices found for this period</td></tr>
              ) : sales.map(sale => {
                const paid    = sale.amountPaid||(sale.paymentStatus==='paid'?sale.totalAmount:0)||0;
                const balance = Math.max(0,(sale.totalAmount||0)-paid);
                return (
                  <tr key={sale._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-3 py-3"><span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">#{sale.invoiceNumber}</span></td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold text-gray-900">{sale.customerName}</p>
                      {sale.customerNameTamil && <p className="text-xs text-gray-400">{sale.customerNameTamil}</p>}
                      {sale.customerPhone && <p className="text-xs text-gray-500">{sale.customerPhone}</p>}
                      {sale.customerCity && <p className="text-xs text-gray-400">{sale.customerCity}</p>}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-600">{sale.items?.length}</td>
                    <td className="px-3 py-3"><span className="text-sm font-bold font-mono text-brand-600">₹{sale.totalAmount?.toFixed(2)}</span></td>
                    <td className="px-3 py-3"><span className="text-sm font-bold font-mono text-green-600">₹{paid.toFixed(2)}</span></td>
                    <td className="px-3 py-3">
                      {balance>0
                        ? <span className="text-sm font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">₹{balance.toFixed(2)}</span>
                        : <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-lg">Cleared</span>}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-gray-600 capitalize">{sale.paymentMethod}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${sale.paymentStatus==='paid'?'bg-green-100 text-green-700':sale.paymentStatus==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                        {statusIcon(sale.paymentStatus)} {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      <br/>{new Date(sale.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>handleView(sale._id)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4"/></button>
                        <button onClick={()=>setEditSale(sale)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4"/></button>
                        <button onClick={()=>handleDelete(sale._id,sale.invoiceNumber)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages>1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs font-bold text-gray-500">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)} className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {viewSale && <InvoiceModal sale={viewSale} onClose={()=>setViewSale(null)}/>}
      {editSale && <EditSaleModal sale={editSale} riceItems={riceItems} onClose={()=>setEditSale(null)} onSaved={()=>{ setEditSale(null); load(); }}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Billing Page
// ══════════════════════════════════════════════════════════════════════════════
export default function Billing() {
  const [tab, setTab]           = useState('new');
  const [riceItems, setRiceItems] = useState([]);
  const [refresh, setRefresh]   = useState(0);
  const [createdSale, setCreatedSale] = useState(null);

  useEffect(()=>{ getRiceItems().then(r=>setRiceItems(r.data.data)).catch(()=>toast.error('Failed to load rice items')); },[]);

  const handleSuccess = sale => { setRefresh(r=>r+1); setCreatedSale(sale); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Billing &amp; Invoicing</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Create GST invoices and manage billing history</p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={()=>{ setTab('new'); setCreatedSale(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab==='new'?'bg-white text-brand-600 shadow-sm border border-gray-200':'text-gray-600 hover:text-gray-900'}`}>
          <Receipt className="w-4 h-4"/> New Bill
        </button>
        <button onClick={()=>{ setTab('history'); setCreatedSale(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab==='history'?'bg-white text-brand-600 shadow-sm border border-gray-200':'text-gray-600 hover:text-gray-900'}`}>
          <History className="w-4 h-4"/> Invoice History
        </button>
      </div>

      {createdSale
        ? <InvoiceCreatedView sale={createdSale} onNewBill={()=>setCreatedSale(null)} onViewHistory={()=>{ setCreatedSale(null); setTab('history'); }}/>
        : tab==='new'
          ? <NewBillForm riceItems={riceItems} onSuccess={handleSuccess}/>
          : <InvoiceHistory refresh={refresh} riceItems={riceItems}/>}
    </div>
  );
}