import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import NewSale from './pages/NewSale';
import SalesHistory from './pages/SalesHistory';
import Billing from './pages/Billing';
import Login from './pages/Login';
import {
  LayoutDashboard, Package, ShoppingCart, History,
  Store, Menu, Receipt, LogOut, ShieldCheck
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/stock', label: 'Stock', icon: Package },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/new-sale', label: 'New Sale', icon: ShoppingCart },
  { path: '/sales', label: 'Sales History', icon: History },
];

// ── Auth helper ──────────────────────────────────────────────────────────────
function isAuthenticated() {
  return !!sessionStorage.getItem('saka_admin_auth');
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ open, setOpen, onLogout }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200
        flex flex-col transition-transform duration-300 shadow-lg
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-orange-600/20 bg-brand-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-white leading-tight">Saka Rice Shop</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-white/60" />
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Billing Software</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                ${isActive
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info + Logout */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-orange-50 rounded-xl border border-orange-100">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">Admin</p>
              <p className="text-[10px] text-gray-500 truncate">sakastoreadmin@2026</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-[10px] text-gray-400 text-center font-bold">© 2026 Saka Rice Shop v1.0</p>
        </div>
      </aside>
    </>
  );
}

// ── Layout (protected) ───────────────────────────────────────────────────────
function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const current = navItems.find(n => n.path === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 shadow-sm">
          <button className="lg:hidden text-gray-500 hover:text-gray-800 p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">{current?.label || 'Saka Rice Shop'}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700">Admin Active</span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-100 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/new-sale" element={<NewSale />} />
            <Route path="/sales" element={<SalesHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());

  const handleLogin = useCallback(() => setAuthed(true), []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('saka_admin_auth');
    setAuthed(false);
    toast.success('Signed out successfully');
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1a1a1a',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
        }}
      />
      {authed ? <Layout onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
    </BrowserRouter>
  );
}
