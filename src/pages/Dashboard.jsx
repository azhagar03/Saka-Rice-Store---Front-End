import { useState, useEffect } from 'react';
import { getDashboardStats } from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, Package, AlertTriangle, ShoppingBag,
  DollarSign, Layers, BarChart2
} from 'lucide-react';

const filters = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

function StatCard({ title, value, sub, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand: 'text-brand-500 bg-orange-50 border-orange-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    amber: 'text-amber-500 bg-amber-50 border-amber-200',
    red: 'text-red-500 bg-red-50 border-red-200',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-display font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{title}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StockBar({ item }) {
  const balance = item.totalStock - item.soldStock;
  const pct = item.totalStock > 0 ? (balance / item.totalStock) * 100 : 0;
  const isLow = balance <= item.minStockAlert;

  return (
    <div className="py-3 border-b border-gray-200 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium text-gray-900">{item.name}</span>
          <span className="text-xs text-gray-400 ml-2">{item.type}</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold font-mono ${isLow ? 'text-red-500' : 'text-green-600'}`}>
            {balance.toFixed(1)} kg
          </span>
          <span className="text-[10px] text-gray-400 ml-1">/ {item.totalStock} kg</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : pct > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-gray-500 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.name === 'Revenue' ? `₹${p.value?.toFixed(0)}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [filter, setFilter] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardStats(filter)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats, riceStocks, chartData, topSelling, recentSales, lowStockItems } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your rice store</p>
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`${stats?.totalSales || 0} invoices`}
          icon={DollarSign}
          color="brand"
        />
        <StatCard
          title="Total Sales"
          value={stats?.totalSales || 0}
          sub="Transactions"
          icon={ShoppingBag}
          color="green"
        />
        <StatCard
          title="Total Stock"
          value={`${(stats?.totalStock || 0).toLocaleString()} kg`}
          sub="All rice types"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Balance Stock"
          value={`${(stats?.totalBalance || 0).toLocaleString()} kg`}
          sub={`${stats?.lowStockCount || 0} items low`}
          icon={Package}
          color={stats?.lowStockCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-base font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" /> Revenue Trend
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4831e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4831e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#d4831e" fill="url(#rev)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Selling */}
        <div className="card p-5">
          <h3 className="font-display text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-brand-500" /> Top Selling
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topSelling || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} />
              <YAxis dataKey="_id" type="category" tick={{ fill: '#6b7280', fontSize: 10 }} width={80} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalQty" name="Qty (kg)" fill="#d4831e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock levels */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-gray-900">Stock Levels</h3>
            {lowStockItems?.length > 0 && (
              <span className="badge-red flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {lowStockItems.length} Low
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto pr-1">
            {riceStocks?.map(item => <StockBar key={item._id} item={item} />)}
            {!riceStocks?.length && (
              <p className="text-gray-400 text-sm text-center py-8">No rice items yet</p>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card p-5">
          <h3 className="font-display text-base font-semibold text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentSales?.map(sale => (
              <div key={sale._id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sale.customerName}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{sale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-500">₹{sale.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <span className={`text-[10px] ${sale.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-500'}`}>
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
            {!recentSales?.length && (
              <p className="text-gray-400 text-sm text-center py-8">No sales yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
