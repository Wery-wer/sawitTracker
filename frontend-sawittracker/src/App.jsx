import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InputPanen from './pages/InputPanen';
import Kasbon from './pages/Kasbon';
import Laporan from './pages/Laporan';
import ManajemenAdmin from './pages/ManajemenAdmin';
import MitraTani from './pages/MitraTani';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Wajib Login / Memiliki Token Sanctum) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="petani" element={<MitraTani />} />
            <Route path="panen" element={<InputPanen />} />
            <Route path="kasbon" element={<Kasbon />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="admin" element={<ManajemenAdmin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
