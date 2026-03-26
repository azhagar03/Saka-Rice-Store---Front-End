import { useState, useEffect } from 'react';
import { getRiceItems, createRice, updateRice, updateStock, deleteRice } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, PackagePlus, X, Check, AlertTriangle } from 'lucide-react';

const RICE_TYPES = [
  'Raw Rice', 'Boiled Rice', 'Basmati', 'Sona Masoori', 'Ponni', 'Idli Rice',
  'Jasmine', 'Brown Rice', 'Red Rice', 'Parboiled', 'Other'
];

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-display text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function RiceForm({ initial, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(initial || {
    name: '', type: 'Sona Masoori', pricePerKg: '', totalStock: '',
    description: '', minStockAlert: 50
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Rice Name *</label>
        <input className="input-field" placeholder="e.g., Premium Sona Masoori" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className="label">Type *</label>
        <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
          {RICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price / kg (₹) *</label>
          <input type="number" className="input-field" placeholder="65.00" value={form.pricePerKg} onChange={e => set('pricePerKg', e.target.value)} />
        </div>
        <div>
          <label className="label">Initial Stock (kg) *</label>
          <input type="number" className="input-field" placeholder="500" value={form.totalStock} onChange={e => set('totalStock', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Low Stock Alert (kg)</label>
        <input type="number" className="input-field" placeholder="50" value={form.minStockAlert} onChange={e => set('minStockAlert', e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..." value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button
          onClick={() => onSubmit(form)}
          disabled={loading || !form.name || !form.pricePerKg || !form.totalStock}
          className="btn-primary flex-1 justify-center disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
}

function StockUpdateModal({ rice, onClose, onUpdated }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter valid quantity');
    setLoading(true);
    try {
      await updateStock(rice._id, amount);
      toast.success(`Added ${amount} kg to ${rice.name}`);
      onUpdated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Add Stock — ${rice.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="card p-3 flex justify-between text-sm">
          <span className="text-gray-500">Current Balance</span>
          <span className="font-bold text-green-600">{(rice.totalStock - rice.soldStock).toFixed(1)} kg</span>
        </div>
        <div>
          <label className="label">Add Stock (kg)</label>
          <input
            type="number"
            className="input-field text-lg font-bold"
            placeholder="Enter kg to add"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handle} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PackagePlus className="w-4 h-4" />}
            Add Stock
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'stock'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getRiceItems()
      .then(r => setItems(r.data.data))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      await createRice({ ...form, pricePerKg: Number(form.pricePerKg), totalStock: Number(form.totalStock), minStockAlert: Number(form.minStockAlert) });
      toast.success('Rice item added!');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adding rice');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await updateRice(selected._id, { ...form, pricePerKg: Number(form.pricePerKg), minStockAlert: Number(form.minStockAlert) });
      toast.success('Rice item updated!');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteRice(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Error deleting');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} rice types</p>
        </div>
        <button className="btn-primary" onClick={() => { setSelected(null); setModal('add'); }}>
          <Plus className="w-4 h-4" /> Add Rice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => {
            const balance = item.totalStock - item.soldStock;
            const pct = item.totalStock > 0 ? (balance / item.totalStock) * 100 : 0;
            const isLow = balance <= item.minStockAlert;

            return (
              <div key={item._id} className="card p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{item.name}</h3>
                    <span className="text-xs text-gray-500">{item.type}</span>
                  </div>
                  {isLow && (
                    <span className="badge-red flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Low
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Total', value: `${item.totalStock} kg`, color: 'text-gray-500' },
                    { label: 'Sold', value: `${item.soldStock.toFixed(1)} kg`, color: 'text-red-500' },
                    { label: 'Balance', value: `${balance.toFixed(1)} kg`, color: isLow ? 'text-red-500' : 'text-green-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Stock Level</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : pct > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-500 font-mono">₹{item.pricePerKg}/kg</span>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary px-3 py-1.5 text-xs gap-1"
                      onClick={() => { setSelected(item); setModal('stock'); }}
                    >
                      <PackagePlus className="w-3.5 h-3.5" /> Stock
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={() => { setSelected(item); setModal('edit'); }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                      onClick={() => handleDelete(item._id, item.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!items.length && (
            <div className="col-span-full card p-12 text-center">
              <p className="text-gray-400 mb-4">No rice items yet</p>
              <button className="btn-primary mx-auto" onClick={() => setModal('add')}>
                <Plus className="w-4 h-4" /> Add First Rice Item
              </button>
            </div>
          )}
        </div>
      )}

      {modal === 'add' && (
        <Modal title="Add New Rice Item" onClose={() => setModal(null)}>
          <RiceForm onSubmit={handleAdd} onClose={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {modal === 'edit' && selected && (
        <Modal title="Edit Rice Item" onClose={() => setModal(null)}>
          <RiceForm initial={selected} onSubmit={handleEdit} onClose={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {modal === 'stock' && selected && (
        <StockUpdateModal rice={selected} onClose={() => setModal(null)} onUpdated={load} />
      )}
    </div>
  );
}
