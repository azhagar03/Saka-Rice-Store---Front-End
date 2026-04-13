import { useState, useEffect, useCallback, useRef } from 'react';
import { getCustomers, getCustomersPending, createCustomer, updateCustomer, deleteCustomer, getSales } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, Search, Phone, MapPin,
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Wallet, Users, RefreshCw, Calendar, FileSpreadsheet,
  Printer, Eye, ShoppingBag
} from 'lucide-react';

const PERIODS = [
  { label: 'Today',      value: 'day'    },
  { label: 'This Week',  value: 'week'   },
  { label: 'This Month', value: 'month'  },
  { label: 'This Year',  value: 'year'   },
  { label: 'All Time',   value: 'all'    },
  { label: 'Custom',     value: 'custom' },
];

const BRAND = '#d4831e';

// ── Transliteration ──────────────────────────────────────────────────────────
const EN_TO_TAMIL_MAP = [
  ['thi','தி'],['tha','த'],['tho','தோ'],['thu','து'],['thee','தீ'],['the','தே'],
  ['dha','த'],['dhi','தி'],['dhu','து'],
  ['sha','ஷா'],['shi','ஷி'],['shu','ஷு'],['sh','ஷ'],
  ['kha','கா'],['khi','கி'],['khu','கு'],['kh','க'],
  ['cha','சா'],['chi','சி'],['chu','சு'],['ch','ச'],
  ['nja','ஞா'],['nj','ஞ'],['nga','ங'],
  ['lla','ல்ல'],['ll','ல்ல'],['rra','ற்ற'],['rr','ற்ற'],
  ['nna','ன்ன'],['nn','ன்'],['mma','ம்ம'],['mm','ம்'],
  ['ssa','ஸ்ஸ'],['ss','ஸ்'],['tti','ட்டி'],['tt','ட்ட'],
  ['kki','க்கி'],['kka','க்கா'],['kk','க்க'],
  ['ppa','ப்ப'],['ppi','ப்பி'],['pp','ப்ப'],
  ['ntha','ந்த'],['nth','ந்த'],['nda','ண்ட'],['nd','ன்ட'],['mb','ம்ப'],
  ['aa','ஆ'],['ee','ஈ'],['oo','ஊ'],['ii','ஈ'],['uu','ஊ'],
  ['ai','ஐ'],['au','ஔ'],
  ['a','அ'],['e','எ'],['i','இ'],['o','ஒ'],['u','உ'],
  ['ka','கா'],['ki','கி'],['ku','கு'],['ke','கே'],['ko','கோ'],['k','க்'],
  ['ga','கா'],['gi','கி'],['gu','கு'],['ge','கே'],['go','கோ'],['g','க்'],
  ['pa','பா'],['pi','பி'],['pu','பு'],['pe','பே'],['po','போ'],['p','ப்'],
  ['ba','பா'],['bi','பி'],['bu','பு'],['be','பே'],['bo','போ'],['b','ப்'],
  ['ta','டா'],['ti','டி'],['tu','டு'],['te','டே'],['to','டோ'],['t','ட்'],
  ['da','டா'],['di','டி'],['du','டு'],['de','டே'],['do','டோ'],['d','ட்'],
  ['na','னா'],['ni','னி'],['nu','னு'],['ne','னே'],['no','னோ'],['n','ன்'],
  ['ma','மா'],['mi','மி'],['mu','மு'],['me','மே'],['mo','மோ'],['m','ம்'],
  ['ra','ரா'],['ri','ரி'],['ru','ரு'],['re','ரே'],['ro','ரோ'],['r','ர்'],
  ['la','லா'],['li','லி'],['lu','லு'],['le','லே'],['lo','லோ'],['l','ல்'],
  ['va','வா'],['vi','வி'],['vu','வு'],['ve','வே'],['vo','வோ'],['v','வ்'],
  ['ya','யா'],['yi','யி'],['yu','யு'],['ye','யே'],['yo','யோ'],['y','ய்'],
  ['sa','சா'],['si','சி'],['su','சு'],['se','சே'],['so','சோ'],['s','ஸ்'],
  ['ha','ஹா'],['hi','ஹி'],['hu','ஹு'],['he','ஹே'],['ho','ஹோ'],['h','ஹ்'],
  ['x','க்ஸ்'],['q','க்'],
];

function transliterateToTamil(name) {
  if (!name) return '';
  return name.split(' ').map(word => {
    let result = '', remaining = word.toLowerCase();
    while (remaining.length > 0) {
      let matched = false;
      for (const [en, ta] of EN_TO_TAMIL_MAP) {
        if (remaining.startsWith(en)) { result += ta; remaining = remaining.slice(en.length); matched = true; break; }
      }
      if (!matched) { result += remaining[0]; remaining = remaining.slice(1); }
    }
    return result;
  }).join(' ');
}

const chunkArray = (arr, size) => {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  if (pages.length === 0) pages.push([]);
  return pages;
};

function openPrint(html) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { toast.error('Please allow popups'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 900);
}

