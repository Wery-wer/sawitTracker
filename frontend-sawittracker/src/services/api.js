import axios from 'axios';

// Konfigurasi global Axios untuk terhubung ke Backend Laravel (PostgreSQL)
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Otomatis sisipkan Sanctum Token dari localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sawittracker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Jika 401 Unauthorized, hapus sesi & lemparkan ke /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Hanya bersihkan token & redirect jika user tidak sedang di halaman login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('sawittracker_token');
        localStorage.removeItem('sawittracker_user');
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

export default api;
