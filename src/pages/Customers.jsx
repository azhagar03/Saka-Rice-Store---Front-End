import { useState, useEffect, useCallback, useRef } from 'react';
import { getCustomers, getCustomersPending, createCustomer, updateCustomer, deleteCustomer, getSales } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, Search, User, Phone, MapPin,
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Wallet, Users, RefreshCw, Calendar, FileSpreadsheet,
  Printer, Eye, TrendingUp, Clock, AlertTriangle, Receipt
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

// ════════════════════════════════════════════════════════════════════════════
// Transliteration (for Tamil invoice)
// ════════════════════════════════════════════════════════════════════════════
const EN_TO_TAMIL_MAP = [
  ['thi','தி'],['tha','த'],['tho','தோ'],['thu','து'],['thee','தீ'],['the','தே'],
  ['dha','த'],['dhi','தி'],['dhu','து'],
  ['sha','ஷா'],['shi','ஷி'],['shu','ஷு'],['sh','ஷ'],
  ['kha','கா'],['khi','கி'],['khu','கு'],['kh','க'],
  ['cha','சா'],['chi','சி'],['chu','சு'],['ch','ச'],
  ['aa','ஆ'],['ee','ஈ'],['oo','ஊ'],['ii','ஈ'],['uu','ஊ'],
  ['ai','ஐ'],['au','ஔ'],
  ['a','அ'],['e','எ'],['i','இ'],['o','ஒ'],['u','உ'],
  ['ka','கா'],['ki','கி'],['ku','கு'],['ke','கே'],['ko','கோ'],['k','க்'],
  ['pa','பா'],['pi','பி'],['pu','பு'],['pe','பே'],['po','போ'],['p','ப்'],
  ['na','னா'],['ni','னி'],['nu','னு'],['ne','னே'],['no','னோ'],['n','ன்'],
  ['ma','மா'],['mi','மி'],['mu','மு'],['me','மே'],['mo','மோ'],['m','ம்'],
  ['ra','ரா'],['ri','ரி'],['ru','ரு'],['re','ரே'],['ro','ரோ'],['r','ர்'],
  ['la','லா'],['li','லி'],['lu','லு'],['le','லே'],['lo','லோ'],['l','ல்'],
  ['va','வா'],['vi','வி'],['vu','வு'],['ve','வே'],['vo','வோ'],['v','வ்'],
  ['sa','சா'],['si','சி'],['su','சு'],['se','சே'],['so','சோ'],['s','ஸ்'],
  ['ha','ஹா'],['hi','ஹி'],['hu','ஹு'],['he','ஹே'],['ho','ஹோ'],['h','ஹ்'],
  ['ta','டா'],['ti','டி'],['tu','டு'],['te','டே'],['to','டோ'],['t','ட்'],
  ['da','டா'],['di','டி'],['du','டு'],['de','டே'],['do','டோ'],['d','ட்'],
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

// ════════════════════════════════════════════════════════════════════════════
// Customer Invoice View Modal
// ════════════════════════════════════════════════════════════════════════════
function CustomerInvoicesModal({ customer, onClose }) {
  const [sales, setSales]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Search invoices by customer name/phone
    import('../utils/api').then(({ getSales }) => {
      getSales({ search: customer.name, limit: 100 })
        .then(r => setSales(r.data.data || []))
        .catch(() => toast.error('Failed to load invoices'))
        .finally(() => setLoading(false));
    });
  }, [customer.name]);

  const totalBilled = sales.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPaid   = sales.reduce((s, i) => s + (i.amountPaid || (i.paymentStatus === 'paid' ? i.totalAmount : 0) || 0), 0);
  const totalBal    = sales.reduce((s, i) => {
    const prevP = i.previousPending || 0;
    const paid  = i.amountPaid || (i.paymentStatus === 'paid' ? i.totalAmount : 0) || 0;
    return s + Math.max(0, (i.totalAmount || 0) + prevP - paid);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 bg-brand-500 rounded-t-2xl">
          <div>
            <h2 className="text-white font-bold text-lg">{customer.name} — Invoice History</h2>
            <p className="text-white/70 text-xs">{sales.length} invoices found</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100">
          <div className="text-center p-3 bg-brand-50 rounded-xl border border-brand-200">
            <p className="text-xs text-brand-600 font-bold uppercase tracking-wide">Total Billed</p>
            <p className="text-xl font-bold font-mono text-brand-600">₹{totalBilled.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Total Paid</p>
            <p className="text-xl font-bold font-mono text-green-600">₹{totalPaid.toFixed(2)}</p>
          </div>
          <div className={`text-center p-3 rounded-xl border ${totalBal > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${totalBal > 0 ? 'text-red-600' : 'text-gray-500'}`}>Balance Due</p>
            <p className={`text-xl font-bold font-mono ${totalBal > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{totalBal.toFixed(2)}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold">No invoices found for this customer</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Invoice #','Date','Bill Total','Prev Pending','Total Payable','Paid','Balance','Status'].map(h=>(
                    <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => {
                  const prevP   = sale.previousPending || 0;
                  const paid    = sale.amountPaid || (sale.paymentStatus === 'paid' ? sale.totalAmount : 0) || 0;
                  const totalOwed = (sale.totalAmount || 0) + prevP;
                  const bal     = Math.max(0, totalOwed - paid);
                  return (
                    <tr key={sale._id} className={`border-b border-gray-100 ${i%2===0?'bg-white':'bg-gray-50'}`}>
                      <td className="px-3 py-3"><span className="text-xs font-bold font-mono text-brand-600">#{sale.invoiceNumber}</span></td>
                      <td className="px-3 py-3 text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                      <td className="px-3 py-3 font-bold font-mono text-gray-900">₹{(sale.totalAmount||0).toFixed(2)}</td>
                      <td className="px-3 py-3">
                        {prevP > 0
                          ? <span className="text-xs font-bold text-amber-600">+₹{prevP.toFixed(2)}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 font-bold font-mono text-orange-700">₹{totalOwed.toFixed(2)}</td>
                      <td className="px-3 py-3 font-bold font-mono text-green-600">₹{paid.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        {bal > 0
                          ? <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">₹{bal.toFixed(2)}</span>
                          : <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">✓</span>}
                      </td>
                      <td className="px-3 py-3">
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
// Pending Report — generatePendingReportHTML
// ════════════════════════════════════════════════════════════════════════════
function generatePendingReportHTML(customers, periodLabel, lang = 'english') {
  const isTamil = lang === 'tamil';
  const ITEMS_PER_PAGE = 20;
  const pages = chunkArray(customers, ITEMS_PER_PAGE);
  const total = pages.length;
  const date  = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const grandPending = customers.reduce((s, c) => s + (c.pendingAmount || 0), 0);

  const css = `
    *{margin:0;padding:0;box-sizing:border-box;}
    body{background:#fff;font-family:'Noto Sans Tamil','Segoe UI',Arial,sans-serif;color:#1a1a1a;}
    @media print{@page{size:A4;margin:0;}body{margin:0;}}
    .page{width:210mm;min-height:297mm;background:#fff;padding:8mm 10mm;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;}
    .page:last-child{page-break-after:auto;}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${BRAND};padding-bottom:8px;margin-bottom:10px;}
    .shop-name{font-size:20px;font-weight:900;color:${BRAND};font-family:Georgia,serif;}
    .shop-sub{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:1px;}
    .period-label{font-size:12px;font-weight:800;color:#1a1a1a;}
    .period-meta{font-size:9px;color:#888;margin-top:2px;}
    .rt{width:100%;border-collapse:collapse;font-size:9.5px;}
    .rt thead tr{background:${BRAND};}
    .rt th{padding:6px 5px;font-size:8.5px;font-weight:800;text-transform:uppercase;color:#fff;white-space:nowrap;text-align:left;}
    .rt th.r{text-align:right;}
    .rt td{border:1px solid #e0e0e0;padding:5px 5px;vertical-align:middle;}
    .rt td.r{text-align:right;}
    .rt tbody tr.even{background:#fdf8f3;}
    .rt tbody tr.odd{background:#fff;}
    .rt tfoot tr{background:${BRAND};}
    .rt tfoot td{padding:6px 5px;font-size:10px;font-weight:900;color:#fff;}
    .rt tfoot td.r{text-align:right;}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-top:10px;}
    .sum-card{padding:10px 12px;border-right:1px solid #e0e0e0;}
    .sum-card:last-child{border-right:none;}
    .sum-title{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
    .sum-val{font-size:16px;font-weight:900;}
    .footer-note{text-align:center;margin-top:8px;font-size:8.5px;color:#aaa;}
    .continue-note{text-align:right;margin-top:auto;padding-top:6px;font-size:8.5px;color:#888;border-top:1px solid #ddd;}
    .spacer{flex:1;}
  `;

  const pageHTMLArr = pages.map((pageCusts, pi) => {
    const isLast = pi === total - 1;
    const emptyRows = Math.max(0, ITEMS_PER_PAGE - pageCusts.length);

    const rowsHTML = pageCusts.map((c, i) => {
      const pending = c.pendingAmount || 0;
      const rowCls  = i % 2 === 0 ? 'odd' : 'even';
      return `
        <tr class="${rowCls}">
          <td style="font-weight:700;">${isTamil ? (c.nameTamil || transliterateToTamil(c.name)) : c.name}</td>
          <td>${c.phone || '—'}</td>
          <td>${c.address || c.city || '—'}</td>
          <td class="r" style="color:${pending > 0 ? '#b91c1c' : '#166534'};font-weight:800;">
            ${pending > 0 ? '₹' + pending.toFixed(2) : '✓ Clear'}
          </td>
          <td style="color:#888;font-size:8px;">${c.manualPendingNote || ''}</td>
        </tr>`;
    }).join('');

    const emptyHTML = Array(emptyRows).fill(0).map(() =>
      `<tr class="odd">${Array(5).fill('<td style="border:1px solid #eee;padding:5px;">&nbsp;</td>').join('')}</tr>`
    ).join('');

    const tfootHTML = isLast ? `
      <tfoot>
        <tr>
          <td colspan="3" style="font-size:10px;">${isTamil ? 'மொத்தம்' : 'TOTAL'} — ${customers.length} ${isTamil ? 'வாடிக்கையாளர்கள்' : 'customers'}</td>
          <td class="r" style="font-size:12px;">₹${grandPending.toFixed(2)}</td>
          <td></td>
        </tr>
      </tfoot>` : '';

    const summaryHTML = isLast ? `
      <div class="summary">
        <div class="sum-card">
          <div class="sum-title">${isTamil ? 'மொத்த வாடிக்கையாளர்கள்' : 'Total Customers'}</div>
          <div class="sum-val" style="color:#1a1a1a;">${customers.length}</div>
        </div>
        <div class="sum-card">
          <div class="sum-title">${isTamil ? 'நிலுவை உள்ளவர்கள்' : 'With Pending'}</div>
          <div class="sum-val" style="color:${BRAND};">${customers.filter(c=>(c.pendingAmount||0)>0).length}</div>
        </div>
        <div class="sum-card" style="background:#fef2f2;">
          <div class="sum-title">${isTamil ? 'மொத்த நிலுவை' : 'Total Pending'}</div>
          <div class="sum-val" style="color:#b91c1c;">₹${grandPending.toFixed(2)}</div>
        </div>
      </div>
      <div class="footer-note">${isTamil ? 'கணினி மூலம் உருவாக்கப்பட்ட அறிக்கை — சகா அரிசி கடை' : 'Computer Generated Report — Saka Rice Shop'}</div>` :
      `<div class="continue-note">Continued on next page... &nbsp; Page ${pi + 1} / ${total}</div>`;

    return `
      <div class="page">
        <div class="hdr">
          <div>
            <div class="shop-name">🌾 ${isTamil ? 'சகா அரிசி கடை' : 'Saka Rice Shop'}</div>
            <div class="shop-sub">${isTamil ? 'வாடிக்கையாளர் நிலுவை அறிக்கை' : 'Customer Pending Balance Report'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:8.5px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1.5px;">${isTamil ? 'காலகட்டம்' : 'Period'}</div>
            <div class="period-label">${periodLabel}</div>
            <div class="period-meta">${isTamil ? 'உருவாக்கப்பட்ட தேதி' : 'Generated'}: ${date} &nbsp;|&nbsp; Page ${pi + 1} / ${total}</div>
          </div>
        </div>
        <table class="rt">
          <thead>
            <tr>
              <th>${isTamil ? 'பெயர்' : 'Customer Name'}</th>
              <th>${isTamil ? 'தொலைபேசி' : 'Phone'}</th>
              <th>${isTamil ? 'முகவரி' : 'Address / City'}</th>
              <th class="r">${isTamil ? 'நிலுவை' : 'Pending Balance'}</th>
              <th>${isTamil ? 'குறிப்பு' : 'Note'}</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}${emptyHTML}</tbody>
          ${tfootHTML}
        </table>
        <div class="spacer"></div>
        ${summaryHTML}
      </div>`;
  });

  return `<!DOCTYPE html>
<html lang="${isTamil ? 'ta' : 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${isTamil ? 'வாடிக்கையாளர் அறிக்கை' : 'Customer Pending Report'} — Saka Rice Shop</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>${pageHTMLArr.join('')}</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════
// Export CSV for customers
// ════════════════════════════════════════════════════════════════════════════
function exportCustomersCSV(customers, periodLabel) {
  const rows = [
    ['SAKA RICE SHOP — CUSTOMER PENDING REPORT'],
    [`Period: ${periodLabel}`],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['#', 'Customer Name', 'Phone', 'Address', 'City', 'Pending Balance', 'Note'],
    ...customers.map((c, i) => [
      i + 1, c.name, c.phone || '', c.address || '', c.city || '',
      (c.pendingAmount || 0).toFixed(2), c.manualPendingNote || ''
    ]),
    [],
    ['', '', '', '', 'TOTAL PENDING', customers.reduce((s, c) => s + (c.pendingAmount || 0), 0).toFixed(2), ''],
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Customers_${periodLabel.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function openPrint(html) {
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) { toast.error('Please allow popups'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 900);
}

// ════════════════════════════════════════════════════════════════════════════
// Add/Edit Customer Modal
// ════════════════════════════════════════════════════════════════════════════
function CustomerModal({ customer, existingPending = 0, onClose, onSaved }) {
  const isEdit = !!customer;

  const [form, setForm] = useState(
    isEdit
      ? {
          name: customer.name,
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          notes: customer.notes || '',
          manualPendingAdjustment: customer.manualPendingAdjustment ?? 0,
          manualPendingNote: customer.manualPendingNote || '',
        }
      : { name: '', phone: '', address: '', city: '', notes: '', manualPendingAdjustment: 0, manualPendingNote: '' }
  );

  const [saving, setSaving]       = useState(false);
  const [adjustType, setAdjustType] = useState('reduce');
  const [inputAmount, setInputAmount] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ✅ CORRECT pending calculation
  // existingPending = salesPending (from backend, from unpaid invoices)
  // currentEffective = salesPending + stored manualAdj = total shown to user
  const currentEffective = Math.max(0, existingPending + (customer?.manualPendingAdjustment ?? 0));

  const amt = Number(inputAmount || 0);
  const previewPending = adjustType === 'reduce'
    ? Math.max(0, currentEffective - amt)
    : currentEffective + amt;

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!form.name.trim()) return toast.error('Customer name is required');

    const newEffective = adjustType === 'reduce'
      ? Math.max(0, currentEffective - amt)
      : currentEffective + amt;

    // newManualAdj = what to store so salesPending + newManualAdj = newEffective
    // i.e. newManualAdj = newEffective - salesPending (existingPending)
    const newManualAdj = newEffective - existingPending;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      notes: form.notes,
      manualPendingAdjustment: newManualAdj,
      manualPendingNote: form.manualPendingNote || (
        amt > 0
          ? adjustType === 'reduce'
            ? `₹${amt.toFixed(2)} received manually`
            : `₹${amt.toFixed(2)} added manually`
          : undefined
      ),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCustomer(customer._id, payload);
        toast.success('Customer updated!');
      } else {
        await createCustomer(payload);
        toast.success('Customer added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
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
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="Mobile number" value={form.phone} onChange={e => set('phone', e.target.value)}/>
            </div>
            <div>
              <label className="label">City</label>
              <input className="input-field" placeholder="City / நகரம்" value={form.city} onChange={e => set('city', e.target.value)}/>
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input-field" placeholder="Address / முகவரி" value={form.address} onChange={e => set('address', e.target.value)}/>
            </div>
          </div>

          {/* Pending adjustment section — show always so you can set opening balance on create */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="font-bold text-gray-900 text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-brand-500"/>
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
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${adjustType === 'add' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                + Add Pending
              </button>
              <button type="button" onClick={() => { setAdjustType('reduce'); setInputAmount(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${adjustType === 'reduce' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                − Mark Received
              </button>
            </div>

            <div>
              <label className="label">{adjustType === 'reduce' ? 'Amount Received (₹)' : 'Amount to Add (₹)'}</label>
              <input type="number" className="input-field" placeholder="0.00" value={inputAmount}
                onChange={e => setInputAmount(e.target.value)} min={0} step="0.01"/>
            </div>

            {/* Live preview */}
            {(amt > 0 || isEdit) && (
              <div className={`p-3 rounded-lg border ${previewPending > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className="text-xs text-gray-500 mb-1">
                  {isEdit
                    ? `₹${currentEffective.toFixed(2)} ${adjustType === 'reduce' ? '−' : '+'} ₹${amt.toFixed(2)}`
                    : `Opening balance: ₹${amt.toFixed(2)}`}
                </p>
                <p className={`font-bold text-lg ${previewPending > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  New Balance: ₹{previewPending.toFixed(2)}
                </p>
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
  const [customers, setCustomers]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(1);
  const [pagination, setPagination]         = useState({ total: 0, pages: 1 });
  const [modalOpen, setModalOpen]           = useState(false);
  const [editCustomer, setEditCustomer]     = useState(null);
  const [viewCustomer, setViewCustomer]     = useState(null);
  const [pendingMap, setPendingMap]         = useState({});
  const [salesPendingMap, setSalesPendingMap] = useState({});
  const [printLang, setPrintLang]           = useState('english');
  // Period filter for the report (doesn't filter customer list, only the report/export)
  const [period, setPeriod]                 = useState('all');
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  // Filter mode: 'all' | 'pending' | 'clear'
  const [filterMode, setFilterMode]         = useState('all');
  const LIMIT = 20;

  const periodLabel = period !== 'custom'
    ? PERIODS.find(p => p.value === period)?.label || period
    : `${startDate || '…'} → ${endDate || '…'}`;

  const loadPending = useCallback(async () => {
    try {
      const res = await getCustomersPending();
      const effMap   = {};
      const salesMap = {};
      for (const c of res.data.data) {
        effMap[c._id]   = c.pendingAmount || 0;
        salesMap[c._id] = c.salesPending  || 0;
      }
      setPendingMap(effMap);
      setSalesPendingMap(salesMap);
    } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      const res = await getCustomers(params);
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); loadPending(); }, [load, loadPending]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted');
      load(); loadPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSearch = e => { e.preventDefault(); setPage(1); load(); };

  const openEdit = c => { setEditCustomer(c); setModalOpen(true); };

  // Filter displayed customers by filterMode
  const displayedCustomers = customers.filter(c => {
    const pending = pendingMap[c._id] || 0;
    if (filterMode === 'pending') return pending > 0;
    if (filterMode === 'clear')   return pending === 0;
    return true;
  });

  // Get all pending customers for report/export
  const getAllCustomersForReport = async () => {
    // Fetch all without pagination
    const res = await getCustomers({ page: 1, limit: 9999, search: search.trim() || undefined });
    const all  = res.data.data;
    // Merge with pendingMap
    return all.map(c => ({
      ...c,
      pendingAmount: pendingMap[c._id] || 0,
      manualPendingNote: c.manualPendingNote || '',
    })).filter(c => filterMode === 'pending' ? c.pendingAmount > 0 : filterMode === 'clear' ? c.pendingAmount === 0 : true);
  };

  const handlePrintReport = async () => {
    try {
      const all = await getAllCustomersForReport();
      openPrint(generatePendingReportHTML(all, periodLabel, printLang));
    } catch { toast.error('Failed to generate report'); }
  };

  const handleExportCSV = async () => {
    try {
      const all = await getAllCustomersForReport();
      exportCustomersCSV(all, periodLabel);
      toast.success('CSV exported!');
    } catch { toast.error('Failed to export'); }
  };

  const totalPending = Object.values(pendingMap).reduce((s, v) => s + v, 0);
  const pendingCount = Object.values(pendingMap).filter(v => v > 0).length;
  const clearCount   = Object.values(pendingMap).filter(v => v === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customers / வாடிக்கையாளர்கள்</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Manage customer records and pending balances</p>
        </div>
        <button onClick={() => { setEditCustomer(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center"><Users className="w-5 h-5 text-brand-600"/></div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Customers</p>
            <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 cursor-pointer hover:border-red-300 transition-all" onClick={() => setFilterMode(f => f === 'pending' ? 'all' : 'pending')}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filterMode === 'pending' ? 'bg-red-500' : 'bg-red-100'}`}>
            <AlertCircle className={`w-5 h-5 ${filterMode === 'pending' ? 'text-white' : 'text-red-600'}`}/>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">With Pending</p>
            <p className="text-xl font-bold text-red-600">{pendingCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 cursor-pointer hover:border-green-300 transition-all" onClick={() => setFilterMode(f => f === 'clear' ? 'all' : 'clear')}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filterMode === 'clear' ? 'bg-green-500' : 'bg-green-100'}`}>
            <CheckCircle className={`w-5 h-5 ${filterMode === 'clear' ? 'text-white' : 'text-green-600'}`}/>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">All Clear</p>
            <p className="text-xl font-bold text-green-600">{clearCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-amber-600"/></div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Total Pending</p>
            <p className="text-xl font-bold text-amber-700">₹{totalPending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filter / Export bar */}
      <div className="card p-4 space-y-3">
        {/* Period tabs (for export/report scope only) */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Report Period:</span>
            {PERIODS.map(p => (
              <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1 ${period === p.value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
                <Calendar className="w-3 h-3"/>{p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
              {['english','tamil'].map(l => (
                <button key={l} type="button" onClick={() => setPrintLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize ${printLang === l ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {l === 'english' ? '🇬🇧 EN' : '🇮🇳 TN'}
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

        {period === 'custom' && (
          <div className="flex gap-3 items-end flex-wrap">
            <div><label className="label">From</label><input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)}/></div>
            <div><label className="label">To</label><input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)}/></div>
          </div>
        )}

        {/* Search + filter */}
        <form onSubmit={handleSearch} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label">Search <span className="text-gray-400 font-normal">(Name / Phone / Address / City)</span></label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Type name, phone, city, address..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>
          <button type="submit" className="btn-primary"><Search className="w-4 h-4"/> Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setPage(1); setFilterMode('all'); setTimeout(load, 0); }}>Clear</button>
          <button type="button" className="btn-secondary" onClick={() => { load(); loadPending(); }} title="Refresh"><RefreshCw className="w-4 h-4"/></button>
        </form>

        {/* Quick filter pills */}
        {filterMode !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Showing:</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${filterMode === 'pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {filterMode === 'pending' ? '⚠ Pending only' : '✓ Clear only'}
              <button onClick={() => setFilterMode('all')} className="hover:opacity-70 ml-1"><X className="w-3 h-3"/></button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">
            Customers
            {filterMode !== 'all' && <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${filterMode === 'pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{filterMode}</span>}
            <span className="text-gray-400 font-normal ml-2">({pagination.total} total)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['#', 'Name', 'Phone', 'Address / City', 'Pending Balance', 'Details', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"/>
                </td></tr>
              ) : displayedCustomers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 font-bold">
                  No customers found. {filterMode !== 'all' && <button onClick={() => setFilterMode('all')} className="text-brand-500 underline ml-1">Show all</button>}
                </td></tr>
              ) : displayedCustomers.map((c, i) => {
                const pending   = pendingMap[c._id] || 0;
                const salesPend = salesPendingMap[c._id] || 0;
                const manualAdj = c.manualPendingAdjustment || 0;
                const hasAdj    = manualAdj !== 0;

                return (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400 font-mono">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold text-gray-900">{c.name}</p>
                      {c.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{c.notes}</p>}
                    </td>
                    <td className="px-3 py-3">
                      {c.phone
                        ? <a href={`tel:${c.phone}`} className="text-sm font-bold text-brand-600 hover:underline">{c.phone}</a>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="text-xs text-gray-600 truncate">{[c.address, c.city].filter(Boolean).join(', ') || '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      {pending > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5"/> ₹{pending.toFixed(2)}
                          </span>
                          {hasAdj && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Invoice: ₹{salesPend.toFixed(2)} {manualAdj >= 0 ? '+' : ''}₹{manualAdj.toFixed(2)} adj
                            </p>
                          )}
                          {c.manualPendingNote && <p className="text-xs text-amber-600 mt-0.5 italic">{c.manualPendingNote}</p>}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3"/> Clear
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      <button onClick={() => setViewCustomer(c)}
                        className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
                        <Eye className="w-3.5 h-3.5"/> View Invoices
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleDelete(c._id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
            <span className="text-xs font-bold text-gray-500">Page {page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <CustomerModal
          customer={editCustomer}
          existingPending={editCustomer ? (salesPendingMap[editCustomer._id] || 0) : 0}
          onClose={() => { setModalOpen(false); setEditCustomer(null); }}
          onSaved={() => { load(); loadPending(); }}
        />
      )}
      {viewCustomer && (
        <CustomerInvoicesModal customer={viewCustomer} onClose={() => setViewCustomer(null)}/>
      )}
    </div>
  );
}