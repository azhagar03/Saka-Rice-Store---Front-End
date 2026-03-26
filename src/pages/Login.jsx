import { useState } from 'react';
import { Store, Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Three admin accounts ──────────────────────────────────────────────────────
const ADMINS = [
  { id: 'admin1', password: '12345', name: 'Admin 1' },
  { id: 'admin2', password: '23456', name: 'Admin 2' },
  { id: 'admin3', password: '34567', name: 'Admin 3' },
];

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ id: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (error) setError('');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const admin = ADMINS.find(
        a => a.id === form.id.trim() && a.password === form.password
      );

      if (admin) {
        sessionStorage.setItem(
          'saka_admin_auth',
          btoa(`${admin.id}:${admin.name}:${Date.now()}`)
        );
        sessionStorage.setItem('saka_admin_name', admin.name);
        toast.success(`Welcome back, ${admin.name}!`);
        onLogin();
      } else {
        const idMatch = ADMINS.find(a => a.id === form.id.trim());
        setError(
          !idMatch
            ? 'Invalid Admin ID. Please check your credentials.'
            : 'Incorrect password. Please try again.'
        );
        triggerShake();
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500 rounded-3xl shadow-2xl shadow-brand-500/40 mb-5 relative">
            <Store className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">Saka Rice Shop</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1.5 tracking-wide uppercase">Admin Control Panel</p>
        </div>

        {/* Login Card */}
        <div className={`bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 overflow-hidden transition-transform ${shake ? 'animate-shake' : ''}`}>
          <div className="h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-amber-500" />

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Enter your admin credentials to continue</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Admin ID</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    spellCheck={false}
                    placeholder="admin1 / admin2 / admin3"
                    value={form.id}
                    onChange={e => set('id', e.target.value)}
                    required
                    className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:bg-white transition-all duration-200 ${error && !ADMINS.find(a => a.id === form.id.trim()) ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-brand-400'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                    className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:bg-white transition-all duration-200 ${error && ADMINS.find(a => a.id === form.id.trim()) ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-brand-400'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !form.id || !form.password}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In to Admin Panel
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gray-500">Secure Admin Access</span>
            </div>
            <span className="text-xs font-bold text-gray-400">v1.0</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 font-medium mt-6">
          🔒 This panel is restricted to authorized administrators only.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
      `}</style>
    </div>
  );
}