// ════════════════════════════════════════════════════════════════════════════
// LEDGER PDF
// ════════════════════════════════════════════════════════════════════════════
function generateLedgerPDF(customers, periodLabel, areaName = '', dateStr = '') {

  const sortedCustomers = [...customers].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return da - db;
  });

  const ROWS_PER_PAGE = 35;
  const pages = chunkArray(sortedCustomers, ROWS_PER_PAGE);
  const totalPages = pages.length;
  const today = dateStr || new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
  const grandPending = sortedCustomers.reduce((s, c) => s + (c.pendingAmount || 0), 0);
  const grandTotal   = sortedCustomers.reduce((s, c) => s + (c.totalAmount   || 0), 0);
  const grandPaid    = sortedCustomers.reduce((s, c) => s + (c.totalPaid     || 0), 0);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{
      font-family:'Noto Sans Tamil',Arial,sans-serif;
      background:#fff;color:#111;font-size:12px;
    }
    @media print{
      @page{size:A4 portrait;margin:0;}
      body{margin:0;}
      .page{page-break-after:always;}
      .page:last-child{page-break-after:auto;}
    }
    .page{
      width:210mm;
      padding:10mm 10mm 8mm 10mm;
      box-sizing:border-box;
      background:#fff;
    }
    .top-header{
      display:grid;
      grid-template-columns:1fr auto 1fr;
      align-items:flex-start;
      margin-bottom:4px;
    }
    .shop-block{text-align:left;}
    .shop-name{font-size:16px;font-weight:900;color:#1a1a1a;line-height:1.2;}
    .shop-sub{font-size:9px;color:#666;margin-top:2px;letter-spacing:0.5px;}
    .area-block{text-align:center;}
    .area-name{
      font-size:15px;font-weight:900;color:#1a1a1a;
      border-bottom:2px solid #1a1a1a;
      padding-bottom:2px;
      display:inline-block;
      min-width:120px;
    }
    .area-period{font-size:9px;color:#555;margin-top:3px;}
    .date-block{text-align:right;}
    .date-val{font-size:13px;font-weight:700;color:#1a1a1a;}
    .page-num{font-size:9px;color:#888;margin-top:2px;}
    .divider{border-top:2.5px solid #1a1a1a;margin:6px 0 6px 0;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    thead tr{border-bottom:2px solid #1a1a1a;}
    thead th{
      padding:5px 4px;
      font-weight:900;font-size:10.5px;
      text-align:left;white-space:nowrap;
      border-right:1px solid #bbb;
      border-bottom:2px solid #1a1a1a;
    }
    thead th:last-child{border-right:none;}
    thead th.r{text-align:right;}
    thead th.c{text-align:center;}
    tbody tr{border-bottom:1px solid #ddd;}
    tbody td{
      padding:5px 4px;
      vertical-align:middle;
      border-right:1px solid #ddd;
    }
    tbody td:last-child{border-right:none;}
    tbody td.r{text-align:right;}
    tbody td.c{text-align:center;}
    tbody td.sno{
      text-align:center;
      color:#888;
      font-size:9.5px;
      font-weight:700;
    }
    tbody td.name{font-weight:700;font-size:11.5px;}
    tbody td.bal{font-weight:800;text-align:right;}
    tbody td.bal.has-bal{color:#b91c1c;}
    tbody td.bal.cleared{color:#166534;font-size:10px;}
    tbody td.chipbam-cell{
      text-align:center;
      font-weight:700;
      font-size:10.5px;
    }
    tbody td.chipbam-cell .chip-val{color:#1d4ed8;}
    tbody td.chipbam-cell .chip-date{display:block;font-size:8.5px;color:#6b7280;font-weight:400;margin-top:1px;}
    .summary-row{
      display:flex;justify-content:space-between;align-items:center;
      border-top:2px solid #1a1a1a;margin-top:8px;padding-top:6px;
    }
    .sum-item{text-align:center;}
    .sum-label{font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;}
    .sum-val{font-size:13px;font-weight:900;color:#1a1a1a;margin-top:1px;}
    .sum-val.red{color:#b91c1c;}
    .footer-note{text-align:center;margin-top:6px;font-size:8.5px;color:#999;border-top:1px solid #eee;padding-top:4px;}
    .continue-note{text-align:right;font-size:9px;color:#888;margin-top:4px;}
  `;

  const pageHTMLs = pages.map((pageCusts, pi) => {
    const isLast = pi === totalPages - 1;
    const globalOffset = pi * ROWS_PER_PAGE;

    const rowsHTML = pageCusts.map((c, idx) => {
      const serialNo  = globalOffset + idx + 1;
      const pending   = c.pendingAmount || 0;
      const tot       = c.totalAmount   || 0;
      const paid      = c.totalPaid     || 0;
      const hasBal    = pending > 0;
      const nameDisp  = c.nameTamil || transliterateToTamil(c.name);

      // FIX: chipbam and chipbamDate are already merged into each customer
      // object by buildCustomerReportData before this function is called.
      const chipVal  = c.chipbam || '';
      const chipDate = c.chipbamDate
        ? new Date(c.chipbamDate).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' })
        : '';

      return `<tr>
        <td class="sno">${serialNo}</td>
        <td class="name">${nameDisp}</td>
        <td class="r" style="font-size:10.5px;color:#166534;">${paid > 0 ? '₹' + paid.toFixed(2) : '—'}</td>
        <td class="bal ${hasBal ? 'has-bal' : 'cleared'}">${hasBal ? '₹' + pending.toFixed(2) : '✓'}</td>
        <td class="chipbam-cell">${chipVal
          ? `<span class="chip-val">${chipVal}</span>${chipDate ? `<span class="chip-date">${chipDate}</span>` : ''}`
          : '<span style="color:#d1d5db;">—</span>'
        }</td>
        <td style="font-size:10.5px;">${c.phone || '—'}</td>
        <td class="r" style="font-size:10.5px;color:#555;">${tot > 0 ? '₹' + tot.toFixed(2) : '—'}</td>
        <td class="c" style="font-size:9px;color:#888;">${c.lastBillDate ? new Date(c.lastBillDate).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'}) : ''}</td>
      </tr>`;
    }).join('');

    const footerHTML = isLast ? `
      <div class="summary-row">
        <div class="sum-item">
          <div class="sum-label">மொத்த வாடிக்கையாளர்கள்</div>
          <div class="sum-val">${sortedCustomers.length}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">மொத்த வாங்கிய தொகை</div>
          <div class="sum-val">₹${grandTotal.toFixed(2)}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">மொத்த வரவு</div>
          <div class="sum-val" style="color:#166534;">₹${grandPaid.toFixed(2)}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">மொத்த நிலுவை</div>
          <div class="sum-val red">₹${grandPending.toFixed(2)}</div>
        </div>
      </div>
      <div class="footer-note">கணினி மூலம் உருவாக்கப்பட்டது — சகா அரிசி கடை</div>` :
      `<div class="continue-note">அடுத்த பக்கம்... ${pi+1} / ${totalPages}</div>`;

    return `<div class="page">
      <div class="top-header">
        <div class="shop-block">
          <div class="shop-name">🌾 சகா அரிசி கடை</div>
          <div class="shop-sub">நிலுவை அறிக்கை · ${periodLabel}</div>
        </div>
        <div class="area-block">
          ${areaName
            ? `<div class="area-name">${areaName}</div><div class="area-period">பகுதி வாடிக்கையாளர்கள்</div>`
            : `<div class="area-name">வாடிக்கையாளர் பட்டியல்</div>`}
        </div>
        <div class="date-block">
          <div class="date-val">${today}</div>
          <div class="page-num">பக்கம் ${pi+1} / ${totalPages}</div>
        </div>
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th class="c" style="width:4%;">#</th>
            <th style="width:20%;">பெயர்</th>
            <th class="r" style="width:11%;">வரவு</th>
            <th class="r" style="width:13%;">நிலுவை (பாக்கி)</th>
            <th class="c" style="width:12%;">சிப்பம்</th>
            <th style="width:13%;">கைபேசி</th>
            <th class="r" style="width:13%;">மொத்த தொகை</th>
            <th class="c" style="width:10%;">தேதி</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
      ${footerHTML}
    </div>`;
  });

  return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <title>நிலுவை அறிக்கை — சகா அரிசி கடை</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>${pageHTMLs.join('')}</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════
// INVOICE HISTORY PDF
// ════════════════════════════════════════════════════════════════════════════
function generateInvoiceHistoryPDF(customer, salesWithBalance, totalQtyAll, totalBilled, totalPaidAll, finalBalance) {
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
  const ROWS_PER_PAGE = 35;
  const pages = chunkArray(salesWithBalance, ROWS_PER_PAGE);
  const totalPages = pages.length;
  const nameTA = customer.nameTamil || transliterateToTamil(customer.name);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Noto Sans Tamil',Arial,sans-serif;background:#fff;color:#111;font-size:11px;}
    @media print{
      @page{size:A4;margin:0;}body{margin:0;}
      .page{page-break-after:always;}.page:last-child{page-break-after:auto;}
    }
    .page{width:210mm;padding:10mm 10mm 8mm 10mm;box-sizing:border-box;background:#fff;}
    .top-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:flex-start;margin-bottom:4px;}
    .shop-name{font-size:15px;font-weight:900;color:#1a1a1a;}
    .shop-sub{font-size:9px;color:#666;margin-top:2px;}
    .cust-center{text-align:center;}
    .cust-name{font-size:15px;font-weight:900;color:#1a1a1a;border-bottom:2px solid #1a1a1a;padding-bottom:2px;display:inline-block;}
    .cust-sub{font-size:9px;color:#555;margin-top:3px;}
    .date-block{text-align:right;}
    .date-val{font-size:13px;font-weight:700;}
    .divider{border-top:2.5px solid #1a1a1a;margin:6px 0;}
    table{width:100%;border-collapse:collapse;font-size:10.5px;}
    thead tr{border-bottom:2px solid #1a1a1a;}
    thead th{padding:5px 4px;font-weight:900;font-size:10px;text-align:left;border-right:1px solid #bbb;border-bottom:2px solid #1a1a1a;white-space:nowrap;}
    thead th:last-child{border-right:none;}
    thead th.r{text-align:right;}
    tbody tr{border-bottom:1px solid #ddd;}
    tbody td{padding:5px 4px;vertical-align:middle;border-right:1px solid #ddd;}
    tbody td:last-child{border-right:none;}
    tbody td.r{text-align:right;}
    tbody td.c{text-align:center;}
    .bal-cell{text-align:right;font-weight:800;}
    .bal-cell.red{color:#b91c1c;}
    .bal-cell.green{color:#166534;}
    .summary-row{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #1a1a1a;margin-top:8px;padding-top:6px;}
    .sum-item{text-align:center;}
    .sum-label{font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;}
    .sum-val{font-size:13px;font-weight:900;color:#1a1a1a;margin-top:1px;}
    .footer-note{text-align:center;margin-top:5px;font-size:8.5px;color:#999;border-top:1px solid #eee;padding-top:4px;}
  `;

  const pageHTMLs = pages.map((pageSales, pi) => {
    const isLast = pi === totalPages - 1;
    const globalOffset = pi * ROWS_PER_PAGE;

    const rowsHTML = pageSales.map((sale, idx) => {
      const serialNo  = globalOffset + idx + 1;
      const prevP = sale.previousPending || 0;
      const paid  = sale.amountPaid || (sale.paymentStatus === 'paid' ? sale.totalAmount : 0) || 0;
      const totalOwed = (sale.totalAmount || 0) + prevP;
      const hasBal = sale.computedBalance > 0;
      return `<tr>
        <td class="c" style="font-size:9.5px;color:#888;font-weight:700;">${serialNo}</td>
        <td style="font-size:9.5px;color:#555;">${new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})}</td>
        <td style="font-weight:700;color:#d4831e;font-size:9.5px;">#${sale.invoiceNumber}</td>
        <td class="r">${sale.totalQty} கி.கி</td>
        <td class="r">₹${(sale.totalAmount||0).toFixed(2)}</td>
        <td class="r" style="color:#b45309;">${prevP > 0 ? '₹'+prevP.toFixed(2) : '—'}</td>
        <td class="r" style="color:#166534;font-weight:700;">₹${paid.toFixed(2)}</td>
        <td class="bal-cell ${hasBal ? 'red' : 'green'}">${hasBal ? '₹'+sale.computedBalance.toFixed(2) : '✓'}</td>
        <td class="c" style="font-size:9px;color:#666;">${sale.paymentStatus === 'paid' ? 'செலுத்தியது' : sale.paymentStatus === 'pending' ? 'நிலுவை' : 'பகுதி'}</td>
      </tr>`;
    }).join('');

    const footerHTML = isLast ? `
      <div class="summary-row">
        <div class="sum-item"><div class="sum-label">மொத்த பில்கள்</div><div class="sum-val">${salesWithBalance.length}</div></div>
        <div class="sum-item"><div class="sum-label">மொத்த அளவு</div><div class="sum-val">${totalQtyAll} கி.கி</div></div>
        <div class="sum-item"><div class="sum-label">மொத்த தொகை</div><div class="sum-val">₹${totalBilled.toFixed(2)}</div></div>
        <div class="sum-item"><div class="sum-label">செலுத்திய தொகை</div><div class="sum-val" style="color:#166534;">₹${totalPaidAll.toFixed(2)}</div></div>
        <div class="sum-item"><div class="sum-label">இறுதி நிலுவை</div><div class="sum-val" style="color:${finalBalance>0?'#b91c1c':'#166534'};">₹${finalBalance.toFixed(2)}</div></div>
      </div>
      <div class="footer-note">கணினி மூலம் உருவாக்கப்பட்டது — சகா அரிசி கடை</div>` :
      `<div style="text-align:right;font-size:9px;color:#888;margin-top:4px;">அடுத்த பக்கம்... ${pi+1}/${totalPages}</div>`;

    return `<div class="page">
      <div class="top-header">
        <div>
          <div class="shop-name">🌾 சகா அரிசி கடை</div>
          <div class="shop-sub">வாடிக்கையாளர் பில் வரலாறு</div>
        </div>
        <div class="cust-center">
          <div class="cust-name">${nameTA}</div>
          <div class="cust-sub">${customer.phone || ''} ${customer.address ? '· ' + customer.address : ''}</div>
        </div>
        <div class="date-block">
          <div class="date-val">${today}</div>
          <div style="font-size:9px;color:#888;">பக்கம் ${pi+1}/${totalPages}</div>
        </div>
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th class="c" style="width:4%;">#</th>
            <th style="width:10%;">தேதி</th>
            <th style="width:9%;">பில் #</th>
            <th class="r" style="width:9%;">அளவு</th>
            <th class="r" style="width:13%;">பில் தொகை</th>
            <th class="r" style="width:13%;">முந்தைய நிலுவை</th>
            <th class="r" style="width:13%;">வரவு</th>
            <th class="r" style="width:14%;">நிலுவை (பாக்கி)</th>
            <th class="c" style="width:10%;">நிலை</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
      ${footerHTML}
    </div>`;
  });

  return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <title>பில் வரலாறு — ${nameTA}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>${pageHTMLs.join('')}</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════
// Customer Invoice History Modal
// ════════════════════════════════════════════════════════════════════════════
function CustomerInvoicesModal({ customer, onClose }) {
  const [sales, setSales]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSales({ search: customer.name, limit: 200 })
      .then(r => setSales(r.data.data || []))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [customer.name]);

  const sortedSales = [...sales].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const salesWithBalance = sortedSales.map(sale => {
    const prevP = sale.previousPending || 0;
    const paid  = sale.amountPaid || (sale.paymentStatus === 'paid' ? sale.totalAmount : 0) || 0;
    const totalOwed = (sale.totalAmount || 0) + prevP;
    const bal = Math.max(0, totalOwed - paid);
    const totalQty = (sale.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
    return { ...sale, computedBalance: bal, totalQty };
  });

  const totalBilled  = sales.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPaidAll = sales.reduce((s, i) => s + (i.amountPaid || (i.paymentStatus === 'paid' ? i.totalAmount : 0) || 0), 0);
  const totalQtyAll  = sales.reduce((s, i) => s + (i.items || []).reduce((q, it) => q + (it.quantity || 0), 0), 0);
  const finalBalance = salesWithBalance.length > 0 ? salesWithBalance[salesWithBalance.length - 1].computedBalance : 0;

  const handlePrint = () => {
    openPrint(generateInvoiceHistoryPDF(customer, salesWithBalance, totalQtyAll, totalBilled, totalPaidAll, finalBalance));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 bg-brand-500 rounded-t-2xl">
          <div>
            <h2 className="text-white font-bold text-lg">{customer.name} — பில் வரலாறு</h2>
            <p className="text-white/70 text-xs">{sales.length} பில்கள் • இறுதி நிலுவை: ₹{finalBalance.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={handlePrint}
              className="bg-white text-brand-600 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs hover:bg-brand-50">
              <Printer className="w-3.5 h-3.5"/> Print Tamil PDF
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-100">
          {[
            { label: 'மொத்த அளவு',      val: totalQtyAll + ' kg',          cls: 'text-brand-600' },
            { label: 'மொத்த தொகை',      val: '₹' + totalBilled.toFixed(2), cls: 'text-orange-600' },
            { label: 'செலுத்திய தொகை', val: '₹' + totalPaidAll.toFixed(2), cls: 'text-green-600' },
            { label: 'இறுதி நிலுவை',   val: '₹' + finalBalance.toFixed(2), cls: finalBalance > 0 ? 'text-red-600' : 'text-green-600' },
          ].map(c => (
            <div key={c.label} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-lg font-bold font-mono ${c.cls}`}>{c.val}</p>
            </div>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : salesWithBalance.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold">No invoices found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#','தேதி','Invoice #','Qty','Bill Total','Prev Pending','Total Payable','Paid','Final Balance','Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salesWithBalance.map((sale, i) => {
                  const prevP = sale.previousPending || 0;
                  const paid  = sale.amountPaid || (sale.paymentStatus === 'paid' ? sale.totalAmount : 0) || 0;
                  const totalOwed = (sale.totalAmount || 0) + prevP;
                  return (
                    <tr key={sale._id} className={`border-b border-gray-100 ${i%2===0?'bg-white':'bg-gray-50'}`}>
                      <td className="px-3 py-2 text-xs font-bold text-gray-400">{i+1}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                      <td className="px-3 py-2 text-xs font-bold text-brand-600">#{sale.invoiceNumber}</td>
                      <td className="px-3 py-2 text-xs font-bold">{sale.totalQty} kg</td>
                      <td className="px-3 py-2 font-bold font-mono text-gray-900">₹{(sale.totalAmount||0).toFixed(2)}</td>
                      <td className="px-3 py-2">{prevP > 0 ? <span className="text-xs font-bold text-amber-600">+₹{prevP.toFixed(2)}</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2 font-bold font-mono text-orange-700">₹{totalOwed.toFixed(2)}</td>
                      <td className="px-3 py-2 font-bold font-mono text-green-600">₹{paid.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {sale.computedBalance > 0
                          ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">₹{sale.computedBalance.toFixed(2)}</span>
                          : <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">✓</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sale.paymentStatus==='paid'?'bg-green-100 text-green-700':sale.paymentStatus==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Add/Edit Customer Modal
// ════════════════════════════════════════════════════════════════════════════
function CustomerModal({ customer, existingPending = 0, onClose, onSaved, allAddresses = [], chipbamInfo = {} }) {
  const isEdit = !!customer;

  const toDateInput = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch { return ''; }
  };

  const initChipbam     = isEdit ? (chipbamInfo.chipbam     || customer.chipbam     || '') : '';
  const initChipbamDate = isEdit ? (chipbamInfo.chipbamDate || customer.chipbamDate || null) : null;

  const [form, setForm] = useState(
    isEdit
      ? {
          name:                    customer.name,
          phone:                   customer.phone    || '',
          address:                 customer.address  || '',
          notes:                   customer.notes    || '',
          manualPendingAdjustment: customer.manualPendingAdjustment ?? 0,
          manualPendingNote:       customer.manualPendingNote || '',
          chipbam:                 initChipbam,
          chipbamDate:             toDateInput(initChipbamDate),
        }
      : {
          name: '', phone: '', address: '', notes: '',
          manualPendingAdjustment: 0, manualPendingNote: '',
          chipbam: '',
          chipbamDate: new Date().toISOString().slice(0, 10),
        }
  );

  const [saving, setSaving]           = useState(false);
  const [adjustType, setAdjustType]   = useState('reduce');
  const [inputAmount, setInputAmount] = useState('');
  const [showAddrDrop, setShowAddrDrop] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentEffective = Math.max(0, existingPending + (customer?.manualPendingAdjustment ?? 0));
  const amt = Number(inputAmount || 0);
  const previewPending = adjustType === 'reduce' ? Math.max(0, currentEffective - amt) : currentEffective + amt;

  const filteredAddresses = form.address.trim().length > 0
    ? allAddresses.filter(a => a.toLowerCase().includes(form.address.toLowerCase()) && a.toLowerCase() !== form.address.toLowerCase())
    : allAddresses;

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!form.name.trim()) return toast.error('Customer name is required');
    const newEffective = adjustType === 'reduce' ? Math.max(0, currentEffective - amt) : currentEffective + amt;
    const newManualAdj = newEffective - existingPending;
    const payload = {
      name:    form.name.trim(),
      phone:   form.phone.trim(),
      address: form.address.trim(),
      city:    '',
      notes:   form.notes,
      manualPendingAdjustment: newManualAdj,
      manualPendingNote: form.manualPendingNote || (amt > 0 ? (adjustType==='reduce' ? `₹${amt.toFixed(2)} received manually` : `₹${amt.toFixed(2)} added manually`) : undefined),
      chipbam:     form.chipbam.trim(),
      chipbamDate: form.chipbam.trim()
        ? (form.chipbamDate || new Date().toISOString().slice(0, 10))
        : null,
    };
    setSaving(true);
    try {
      let saved;
      if (isEdit) { saved = await updateCustomer(customer._id, payload); toast.success('Customer updated!'); }
      else        { saved = await createCustomer(payload);                toast.success('Customer added!');  }
      const savedDoc = saved?.data?.data || {};
      onSaved(savedDoc);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border flex flex-col">
        <div className="flex justify-between p-5 bg-brand-500 rounded-t-2xl">
          <h2 className="text-white font-bold text-lg">{isEdit ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Customer Name *</label>
              <input className="input-field" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} required/>
            </div>
            <div className="col-span-2">
              <label className="label">Phone</label>
              <input className="input-field" placeholder="Mobile number" value={form.phone} onChange={e => set('phone', e.target.value)}/>
            </div>
            <div className="col-span-2 relative">
              <label className="label">Address</label>
              <input className="input-field" placeholder="Address / முகவரி" value={form.address} autoComplete="off"
                onChange={e => { set('address', e.target.value); setShowAddrDrop(true); }}
                onFocus={() => setShowAddrDrop(true)}
                onBlur={() => setTimeout(() => setShowAddrDrop(false), 200)}
              />
              {showAddrDrop && filteredAddresses.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredAddresses.map((addr, i) => (
                    <button key={i} type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 font-medium flex items-center gap-2 border-b border-gray-100 last:border-0"
                      onMouseDown={() => { set('address', addr); setShowAddrDrop(false); }}>
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/> {addr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── சிப்பம் Section ── */}
          <div className="border border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50/40">
            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600"/>
              சிப்பம் (Bag / Sack) விவரம்
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">சிப்பம் <span className="text-gray-400 font-normal">(e.g. 5, 10 சிப்பம்)</span></label>
                <input
                  className="input-field"
                  placeholder="சிப்பம் எண் / குறிப்பு"
                  value={form.chipbam}
                  onChange={e => set('chipbam', e.target.value)}
                />
              </div>
              <div>
                <label className="label">வாங்கிய தேதி</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.chipbamDate}
                  onChange={e => set('chipbamDate', e.target.value)}
                />
              </div>
            </div>
            {form.chipbam.trim() && (
              <div className="flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600 flex-shrink-0"/>
                <span className="text-xs font-bold text-blue-800">
                  சிப்பம்: <strong>{form.chipbam}</strong>
                  {form.chipbamDate && <> &nbsp;·&nbsp; தேதி: {new Date(form.chipbamDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</>}
                </span>
              </div>
            )}
          </div>

          {/* ── Pending Balance ── */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-brand-500"/>
              {isEdit ? 'Adjust Pending Balance' : 'Opening Balance (if any)'}
            </p>
            {isEdit && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800 font-bold">Current Balance: ₹{currentEffective.toFixed(2)}</p>
                <p className="text-xs text-amber-600 mt-0.5">From invoices: ₹{existingPending.toFixed(2)} + Manual adj: ₹{(customer?.manualPendingAdjustment ?? 0).toFixed(2)}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAdjustType('add'); setInputAmount(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${adjustType==='add'?'bg-red-600 text-white border-red-600':'bg-white text-gray-700 border-gray-300'}`}>
                + Add Pending
              </button>
              <button type="button" onClick={() => { setAdjustType('reduce'); setInputAmount(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${adjustType==='reduce'?'bg-green-600 text-white border-green-600':'bg-white text-gray-700 border-gray-300'}`}>
                − Mark Received
              </button>
            </div>
            <div>
              <label className="label">{adjustType === 'reduce' ? 'Amount Received (₹)' : 'Amount to Add (₹)'}</label>
              <input type="number" className="input-field" placeholder="0.00" value={inputAmount}
                onChange={e => setInputAmount(e.target.value)} min={0} step="0.01"/>
            </div>
            {(amt > 0 || isEdit) && (
              <div className={`p-3 rounded-lg border ${previewPending > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className="text-xs text-gray-500 mb-1">
                  {isEdit ? `₹${currentEffective.toFixed(2)} ${adjustType==='reduce'?'−':'+'} ₹${amt.toFixed(2)}` : `Opening: ₹${amt.toFixed(2)}`}
                </p>
                <p className={`font-bold text-lg ${previewPending > 0 ? 'text-red-700' : 'text-green-700'}`}>New Balance: ₹{previewPending.toFixed(2)}</p>
              </div>
            )}
            <div>
              <label className="label">Note (optional)</label>
              <input className="input-field" placeholder="Reason / note" value={form.manualPendingNote} onChange={e => set('manualPendingNote', e.target.value)}/>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full py-3 text-base">
            {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main Customers Page
// ════════════════════════════════════════════════════════════════════════════
export default function Customers() {
  const [customers, setCustomers]             = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [search, setSearch]                   = useState('');
  const [page, setPage]                       = useState(1);
  const [pagination, setPagination]           = useState({ total:0, pages:1 });
  const [modalOpen, setModalOpen]             = useState(false);
  const [editCustomer, setEditCustomer]       = useState(null);
  const [viewCustomer, setViewCustomer]       = useState(null);
  const [pendingMap, setPendingMap]           = useState({});
  const [salesPendingMap, setSalesPendingMap] = useState({});
  // ── FIX: use a ref so buildCustomerReportData always reads fresh chipbam data ──
  const [chipbamMap, setChipbamMap]           = useState({});
  const chipbamMapRef                         = useRef({});
  const [period, setPeriod]                   = useState('all');
  const [startDate, setStartDate]             = useState('');
  const [endDate, setEndDate]                 = useState('');
  const [filterMode, setFilterMode]           = useState('all');
  const [allAddresses, setAllAddresses]       = useState([]);
  const LIMIT = 20;

  const periodLabel = period !== 'custom'
    ? PERIODS.find(p => p.value === period)?.label || period
    : `${startDate||'…'} → ${endDate||'…'}`;

  // ── FIX: loadPending now returns the fresh chipMap AND syncs the ref ──────
  const loadPending = useCallback(async () => {
    try {
      const res = await getCustomersPending();
      const effMap = {}, salesMap = {}, chipMap = {};
      for (const c of res.data.data) {
        effMap[c._id]   = c.pendingAmount || 0;
        salesMap[c._id] = c.salesPending  || 0;
        chipMap[c._id]  = { chipbam: c.chipbam || '', chipbamDate: c.chipbamDate || null };
      }
      setPendingMap(effMap);
      setSalesPendingMap(salesMap);
      // Keep both state (for re-render) and ref (for instant reads in callbacks)
      setChipbamMap(chipMap);
      chipbamMapRef.current = chipMap;
      return chipMap;
    } catch (_) { return {}; }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      const res = await getCustomers(params);
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [page, search]);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await getCustomers({ page:1, limit:9999 });
      const addresses = [...new Set(
        res.data.data.map(c => c.address).filter(Boolean).map(a => a.trim()).filter(a => a.length > 0)
      )].sort();
      setAllAddresses(addresses);
    } catch (_) {}
  }, []);

  useEffect(() => { load(); loadPending(); }, [load, loadPending]);
  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try { await deleteCustomer(id); toast.success('Customer deleted'); load(); loadPending(); loadAddresses(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleSearch = e => { e.preventDefault(); setPage(1); load(); };
  const openEdit = c => { setEditCustomer(c); setModalOpen(true); };

  const displayedCustomers = customers.filter(c => {
    const p = pendingMap[c._id] || 0;
    if (filterMode === 'pending') return p > 0;
    if (filterMode === 'clear')   return p === 0;
    return true;
  });

  // ── FIX: buildCustomerReportData reads chipbam from ref (always fresh) ───
  const buildCustomerReportData = async () => {
    const res = await getCustomers({ page:1, limit:9999, search: search.trim()||undefined });
    const allCusts = res.data.data;

    const salesParams = { page:1, limit:9999 };
    if (period !== 'all' && period !== 'custom') salesParams.period = period;
    if (period === 'custom') {
      if (startDate) salesParams.startDate = startDate;
      if (endDate)   salesParams.endDate   = endDate;
    }
    const salesRes = await getSales(salesParams);
    const allSales = salesRes.data.data || [];

    const salesMap = {};
    for (const sale of allSales) {
      const name = sale.customerName;
      if (!salesMap[name]) salesMap[name] = { totalAmount:0, totalPaid:0, totalQty:0, lastBillDate: sale.createdAt };
      const tot  = sale.totalAmount || 0;
      const paid = sale.amountPaid || (sale.paymentStatus==='paid' ? tot : 0) || 0;
      const qty  = (sale.items||[]).reduce((s,it) => s+(it.quantity||0), 0);
      salesMap[name].totalAmount += tot;
      salesMap[name].totalPaid   += paid;
      salesMap[name].totalQty    += qty;
      if (new Date(sale.createdAt) > new Date(salesMap[name].lastBillDate))
        salesMap[name].lastBillDate = sale.createdAt;
    }

    // FIX: always use the ref for chipbam — it's always up to date even if
    // React state hasn't re-rendered yet after a save.
    const freshChipbamMap = chipbamMapRef.current;

    const result = allCusts.map(c => {
      const chipInfo = freshChipbamMap[c._id] || {};
      return {
        ...c,
        pendingAmount: pendingMap[c._id] || 0,
        totalAmount:   salesMap[c.name]?.totalAmount  || 0,
        totalPaid:     salesMap[c.name]?.totalPaid    || 0,
        totalQty:      salesMap[c.name]?.totalQty     || 0,
        lastBillDate:  salesMap[c.name]?.lastBillDate || null,
        // FIX: chipbam from ref takes priority over stale customer object fields
        chipbam:     chipInfo.chipbam     !== undefined ? chipInfo.chipbam     : (c.chipbam     || ''),
        chipbamDate: chipInfo.chipbamDate !== undefined ? chipInfo.chipbamDate : (c.chipbamDate || null),
      };
    }).filter(c =>
      filterMode === 'pending' ? (c.pendingAmount > 0) :
      filterMode === 'clear'   ? (c.pendingAmount === 0) : true
    );

    return result.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return da - db;
    });
  };

  const handlePrintReport = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });
      const all = await buildCustomerReportData();
      const matchedArea = search.trim()
        ? (allAddresses.find(a => a.toLowerCase().includes(search.toLowerCase())) || search.trim())
        : '';
      const filtered = matchedArea
        ? all.filter(c => (c.address||'').toLowerCase().includes(matchedArea.toLowerCase()))
        : all;
      toast.dismiss('pdf');
      openPrint(generateLedgerPDF(filtered, periodLabel, matchedArea, ''));
    } catch(e) {
      toast.dismiss('pdf');
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      const all = await buildCustomerReportData();
      const rows = [
        ['SAKA RICE SHOP — CUSTOMER REPORT'],
        [`Period: ${periodLabel}`],
        [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
        [],
        ['#','Customer Name','Phone','Address','சிப்பம்','சிப்பம் Date','Total Qty','Total Amount','Total Paid','Pending Balance'],
        ...all.map((c,i) => [
          i+1, c.name, c.phone||'', c.address||'',
          c.chipbam||'',
          c.chipbamDate ? new Date(c.chipbamDate).toLocaleDateString('en-IN') : '',
          (c.totalQty||0), (c.totalAmount||0).toFixed(2), (c.totalPaid||0).toFixed(2), (c.pendingAmount||0).toFixed(2)
        ]),
        [],
        ['','','','','','','','TOTAL PENDING','', all.reduce((s,c) => s+(c.pendingAmount||0), 0).toFixed(2)],
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Customers_${periodLabel.replace(/\s+/g,'_')}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch { toast.error('Failed to export'); }
  };

  const totalPending = Object.values(pendingMap).reduce((s,v) => s+v, 0);
  const pendingCount = Object.values(pendingMap).filter(v => v > 0).length;
  const clearCount   = Object.values(pendingMap).filter(v => v === 0).length;

  const isAreaSearch = search.trim() && allAddresses.some(a => a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customers / வாடிக்கையாளர்கள்</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Manage customer records and pending balances</p>
        </div>
        <button onClick={() => { setEditCustomer(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-600"/>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Customers</p>
            <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 cursor-pointer hover:border-red-300 transition-all"
          onClick={() => setFilterMode(f => f==='pending'?'all':'pending')}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filterMode==='pending'?'bg-red-500':'bg-red-100'}`}>
            <AlertCircle className={`w-5 h-5 ${filterMode==='pending'?'text-white':'text-red-600'}`}/>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">With Pending</p>
            <p className="text-xl font-bold text-red-600">{pendingCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 cursor-pointer hover:border-green-300 transition-all"
          onClick={() => setFilterMode(f => f==='clear'?'all':'clear')}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filterMode==='clear'?'bg-green-500':'bg-green-100'}`}>
            <CheckCircle className={`w-5 h-5 ${filterMode==='clear'?'text-white':'text-green-600'}`}/>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">All Clear</p>
            <p className="text-xl font-bold text-green-600">{clearCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-600"/>
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Total Pending</p>
            <p className="text-xl font-bold text-amber-700">₹{totalPending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Export ── */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Report Period:</span>
            {PERIODS.map(p => (
              <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1 ${period===p.value?'bg-brand-500 text-white border-brand-500':'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
                <Calendar className="w-3 h-3"/>{p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button type="button" onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 transition-all">
              <Printer className="w-4 h-4"/> Print Tamil PDF
            </button>
            <button type="button" onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 transition-all">
              <FileSpreadsheet className="w-4 h-4"/> Export CSV
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex gap-3 items-end flex-wrap">
            <div><label className="label">From</label><input type="date" className="input-field" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
            <div><label className="label">To</label><input type="date" className="input-field" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label">Search <span className="text-gray-400 font-normal">(Name / Phone / Address)</span></label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="பெயர், கைபேசி, அல்லது பகுதி தேடுங்கள்..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <button type="submit" className="btn-primary"><Search className="w-4 h-4"/> Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setPage(1); setFilterMode('all'); setTimeout(load,0); }}>Clear</button>
          <button type="button" className="btn-secondary" onClick={() => { load(); loadPending(); }}><RefreshCw className="w-4 h-4"/></button>
        </form>

        {isAreaSearch && (
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0"/>
            <span className="text-xs font-bold text-brand-700">
              பகுதி தேடல்: <strong className="text-brand-900">{search}</strong> — PDF-ல் இந்த பகுதி பெயர் மேலே காட்டப்படும்
            </span>
          </div>
        )}

        {filterMode !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Showing:</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${filterMode==='pending'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>
              {filterMode==='pending'?'⚠ Pending only':'✓ Clear only'}
              <button onClick={() => setFilterMode('all')} className="hover:opacity-70 ml-1"><X className="w-3 h-3"/></button>
            </span>
          </div>
        )}
      </div>

      {/* ── Customers Table ── */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">
            Customers
            {filterMode !== 'all' && (
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${filterMode==='pending'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>
                {filterMode}
              </span>
            )}
            <span className="text-gray-400 font-normal ml-2">({pagination.total} total)</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['#','Name','Phone','Address','சிப்பம்','Pending Balance','History',''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"/>
                </td></tr>
              ) : displayedCustomers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 font-bold">
                  No customers found.{' '}
                  {filterMode !== 'all' && (
                    <button onClick={() => setFilterMode('all')} className="text-brand-500 underline ml-1">Show all</button>
                  )}
                </td></tr>
              ) : displayedCustomers.map((c, i) => {
                const pending   = pendingMap[c._id] || 0;
                const salesPend = salesPendingMap[c._id] || 0;
                const manualAdj = c.manualPendingAdjustment || 0;
                // FIX: always read chipbam from chipbamMap state (populated from
                // /pending/summary), never from the paginated list's customer object.
                // The paginated GET / endpoint does NOT return chipbam fields.
                const chip = chipbamMap[c._id] || {};

                return (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400 font-mono">{(page-1)*LIMIT+i+1}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold text-gray-900">{c.name}</p>
                      {c.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{c.notes}</p>}
                    </td>
                    <td className="px-3 py-3">
                      {c.phone
                        ? <a href={`tel:${c.phone}`} className="text-sm font-bold text-brand-600 hover:underline">{c.phone}</a>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 max-w-[150px]">
                      <p className="text-xs text-gray-600 truncate">{c.address || '—'}</p>
                    </td>

                    {/* FIX: சிப்பம் column — reads from chipbamMap, not c.chipbam */}
                    <td className="px-3 py-3">
                      {chip.chipbam ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            <ShoppingBag className="w-3 h-3"/> {chip.chipbam}
                          </span>
                          {chip.chipbamDate && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(chip.chipbamDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {pending > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5"/> ₹{pending.toFixed(2)}
                          </span>
                          {manualAdj !== 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Invoice: ₹{salesPend.toFixed(2)} {manualAdj>=0?'+':''}₹{manualAdj.toFixed(2)} adj
                            </p>
                          )}
                          {c.manualPendingNote && (
                            <p className="text-xs text-amber-600 mt-0.5 italic">{c.manualPendingNote}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3"/> Clear
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => setViewCustomer(c)} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
                        <Eye className="w-3.5 h-3.5"/> View
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleDelete(c._id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs font-bold text-gray-500">
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modalOpen && (
        <CustomerModal
          customer={editCustomer}
          existingPending={editCustomer ? (salesPendingMap[editCustomer._id]||0) : 0}
          chipbamInfo={editCustomer ? (chipbamMap[editCustomer._id] || {}) : {}}
          onClose={() => { setModalOpen(false); setEditCustomer(null); }}
          onSaved={async (savedDoc) => {
            // ── FIX: step-by-step to avoid race conditions ──────────────────
            // Step 1: Immediately patch chipbamMap state AND ref with the
            //         data returned directly from the save API response.
            //         This means the table updates instantly with no flicker,
            //         even before loadPending() completes.
            if (savedDoc?._id) {
              const freshChip = {
                chipbam:     savedDoc.chipbam     || '',
                chipbamDate: savedDoc.chipbamDate || null,
              };
              // Patch the ref immediately (synchronous — no re-render delay)
              chipbamMapRef.current = {
                ...chipbamMapRef.current,
                [savedDoc._id]: freshChip,
              };
              // Patch state so the table re-renders with correct chipbam
              setChipbamMap(prev => ({ ...prev, [savedDoc._id]: freshChip }));
              // Patch customers list row as well
              setCustomers(prev =>
                prev.map(c => c._id === savedDoc._id ? { ...c, ...savedDoc } : c)
              );
            }
            // Step 2: Reload pending summary first (updates pendingMap,
            //         salesPendingMap, AND refreshes chipbamMap from server)
            await loadPending();
            // Step 3: Reload paginated list (safe now — chipbamMap is current)
            load();
            loadAddresses();
          }}
          allAddresses={allAddresses}
        />
      )}
      {viewCustomer && (
        <CustomerInvoicesModal customer={viewCustomer} onClose={() => setViewCustomer(null)}/>
      )}
    </div>
  );
}