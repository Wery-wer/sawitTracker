import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Scale, 
  DollarSign,
  CheckCircle2,
  ArrowDownToLine,
  Sprout,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

const Laporan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('minggu'); // hari, minggu, bulan
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data transaksi secara Live dari Backend Laravel / Supabase Cloud
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil laporan transaksi:', error);
    } finally {
      setLoading(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).split('T')[0] || dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Filter transaksi
  const filteredData = transactions.filter(t => {
    const farmerName = t.farmer?.name || '';
    const idStr = `TRX-${t.id}`;
    return farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           idStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Perhitungan Summary Total dari data live Supabase (konversi ke Number dulu)
  const totalNetto = filteredData.reduce((sum, t) => sum + (Number(t.netto_weight) || 0), 0);
  const totalDeduction = filteredData.reduce((sum, t) => sum + (Number(t.debt_deduction) || 0), 0);
  const totalNetPay = filteredData.reduce((sum, t) => sum + (Number(t.total_net_price) || 0), 0);

  // =========================================================================
  // EXCEL & SPREADSHEET EXPORTER (Standar Microsoft Excel Indonesia / ISO)
  // =========================================================================
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data transaksi untuk diexport!');
      return;
    }

    // 1. Header Kolom (Gunakan delimiter titik koma ';' karena Excel Indonesia menggunakan koma untuk pecahan desimal)
    const headers = [
      'No',
      'No. Bukti / Transaksi',
      'Tanggal / Jam',
      'Nama Petani / Mitra',
      'No. Telepon',
      'Netto (Kg)',
      'Harga per Kg (Rp)',
      'Potongan Kasbon (Rp)',
      'Total Bayar Net (Rp)',
      'Status'
    ];

    // 2. Baris Data Transaksi dengan format mata uang resmi Indonesia (Rp.000.000)
    const rows = filteredData.map((t, index) => [
      index + 1,
      `"TRX-${t.id}"`,
      `"${formatDate(t.date || t.created_at)}"`,
      `"${t.farmer?.name || 'Petani'}"`,
      `"${t.farmer?.phone || '-'}"`,
      `"${formatNumber(t.netto_weight || 0)} Kg"`,
      `"Rp. ${formatNumber(t.price_per_kg || 0)}"`,
      `"Rp. ${formatNumber(t.debt_deduction || 0)}"`,
      `"Rp. ${formatNumber(t.total_net_price || 0)}"`,
      '"Lunas"'
    ]);

    // 3. Baris Ringkasan Total Akuntansi (Footer)
    rows.push([]); // Baris kosong sebagai pembatas
    rows.push([
      '""',
      '"TOTAL KESELURUHAN"',
      `"${filteredData.length} Transaksi"`,
      '""',
      '""',
      `"${formatNumber(totalNetto)} Kg"`,
      '""',
      `"Rp. ${formatNumber(totalDeduction)}"`,
      `"Rp. ${formatNumber(totalNetPay)}"`,
      '""'
    ]);

    // 4. Gabungkan semua baris menjadi string CSV dengan BOM (\uFEFF) agar langsung terbaca rapi oleh Microsoft Excel
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    // 5. Buat Blob & Unduh Otomatis ke Komputer User
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Laporan_Panen_SawitTracker_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Halaman & Export Buttons (Disembunyikan saat cetak) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Sistem Arsip & Pelaporan Resmi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">
            Laporan Riwayat Panen & Pembayaran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Arsip seluruh transaksi penerimaan TBS dari lapangan beserta rincian pemotongan kasbon petani.
          </p>
        </div>

        {/* Tombol Export & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-2xs"
            title="Cetak Laporan"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS RINGKASAN LAPORAN (LIVE SUPABASE - Disembunyikan saat cetak) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 no-print">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
            Total Tonase TBS Masuk
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl lg:text-4xl font-black tracking-tight">
              {(totalNetto / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-lg font-bold text-emerald-200">Ton</span>
          </div>
          <p className="text-xs text-emerald-200/80 mt-2 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" /> Total {formatNumber(totalNetto)} Kg dari {filteredData.length} transaksi
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Piutang Terpotong
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-rose-600 tracking-tight">
            {formatRupiah(totalDeduction)}
          </h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Berhasil dipotong otomatis dari panen
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Uang Dibayarkan (Net)
          </span>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
            {formatRupiah(totalNetPay)}
          </h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Uang tunai/transfer keluar ke petani
          </p>
        </div>
      </div>

      {/* FILTER BAR & TABEL LAPORAN (LIVE DATA) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden print-container">
        {/* Filter Controls (Disembunyikan saat cetak) */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 no-print">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter Periode:
            </span>
            <div className="flex rounded-xl bg-slate-200/80 p-1">
              <button
                onClick={() => setFilterPeriod('hari')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterPeriod === 'hari' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setFilterPeriod('minggu')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterPeriod === 'minggu' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setFilterPeriod('bulan')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterPeriod === 'bulan' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Bulan Ini
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari ID transaksi atau petani..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* =========================================================
            1. TABEL RIWAYAT TRANSAKSI (Versi Web Dashboard - Disembunyikan saat cetak)
            ========================================================= */}
        <div className="overflow-x-auto no-print">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">No. Transaksi / Waktu</th>
                <th className="py-4 px-6">Nama Petani</th>
                <th className="py-4 px-6">Netto (Kg)</th>
                <th className="py-4 px-6">Harga/Kg</th>
                <th className="py-4 px-6 text-rose-600">Potong Kasbon</th>
                <th className="py-4 px-6 text-emerald-700">Total Dibayar (Net)</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Memuat arsip transaksi dari server...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Belum ada riwayat transaksi yang tersimpan.
                  </td>
                </tr>
              ) : (
                filteredData.map((t) => (
                  <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">TRX-{t.id}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(t.date || t.created_at)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm">{t.farmer?.name || 'Petani'}</p>
                      <p className="text-[11px] text-slate-400">📱 {t.farmer?.phone || '-'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800">
                        {formatNumber(t.netto_weight)} Kg
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatRupiah(t.price_per_kg)}
                    </td>
                    <td className="py-4 px-6 font-bold text-rose-600">
                      {Number(t.debt_deduction) > 0 ? (
                        <span className="bg-rose-50 px-2 py-0.5 rounded text-rose-700 border border-rose-200/50">
                          - {formatRupiah(t.debt_deduction)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Tidak ada utang</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-black text-emerald-600 text-sm">
                      {formatRupiah(t.total_net_price)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/50">
                        <CheckCircle2 className="w-3 h-3" />
                        Lunas
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
            {/* Table Footer / Total Summary Row */}
            <tfoot className="bg-slate-100/80 font-black text-slate-800 text-xs border-t-2 border-slate-200">
              <tr>
                <td colSpan="2" className="py-4 px-6 uppercase text-slate-600">Total Keseluruhan ({filteredData.length} Transaksi)</td>
                <td className="py-4 px-6 text-slate-900">{formatNumber(totalNetto)} Kg</td>
                <td className="py-4 px-6 text-slate-500">-</td>
                <td className="py-4 px-6 text-rose-600">- {formatRupiah(totalDeduction)}</td>
                <td className="py-4 px-6 text-emerald-700 text-sm">{formatRupiah(totalNetPay)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* =========================================================
            2. DOKUMEN RESMI CETAK PDF (100% STANDAR KORPORAT / ISO PKS)
            Hanya Muncul di Kertas saat Ditekan Tombol Cetak PDF
            ========================================================= */}
        <div className="print-only font-serif text-black p-4 bg-white">
          {/* KOP SURAT TRADISIONAL GANDA (Standar BUMN / Pabrik Kelapa Sawit) */}
          <div className="text-center pb-3 border-b-[3px] border-black">
            <h1 className="text-xl font-extrabold uppercase tracking-wide text-black">
              PT. KOPERASI SAWIT TRACKER INDONESIA
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-wider text-black mt-0.5">
              UNIT PABRIK KELAPA SAWIT (PKS) &amp; POS TIMBANGAN RAM
            </h2>
            <p className="text-[11px] font-normal text-black mt-1">
              Jalan Raya Perkebunan Kelapa Sawit KM 15, Pekanbaru, Riau 28282 | Telp: (0761) 554433 | Fax: (0761) 554434
            </p>
            <p className="text-[10px] font-normal italic text-black">
              Izin Usaha Perkebunan &amp; Pengolahan: SK.503/IUP-PKS/2026/0198 | NIB: 0220304918271
            </p>
          </div>
          <div className="border-t border-black mt-0.5 mb-5"></div>

          {/* METADATA DOKUMEN FORMAL */}
          <div className="text-center mb-5">
            <h3 className="text-base font-bold underline uppercase tracking-wider text-black">
              LAPORAN REKAPITULASI PENERIMAAN TBS &amp; PEMBAYARAN KASBON PETANI
            </h3>
            <p className="text-xs font-semibold text-black mt-1.5">
              Nomor Dokumen: ST-LPR/{new Date().getFullYear()}/07/0014 &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; Periode: {filterPeriod.toUpperCase()} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; Total Transaksi: {filteredData.length} Unit Truk
            </p>
          </div>

          {/* TABEL DATA FORMAL (GRID HITAM SOLID BORDER 1px BLACK) */}
          <table className="print-table w-full text-[11px] text-black border-collapse mb-6 font-sans">
            <thead>
              <tr className="bg-slate-200 font-bold text-center">
                <th className="py-2 px-1.5 w-10 text-center">No.</th>
                <th className="py-2 px-2 text-center">No. Bukti</th>
                <th className="py-2 px-2 text-center">Tanggal / Jam</th>
                <th className="py-2 px-3 text-left">Nama Petani / Mitra</th>
                <th className="py-2 px-2 text-right">Netto (Kg)</th>
                <th className="py-2 px-2 text-right">Harga/Kg (Rp)</th>
                <th className="py-2 px-2 text-right">Potongan Kasbon (Rp)</th>
                <th className="py-2 px-2 text-right">Total Bayar Net (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((t, index) => (
                <tr key={t.id}>
                  <td className="py-1.5 px-1.5 text-center">{index + 1}</td>
                  <td className="py-1.5 px-2 text-center font-semibold">TRX-{t.id}</td>
                  <td className="py-1.5 px-2 text-center">{formatDate(t.date || t.created_at)}</td>
                  <td className="py-1.5 px-3 font-medium">{t.farmer?.name || 'Petani'}</td>
                  <td className="py-1.5 px-2 text-right font-semibold">{formatNumber(t.netto_weight)}</td>
                  <td className="py-1.5 px-2 text-right">{formatNumber(t.price_per_kg)}</td>
                  <td className="py-1.5 px-2 text-right">{Number(t.debt_deduction) > 0 ? formatNumber(t.debt_deduction) : '-'}</td>
                  <td className="py-1.5 px-2 text-right font-bold">{formatNumber(t.total_net_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-bold">
                <td colSpan="4" className="py-2 px-3 text-center uppercase tracking-wider">TOTAL KESELURUHAN</td>
                <td className="py-2 px-2 text-right font-black">{formatNumber(totalNetto)}</td>
                <td className="py-2 px-2 text-center">-</td>
                <td className="py-2 px-2 text-right font-black">{formatNumber(totalDeduction)}</td>
                <td className="py-2 px-2 text-right font-black text-xs">{formatNumber(totalNetPay)}</td>
              </tr>
            </tfoot>
          </table>

          {/* KOLOM TANDA TANGAN FORMAL (Standar BUMN / Perbankan / PKS) */}
          <div className="mt-8 text-xs text-black font-sans flex justify-between px-6 pt-2">
            <div className="text-center w-56">
              <p className="mb-1 text-slate-800">Disiapkan &amp; Diperiksa Oleh,</p>
              <p className="font-bold text-black">Kepala Pos Timbangan / Kasir</p>
              <div className="h-20"></div>
              <p className="font-bold text-black underline">( ............................................ )</p>
              <p className="text-[10px] mt-0.5 text-slate-700">NIP: 19880214 202601 1 001</p>
            </div>

            <div className="text-center w-56">
              <p className="mb-1 text-slate-800">Pekanbaru, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-black">Manajer Operasional PKS / RAM</p>
              <div className="h-20"></div>
              <p className="font-bold text-black underline">( ............................................ )</p>
              <p className="text-[10px] mt-0.5 text-slate-700">PT. Koperasi Sawit Tracker Indonesia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
