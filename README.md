<div align="center">

# 🌾 SawitTracker
### **Sistem Manajemen Panen Kelapa Sawit & Kasbon Mitra Tani Terpadu**

[![Laravel](https://img.shields.io/badge/Backend-Laravel%2011%20%2F%20PHP%208.2+-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](./backend-sawittracker)
[![React](https://img.shields.io/badge/Web%20Dashboard-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black)](./frontend-sawittracker)
[![React Native](https://img.shields.io/badge/Mobile%20App-React%20Native%20%2B%20Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](./sawittracker-mobile)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-059669?style=for-the-badge)]()

<p align="center">
  <b>Solusi Digital Modern & Enterprise untuk Pencatatan Timbangan Panen, Manajemen Utang/Kasbon Petani, dan Analitik Keuangan Perkebunan Kelapa Sawit secara Real-Time across Web & Mobile.</b>
</p>

</div>

---

## ✨ Tentang SawitTracker

**SawitTracker** adalah platform *Full-Stack Monorepo* yang dirancang khusus untuk meningkatkan transparansi, efisiensi, dan akurasi operasional bagi pengepul (RAM), koperasi, dan perkebunan kelapa sawit. Mengusung filosofi desain **Modern Enterprise UI/UX** dengan sentuhan **Liquid Glassmorphism**, sistem ini memastikan kenyamanan operasional admin di kantor (*Web Dashboard*) maupun lapangan (*Mobile App*).

---

## 🚀 Fitur Unggulan

### ⚖️ 1. Input Timbangan Panen Presisi (Live Calculation)
- **Perhitungan Otomatis Bruto - Tarra = Netto**: Kalkulasi instan berat bersih sawit.
- **Fintech Receipt Card Experience**: Ringkasan rincian panen transparan yang menyerupai struk transaksi perbankan digital.
- **Validasi Data Lapangan**: Pencegahan duplikasi dan pemantauan harga satuan (`Rp/KG`) real-time.

### 💳 2. Manajemen Utang & Kasbon Cerdas (Smart Debt Management)
- **Opsi Potongan Kasbon Manual & Otomatis**: Logika pintar untuk memotong utang petani secara otomatis (*Potong Kasbon*) atau pembayaran utuh (*Bayar Penuh*).
- **Auto-Disable & Safety Guard**: Petani tanpa utang/kasbon (`Rp 0`) secara otomatis diatur ke status *Bebas Kasbon* untuk mencegah kesalahan admin.
- **Riwayat Transaksi Transparan**: Setiap potongan terunggah dan memotong saldo kasbon petani secara sinkron di database.

### 📊 3. Executive Dashboard & Real-Time Analytics
- **Hero Analytics Card**: Pantauan total pengeluaran pembayaran panen, total tonase neto (`KG Netto`), dan jumlah transaksi harian.
- **Trend Indicators**: Indikator persentase pertumbuhan performa harian/bulanan dengan visualisasi yang interaktif.
- **Glassmorphism Navigation**: Header dan *sidebar* bernuansa kaca cair yang memberikan kesan mewah namun tetap cepat dan ringan.

### 📱 4. Ekosistem Lintas Platform yang Harmonis (Web & Mobile Sync)
- **Standardisasi Tipografi Enterprise**: Sinkronisasi sempurna antara sistem font di Web (`font-sans` Tailwind) dan Mobile (`SF Pro` di iOS & `Roboto` di Android) dengan proporsi *letter spacing* dan *font weight* presisi.
- **Sinkronisasi API Terpusat**: Satu *backend API* yang melayani Web Dashboard dan Mobile Application secara simultan dengan autentikasi `Sanctum` yang aman.

---

## 🛠️ Arsitektur & Teknologi

| Pilar | Teknologi Utama | Folder | Deskripsi |
| :--- | :--- | :--- | :--- |
| **🧠 Backend API** | **Laravel 11**, PHP 8.2+, MySQL / PostgreSQL, Sanctum | `backend-sawittracker/` | RESTful API kuat dengan validasi ketat, relasi database optimal, dan manajemen autentikasi. |
| **💻 Web Dashboard** | **React 18**, Vite, **Tailwind CSS**, Lucide Icons | `frontend-sawittracker/` | Dashboard web responsif berstandar enterprise untuk admin RAM dan manajemen keuangan. |
| **📱 Mobile App** | **React Native**, **Expo**, React Navigation, BlurView | `sawittracker-mobile/` | Aplikasi seluler berkinerja tinggi berdesain iOS/Android native untuk penginputan panen di lapangan. |

---

## 📂 Struktur Monorepo

```bash
sawitTracker/
├── 📂 backend-sawittracker/     # Laravel 11 API Backend & Database Migrations
├── 📂 frontend-sawittracker/    # React + Vite + Tailwind Web Application
├── 📂 sawittracker-mobile/      # React Native + Expo Mobile Application
├── 📄 .gitignore                # Global Monorepo Git Ignore
└── 📄 README.md                 # Dokumentasi Proyek
```

---

## ⚡ Panduan Instalasi & Quick Start

### 1. Persiapan Database & Backend API
```bash
# Masuk ke direktori backend
cd backend-sawittracker

# Salin file konfigurasi environment
cp .env.example .env

# Install dependensi PHP
composer install

# Generate Application Key
php artisan key:generate

# Jalankan migrasi dan seeder database
php artisan migrate --seed

# Nyalakan server lokal (Default: http://127.0.0.1:8000)
php artisan serve
```

### 2. Menjalankan Web Dashboard (Frontend)
```bash
# Masuk ke direktori frontend
cd frontend-sawittracker

# Install dependensi Node.js
npm install

# Jalankan dev server (Default: http://localhost:5173)
npm run dev
```

### 3. Menjalankan Mobile App (iOS / Android)
```bash
# Masuk ke direktori mobile
cd sawittracker-mobile

# Install dependensi
npm install

# Jalankan Expo Metro Bundler
npm run start
# Tekan 'i' untuk membuka di iOS Simulator atau 'a' untuk Android Emulator
```

---

<!-- ## 🎨 Filosofi Desain (Aesthetic Guidelines)

- **Vibrant & Harmonious Colors**: Kombinasi warna *Emerald* (`#059669`) sebagai identitas perkebunan sawit modern, berpadu dengan *Midnight Slate* (`#0F172A`) dan *Snow White* (`#F8FAFC`).
- **Liquid Glass Effect**: Pemanfaatan *backdrop-filter* dan *blur view* transparan dengan border siluet (`#A7F3D0`) untuk memisahkan navigasi dan konten utama.
- **Zero Placeholder & Premium Polish**: Setiap tombol, modal konfirmasi, dan notifikasi (*Bottom Toast*) dibuat dengan animasi halus (*micro-animations*) untuk kenyamanan maksimal pengguna. -->

<!-- --- -->

<div align="center">
  <p><b>© 2026 SawitTracker</b></p>
</div>
