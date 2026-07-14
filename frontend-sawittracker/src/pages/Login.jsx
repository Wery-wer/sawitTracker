import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Lock, Mail, Loader2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sawittracker.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      const resData = response.data.data || response.data;

      if (resData && resData.token) {
        // 1. Simpan Token dan User Data ke localStorage
        localStorage.setItem('sawittracker_token', resData.token);
        localStorage.setItem('sawittracker_user', JSON.stringify(resData.user || { name: 'Admin Koperasi', email }));

        // 2. Arahkan ke Dashboard
        navigate('/', { replace: true });
      } else {
        setError('Format respons server tidak mengenali token. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.message || 'Gagal terhubung ke server Laravel. Pastikan backend aktif di port 8000.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10 animate-fade-in">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/30">
            <Sprout className="w-9 h-9 text-white animate-bounce" />
          </div>
          <h1 className="text-2xl font-black tracking-wide">Nyawit</h1>
          <p className="text-xs text-emerald-100 font-medium mt-1 uppercase tracking-widest">
            Sistem Manajemen Perkebunan & Kasbon
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Selamat Datang Kembali</h2>
            <p className="text-xs text-slate-500 mt-1">
              Silakan masuk dengan akun Admin Koperasi Anda
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block font-bold">Akses Ditolak!</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@sawittracker.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 focus:bg-white text-sm font-semibold text-slate-800 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 focus:bg-white text-sm font-semibold text-slate-800 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Tombol Login */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-200 mt-6 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 hover:scale-[1.02] active:scale-98'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint */}
          {/* <div className="pt-4 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-medium border border-emerald-200/60">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Admin Default: <strong>admin@sawittracker.com</strong> / <strong>password123</strong></span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
