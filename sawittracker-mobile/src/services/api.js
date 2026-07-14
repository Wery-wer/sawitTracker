import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// URL API Produksi / Lokal
// Jika jalankan di Mac iOS Simulator, localhost bisa langsung diakses via http://127.0.0.1:8000/api atau http://localhost:8000/api
// Untuk device fisik atau server cloud render, gunakan URL produksi: misal 'https://api-sawittracker.render.com/api'
const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 detik timeout
});

// REQUEST INTERCEPTOR: Otomatis sisipkan Bearer Token dari AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('sawittracker_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Gagal mengambil token dari AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle error & 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Jika token kedaluwarsa atau tidak valid, bersihkan sesi
      try {
        await AsyncStorage.removeItem('sawittracker_token');
        await AsyncStorage.removeItem('sawittracker_user');
      } catch (e) {
        console.error('Gagal menghapus sesi:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
