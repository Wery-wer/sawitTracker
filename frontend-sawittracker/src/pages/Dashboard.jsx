import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Truck, 
  Wallet, 
  Edit3, 
  Check, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Scale,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  // Stat Card 1: Harga Sawit Hari Ini (Editable Input)
  const [hargaSawit, setHargaSawit] = useState(2500);
  const [isEditingHarga, setIsEditingHarga] = useState(false);
  const [tempHarga, setTempHarga] = useState(2500);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data transaksi & harga sawit Live dari Backend Laravel / Supabase Cloud
  useEffect(() => {
    fetchTransactions();
    fetchHargaSawit();
  }, []);

  const fetchHargaSawit = async () => {
    try {
      const res = await api.get('/harga-sawit');
      if (res.data?.data?.harga_sawit) {
        const val = Number(res.data.data.harga_sawit);
        setHargaSawit(val);
        setTempHarga(val);
      }
    } catch (error) {
      console.error('Gagal mengambil harga sawit dari server:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data transaksi dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHarga = async () => {
    const num = Number(tempHarga);
    if (!num || num <= 0) return;
    setHargaSawit(num);
    setIsEditingHarga(false);
    try {
      await api.post('/harga-sawit', { harga_sawit: num });
    } catch (error) {
      console.error('Gagal menyimpan harga sawit ke server:', error);
    }
  };

  // Helper untuk formatting angka & mata uang yang aman dari string concatenation & trailing decimals
  const formatNumber = (val) => {
    const num = Math.round(Number(val) || 0);
    return num.toLocaleString('id-ID');
  };

  const formatRupiah = (val) => {
    return 'Rp ' + formatNumber(val);
  };

  // Hitung statistik Live dari Supabase (diubah ke Number terlebih dahulu)
  const totalNetto = transactions.reduce((acc, curr) => acc + (Number(curr.netto_weight) || 0), 0);
  const totalPembayaran = transactions.reduce((acc, curr) => acc + (Number(curr.total_net_price) || 0), 0);
  const totalPotongan = transactions.reduce((acc, curr) => acc + (Number(curr.debt_deduction) || 0), 0);
  const totalTruk = transactions.length;

  // Data bar chart statis 7 hari terakhir
  const chartData = [
    { day: 'Senin', tonase: 32.4, persentase: 75, gross: 'Rp 79,38 Jt' },
    { day: 'Selasa', tonase: 28.0, persentase: 65, gross: 'Rp 68,60 Jt' },
    { day: 'Rabu', tonase: 45.2, persentase: 100, gross: 'Rp 110,74 Jt', isPeak: true },
    { day: 'Kamis', tonase: 38.5, persentase: 85, gross: 'Rp 94,32 Jt' },
    { day: 'Jumat', tonase: 41.0, persentase: 90, gross: 'Rp 100,45 Jt' },
    { day: 'Sabtu', tonase: 35.8, persentase: 79, gross: 'Rp 87,71 Jt' },
    { day: 'Minggu Ini', tonase: (totalNetto / 1000).toFixed(1), persentase: 94, gross: `Rp ${(totalPembayaran / 1000000).toFixed(1)} Jt`, isToday: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs no-print">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Dashboard Operasional Sawit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau pergerakan harga TBS (Tandan Buah Segar), tonase panen harian, serta potongan utang petani.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button 
            onClick={() => { fetchTransactions(); fetchHargaSawit(); }}
            className="px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl border border-emerald-400/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setIsEditingHarga(true)}
            className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            Update Harga TBS
          </button>
        </div>
      </div>

      {/* 3 STAT CARDS (LIVE DARI SUPABASE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Harga Sawit Hari Ini (Editable) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Harga Sawit Hari Ini / Kg
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            {isEditingHarga ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={tempHarga}
                    onChange={(e) => setTempHarga(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3 py-1.5 text-2xl font-black text-slate-800 bg-slate-50 border-2 border-emerald-500 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  onClick={handleSaveHarga}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors"
                  title="Simpan Harga"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                  {formatRupiah(hargaSawit)}
                </h3>
                <span className="text-sm font-semibold text-slate-500">/ kg</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +Rp 50 dari kemarin
            </span>
            {!isEditingHarga && (
              <button
                onClick={() => {
                  setTempHarga(hargaSawit);
                  setIsEditingHarga(true);
                }}
                className="text-slate-400 hover:text-emerald-600 font-medium underline transition-colors"
              >
                Ubah Harga
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: Total Tonase Hari Ini (Live Supabase) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Tonase Panen
            </span>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
              {(totalNetto / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} <span className="text-2xl font-bold text-slate-600">Ton</span>
            </h3>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-medium">{totalTruk} Transaksi Masuk</span>
            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {formatNumber(totalNetto)} Kg Netto
            </span>
          </div>
        </div>

        {/* CARD 3: Total Uang Keluar (Live Supabase) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Dibayarkan ke Petani
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
              Rp {(totalPembayaran / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} <span className="text-xl font-bold text-slate-600">Juta</span>
            </h3>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-medium">Setelah potong utang</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Potong Utang: {formatRupiah(totalPotongan)}
            </span>
          </div>
        </div>
      </div>

      {/* BAR CHART: Hasil Panen 7 Hari Terakhir (HTML/div Bar Chart) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Statistik Tonase Mingguan</span>
            </div>
            <h2 className="text-xl font-black text-slate-800">
              Hasil Panen 7 Hari Terakhir
            </h2>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
              <span>Tonase Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-700 inline-block"></span>
              <span>Hari Ini</span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="mt-6 pt-4">
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-6 pb-4 border-b-2 border-slate-200 relative">
            {/* Y-Axis Grid Lines */}
            <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-100 w-full flex justify-between">
              <span className="text-[10px] text-slate-400 -mt-2 -ml-2">50 Ton</span>
            </div>
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100 w-full flex justify-between">
              <span className="text-[10px] text-slate-400 -mt-2 -ml-2">25 Ton</span>
            </div>

            {/* Bars */}
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                {/* Tooltip Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-12 bg-slate-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20">
                  <p className="font-bold">{item.tonase} Ton</p>
                  <p className="text-[10px] text-emerald-300">Gross: {item.gross}</p>
                  <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>

                {/* Tonase Value Label Above Bar */}
                <span className={`text-xs font-bold transition-all duration-200 ${item.isToday ? 'text-emerald-700 font-black scale-110' : 'text-slate-600 group-hover:text-emerald-600'}`}>
                  {item.tonase}t
                </span>

                {/* Bar Div */}
                <div 
                  style={{ height: `${item.persentase}%` }}
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-xs cursor-pointer relative overflow-hidden ${
                    item.isToday 
                      ? 'bg-gradient-to-t from-emerald-800 via-emerald-600 to-emerald-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400 ring-offset-2' 
                      : item.isPeak
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400 opacity-90 group-hover:opacity-100'
                      : 'bg-gradient-to-t from-slate-300 via-emerald-500/80 to-emerald-400/80 group-hover:from-emerald-600 group-hover:to-emerald-400'
                  }`}
                >
                  {item.isToday && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* X-Axis Labels (Days) */}
          <div className="flex justify-between gap-2 sm:gap-6 px-2 sm:px-6 pt-3 text-center">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1">
                <span className={`text-xs font-semibold block ${item.isToday ? 'text-emerald-700 font-bold bg-emerald-50 py-1 rounded-md' : 'text-slate-500'}`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE (Live Supabase Section) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              Transaksi Panen Masuk Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar transaksi yang baru saja dicatat dari Aplikasi Mobile / lapangan.
            </p>
          </div>
          <button 
            onClick={fetchTransactions}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">ID Transaksi</th>
                <th className="py-4 px-6">Nama Petani</th>
                <th className="py-4 px-6">Netto (Kg)</th>
                <th className="py-4 px-6">Harga/Kg</th>
                <th className="py-4 px-6 text-rose-600">Potong Kasbon</th>
                <th className="py-4 px-6 text-emerald-700">Total Bersih</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Memuat data transaksi dari server...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Belum ada transaksi panen yang tersimpan.
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 5).map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6 font-bold text-slate-800">TRX-{trx.id}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{trx.farmer?.name || 'Petani'}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold">
                        {formatNumber(trx.netto_weight)} kg
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{formatRupiah(trx.price_per_kg)}</td>
                    <td className="py-4 px-6 font-semibold text-rose-600">
                      {Number(trx.debt_deduction) > 0 ? (
                        <span className="bg-rose-50 px-2 py-0.5 rounded text-rose-700 border border-rose-200/50">
                          -{formatRupiah(trx.debt_deduction)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Tidak ada utang</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-600 text-sm">
                      {formatRupiah(trx.total_net_price)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Lunas & Terbayar
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
