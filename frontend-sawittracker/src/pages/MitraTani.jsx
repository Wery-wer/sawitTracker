import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Plus, 
  Search, 
  Phone, 
  Wallet, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Loader2,
  Calendar,
  Trash2,
  Edit3,
  Users,
  DollarSign
} from 'lucide-react';
import api from '../services/api';

const MitraTani = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Form Create State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Edit State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmers');
      setFarmers(res.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil daftar petani:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name) {
      setErrorMsg('Nama lengkap petani wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/farmers', {
        name,
        phone: phone || null,
        total_debt: totalDebt ? Number(String(totalDebt).replace(/[^0-9]/g, '')) : 0
      });
      setSuccessMsg('Mitra Tani baru berhasil didaftarkan!');
      setShowModal(false);
      setName('');
      setPhone('');
      setTotalDebt('');
      fetchFarmers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Error create farmer:', error.response?.data || error.message);
      setErrorMsg(error.response?.data?.message || 'Gagal mendaftarkan petani.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFarmer = async (e) => {
    e.preventDefault();
    if (!selectedFarmer || !editName) return;

    setSubmitting(true);
    try {
      await api.put(`/farmers/${selectedFarmer.id}`, {
        name: editName,
        phone: editPhone || null
      });
      setSuccessMsg(`Data petani ${editName} berhasil diperbarui.`);
      setShowEditModal(false);
      setSelectedFarmer(null);
      fetchFarmers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengupdate petani.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarmer = async () => {
    if (!selectedFarmer) return;
    setSubmitting(true);
    try {
      await api.delete(`/farmers/${selectedFarmer.id}`);
      setSuccessMsg(`Data petani ${selectedFarmer.name} berhasil dihapus.`);
      setShowDeleteModal(false);
      setSelectedFarmer(null);
      fetchFarmers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus petani.');
      setShowDeleteModal(false);
    } finally {
      setSubmitting(false);
    }
  };

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

  const filteredFarmers = farmers.filter(f => 
    (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActiveDebt = farmers.reduce((sum, f) => sum + (Number(f.total_debt) || 0), 0);
  const farmersWithDebt = farmers.filter(f => (Number(f.total_debt) || 0) > 0).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs no-print">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
              <Sprout className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Manajemen Mitra Tani</h1>
            {/* <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              Master Data Sawit
            </span> */}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data registrasi petani kelapa sawit, informasi kontak, dan rekam saldo kasbon secara terpusat untuk sinkronisasi ke HP lapangan.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={fetchFarmers}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              setErrorMsg('');
              setShowModal(true);
            }}
            className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-emerald-400/30"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Petani Baru</span>
          </button>
        </div>
      </div>

      {/* Alert Success */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Mitra Terdaftar</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{farmers.length} <span className="text-sm font-semibold text-slate-500">Petani</span></h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sinkron ke HP semua admin
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            <Sprout className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Kasbon Beredar</p>
            <h3 className="text-2xl font-extrabold text-amber-600">Rp {formatNumber(totalActiveDebt)}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Dari {farmersWithDebt} petani berutang
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <Wallet className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Petani Bersih (Tanpa Utang)</p>
            <h3 className="text-2xl font-extrabold text-teal-600">{farmers.length - farmersWithDebt} <span className="text-sm font-semibold text-slate-500">Orang</span></h3>
            <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Siap bayar penuh 100%
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-inner">
            <Users className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daftar Mitra Tani SawitTracker</h2>
            <p className="text-xs text-slate-500">Daftarkan petani baru di sini agar operator lapangan bisa menginput panennya</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, HP, atau admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Informasi Petani</th>
                <th className="py-4 px-6">Kontak / WA</th>
                <th className="py-4 px-6">Admin Pendaftar</th>
                <th className="py-4 px-6">Status Kasbon</th>
                <th className="py-4 px-6">Tanggal Daftar</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="font-semibold text-sm">Memuat data mitra tani dari server...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data petani yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((farmer) => {
                  const hasDebt = (Number(farmer.total_debt) || 0) > 0;
                  return (
                    <tr key={farmer.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
                            {(farmer.name || 'P').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                              {farmer.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ID: #{farmer.id} • Mitra Aktif
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {farmer.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{farmer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada No. HP</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{farmer.user?.name || 'Admin Pusat'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {hasDebt ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg text-xs border border-amber-200/60 shadow-2xs">
                            <Wallet className="w-3.5 h-3.5 text-amber-600" />
                            <span>Rp {formatNumber(farmer.total_debt)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lunas / Bersih</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-500 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(farmer.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setEditName(farmer.name || '');
                              setEditPhone(farmer.phone || '');
                              setShowEditModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Edit Data Petani"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Hapus Petani"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH PETANI BARU */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Daftarkan Mitra Tani Baru</h3>
                  <p className="text-xs text-slate-500">Otomatis sinkron ke HP semua operator lapangan</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateFarmer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Petani <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp / HP (Opsional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Saldo Utang / Kasbon Awal (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input
                    type="text"
                    placeholder="Contoh: 2.000.000"
                    value={totalDebt}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setTotalDebt(raw ? Number(raw).toLocaleString('id-ID') : '');
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Jika diisi, otomatis tercatat di daftar Kasbon & terpotong saat penimbangan buah sawit berikutnya.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Petani</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PETANI */}
      {showEditModal && selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Edit Data Mitra Tani</h3>
                  <p className="text-xs text-slate-500">Perbarui nama atau nomor kontak petani</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarmer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Petani <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Update Data</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PETANI */}
      {showDeleteModal && selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">Hapus Mitra Tani Ini?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Anda akan menghapus data <strong className="text-slate-800 font-bold">{selectedFarmer.name}</strong>. Semua riwayat penimbangan dan kasbon terkait petani ini akan ikut terhapus dari database PKS.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteFarmer}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Petani</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MitraTani;
