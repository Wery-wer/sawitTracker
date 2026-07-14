import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Loader2,
  Calendar,
  Key,
  UserCheck,
  Edit2,
  Scale
} from 'lucide-react';
import api from '../services/api';

const ManajemenAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Current logged in user
  const currentUser = JSON.parse(localStorage.getItem('sawittracker_user') || '{}');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setAdmins(res.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil daftar admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name || !email || !password) {
      setErrorMsg('Mohon lengkapi semua kolom data!');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/users', { name, email, password });
      setSuccessMsg('Akun Admin baru berhasil ditambahkan!');
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchAdmins();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Error create admin:', error.response?.data || error.message);
      setErrorMsg(error.response?.data?.message || 'Gagal menambahkan admin. Email mungkin sudah terdaftar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if(!selectedAdmin) return;

    setSubmitting(true);
    try{
      await api.put(`/users/${selectedAdmin.id}`, {
        name: editName,
        email: editEmail,
        ...(editPassword ? {password: editPassword} : {})
      });
      setSuccessMsg('Data profil berhasil di perbaharui');
      setShowEditModal(false);
      fetchAdmins();

      if (currentUser.id === selectedAdmin.id || currentUser.email === selectedAdmin.email){
        const updatedUser = {
          ...currentUser, name: editName, email: editEmail
        };
        localStorage.setItem('sawittracker_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('sotrage'));
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error){
      alert(error.response?.data?.message || 'Gagal mengedit profil.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${selectedAdmin.id}`);
      setSuccessMsg(`Akun admin ${selectedAdmin.name} berhasil dihapus.`);
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus admin.');
      setShowDeleteModal(false);
    } finally {
      setSubmitting(false);
    }
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

  const filteredAdmins = admins.filter(a => 
    (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs no-print">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Manajemen Admin & Pengguna</h1>
          </div>
          {/* <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Manajemen Admin & Pengguna</h1> */}
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses akun pengawas operasional koperasi sawit dan lapangan secara terpusat dengan protokol keamanan berlapis.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={fetchAdmins}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
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
            <span>Tambah Admin Baru</span>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Pengguna Terdaftar</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{admins.length} <span className="text-sm font-semibold text-slate-500">Akun</span></h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Terverifikasi sistem PKS
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Protokol Keamanan</p>
            <h3 className="text-2xl font-extrabold text-slate-800">100% Aman</h3>
            <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Laravel Sanctum & Bcrypt
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <Key className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pendaftaran Mandiri</p>
            <h3 className="text-2xl font-extrabold text-rose-600">Non-aktif</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Mencegah akses liar dari luar
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daftar Admin & Pengawas Koperasi</h2>
            <p className="text-xs text-slate-500">Kelola dan cabut akses akun sewaktu-waktu jika pegawai resign</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
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
                <th className="py-4 px-6">Informasi Admin</th>
                <th className="py-4 px-6">Status & Peran</th>
                <th className="py-4 px-6">Petani Dikelola</th>
                <th className="py-4 px-6">Panen Diinput</th>
                <th className="py-4 px-6">Tanggal Bergabung</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="font-semibold text-sm">Memuat daftar pengelola sistem...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data admin yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSelf = currentUser.email === admin.email || currentUser.id === admin.id;
                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
                            {(admin.name || 'A').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {admin.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {admin.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Aktif • Pengawas Koperasi</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{admin.farmers_count || 0} Petani</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-200/50 shadow-2xs">
                          <Scale className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{admin.transactions_count || 0} Transaksi</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-500 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(admin.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <dvi className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setEditName(admin.name || '');
                              setEditEmail(admin.email);
                              setEditPassword('');
                              setShowEditModal(true);
                            }}
                            className='p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-200 active:scale-95'
                            title='Edit Profil Admin'
                          >
                            <Edit2 className='w-4 h-4'/>
                          </button>
                        </dvi>
                        {!isSelf ? (
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 active:scale-95"
                            title="Hapus / Nonaktifkan Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-1 rounded-lg ml-1 shadow-2xs">
                            Akun Anda
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH ADMIN BARU */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Tambah Admin Baru</h3>
                  <p className="text-xs text-slate-500">Buat akun untuk pengawas atau kasir baru</p>
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

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Pegawai
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Resmi / Username Login
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: budi@sawittracker.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi Sementara
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Kata sandi ini akan digunakan admin lapangan untuk login di HP.
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
                    <span>Simpan Admin</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS ADMIN */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">Hapus Akun Admin Ini?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Anda akan menghapus hak akses untuk <strong className="text-slate-800 font-bold">{selectedAdmin.name}</strong> (<span className="text-rose-600 font-semibold">{selectedAdmin.email}</span>). Pegawai ini tidak akan bisa login lagi di aplikasi mobile.
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
                onClick={handleDeleteAdmin}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Akun</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL EDIT ADMIN */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Edit Profil Admin</h3>
                  <p className="text-xs text-slate-500">Perbarui nama, email, atau sandi login</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Resmi / Username Login
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kosongkan jika tidak ingin ganti sandi..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Biarkan kosong kalau sandinya tidak mau diubah.
                </p>
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
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenAdmin;
