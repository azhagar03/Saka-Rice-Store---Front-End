import { useState, useEffect, useCallback } from 'react';
import { getCustomers, getCustomersPending, createCustomer, updateCustomer, deleteCustomer } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, Search, User, Phone, MapPin,
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Wallet, Users, RefreshCw, Info, IndianRupee
} from 'lucide-react';

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function CustomerModal({ customer, existingPending = 0, onClose, onSaved }) {
  const isEdit = !!customer;

  const [form, setForm] = useState(
    isEdit
      ? {
          name:                    customer.name,
          phone:                   customer.phone    || '',
          address:                 customer.address  || '',
          notes:                   customer.notes    || '',
          // Manual adjustment stored on customer document
          manualPendingAdjustment: customer.manualPendingAdjustment ?? 0,
          manualPendingNote:       customer.manualPendingNote || '',
        }
      : {
          name: '', phone: '', address: '', notes: '',
          manualPendingAdjustment: 0,
          manualPendingNote: '',
        }
  );
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Effective pending = auto-calculated from sales + manual adjustment
  const effectivePending = Math.max(0, existingPending + Number(form.manualPendingAdjustment || 0));

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!form.name.trim()) return toast.error('Customer name is required');
    setSaving(true);
    try {
      if (isEdit) {
        await updateCustomer(customer._id, form);
        toast.success('Customer updated!');
      } else {
        await createCustomer(form);
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-brand-500 rounded-t-2xl">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5" /> {isEdit ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">

          {/* Name */}
          <div>
            <label className="label">Customer Name * <span className="text-gray-400 font-normal text-xs">(English / தமிழ்)</span></label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="Name — பெயர்"
                required
                value={form.name}
                onChange={e => set('name', e.target.value)} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="label">Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="Mobile number"
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label">Address / முகவரி <span className="text-gray-400 font-normal text-xs">(English / தமிழ்)</span></label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Address — முகவரி"
              value={form.address}
              onChange={e => set('address', e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
            <input
              className="input-field"
              placeholder="Any notes..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>

          {/* ── Balance Adjustment Section ───────────────────────────────── */}
          <div className="border-t border-dashed border-gray-300 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Balance / Pending Adjustment
            </p>

            {/* Show auto-calculated pending from sales (read-only context) */}
            {isEdit && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Auto-calculated from Sales</p>
                  <p className="text-sm font-bold text-gray-800 font-mono">₹{existingPending.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Info className="w-3 h-3" /> calculated from invoice history
                </div>
              </div>
            )}

            {/* Manual adjustment — positive adds to pending, negative reduces */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  Balance Adjustment (₹)
                  <span className="text-gray-400 font-normal ml-1 text-xs">+ adds · − reduces</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    className="input-field pl-9"
                    placeholder="0.00"
                    value={form.manualPendingAdjustment}
                    onChange={e => set('manualPendingAdjustment', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Reason / Note</label>
                <input
                  className="input-field"
                  placeholder="e.g. Opening balance, Correction…"
                  value={form.manualPendingNote}
                  onChange={e => set('manualPendingNote', e.target.value)}
                />
              </div>
            </div>

            {/* Live preview of effective pending */}
            <div className={`mt-3 rounded-xl px-4 py-3 flex items-center justify-between
              ${effectivePending > 0
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">
                  {effectivePending > 0 ? '⚠ Effective Pending (will show in Billing)' : '✓ No Pending Balance'}
                </p>
                <p className={`text-xl font-bold font-mono mt-0.5
                  ${effectivePending > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  ₹{effectivePending.toFixed(2)}
                </p>
              </div>
              {Number(form.manualPendingAdjustment) !== 0 && (
                <div className="text-xs text-right opacity-60">
                  <p>Sales: ₹{existingPending.toFixed(2)}</p>
                  <p>Adj: {Number(form.manualPendingAdjustment) >= 0 ? '+' : ''}₹{Number(form.manualPendingAdjustment).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-3 justify-end border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary px-6">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Customers Page ───────────────────────────────────────────────────────
export default function Customers() {
  const [customers, setCustomers]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState('');
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState({ total: 0, pages: 1 });
  const [modalOpen, setModalOpen]         = useState(false);
  const [editCustomer, setEditCustomer]   = useState(null);
  // pendingMap: { customerId → effectivePending }
  const [pendingMap, setPendingMap]       = useState({});
  // salesPendingMap: { customerId → salesPending (before manual adj) }
  const [salesPendingMap, setSalesPendingMap] = useState({});
  const LIMIT = 20;

  // Load pending amounts from /pending/summary
  const loadPending = useCallback(async () => {
    try {
      const res = await getCustomersPending();
      const effMap  = {};
      const salesMap = {};
      for (const c of res.data.data) {
        effMap[c._id]   = c.pendingAmount  || 0;   // effective (sales + manual)
        salesMap[c._id] = c.salesPending   || 0;   // raw sales only
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

  // Open edit modal — pass the raw salesPending so the modal can show breakdown
  const openEdit = c => {
    setEditCustomer(c);
    setModalOpen(true);
  };

  const totalPending = Object.values(pendingMap).reduce((s, v) => s + v, 0);
  const pendingCount = Object.values(pendingMap).filter(v => v > 0).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customers / வாடிக்கையாளர்கள்</h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Add and manage customer records</p>
        </div>
        <button
          onClick={() => { setEditCustomer(null); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Customers</p>
            <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pending Customers</p>
            <p className="text-xl font-bold text-red-600">{pendingCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Pending</p>
            <p className="text-xl font-bold text-amber-600">₹{totalPending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label">Search <span className="text-gray-400 font-normal">(English / தமிழ்)</span></label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="Name, phone, address / பெயர், ஊர்..."
                value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary"><Search className="w-4 h-4" /> Search</button>
          <button type="button" className="btn-secondary"
            onClick={() => { setSearch(''); setPage(1); setTimeout(load, 0); }}>Clear</button>
          <button type="button" className="btn-secondary"
            onClick={() => { load(); loadPending(); }} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">
            All Customers <span className="text-gray-400 font-normal ml-2">({pagination.total} records)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['#', 'Name / பெயர்', 'Mobile', 'Address / முகவரி', 'Pending Balance', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-bold">
                  No customers found. Click "Add Customer" to get started.
                </td></tr>
              ) : customers.map((c, i) => {
                const pending     = pendingMap[c._id]      || 0;
                const salesPend   = salesPendingMap[c._id] || 0;
                const manualAdj   = c.manualPendingAdjustment || 0;
                const hasAdj      = manualAdj !== 0;

                return (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400 font-mono">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-bold text-gray-900">{c.name}</p>
                    </td>
                    <td className="px-3 py-3">
                      {c.phone
                        ? <a href={`tel:${c.phone}`} className="text-sm font-bold text-brand-600 hover:underline">{c.phone}</a>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="text-xs text-gray-600 truncate">{c.address || '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      {pending > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertCircle className="w-3 h-3" /> ₹{pending.toFixed(2)}
                          </span>
                          {/* Show breakdown if there's a manual adjustment */}
                          {hasAdj && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Sales ₹{salesPend.toFixed(2)} {manualAdj >= 0 ? '+' : ''}₹{manualAdj.toFixed(2)} adj
                              {c.manualPendingNote ? ` · ${c.manualPendingNote}` : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Clear
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
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
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <CustomerModal
          customer={editCustomer}
          // Pass the raw sales-only pending so the modal shows a correct breakdown
          existingPending={editCustomer ? (salesPendingMap[editCustomer._id] || 0) : 0}
          onClose={() => { setModalOpen(false); setEditCustomer(null); }}
          onSaved={() => { load(); loadPending(); }}
        />
      )}
    </div>
  );
}