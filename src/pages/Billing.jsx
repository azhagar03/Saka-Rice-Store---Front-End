import { useState, useEffect } from 'react';
import { getRiceItems, getSales, getSaleById, createSale } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Printer, Eye, X, ChevronLeft, ChevronRight, History,
  Search, Receipt, ShoppingBag, User, Phone, MapPin, CreditCard,
  FileText, Tag, Percent, CheckCircle, Clock, AlertCircle
} from 'lucide-react';

const GST_RATES = [0, 5, 12, 18];
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'credit'];
const PAYMENT_STATUSES = ['paid', 'pending', 'partial'];

// ─── Invoice Print Modal ──────────────────────────────────────────────────────
function InvoiceModal({ sale, onClose }) {
  const handlePrint = () => {
    const date = new Date(sale.createdAt);
    const gstAmt = sale.tax > 0 ? ((sale.subtotal - (sale.discount || 0)) * sale.tax / 100) : 0;
    const cgst = gstAmt / 2;
    const sgst = gstAmt / 2;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${sale.invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: white; padding: 32px; font-size: 13px; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #d4831e; margin-bottom: 24px; }
          .shop-name { font-size: 26px; font-weight: 900; color: #d4831e; font-family: 'Georgia', serif; }
          .shop-sub { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; }
          .shop-gstin { font-size: 11px; color: #555; margin-top: 6px; font-weight: 600; }
          .inv-box { text-align: right; }
          .inv-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 2px; }
          .inv-num { font-size: 22px; font-weight: 900; color: #1a1a1a; margin-top: 3px; }
          .inv-date { font-size: 11px; color: #888; margin-top: 4px; }
          .inv-badge { display: inline-block; margin-top: 6px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            background: ${sale.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3'}; color: ${sale.paymentStatus === 'paid' ? '#166534' : '#854d0e'}; }

          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; padding: 16px; background: #fdf8f3; border-radius: 8px; border: 1px solid #f0e0c8; }
          .party-label { font-size: 9px; color: #d4831e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; font-weight: 800; }
          .party-name { font-weight: 800; font-size: 14px; color: #1a1a1a; }
          .party-info { font-size: 12px; color: #555; line-height: 1.7; margin-top: 3px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead tr { background: #d4831e; }
          th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: white; }
          th:last-child, td:last-child { text-align: right; }
          td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0ec; font-weight: 500; }
          tbody tr:nth-child(even) td { background: #fdf8f3; }
          .row-num { color: #888; font-size: 11px; font-weight: 600; }
          .item-name { font-weight: 700; color: #1a1a1a; }
          .item-type { font-size: 11px; color: #888; font-weight: 500; }
          .mono { font-family: 'Courier New', monospace; font-weight: 700; }

          .summary-section { display: flex; justify-content: flex-end; margin-bottom: 24px; }
          .summary-box { width: 280px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid #f0f0ec; }
          .summary-row:last-child { border-bottom: none; }
          .summary-label { color: #555; font-weight: 600; }
          .summary-val { font-weight: 700; font-family: 'Courier New', monospace; }
          .discount-val { color: #16a34a; }
          .gst-label { color: #1d4ed8; font-weight: 600; }
          .gst-val { color: #1d4ed8; font-weight: 700; font-family: 'Courier New', monospace; }
          .grand-row { background: #d4831e; }
          .grand-label { color: white; font-weight: 800; font-size: 14px; }
          .grand-val { color: white; font-weight: 900; font-size: 15px; font-family: 'Courier New', monospace; }

          .payment-info { display: flex; gap: 24px; margin-bottom: 24px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
          .pay-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .pay-val { font-size: 13px; font-weight: 800; color: #1a1a1a; text-transform: capitalize; margin-top: 2px; }

          .notes-box { padding: 12px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 24px; }
          .notes-label { font-size: 9px; color: #92400e; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 4px; }
          .notes-text { font-size: 12px; color: #78350f; font-weight: 500; }

          .footer { margin-top: 32px; padding-top: 20px; border-top: 2px dashed #e5e7eb; text-align: center; }
          .thank { font-size: 17px; font-weight: 900; color: #d4831e; margin-bottom: 5px; font-family: 'Georgia', serif; }
          .footer-sub { font-size: 10px; color: #999; font-weight: 500; }

          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="shop-name">🌾 Saka Rice Shop</div>
            <div class="shop-sub">Premium Rice Traders & Wholesalers</div>
            <div class="shop-gstin">GSTIN: 33XXXXX0000X1ZX &nbsp;|&nbsp; +91 99999 99999</div>
          </div>
          <div class="inv-box">
            <div class="inv-title">Tax Invoice</div>
            <div class="inv-num">${sale.invoiceNumber}</div>
            <div class="inv-date">${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div class="inv-date">${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div><span class="inv-badge">${sale.paymentStatus?.toUpperCase()}</span></div>
          </div>
        </div>

        <div class="parties">
          <div>
            <div class="party-label">Bill To</div>
            <div class="party-name">${sale.customerName}</div>
            <div class="party-info">
              ${sale.customerPhone ? '📞 ' + sale.customerPhone : ''}
              ${sale.customerAddress ? '<br>📍 ' + sale.customerAddress : ''}
            </div>
          </div>
          <div>
            <div class="party-label">Billed By</div>
            <div class="party-name">${sale.soldBy || 'Admin'}</div>
            <div class="party-info">Saka Rice Shop<br>Authorized Representative</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Rice Item</th>
              <th>Type</th>
              <th>Qty (kg)</th>
              <th>Rate (₹/kg)</th>
              <th>Discount (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map((item, i) => `
              <tr>
                <td class="row-num">${i + 1}</td>
                <td><span class="item-name">${item.riceName}</span></td>
                <td><span class="item-type">${item.riceType}</span></td>
                <td class="mono">${item.quantity}</td>
                <td class="mono">₹${item.pricePerKg?.toFixed(2)}</td>
                <td class="mono">${item.itemDiscount > 0 ? '<span style="color:#16a34a">-₹' + item.itemDiscount?.toFixed(2) + '</span>' : '—'}</td>
                <td class="mono">₹${item.totalPrice?.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-label">Subtotal</span>
              <span class="summary-val">₹${sale.subtotal?.toFixed(2)}</span>
            </div>
            ${sale.discount > 0 ? `
            <div class="summary-row">
              <span class="summary-label">Overall Discount</span>
              <span class="summary-val discount-val">-₹${sale.discount?.toFixed(2)}</span>
            </div>` : ''}
            ${sale.tax > 0 ? `
            <div class="summary-row">
              <span class="gst-label">CGST (${sale.tax / 2}%)</span>
              <span class="gst-val">₹${cgst.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="gst-label">SGST (${sale.tax / 2}%)</span>
              <span class="gst-val">₹${sgst.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="gst-label">Total GST (${sale.tax}%)</span>
              <span class="gst-val">₹${gstAmt.toFixed(2)}</span>
            </div>` : ''}
            <div class="summary-row grand-row">
              <span class="grand-label">Grand Total</span>
              <span class="grand-val">₹${sale.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="payment-info">
          <div>
            <div class="pay-label">Payment Method</div>
            <div class="pay-val">${sale.paymentMethod}</div>
          </div>
          <div>
            <div class="pay-label">Payment Status</div>
            <div class="pay-val">${sale.paymentStatus}</div>
          </div>
          <div>
            <div class="pay-label">Billed By</div>
            <div class="pay-val">${sale.soldBy || 'Admin'}</div>
          </div>
        </div>

        ${sale.notes ? `
        <div class="notes-box">
          <div class="notes-label">Notes</div>
          <div class="notes-text">${sale.notes}</div>
        </div>` : ''}

        <div class="footer">
          <div class="thank">Thank You for Your Business!</div>
          <div class="footer-sub">This is a computer-generated invoice. No signature required.</div>
          <div class="footer-sub" style="margin-top:4px">Saka Rice Shop • GSTIN: 33XXXXX0000X1ZX</div>
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(content);
    win.document.close();
  };

  const date = new Date(sale.createdAt);
  const gstAmt = sale.tax > 0 ? ((sale.subtotal - (sale.discount || 0)) * sale.tax / 100) : 0;
  const cgst = gstAmt / 2;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-brand-500 rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg font-bold text-white">{sale.invoiceNumber}</h2>
            <p className="text-xs text-white/80 font-semibold">{sale.customerName} • {date.toLocaleDateString('en-IN')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-white text-brand-600 hover:bg-brand-50 font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors">
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {/* Customer & Payment Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><User className="w-3 h-3" /> Customer</p>
              <p className="text-gray-900 font-bold text-sm">{sale.customerName}</p>
              {sale.customerPhone && <p className="text-gray-600 text-xs font-semibold mt-1">📞 {sale.customerPhone}</p>}
              {sale.customerAddress && <p className="text-gray-600 text-xs font-semibold mt-1">📍 {sale.customerAddress}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</p>
              <p className="text-gray-900 font-bold text-sm capitalize">{sale.paymentMethod}</p>
              <span className={`mt-2 inline-block badge-${sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'pending' ? 'amber' : 'red'}`}>
                {sale.paymentStatus}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Details</p>
              <p className="text-gray-900 font-bold text-sm">{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p className="text-gray-600 text-xs font-semibold mt-1">{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-gray-600 text-xs font-semibold mt-1">By: {sale.soldBy || 'Admin'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-500">
                  <th className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">#</th>
                  <th className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Item</th>
                  <th className="text-right py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Qty</th>
                  <th className="text-right py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Rate</th>
                  <th className="text-right py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Disc</th>
                  <th className="text-right py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-4 text-gray-400 font-bold text-xs">{i + 1}</td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 font-bold">{item.riceName}</p>
                      <p className="text-gray-500 text-xs font-semibold">{item.riceType}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-gray-700">{item.quantity} kg</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-gray-700">₹{item.pricePerKg?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-green-600">
                      {item.itemDiscount > 0 ? `-₹${item.itemDiscount?.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-brand-600">₹{item.totalPrice?.toFixed(2)}</td>
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
                    <span className="text-blue-700 font-bold text-xs">CGST ({sale.tax / 2}%)</span>
                    <span className="font-bold font-mono text-blue-700 text-xs">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                    <span className="text-blue-700 font-bold text-xs">SGST ({sale.tax / 2}%)</span>
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

// ─── New Bill Form ─────────────────────────────────────────────────────────────
function NewBillForm({ riceItems, onSuccess }) {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [items, setItems] = useState([{ rice: '', quantity: '', itemDiscount: 0 }]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems(prev => [...prev, { rice: '', quantity: '', itemDiscount: 0 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));

  const getRice = (id) => riceItems.find(r => r._id === id);

  const calcItemTotal = (item) => {
    const rice = getRice(item.rice);
    if (!rice || !item.quantity) return 0;
    const gross = Number(item.quantity) * rice.pricePerKg;
    return Math.max(0, gross - Number(item.itemDiscount || 0));
  };

  const subtotal = items.reduce((s, it) => s + calcItemTotal(it), 0);
  const afterDiscount = Math.max(0, subtotal - Number(overallDiscount));
  const gstAmount = afterDiscount * gstRate / 100;
  const grandTotal = afterDiscount + gstAmount;
  const cgst = gstAmount / 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.name.trim()) return toast.error('Customer name is required');
    const validItems = items.filter(it => it.rice && it.quantity > 0);
    if (!validItems.length) return toast.error('Add at least one item');

    setSaving(true);
    try {
      const payload = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerAddress: customer.address.trim(),
        items: validItems.map(it => ({ rice: it.rice, quantity: Number(it.quantity), itemDiscount: Number(it.itemDiscount || 0) })),
        discount: Number(overallDiscount),
        tax: gstRate,
        paymentMethod,
        paymentStatus,
        notes
      };
      const res = await createSale(payload);
      toast.success(`Bill created! ${res.data.data.invoiceNumber}`);
      onSuccess(res.data.data);
      // Reset form
      setCustomer({ name: '', phone: '', address: '' });
      setItems([{ rice: '', quantity: '', itemDiscount: 0 }]);
      setOverallDiscount(0);
      setGstRate(0);
      setPaymentMethod('cash');
      setPaymentStatus('paid');
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Details */}
      <div className="card p-5">
        <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-500" /> Customer Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Customer Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Full name" value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Mobile number" value={customer.phone}
                onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Customer address" value={customer.address}
                onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-500" /> Bill Items
          </h3>
          <button type="button" onClick={addItem} className="btn-primary text-xs px-3 py-1.5">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-1">
            <div className="col-span-4"><p className="label">Rice Item</p></div>
            <div className="col-span-2"><p className="label">Stock (kg)</p></div>
            <div className="col-span-2"><p className="label">Qty (kg)</p></div>
            <div className="col-span-2"><p className="label">Item Disc (₹)</p></div>
            <div className="col-span-1"><p className="label">Amount</p></div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, idx) => {
            const rice = getRice(item.rice);
            const balance = rice ? rice.totalStock - rice.soldStock : 0;
            const total = calcItemTotal(item);
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 items-center">
                <div className="col-span-4">
                  <select className="input-field" value={item.rice} onChange={e => updateItem(idx, 'rice', e.target.value)}>
                    <option value="">Select Rice</option>
                    {riceItems.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.name} — ₹{r.pricePerKg}/kg
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <div className={`text-sm font-bold px-3 py-2 rounded-xl ${balance > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {rice ? `${(balance).toFixed(1)} kg` : '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <input type="number" className="input-field" placeholder="0.0" min="0.1" step="0.1"
                    value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <Tag className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" className="input-field pl-8" placeholder="0" min="0" step="0.01"
                      value={item.itemDiscount} onChange={e => updateItem(idx, 'itemDiscount', e.target.value)} />
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

      {/* GST, Discount & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Charges */}
        <div className="card p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Percent className="w-4 h-4 text-brand-500" /> GST & Discount
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">GST Rate</label>
              <div className="flex gap-2 flex-wrap">
                {GST_RATES.map(rate => (
                  <button key={rate} type="button"
                    onClick={() => setGstRate(rate)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${gstRate === rate
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                    {rate === 0 ? 'No GST' : `${rate}%`}
                  </button>
                ))}
              </div>
              {gstRate > 0 && (
                <p className="text-xs text-blue-600 font-bold mt-2">
                  CGST {gstRate/2}% + SGST {gstRate/2}% = ₹{gstAmount.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <label className="label">Overall Discount (₹)</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" className="input-field pl-9" placeholder="0.00" min="0" step="0.01"
                  value={overallDiscount} onChange={e => setOverallDiscount(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-500" /> Payment
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-xl text-sm font-bold capitalize border-2 transition-all ${paymentMethod === m
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <div className="flex gap-2">
                {PAYMENT_STATUSES.map(s => (
                  <button key={s} type="button"
                    onClick={() => setPaymentStatus(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize border-2 transition-all ${paymentStatus === s
                      ? s === 'paid' ? 'bg-green-600 text-white border-green-600'
                        : s === 'pending' ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>
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
          {/* Summary */}
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

          <button type="submit" disabled={saving}
            className="btn-primary px-8 py-3 text-base disabled:opacity-60">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Create Invoice
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Invoice History ───────────────────────────────────────────────────────────
function InvoiceHistory({ refresh }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewSale, setViewSale] = useState(null);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (search) params.search = search;
    if (dateFilter.start) params.startDate = dateFilter.start;
    if (dateFilter.end) params.endDate = dateFilter.end;
    getSales(params)
      .then(r => { setSales(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, refresh]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const handleView = async (id) => {
    try {
      const res = await getSaleById(id);
      setViewSale(res.data.data);
    } catch { toast.error('Failed to load invoice'); }
  };

  const statusIcon = (s) => s === 'paid'
    ? <CheckCircle className="w-3 h-3" />
    : s === 'pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />;

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label">Search Invoices</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9" placeholder="Invoice no, customer name, phone..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">From Date</label>
          <input type="date" className="input-field"
            value={dateFilter.start} onChange={e => setDateFilter(f => ({ ...f, start: e.target.value }))} />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" className="input-field"
            value={dateFilter.end} onChange={e => setDateFilter(f => ({ ...f, end: e.target.value }))} />
        </div>
        <button type="submit" className="btn-primary"><Search className="w-4 h-4" /> Search</button>
        <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setDateFilter({ start: '', end: '' }); setPage(1); setTimeout(load, 0); }}>Clear</button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">All Invoices ({pagination.total || 0})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Invoice #', 'Customer', 'Items', 'Subtotal', 'GST', 'Discount', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400 font-bold">No invoices found</td></tr>
              ) : sales.map(sale => {
                const gstAmt = sale.tax > 0 ? ((sale.subtotal - (sale.discount || 0)) * sale.tax / 100) : 0;
                return (
                  <tr key={sale._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">{sale.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{sale.customerName}</p>
                      {sale.customerPhone && <p className="text-xs text-gray-500 font-semibold">{sale.customerPhone}</p>}
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
                      <span className="text-sm font-bold font-mono text-brand-600">₹{sale.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-600 capitalize">{sale.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 badge-${sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'pending' ? 'amber' : 'red'}`}>
                        {statusIcon(sale.paymentStatus)} {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <br />{new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleView(sale._id)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View & Print">
                        <Eye className="w-4 h-4" />
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
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-2 py-1.5 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-2 py-1.5 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {viewSale && <InvoiceModal sale={viewSale} onClose={() => setViewSale(null)} />}
    </div>
  );
}

// ─── Main Billing Page ─────────────────────────────────────────────────────────
export default function Billing() {
  const [tab, setTab] = useState('new');
  const [riceItems, setRiceItems] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    getRiceItems().then(r => setRiceItems(r.data.data)).catch(() => toast.error('Failed to load rice items'));
  }, []);

  const handleSuccess = (sale) => {
    setRefresh(r => r + 1);
    setTab('history');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Create GST invoices and manage billing history</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setTab('new')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'new'
            ? 'bg-white text-brand-600 shadow-sm border border-gray-200'
            : 'text-gray-600 hover:text-gray-900'}`}>
          <Receipt className="w-4 h-4" /> New Bill
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'history'
            ? 'bg-white text-brand-600 shadow-sm border border-gray-200'
            : 'text-gray-600 hover:text-gray-900'}`}>
          <History className="w-4 h-4" /> Invoice History
        </button>
      </div>

      {tab === 'new'
        ? <NewBillForm riceItems={riceItems} onSuccess={handleSuccess} />
        : <InvoiceHistory refresh={refresh} />
      }
    </div>
  );
}
