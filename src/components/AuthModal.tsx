"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, User, ArrowRight, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: { isOpen?: boolean; onClose?: () => void; initialMode?: string }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await login(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose?.();
        }
      } else {
        const { error } = await signup(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email to confirm your account!');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/50 animate-fadeInScale">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-teal-500 to-indigo-500"></div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="p-10 pt-16">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 shadow-xl shadow-indigo-100/50">
              <Sparkles size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
              {mode === 'login' ? 'Welcome back' : 'Join the elite'}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {mode === 'login'
                ? 'Access your curated path to higher education.'
                : 'Your journey to academic excellence begins here.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                </div>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Email</label>
              </div>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                  placeholder="you@university.edu"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                {mode === 'login' && (
                  <button type="button" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600">Forgot?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={16} />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'login' ? "New to the platform?" : 'Already have an account?'}
              <button
                onClick={switchMode}
                className="ml-2 text-indigo-600 hover:text-indigo-700 font-black uppercase text-[10px] tracking-widest"
              >
                {mode === 'login' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
