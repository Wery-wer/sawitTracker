import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  User, 
  DollarSign, 
  Sprout, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Receipt,
  RefreshCw,
  Loader2
} from 'lucide-react';
import api from '../services/api';

const Kasbon = () => {
  const [farmers, setFarmers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [totalDeducted, setTotalDeducted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form Modal State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [loanType, setLoanType] = useState('uang');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFarmers, resDebts, resTrx] = await Promise.all([
        api.get('/farmers'),
        api.get('/debts'),
        api.get('/transactions')
      ]);

      const dataFarmers = resFarmers.data.data || [];
      const dataDebts = resDebts.data.data || [];
      const dataTrx = resTrx.data.data || [];

      setFarmers(dataFarmers);
      setDebts(dataDebts);

      // Hitung total hutang yang sudah terpotong otomatis lewat transaksi panen
      const deductedSum = dataTrx.reduce((sum, t) => sum + (Number(t.debt_deduction) || 0), 0);
      setTotalDeducted(deductedSum);

      if (dataFarmers.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(dataFarmers[0].id);
      }
    } catch (error) {
      console.error('Gagal mengambil data kasbon & petani:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk formatting angka & mata uang
  const formatNumber = (val) => {
    const num = Math.round(Number(val) || 0);
    return num.toLocaleString('id-ID');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Total Utang Beredar & Petani Berutang (Live dari PostgreSQL)
  const totalActiveDebt = farmers.reduce((sum, f) => sum + (Number(f.total_debt) || 0), 0);
  const totalDebtors = farmers.filter(f => (Number(f.total_debt) || 0) > 0).length;

  // Filter Petani
  const filteredFarmers = farmers.filter(f => 
    (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Tambah Kasbon ke Server Laravel
  const handleAddKasbon = async (e) => {
    e.preventDefault();
    const numAmount = Number(String(amount).replace(/[^0-9]/g, '')) || 0;
    if (!numAmount || numAmount <= 0 || !selectedFarmerId) return;

    setSubmitting(true);
    try {
      await api.post('/debts', {
        farmer_id: Number(selectedFarmerId),
        type: loanType,
        amount: numAmount,
        status: 'unpaid'
      });

      // Reset dan tutup modal
      setAmount('');
      setNotes('');
      setShowModal(false);

      // Refresh data agar saldo utang langsung update
      await fetchData();
    } catch (error) {
      console.error('Gagal menambah kasbon:', error);
      alert('Gagal menambah kasbon. Pastikan koneksi ke server aman.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Manajemen Keuangan & Piutang</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">
            Daftar Kasbon & Utang Petani
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau pinjaman uang tunai maupun sarana tani yang terintegrasi langsung dengan pemotongan otomatis saat panen.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              if (farmers.length > 0 && !selectedFarmerId) setSelectedFarmerId(farmers[0].id);
              setShowModal(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-amber-500/25 transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Kasbon Baru</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS RINGKASAN PIUTANG */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-100 text-amber-700">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Total Utang Beredar</span>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mt-0.5">
              Rp {formatNumber(totalActiveDebt)}
            </h3>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
              Belum terpotong panen
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-rose-100 text-rose-600">
            <User className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Petani Berutang</span>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mt-0.5">
              {totalDebtors} <span className="text-lg font-bold text-slate-500">Orang</span>
            </h3>
            <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded mt-1 inline-block">
              Dari total {farmers.length} petani aktif
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Total Terpotong Panen</span>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mt-0.5">
              Rp {formatNumber(totalDeducted)}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
              ✓ Lewat sistem potong otomatis
            </span>
          </div>
        </div>
      </div>

      {/* TABEL DAFTAR KASBON PETANI */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              Daftar Sisa Utang Petani
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar petani beserta nominal pinjaman aktif yang akan otomatis dipotong saat input panen berikutnya.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama petani atau kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-bold">Mengambil data kasbon terbaru dari server...</p>
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              Tidak ada data petani atau kasbon yang ditemukan.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Nama Petani</th>
                  <th className="py-4 px-6">Kontak / Telepon</th>
                  <th className="py-4 px-6">Pinjaman Terakhir</th>
                  <th className="py-4 px-6 text-rose-600">Sisa Utang Aktif</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredFarmers.map((f) => {
                  const farmerDebt = Number(f.total_debt) || 0;
                  // Cari catatan utang terakhir milik petani ini
                  const farmerDebtsList = debts.filter(d => d.farmer_id === f.id);
                  const lastDebt = farmerDebtsList.length > 0 ? farmerDebtsList[0] : null;

                  return (
                    <tr key={f.id} className="hover:bg-amber-50/40 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-slate-700 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                            {f.name ? f.name.charAt(0) : 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{f.name}</p>
                            <p className="text-[11px] text-slate-400">ID: #P-{f.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800">{f.phone || 'Tidak ada nomor'}</p>
                        <p className="text-[11px] text-slate-400">Mitra SawitTracker</p>
                      </td>
                      <td className="py-4 px-6">
                        {lastDebt ? (
                          <>
                            <p className="font-semibold text-slate-700">
                              {lastDebt.type === 'uang' ? 'Uang Tunai' : 'Pupuk / Sarana Tani'} (Rp {formatNumber(lastDebt.amount)})
                            </p>
                            <p className="text-[11px] text-slate-400">{formatDate(lastDebt.created_at)}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 font-medium">- Belum ada riwayat -</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-black text-sm">
                        {farmerDebt > 0 ? (
                          <span className="text-rose-600">Rp {formatNumber(farmerDebt)}</span>
                        ) : (
                          <span className="text-slate-400 font-bold">Rp 0</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {farmerDebt > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200/50">
                            <Clock className="w-3 h-3" />
                            Belum Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/50">
                            <CheckCircle2 className="w-3 h-3" />
                            Bebas Utang
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedFarmerId(f.id);
                            setShowModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 font-bold rounded-xl transition-all shadow-2xs"
                        >
                          + Tambah Utang
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL INPUT KASBON BARU */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Catat Kasbon / Pinjaman Baru</h3>
                  <p className="text-xs text-amber-100">Utang ini akan otomatis dipotong saat panen sawit berikutnya.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddKasbon} className="p-6 md:p-8 space-y-5">
              {/* Pilih Petani */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pilih Petani Peminjam
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-bold text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} — Sisa Utang: Rp {formatNumber(f.total_debt)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Pinjaman (Uang / Pupuk) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Jenis Kasbon / Pinjaman
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoanType('uang')}
                    className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      loanType === 'uang'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Uang Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType('pupuk')}
                    className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      loanType === 'pupuk'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sprout className="w-4 h-4" />
                    Pupuk / Sarana Tani
                  </button>
                </div>
              </div>

              {/* Nominal Pinjaman */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                  <span>Nominal Pinjaman</span>
                  <span className="text-amber-600 font-semibold">Rupiah</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="500.000"
                    value={amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
                    }}
                    required
                    autoFocus
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 focus:bg-white text-2xl font-black text-slate-800 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pupuk NPK 2 Sak / Bayar darurat sekolah..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 focus:bg-white text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!amount || Number(String(amount).replace(/[^0-9]/g, '')) <= 0 || submitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                    !amount || Number(String(amount).replace(/[^0-9]/g, '')) <= 0 || submitting
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25 hover:scale-[1.02]'
                  }`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Menyimpan...' : 'Simpan Kasbon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kasbon;
