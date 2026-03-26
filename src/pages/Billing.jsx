import { useState, useEffect } from 'react';
import { getRiceItems, getSales, getSaleById, createSale } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Printer, Eye, X, ChevronLeft, ChevronRight, History,
  Search, Receipt, ShoppingBag, User, Phone, MapPin, CreditCard,
  FileText, Tag, Percent, CheckCircle, Clock, AlertCircle,
  Download, FileSpreadsheet, Calendar
} from 'lucide-react';

const GST_RATES = [0, 5, 12, 18];
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'credit'];
const PAYMENT_STATUSES = ['paid', 'pending', 'partial'];
const ITEMS_PER_A4 = 15;

const PERIODS = [
  { label: 'Today',     value: 'day'    },
  { label: 'This Week', value: 'week'   },
  { label: 'This Month',value: 'month'  },
  { label: 'This Year', value: 'year'   },
  { label: 'Custom',    value: 'custom' },
];

// ── Number-to-words (for invoice footer) ──────────────────────────────────────
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
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

// ── Chunk array into pages ─────────────────────────────────────────────────────
const chunkArray = (arr, size) => {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  if (pages.length === 0) pages.push([]);
  return pages;
};

// ── Generate A4 print HTML for a single invoice ────────────────────────────────
function generateInvoiceHTML(sale) {
  const date   = new Date(sale.createdAt);
  const pages  = chunkArray(sale.items || [], ITEMS_PER_A4);
  const total  = pages.length;
  const gstAmt = sale.tax > 0 ? ((sale.subtotal - (sale.discount||0)) * sale.tax / 100) : 0;
  const cgst   = gstAmt / 2;
  const netAmt = sale.totalAmount || 0;

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

    const emptyRowsHTML = Array(emptyRows).fill(`
      <tr>${Array(7).fill('<td style="border:1px solid #eee;padding:6px 8px;">&nbsp;</td>').join('')}</tr>`
    ).join('');

    const footer = isLast ? `
      <div style="display:grid;grid-template-columns:1fr auto;border-top:2px solid #d4831e;margin-top:0;">
        <div style="padding:12px 16px;border-right:1px solid #ddd;">
          <div style="font-size:10px;color:#888;margin-bottom:4px;">Amount in Words</div>
          <div style="font-weight:700;font-size:11px;">${amountWords(netAmt)}</div>
          <div style="margin-top:12px;font-size:10px;font-weight:700;color:#888;">E &amp; O E</div>
        </div>
        <div style="padding:12px 16px;min-width:220px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="font-size:11px;color:#555;padding:4px 0;border-bottom:1px solid #eee;">Subtotal</td>
                <td style="font-size:11px;font-weight:700;text-align:right;padding:4px 0;border-bottom:1px solid #eee;">₹${sale.subtotal?.toFixed(2)}</td></tr>
            ${sale.discount > 0 ? `<tr><td style="font-size:11px;color:#16a34a;padding:4px 0;border-bottom:1px solid #eee;">Discount</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#16a34a;padding:4px 0;border-bottom:1px solid #eee;">-₹${sale.discount?.toFixed(2)}</td></tr>` : ''}
            ${sale.tax > 0 ? `
            <tr><td style="font-size:11px;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">CGST (${sale.tax/2}%)</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">₹${cgst.toFixed(2)}</td></tr>
            <tr><td style="font-size:11px;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">SGST (${sale.tax/2}%)</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">₹${cgst.toFixed(2)}</td></tr>
            <tr><td style="font-size:11px;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">Total GST (${sale.tax}%)</td>
                <td style="font-size:11px;font-weight:700;text-align:right;color:#1d4ed8;padding:4px 0;border-bottom:1px solid #eee;">₹${gstAmt.toFixed(2)}</td></tr>
            ` : ''}
            <tr style="background:#d4831e;"><td style="font-size:13px;font-weight:800;padding:6px 0;color:white;">Grand Total</td>
                <td style="font-size:13px;font-weight:900;text-align:right;color:white;padding:6px 0;">₹${netAmt.toFixed(2)}</td></tr>
          </table>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 16px;border-top:1px solid #ddd;font-size:11px;font-weight:700;">
        <span>Customer's Seal &amp; Signature</span>
        <span>For Saka Rice Shop</span>
      </div>
      <div style="text-align:center;padding:8px;border-top:1px solid #eee;font-size:10px;color:#999;">
        This is a Computer Generated Invoice — No signature required
      </div>` : `
      <div style="text-align:right;padding:8px 16px;border-top:1px solid #ddd;font-size:10px;color:#888;">
        Continued on next page... &nbsp;&nbsp; Page ${pi+1} of ${total}
      </div>`;

    return `
      <div style="width:210mm;min-height:297mm;background:#fff;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:10mm;box-sizing:border-box;page-break-after:${isLast?'auto':'always'};">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #d4831e;margin-bottom:20px;">
          <div>
            <div style="font-size:24px;font-weight:900;color:#d4831e;font-family:Georgia,serif;">🌾 Saka Rice Shop</div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Premium Rice Traders &amp; Wholesalers</div>
            <div style="font-size:11px;color:#555;margin-top:5px;">GSTIN: 33XXXXX0000X1ZX &nbsp;|&nbsp; +91 99999 99999</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;">Tax Invoice</div>
            <div style="font-size:22px;font-weight:900;">#${sale.invoiceNumber}</div>
            <div style="font-size:11px;color:#888;margin-top:3px;">${date.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
            <div style="margin-top:5px;display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sale.paymentStatus==='paid'?'#dcfce7':'#fef9c3'};color:${sale.paymentStatus==='paid'?'#166534':'#854d0e'};">${sale.paymentStatus?.toUpperCase()}</div>
          </div>
        </div>

        <!-- Buyer info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;padding:14px;background:#fdf8f3;border-radius:8px;border:1px solid #f0e0c8;">
          <div>
            <div style="font-size:9px;color:#d4831e;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;margin-bottom:5px;">Bill To</div>
            <div style="font-weight:800;font-size:14px;">${sale.customerName}</div>
            ${sale.customerPhone ? `<div style="font-size:12px;color:#555;margin-top:3px;">📞 ${sale.customerPhone}</div>` : ''}
            ${sale.customerAddress ? `<div style="font-size:12px;color:#555;margin-top:2px;">📍 ${sale.customerAddress}</div>` : ''}
          </div>
          <div>
            <div style="font-size:9px;color:#d4831e;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;margin-bottom:5px;">Payment Details</div>
            <div style="font-size:12px;font-weight:700;text-transform:capitalize;">${sale.paymentMethod}</div>
            <div style="font-size:11px;color:#555;margin-top:2px;">Status: ${sale.paymentStatus}</div>
            ${sale.soldBy ? `<div style="font-size:11px;color:#555;margin-top:2px;">By: ${sale.soldBy}</div>` : ''}
            <div style="font-size:11px;color:#888;margin-top:2px;">Page ${pi+1} / ${total}</div>
          </div>
        </div>

        <!-- Items table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
          <thead>
            <tr style="background:#d4831e;">
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:center;width:32px;">#</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:left;">Rice Item</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:left;width:70px;">Type</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:65px;">Qty</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:72px;">Rate</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:72px;">Disc</th>
              <th style="padding:8px;font-size:10px;font-weight:800;text-transform:uppercase;color:white;text-align:right;width:80px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            ${emptyRowsHTML}
          </tbody>
        </table>

        ${footer}
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Invoice #${sale.invoiceNumber}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}
    @media print{@page{size:A4;margin:0;}body{margin:0;}}</style>
  </head><body>${pageHTML}</body></html>`;
}

// ── Generate A4 print HTML for Sales Report ────────────────────────────────────
function generateReportHTML(sales, periodLabel) {
  const pages  = chunkArray(sales, ITEMS_PER_A4);
  const total  = pages.length;
  const date   = new Date().toLocaleDateString('en-IN');

  const grandTotal    = sales.reduce((s,i) => s + (i.totalAmount||0), 0);
  const grandSubtotal = sales.reduce((s,i) => s + (i.subtotal||0), 0);
  const grandDisc     = sales.reduce((s,i) => s + (i.discount||0), 0);
  const grandGst      = sales.reduce((s,i) => s + ((i.subtotal-(i.discount||0))*(i.tax||0)/100), 0);

  const pageHTML = pages.map((pageSales, pi) => {
    const isLast    = pi === total - 1;
    const emptyRows = Math.max(0, ITEMS_PER_A4 - pageSales.length);

    const rows = pageSales.map((sale, i) => {
      const gst = (sale.subtotal-(sale.discount||0)) * (sale.tax||0) / 100;
      return `<tr style="background:${((pi*ITEMS_PER_A4+i)%2===0)?'#fff':'#fdf8f3'};">
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;font-weight:700;color:#d4831e;">#${sale.invoiceNumber}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;">${new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;font-weight:600;">${sale.customerName}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;color:#666;">${sale.customerPhone||'—'}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;">${sale.items?.length}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;">₹${sale.subtotal?.toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;color:#16a34a;">${sale.discount>0?'-₹'+sale.discount?.toFixed(2):'—'}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;color:#1d4ed8;">${sale.tax>0?`₹${gst.toFixed(2)} (${sale.tax}%)`:'—'}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:right;font-weight:700;">₹${sale.totalAmount?.toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:center;text-transform:capitalize;">${sale.paymentMethod}</td>
        <td style="border:1px solid #ddd;padding:5px 7px;font-size:10px;text-align:center;">
          <span style="padding:2px 7px;border-radius:12px;font-size:9px;font-weight:700;background:${sale.paymentStatus==='paid'?'#dcfce7':sale.paymentStatus==='pending'?'#fef9c3':'#fee2e2'};color:${sale.paymentStatus==='paid'?'#166534':sale.paymentStatus==='pending'?'#854d0e':'#991b1b'};">${sale.paymentStatus}</span>
        </td>
      </tr>`;
    }).join('');

    const emptyRowsHTML = Array(emptyRows).fill(`
      <tr>${Array(11).fill('<td style="border:1px solid #eee;padding:5px 7px;">&nbsp;</td>').join('')}</tr>`
    ).join('');

    const footer = isLast ? `
      <tfoot>
        <tr style="background:#d4831e;">
          <td colspan="4" style="border:1px solid #b45309;padding:7px 8px;font-size:11px;font-weight:800;color:white;">
            TOTAL &nbsp; (${sales.length} invoices)
          </td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:10px;font-weight:800;text-align:right;color:white;">—</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:10px;font-weight:800;text-align:right;color:white;">₹${grandSubtotal.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:10px;font-weight:800;text-align:right;color:#bbf7d0;">-₹${grandDisc.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:10px;font-weight:800;text-align:right;color:#bfdbfe;">₹${grandGst.toFixed(2)}</td>
          <td style="border:1px solid #b45309;padding:7px 8px;font-size:12px;font-weight:900;text-align:right;color:white;">₹${grandTotal.toFixed(2)}</td>
          <td colspan="2" style="border:1px solid #b45309;padding:7px 8px;"></td>
        </tr>
      </tfoot>
      <div style="margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
        ${[['Total Invoices',sales.length,'#1a1a1a'],['Gross Subtotal','₹'+grandSubtotal.toFixed(2),'#1a1a1a'],['Total GST','₹'+grandGst.toFixed(2),'#1d4ed8'],['Grand Total','₹'+grandTotal.toFixed(2),'#d4831e']].map(([l,v,c],i)=>`
        <div style="padding:12px 14px;border-right:${i<3?'1px solid #ddd':'none'};background:${i===3?'#fdf8f3':'#fff'};">
          <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${l}</div>
          <div style="font-size:16px;font-weight:900;color:${c};">${v}</div>
        </div>`).join('')}
      </div>
      <div style="text-align:center;margin-top:16px;font-size:10px;color:#999;">Computer Generated Sales Report — Saka Rice Shop</div>` : `
      <tfoot>
        <tr><td colspan="11" style="border-top:2px solid #ddd;padding:7px 8px;font-size:10px;color:#888;text-align:right;">Continued on next page... (Page ${pi+1} of ${total})</td></tr>
      </tfoot>`;

    return `
      <div style="width:210mm;min-height:297mm;background:#fff;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:10mm;box-sizing:border-box;page-break-after:${isLast?'auto':'always'};">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #d4831e;margin-bottom:16px;">
          <div>
            <div style="font-size:22px;font-weight:900;color:#d4831e;font-family:Georgia,serif;">🌾 Saka Rice Shop</div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:2px;">Sales Report</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;">Period</div>
            <div style="font-size:14px;font-weight:800;color:#1a1a1a;margin-top:2px;">${periodLabel}</div>
            <div style="font-size:11px;color:#888;margin-top:3px;">Generated: ${date}</div>
            <div style="font-size:11px;color:#888;margin-top:2px;">Page ${pi+1} / ${total}</div>
          </div>
        </div>
        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#d4831e;">
              ${['Inv #','Date','Customer','Phone','Items','Subtotal','Discount','GST','Total','Method','Status'].map(h=>`
              <th style="padding:7px 6px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:white;text-align:${['Subtotal','Discount','GST','Total','Items'].includes(h)?'right':h==='Inv #'?'center':'left'};">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows}
            ${emptyRowsHTML}
          </tbody>
          ${footer}
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Sales Report — Saka Rice Shop</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}
    @media print{@page{size:A4 landscape;margin:0;}body{margin:0;}}</style>
  </head><body>${pageHTML}</body></html>`;
}

// ── Excel / CSV export ─────────────────────────────────────────────────────────
function exportToCSV(sales, periodLabel) {
  const rows = [
    ['SAKA RICE SHOP — SALES REPORT'],
    [`Period: ${periodLabel}`],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['Invoice #','Date','Customer','Phone','Items','Subtotal','Discount','GST %','GST Amount','Grand Total','Method','Status'],
    ...sales.map(s => {
      const gst = (s.subtotal-(s.discount||0))*(s.tax||0)/100;
      return [
        s.invoiceNumber,
        new Date(s.createdAt).toLocaleDateString('en-IN'),
        s.customerName,
        s.customerPhone||'',
        s.items?.length,
        s.subtotal?.toFixed(2),
        s.discount||0,
        s.tax||0,
        gst.toFixed(2),
        s.totalAmount?.toFixed(2),
        s.paymentMethod,
        s.paymentStatus,
      ];
    }),
    [],
    ['','','','','TOTALS',
      sales.reduce((a,s)=>a+(s.subtotal||0),0).toFixed(2),
      sales.reduce((a,s)=>a+(s.discount||0),0).toFixed(2),
      '',
      sales.reduce((a,s)=>a+((s.subtotal-(s.discount||0))*(s.tax||0)/100),0).toFixed(2),
      sales.reduce((a,s)=>a+(s.totalAmount||0),0).toFixed(2),
      '',''
    ],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SalesReport_${periodLabel.replace(/\s+/g,'_')}_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Open print window ──────────────────────────────────────────────────────────
function openPrint(html) {
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { toast.error('Please allow popups'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 800);
}

// ══════════════════════════════════════════════════════════════════════════════
// InvoiceModal
// ══════════════════════════════════════════════════════════════════════════════
function InvoiceModal({ sale, onClose }) {
  const date   = new Date(sale.createdAt);
  const gstAmt = sale.tax > 0 ? ((sale.subtotal - (sale.discount||0)) * sale.tax / 100) : 0;
  const cgst   = gstAmt / 2;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-brand-500 rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Invoice #{sale.invoiceNumber}</h2>
            <p className="text-xs text-white/80 font-semibold">{sale.customerName} • {date.toLocaleDateString('en-IN')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openPrint(generateInvoiceHTML(sale))} className="bg-white text-brand-600 hover:bg-brand-50 font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {/* Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Customer</p>
              <p className="text-gray-900 font-bold text-sm">{sale.customerName}</p>
              {sale.customerPhone && <p className="text-gray-600 text-xs mt-1">📞 {sale.customerPhone}</p>}
              {sale.customerAddress && <p className="text-gray-600 text-xs mt-1">📍 {sale.customerAddress}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</p>
              <p className="text-gray-900 font-bold text-sm capitalize">{sale.paymentMethod}</p>
              <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${sale.paymentStatus==='paid'?'bg-green-100 text-green-700':sale.paymentStatus==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                {sale.paymentStatus}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Details</p>
              <p className="text-gray-900 font-bold text-sm">{date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
              <p className="text-gray-500 text-xs mt-1">{date.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
              {sale.soldBy && <p className="text-gray-500 text-xs mt-1">By: {sale.soldBy}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-500">
                  {['#','Item','Qty','Rate','Disc','Amount'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${i%2===0?'bg-white':'bg-gray-50'}`}>
                    <td className="py-3 px-4 text-gray-400 font-bold text-xs">{i+1}</td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 font-bold">{item.riceName}</p>
                      <p className="text-gray-500 text-xs">{item.riceType}</p>
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-gray-700">{item.quantity} kg</td>
                    <td className="py-3 px-4 font-bold font-mono text-gray-700">₹{item.pricePerKg?.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold font-mono text-green-600">{item.itemDiscount>0?`-₹${item.itemDiscount?.toFixed(2)}`:'—'}</td>
                    <td className="py-3 px-4 font-bold font-mono text-brand-600">₹{item.totalPrice?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-gray-600 font-semibold text-sm">Subtotal</span>
                <span className="font-bold font-mono text-gray-900">₹{sale.subtotal?.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-green-700 font-bold text-sm flex items-center gap-1"><Tag className="w-3 h-3" /> Discount</span>
                  <span className="font-bold font-mono text-green-700">-₹{sale.discount?.toFixed(2)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <>
                  <div className="flex justify-between px-4 py-2 border-b border-gray-100">
                    <span className="text-blue-700 font-bold text-xs">CGST ({sale.tax/2}%)</span>
                    <span className="font-bold font-mono text-blue-700 text-xs">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                    <span className="text-blue-700 font-bold text-xs">SGST ({sale.tax/2}%)</span>
                    <span className="font-bold font-mono text-blue-700 text-xs">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 border-b border-gray-200">
                    <span className="text-blue-700 font-bold text-sm flex items-center gap-1"><Percent className="w-3 h-3" /> GST ({sale.tax}%)</span>
                    <span className="font-bold font-mono text-blue-700">₹{gstAmt.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between px-4 py-4 bg-brand-500">
                <span className="font-bold text-white text-base">Grand Total</span>
                <span className="font-bold font-mono text-white text-lg">₹{sale.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {sale.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-amber-800 font-semibold">{sale.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NewBillForm
// ══════════════════════════════════════════════════════════════════════════════
function NewBillForm({ riceItems, onSuccess }) {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [items, setItems]       = useState([{ rice: '', quantity: '', itemDiscount: 0 }]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [gstRate, setGstRate]   = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  const addItem    = () => setItems(p => [...p, { rice: '', quantity: '', itemDiscount: 0 }]);
  const removeItem = i  => setItems(p => p.filter((_,idx) => idx !== i));
  const updateItem = (i, k, v) => setItems(p => p.map((it,idx) => idx===i ? {...it,[k]:v} : it));
  const getRice    = id => riceItems.find(r => r._id === id);

  const calcItemTotal = item => {
    const rice = getRice(item.rice);
    if (!rice || !item.quantity) return 0;
    return Math.max(0, Number(item.quantity)*rice.pricePerKg - Number(item.itemDiscount||0));
  };

  const subtotal     = items.reduce((s,it) => s+calcItemTotal(it), 0);
  const afterDiscount= Math.max(0, subtotal - Number(overallDiscount));
  const gstAmount    = afterDiscount * gstRate / 100;
  const grandTotal   = afterDiscount + gstAmount;
  const cgst         = gstAmount / 2;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!customer.name.trim()) return toast.error('Customer name is required');
    const validItems = items.filter(it => it.rice && it.quantity > 0);
    if (!validItems.length) return toast.error('Add at least one item');

    setSaving(true);
    try {
      const adminName = sessionStorage.getItem('saka_admin_name') || 'Admin';
      const payload = {
        customerName:    customer.name.trim(),
        customerPhone:   customer.phone.trim(),
        customerAddress: customer.address.trim(),
        items:           validItems.map(it => ({ rice: it.rice, quantity: Number(it.quantity), itemDiscount: Number(it.itemDiscount||0) })),
        discount:        Number(overallDiscount),
        tax:             gstRate,
        paymentMethod,
        paymentStatus,
        notes,
        soldBy:          adminName,
      };
      const res = await createSale(payload);
      toast.success(`Bill #${res.data.data.invoiceNumber} created!`);
      onSuccess(res.data.data);
      setCustomer({ name: '', phone: '', address: '' });
      setItems([{ rice: '', quantity: '', itemDiscount: 0 }]);
      setOverallDiscount(0); setGstRate(0);
      setPaymentMethod('cash'); setPaymentStatus('paid'); setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <div className="card p-5">
        <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-500" /> Customer Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Customer Name *</label>
            <div className="relative"><User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Full name" value={customer.name} onChange={e => setCustomer(c=>({...c,name:e.target.value}))} required />
            </div>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="relative"><Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Mobile number" value={customer.phone} onChange={e => setCustomer(c=>({...c,phone:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <div className="relative"><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Customer address" value={customer.address} onChange={e => setCustomer(c=>({...c,address:e.target.value}))} />
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-500" /> Bill Items
            <span className="text-xs text-gray-400 font-normal">({items.length} items)</span>
          </h3>
          <button type="button" onClick={addItem} className="btn-primary text-xs px-3 py-1.5">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-1">
            {['Rice Item','Stock (kg)','Qty (kg)','Item Disc (₹)','Amount',''].map(l => (
              <div key={l} className={l===''?'col-span-1':l==='Rice Item'?'col-span-4':'col-span-2'}><p className="label">{l}</p></div>
            ))}
          </div>
          {items.map((item, idx) => {
            const rice    = getRice(item.rice);
            const balance = rice ? rice.totalStock - rice.soldStock : 0;
            const total   = calcItemTotal(item);
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 items-center">
                <div className="col-span-4">
                  <select className="input-field" value={item.rice} onChange={e => updateItem(idx,'rice',e.target.value)}>
                    <option value="">Select Rice</option>
                    {riceItems.map(r => <option key={r._id} value={r._id}>{r.name} — ₹{r.pricePerKg}/kg</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <div className={`text-sm font-bold px-3 py-2 rounded-xl ${balance>0?'text-green-700 bg-green-50':'text-red-700 bg-red-50'}`}>
                    {rice ? `${balance.toFixed(1)} kg` : '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <input type="number" className="input-field" placeholder="0.0" min="0.1" step="0.1"
                    value={item.quantity} onChange={e => updateItem(idx,'quantity',e.target.value)} />
                </div>
                <div className="col-span-2">
                  <div className="relative"><Tag className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" className="input-field pl-8" placeholder="0" min="0" step="0.01"
                      value={item.itemDiscount} onChange={e => updateItem(idx,'itemDiscount',e.target.value)} />
                  </div>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-bold font-mono text-brand-600">₹{total.toFixed(2)}</p>
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GST & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Percent className="w-4 h-4 text-brand-500" /> GST &amp; Discount
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">GST Rate</label>
              <div className="flex gap-2 flex-wrap">
                {GST_RATES.map(rate => (
                  <button key={rate} type="button" onClick={() => setGstRate(rate)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${gstRate===rate?'bg-blue-600 text-white border-blue-600 shadow':'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                    {rate===0?'No GST':`${rate}%`}
                  </button>
                ))}
              </div>
              {gstRate > 0 && <p className="text-xs text-blue-600 font-bold mt-2">CGST {gstRate/2}% + SGST {gstRate/2}% = ₹{gstAmount.toFixed(2)}</p>}
            </div>
            <div>
              <label className="label">Overall Discount (₹)</label>
              <div className="relative"><Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" className="input-field pl-9" placeholder="0.00" min="0" step="0.01"
                  value={overallDiscount} onChange={e => setOverallDiscount(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-500" /> Payment
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-xl text-sm font-bold capitalize border-2 transition-all ${paymentMethod===m?'bg-brand-500 text-white border-brand-500':'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <div className="flex gap-2">
                {PAYMENT_STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => setPaymentStatus(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize border-2 transition-all ${paymentStatus===s?s==='paid'?'bg-green-600 text-white border-green-600':s==='pending'?'bg-amber-500 text-white border-amber-500':'bg-red-500 text-white border-red-500':'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="label">Notes (Optional)</label>
        <textarea className="input-field" rows={2} placeholder="Any additional notes..."
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Summary + Submit */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Subtotal</p>
              <p className="text-lg font-bold font-mono text-gray-900">₹{subtotal.toFixed(2)}</p>
            </div>
            {Number(overallDiscount) > 0 && (
              <div className="text-center">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Discount</p>
                <p className="text-lg font-bold font-mono text-green-600">-₹{Number(overallDiscount).toFixed(2)}</p>
              </div>
            )}
            {gstRate > 0 && (
              <div className="text-center">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">GST ({gstRate}%)</p>
                <p className="text-lg font-bold font-mono text-blue-600">+₹{gstAmount.toFixed(2)}</p>
              </div>
            )}
            <div className="text-center border-l pl-6 border-gray-200">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Grand Total</p>
              <p className="text-2xl font-bold font-mono text-brand-600">₹{grandTotal.toFixed(2)}</p>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-base disabled:opacity-60">
            {saving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating...</span>
              : <span className="flex items-center gap-2"><Receipt className="w-5 h-5"/>Create Invoice</span>}
          </button>
        </div>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// InvoiceHistory (with period filters + export)
// ══════════════════════════════════════════════════════════════════════════════
function InvoiceHistory({ refresh }) {
  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [period, setPeriod]         = useState('month');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewSale, setViewSale]     = useState(null);
  const [allSales, setAllSales]     = useState([]);   // for export (no pagination)

  const periodLabel = period !== 'custom'
    ? PERIODS.find(p => p.value === period)?.label || period
    : `${startDate || '…'} → ${endDate || '…'}`;

  const load = (forExport = false) => {
    if (!forExport) setLoading(true);
    const params = { page: forExport ? 1 : page, limit: forExport ? 9999 : 15 };
    if (period !== 'custom') { params.period = period; }
    else { if (startDate) params.startDate = startDate; if (endDate) params.endDate = endDate; }
    if (search) params.search = search;

    getSales(params)
      .then(r => {
        if (forExport) { setAllSales(r.data.data); }
        else { setSales(r.data.data); setPagination(r.data.pagination); }
      })
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => { if (!forExport) setLoading(false); });
  };

  useEffect(() => { load(); }, [page, period, refresh]);

  const handleSearch = e => { e.preventDefault(); setPage(1); load(); };

  const handleExportCSV = async () => {
    const params = { page:1, limit:9999 };
    if (period !== 'custom') params.period = period;
    else { if (startDate) params.startDate = startDate; if (endDate) params.endDate = endDate; }
    if (search) params.search = search;
    const r = await getSales(params);
    exportToCSV(r.data.data, periodLabel);
    toast.success('CSV exported!');
  };

  const handlePrintReport = async () => {
    const params = { page:1, limit:9999 };
    if (period !== 'custom') params.period = period;
    else { if (startDate) params.startDate = startDate; if (endDate) params.endDate = endDate; }
    if (search) params.search = search;
    const r = await getSales(params);
    openPrint(generateReportHTML(r.data.data, periodLabel));
  };

  const handleView = async id => {
    try { const res = await getSaleById(id); setViewSale(res.data.data); }
    catch { toast.error('Failed to load invoice'); }
  };

  const statusIcon = s => s==='paid' ? <CheckCircle className="w-3 h-3"/> : s==='pending' ? <Clock className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button key={p.value} type="button" onClick={() => { setPeriod(p.value); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-1.5
                  ${period===p.value?'bg-brand-500 text-white border-brand-500 shadow':'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
                <Calendar className="w-3.5 h-3.5"/>{p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
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

        {period === 'custom' && (
          <div className="flex gap-3 items-end flex-wrap">
            <div><label className="label">From</label>
              <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className="label">To</label>
              <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            <button type="button" onClick={() => { setPage(1); load(); }} className="btn-primary">Apply</button>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label">Search</label>
            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Invoice #, customer name, phone…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary"><Search className="w-4 h-4"/> Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setPage(1); setTimeout(()=>load(),0); }}>Clear</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">
            Invoices — <span className="text-brand-600">{periodLabel}</span>
            <span className="text-gray-400 font-normal ml-2">({pagination.total || 0} records)</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Invoice #','Customer','Items','Subtotal','GST','Discount','Total','Payment','Status','Date',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"/>
                </td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400 font-bold">No invoices found for this period</td></tr>
              ) : sales.map(sale => {
                const gstAmt = (sale.subtotal-(sale.discount||0))*(sale.tax||0)/100;
                return (
                  <tr key={sale._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">#{sale.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{sale.customerName}</p>
                      {sale.customerPhone && <p className="text-xs text-gray-500">{sale.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-600">{sale.items?.length}</td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-gray-700">₹{sale.subtotal?.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-blue-600">
                      {sale.tax > 0 ? `₹${gstAmt.toFixed(2)} (${sale.tax}%)` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-green-600">
                      {sale.discount > 0 ? `-₹${sale.discount?.toFixed(2)}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold font-mono text-brand-600">₹{sale.totalAmount?.toLocaleString('en-IN',{maximumFractionDigits:2})}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-600 capitalize">{sale.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${sale.paymentStatus==='paid'?'bg-green-100 text-green-700':sale.paymentStatus==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                        {statusIcon(sale.paymentStatus)} {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      <br/>{new Date(sale.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleView(sale._id)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View & Print">
                        <Eye className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs font-bold text-gray-500">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {viewSale && <InvoiceModal sale={viewSale} onClose={() => setViewSale(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Billing Page
// ══════════════════════════════════════════════════════════════════════════════
export default function Billing() {
  const [tab, setTab]         = useState('new');
  const [riceItems, setRiceItems] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    getRiceItems().then(r => setRiceItems(r.data.data)).catch(() => toast.error('Failed to load rice items'));
  }, []);

  const handleSuccess = () => { setRefresh(r => r+1); setTab('history'); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Billing &amp; Invoicing</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Create GST invoices and manage billing history</p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setTab('new')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab==='new'?'bg-white text-brand-600 shadow-sm border border-gray-200':'text-gray-600 hover:text-gray-900'}`}>
          <Receipt className="w-4 h-4"/> New Bill
        </button>
        <button onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab==='history'?'bg-white text-brand-600 shadow-sm border border-gray-200':'text-gray-600 hover:text-gray-900'}`}>
          <History className="w-4 h-4"/> Invoice History
        </button>
      </div>

      {tab === 'new'
        ? <NewBillForm riceItems={riceItems} onSuccess={handleSuccess} />
        : <InvoiceHistory refresh={refresh} />
      }
    </div>
  );
}