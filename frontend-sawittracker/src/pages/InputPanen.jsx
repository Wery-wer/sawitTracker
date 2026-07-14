import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  Truck, 
  User, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Calculator, 
  Receipt,
  X,
  Loader2,
  Bell,
  Check
} from 'lucide-react';
import api from '../services/api';

const InputPanen = () => {
  // Data Petani dari PostgreSQL via API
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Form State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [bruto, setBruto] = useState('');
  const [tarra, setTarra] = useState('');
  const [pricePerKg, setPricePerKg] = useState('2500');
  const [notes, setNotes] = useState('');
  const [deductDebt, setDeductDebt] = useState(null);

  // Status & Notification State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // KAMERA STATE
  const [useCamera, setUseCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Quick preset harga
  const pricePresets = ['2450', '2500', '2550', '2600'];

  // LOAD DATA INITIAL
  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const response = await api.get('/farmers');
      const data = response.data?.data || response.data || [];
      setFarmers(data);
      if (data.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(data[0].id);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) return; // Biarkan interceptor api.js me-redirect ke login
      console.error('Error fetching farmers for input:', error);
      setToastMessage('⚠️ Gagal mengambil data petani. Pastikan Anda sudah login dan backend aktif.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setLoadingFarmers(false);
    }
  };

  // KAMERA HANDLERS
  const startCamera = async () => {
    setUseCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      alert("Kamera tidak dapat diakses. Gunakan upload manual.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // KALKULASI REAL-TIME DI FRONTEND (Sinkron saat render)
  const selectedFarmer = farmers.find(f => String(f.id) === String(selectedFarmerId)) || null;
  const brutoNum = Number(bruto) || 0;
  const tarraNum = Number(tarra) || 0;
  const priceNum = Number(String(pricePerKg).replace(/[^0-9]/g, '')) || 0;

  // 1. Netto (Bruto - Tarra)
  const nettoNum = Math.max(0, brutoNum - tarraNum);

  // 2. Total Kotor (Netto * Harga)
  const totalGross = nettoNum * priceNum;

  // 3. Potongan Kasbon (Otomatis mendeteksi hutang petani di DB)
  const farmerDebt = selectedFarmer ? Number(selectedFarmer.total_debt || selectedFarmer.debt || 0) : 0;
  const debtDeduction = deductDebt === true ? Math.min(farmerDebt, totalGross) : 0;

  // 4. Total Bersih
  const totalNet = totalGross - debtDeduction;

  // 5. Sisa Hutang Petani setelah transaksi ini
  const remainingDebt = farmerDebt - debtDeduction;

  // Otomatis atur opsi potong kasbon berdasar status utang/kasbon petani yang dipilih
  useEffect(() => {
    if (selectedFarmer) {
      const currentDebt = Number(selectedFarmer.total_debt || selectedFarmer.debt || 0);
      if (currentDebt <= 0) {
        setDeductDebt(false);
      } else {
        setDeductDebt(null); // Kosongkan dulu jika petani punya utang agar admin wajib memilih manual
      }
    }
  }, [selectedFarmerId, farmers]);

  // Validasi timbangan error
  const isTarraInvalid = tarraNum > brutoNum && brutoNum > 0;

  // 2. SUBMIT TRANSAKSI KE POSTGRESQL (POST /api/transactions)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarmer || brutoNum <= 0 || isTarraInvalid) return;

    if (farmerDebt > 0 && deductDebt === null) {
      setToastMessage('⚠️ Harap pilih Opsi Potongan Kasbon (Potong Kasbon atau Bayar Penuh) terlebih dahulu!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        farmer_id: Number(selectedFarmerId),
        date: new Date().toISOString().split('T')[0],
        bruto_weight: brutoNum,
        tarra_weight: tarraNum,
        price_per_kg: priceNum,
        deduct_debt: deductDebt,
        deductDebt: deductDebt,
      };

      // Tembak API Laravel
      const response = await api.post('/transactions', payload);
      const savedTrx = response.data.data || response.data || {};

      // Siapkan data untuk struk thermal
      const trxData = {
        id: savedTrx.id ? `TRX-${savedTrx.id}` : 'TRX-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        farmer: selectedFarmer,
        bruto: Number(savedTrx.bruto_weight || brutoNum),
        tarra: Number(savedTrx.tarra_weight || tarraNum),
        netto: Number(savedTrx.netto_weight || nettoNum),
        price: Number(savedTrx.price_per_kg || priceNum),
        gross: Number(savedTrx.total_gross_price || totalGross),
        deduction: Number(savedTrx.debt_deduction !== undefined ? savedTrx.debt_deduction : debtDeduction),
        net: Number(savedTrx.total_net_price !== undefined ? savedTrx.total_net_price : totalNet),
        remainingDebt: remainingDebt,
        notes: notes || '-'
      };

      setLastTransaction(trxData);
      
      // Tampilkan Toast Notifikasi Sukses
      setToastMessage('✅ Transaksi Panen Berhasil Disimpan ke PostgreSQL! Utang petani otomatis terpotong.');
      setTimeout(() => setToastMessage(null), 6000);

      // Buka Modal Struk
      setShowReceiptModal(true);

      // Reset Form & Refresh Data Petani agar sisa hutang terupdate dari DB!
      handleReset();
      await fetchFarmers();
    } catch (error) {
      console.error('Error saving transaction:', error);
      const errMsg = error.response?.data?.message || 'Gagal menyimpan transaksi ke server. Cek koneksi backend Laravel Anda.';
      alert('❌ Error: ' + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form
  const handleReset = () => {
    setBruto('');
    setTarra('');
    setNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 animate-bounce">
          <div className="p-1.5 bg-white/20 rounded-full">
            <Check className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Input Panen & Potong Utang Otomatis</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">
            Kalkulator Panen
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchFarmers}
            disabled={loadingFarmers}
            className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5"
            title="Refresh Data Petani dari DB"
          >
            <Loader2 className={`w-3.5 h-3.5 ${loadingFarmers ? 'animate-spin' : ''}`} />
            <span>Refresh DB</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Kosongkan Form
          </button>
        </div>
      </div>

      {/* GRID UTAMA: Form Kiri (7 Kolom) & Real-time Card Kanan (5 Kolom) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: FORM INPUT (7 Kolom) */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Input Petani & Timbangan TBS
          </h2>

          {/* Dropdown Petani dari PostgreSQL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Nama Petani / Pemasok</span>
              {/* {loadingFarmers && <span className="text-emerald-600 animate-pulse text-[11px]">⏳ Memuat daftar petani...</span>} */}
            </label>
            
            {loadingFarmers ? (
              <div className="w-full px-4 py-4 bg-slate-100 text-slate-500 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                Memuat daftar petani...
              </div>
            ) : (
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 font-bold text-sm rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all duration-200 cursor-pointer"
              >
                {farmers.length === 0 ? (
                  <option value="">Belum ada data petani di database</option>
                ) : (
                  farmers.map((f) => {
                    const debtVal = Number(f.total_debt || f.debt || 0);
                    return (
                      <option key={f.id} value={f.id}>
                        {f.name} — {debtVal > 0 ? `Utang: Rp ${debtVal.toLocaleString('id-ID')}` : 'Bebas Utang'}
                      </option>
                    );
                  })
                )}
              </select>
            )}

            {selectedFarmer && (
              <div className="flex items-center justify-between text-xs px-2 pt-1">
                <span className="text-slate-500">No. HP: <strong className="text-slate-700">{selectedFarmer.phone || '-'}</strong></span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${farmerDebt > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {farmerDebt > 0 ? `Sisa Utang: Rp ${farmerDebt.toLocaleString('id-ID')}` : '✓ Bebas Utang'}
                </span>
              </div>
            )}
          </div>

          {/* Input Bruto & Tarra (Side-by-side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Berat Bruto */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Berat Bruto (Truk + TBS)</span>
                <span className="text-emerald-600 font-semibold">Kg</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={bruto}
                  onChange={(e) => setBruto(e.target.value)}
                  autoFocus
                  required
                  min="1"
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-50 focus:bg-white text-2xl font-black text-slate-800 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all duration-200"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm pointer-events-none">
                  Kg
                </span>
              </div>
              <p className="text-[11px] text-slate-400 px-1">Berat total saat truk naik timbangan</p>
            </div>

            {/* Berat Tarra */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Tarra (Truk Kosong)</span>
                <span className="text-emerald-600 font-semibold">Kg</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={tarra}
                  onChange={(e) => setTarra(e.target.value)}
                  required
                  min="0"
                  className={`w-full pl-4 pr-12 py-3.5 bg-slate-50 focus:bg-white text-2xl font-black rounded-2xl border-2 outline-none transition-all duration-200 ${
                    isTarraInvalid 
                      ? 'border-rose-500 text-rose-600 focus:ring-4 focus:ring-rose-500/15' 
                      : 'border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm pointer-events-none">
                  Kg
                </span>
              </div>
              {isTarraInvalid ? (
                <p className="text-[11px] text-rose-600 font-bold px-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Tarra tidak boleh melebihi Bruto!
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 px-1">Berat truk setelah sawit dibongkar</p>
              )}
            </div>
          </div>

          {/* Input Harga per Kg */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Harga per Kg TBS</span>
                <span className="text-emerald-600 font-semibold">Rupiah</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg pointer-events-none">
                Rp
              </span>
              <input
                type="text"
                value={pricePerKg}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setPricePerKg(raw ? Number(raw).toLocaleString('id-ID') : '');
                }}
                required
                placeholder="2.500"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 focus:bg-white text-2xl font-black text-slate-800 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all duration-200"
              />
            </div>

            {/* Price Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-400 font-medium mr-1">Preset Cepat:</span>
              {pricePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPricePerKg(Number(preset).toLocaleString('id-ID'))}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    String(pricePerKg).replace(/[^0-9]/g, '') === String(preset)
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Rp {Number(preset).toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          {/* Opsi Potongan */}
          <div className="pt-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Opsi Potongan Kasbon Petani</label>
            </div>

            {farmerDebt <= 0 ? (
              <div className="mt-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Petani Bebas Kasbon (Rp 0)</div>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Button Kasbon */}
                  <button
                    type="button"
                    onClick={() => setDeductDebt(true)}
                    className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                        deductDebt === true
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.01] border-emerald-600'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-300'
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4"/>
                    <span>Potong Kasbon</span>
                  </button>

                  {/* Button Bayar Penuh */}
                  <button
                    type="button"
                    onClick={() => setDeductDebt(false)}
                    className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                        deductDebt === false
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.01] border-emerald-600'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-300'
                      }`}
                  >
                    <DollarSign className="w-4 h-4"/>
                    <span>Bayar Penuh</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Buah bagus, potong tangkai rapi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 focus:bg-white text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* KOLOM KANAN: REAL-TIME SUMMARY & ACTION CARD (5 Kolom) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/60 sticky top-24 space-y-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* Header Card */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Rincian Pembayaran
              </h3>
            </div>
          </div>

          {/* Selected Farmer Info */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Petani Pemasok:</p>
              <p className="font-bold text-white text-base">{selectedFarmer?.name || '-'}</p>
              <p className="text-xs text-emerald-300">ID: #{selectedFarmer?.id || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Status Utang:</p>
              <p className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                farmerDebt > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {farmerDebt > 0 ? `Rp ${farmerDebt.toLocaleString('id-ID')}` : 'Bebas Utang'}
              </p>
            </div>
          </div>

          {/* Rincian Perhitungan (Timbangan & Uang) */}
          <div className="space-y-3.5 text-sm py-2">
            {/* Bruto & Tarra */}
            <div className="flex justify-between items-center text-slate-300">
              <span>Berat Bruto (Truk + TBS)</span>
              <span className="font-bold text-white">{brutoNum.toLocaleString('id-ID')} kg</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Potongan Tarra (Truk Kosong)</span>
              <span className="font-bold text-rose-300">- {tarraNum.toLocaleString('id-ID')} kg</span>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-700/80 my-2"></div>

            {/* Netto */}
            <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <span className="font-bold text-emerald-300">Netto (Berat Bersih)</span>
              <span className="text-lg font-black text-white">{nettoNum.toLocaleString('id-ID')} Kg</span>
            </div>

            {/* Harga & Gross */}
            <div className="flex justify-between items-center text-slate-300 pt-1">
              <span>Harga per Kg</span>
              <span className="font-semibold text-white">Rp {priceNum.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Total Kotor (Gross)</span>
              <span className="font-bold text-white">Rp {totalGross.toLocaleString('id-ID')}</span>
            </div>

            {/* Potongan Kasbon */}
            <div className={`flex flex-wrap justify-between items-center gap-2 p-3 rounded-xl border transition-all 
            ${ debtDeduction > 0 
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-200' 
                : 'bg-white/5 border-white/5 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="truncate">Potongan Kasbon</span>
                {/* {debtDeduction > 0 && (
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold">
                    Otomatis
                  </span>
                )} */}
              </div>
              <span className={`font-bold shrink-0 ${debtDeduction > 0 ? 'text-rose-400 text-base' : ''}`}>
                - Rp {debtDeduction.toLocaleString('id-ID')}
              </span>
            </div>
            {debtDeduction > 0 && (
              <p className="text-[11px] text-emerald-400/90 text-right italic -mt-1 pr-1">
                ✓ Sisa utang petani setelah panen ini: Rp {remainingDebt.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* TOTAL BERSIH DIBAYARKAN */}
          <div className="pt-4 border-t-2 border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Bersih Dibayarkan ke Petani
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-emerald-400">Net Pay</span>
              <span className="text-3xl lg:text-4xl font-black text-white tracking-tight text-right">
                Rp {totalNet.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tombol Simpan & Cetak */}
          <button
            type="submit"
            disabled={!selectedFarmer || brutoNum <= 0 || isTarraInvalid || isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-3 transition-all duration-200 ${
              !selectedFarmer || brutoNum <= 0 || isTarraInvalid || isSubmitting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                <span>Simpan & Cetak Struk (F10)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL STRUK BUKTI PANEN (Thermal Receipt Preview) */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                <h3 className="font-bold text-lg">Tersimpan di PostgreSQL!</h3>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Body */}
            <div className="p-6 bg-slate-50 font-mono text-xs text-slate-800 space-y-4">
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h4 className="font-black text-sm text-slate-900">KOPERASI SAWIT TRACKER</h4>
                <p className="text-[11px] text-slate-500">Jl. Perkebunan Makmur No. 88, Blok Sawit</p>
                <p className="text-[11px] text-slate-500">Telp: 0811-2233-4455</p>
                <div className="mt-2 text-[11px] font-bold bg-slate-200 py-1 rounded">
                  BUKTI TIMBANG & PEMBAYARAN TBS
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                <div className="flex justify-between"><span>No. Transaksi:</span> <strong>{lastTransaction.id}</strong></div>
                <div className="flex justify-between"><span>Tanggal/Jam:</span> <span>{lastTransaction.date}</span></div>
                <div className="flex justify-between"><span>Petani:</span> <strong>{lastTransaction.farmer.name}</strong></div>
                <div className="flex justify-between"><span>ID Petani:</span> <span>#{lastTransaction.farmer.id}</span></div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                <div className="flex justify-between"><span>Berat Bruto:</span> <span>{lastTransaction.bruto.toLocaleString('id-ID')} Kg</span></div>
                <div className="flex justify-between"><span>Potongan Tarra:</span> <span>- {lastTransaction.tarra.toLocaleString('id-ID')} Kg</span></div>
                <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded my-1">
                  <span>BERAT NETTO:</span> <span>{lastTransaction.netto.toLocaleString('id-ID')} Kg</span>
                </div>
                <div className="flex justify-between"><span>Harga / Kg:</span> <span>Rp {lastTransaction.price.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-semibold"><span>Total Kotor:</span> <span>Rp {lastTransaction.gross.toLocaleString('id-ID')}</span></div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Potongan Utang:</span> <span>- Rp {lastTransaction.deduction.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Sisa Utang Petani:</span> <span>Rp {lastTransaction.remainingDebt.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-500 block uppercase">Total Bersih Dibayar (Net)</span>
                <div className="text-xl font-black text-emerald-600 my-1">
                  Rp {lastTransaction.net.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-slate-400 border-t border-dashed border-slate-300">
                <p>--- Terima Kasih Atas Kerjasama Anda ---</p>
                <p>Data tersimpan sah di database server PostgreSQL.</p>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Tutup / Panen Baru
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputPanen;
