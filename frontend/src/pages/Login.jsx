import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic, Lock, Mail, ArrowRight, Sparkles, Store, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('demo@kadaivoice.ai');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.warning('Please enter your email or phone and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(identifier, password);
      toast.success('Welcome back to KadaiVoice AI!');

      if (data.shop && !data.shop.isConfigured) {
        navigate('/setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIdentifier('demo@kadaivoice.ai');
    setPassword('admin123');
    setLoading(true);
    try {
      await login('demo@kadaivoice.ai', 'admin123');
      toast.success('Logged in as Immanuel Mini Mart (Demo Store)!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
          <Mic className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          KadaiVoice <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Run Your Shop. Just Speak.
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          AI Voice-First Business Management for Kirana Stores
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-surface-border">
          {/* 1-Click Demo Login Banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Evaluator Quick Demo</span>
                <span className="text-slate-600">Pre-seeded with Immanuel Mini Mart</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs transition-all active:scale-95"
            >
              1-Click Demo Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="demo@kadaivoice.ai or 9840123456"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('For demo: use password "admin123" or click 1-Click Demo Login above.');
                }}
                className="font-semibold text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-border text-center text-xs text-slate-500">
            Don't have a KadaiVoice account yet?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
              Register Your Shop
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Shop data isolation protected • JWT authenticated</span>
        </div>
      </div>
    </div>
  );
};

export default Login;

