import { useState, useEffect } from 'react';
import { getSales, getSaleById } from '../utils/api';
import toast from 'react-hot-toast';
import { Search, Printer, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';

function InvoicePrint({ sale, onClose }) {
  const handlePrint = () => {
    const date = new Date(sale.createdAt);
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${sale.invoiceNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: white; padding: 30px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #d4831e; margin-bottom: 24px; }
          h1 { font-size: 28px; font-weight: 800; color: #d4831e; }
          .sub { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
          .inv-num { font-size: 22px; font-weight: 700; text-align: right; }
          .inv-date { font-size: 12px; color: #888; text-align: right; margin-top: 4px; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .party-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 600; }
          .party-name { font-weight: 700; font-size: 15px; }
          .party-info { font-size: 13px; color: #555; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #fdf1e3; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #d4831e; }
          td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
          .total-section { float: right; width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
          .grand-total { display: flex; justify-content: space-between; padding: 10px 0 0; margin-top: 8px; border-top: 2px solid #d4831e; font-size: 16px; font-weight: 800; color: #1a1a1a; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534; }
          .footer { clear: both; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
          .thank { font-size: 16px; font-weight: 700; color: #d4831e; margin-bottom: 4px; }
          .footer-sub { font-size: 11px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>🌾 RiceStore Pro</h1>
            <div class="sub">Premium Rice Traders</div>
          </div>
          <div>
            <div class="inv-num">${sale.invoiceNumber}</div>
            <div class="inv-date">${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div style="text-align:right;margin-top:6px"><span class="badge">${sale.paymentStatus?.toUpperCase()}</span></div>
          </div>
        </div>
        <div class="parties">
          <div>
            <div class="party-label">Bill To</div>
            <div class="party-name">${sale.customerName}</div>
            <div class="party-info">${sale.customerPhone ? '📞 ' + sale.customerPhone : ''}<br>${sale.customerAddress ? '📍 ' + sale.customerAddress : ''}</div>
          </div>
          <div>
            <div class="party-label">Payment Method</div>
            <div class="party-name">${sale.paymentMethod?.toUpperCase()}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Rice Item</th><th>Type</th><th>Qty (kg)</th><th>Rate (₹)</th><th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.riceName}</td>
                <td>${item.riceType}</td>
                <td>${item.quantity}</td>
                <td>₹${item.pricePerKg}</td>
                <td>₹${item.totalPrice?.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-section">
          <div class="total-row"><span>Subtotal</span><span>₹${sale.subtotal?.toFixed(2)}</span></div>
          ${sale.discount > 0 ? `<div class="total-row" style="color:#16a34a"><span>Discount</span><span>-₹${sale.discount?.toFixed(2)}</span></div>` : ''}
          ${sale.tax > 0 ? `<div class="total-row"><span>Tax (${sale.tax}%)</span><span>₹${((sale.subtotal * sale.tax) / 100)?.toFixed(2)}</span></div>` : ''}
          <div class="grand-total"><span>Total</span><span>₹${sale.totalAmount?.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <div class="thank">Thank you for your purchase!</div>
          <div class="footer-sub">Computer-generated invoice. No signature required.</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(content);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">{sale.invoiceNumber}</h2>
            <p className="text-xs text-gray-500">{sale.customerName}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Customer</p>
              <p className="text-gray-900 font-medium">{sale.customerName}</p>
              {sale.customerPhone && <p className="text-gray-500">{sale.customerPhone}</p>}
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Payment</p>
              <p className="text-gray-900 capitalize font-medium">{sale.paymentMethod}</p>
              <span className={`text-xs ${sale.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-500'}`}>
                {sale.paymentStatus}
              </span>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-400 font-medium">Item</th>
                <th className="text-right py-2 text-gray-400 font-medium">Qty</th>
                <th className="text-right py-2 text-gray-400 font-medium">Rate</th>
                <th className="text-right py-2 text-gray-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-900">{item.riceName}</td>
                  <td className="py-2 text-right text-gray-500 font-mono">{item.quantity}kg</td>
                  <td className="py-2 text-right text-gray-500 font-mono">₹{item.pricePerKg}</td>
                  <td className="py-2 text-right text-brand-500 font-mono font-bold">₹{item.totalPrice?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-mono">₹{sale.subtotal?.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-mono">- ₹{sale.discount?.toFixed(2)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-sm text-blue-600 font-bold">
                <span>GST ({sale.tax}%)</span>
                <span className="font-mono">₹{((sale.subtotal * sale.tax) / 100)?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="font-mono text-brand-500">₹{sale.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewSale, setViewSale] = useState(null);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (dateFilter.start) params.startDate = dateFilter.start;
    if (dateFilter.end) params.endDate = dateFilter.end;

    getSales(params)
      .then(r => {
        setSales(r.data.data);
        setPagination(r.data.pagination);
      })
      .catch(() => toast.error('Failed to load sales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleView = async (id) => {
    try {
      const res = await getSaleById(id);
      setViewSale(res.data.data);
    } catch {
      toast.error('Failed to load invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Sales History</h1>
        <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} total invoices</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Invoice no, customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">From Date</label>
          <input type="date" className="input-field" value={dateFilter.start} onChange={e => setDateFilter(f => ({ ...f, start: e.target.value }))} />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" className="input-field" value={dateFilter.end} onChange={e => setDateFilter(f => ({ ...f, end: e.target.value }))} />
        </div>
        <button type="submit" className="btn-primary">
          <Search className="w-4 h-4" /> Search
        </button>
        <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setDateFilter({ start: '', end: '' }); setPage(1); setTimeout(load, 0); }}>
          Clear
        </button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['Invoice', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">No sales found</td>
                </tr>
              ) : sales.map(sale => (
                <tr key={sale._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-brand-500">{sale.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{sale.customerName}</p>
                    {sale.customerPhone && <p className="text-xs text-gray-400">{sale.customerPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sale.items?.length} item(s)</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold font-mono text-gray-900">
                      ₹{sale.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-gray-500">{sale.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge-${sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'pending' ? 'amber' : 'red'}`}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <br />
                    {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleView(sale._id)}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                      title="View & Print"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {viewSale && <InvoicePrint sale={viewSale} onClose={() => setViewSale(null)} />}
    </div>
  );
}
