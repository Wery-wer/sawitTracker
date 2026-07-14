import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Scale, 
  Wallet, 
  FileText, 
  Sprout, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Users
} from 'lucide-react';
import api from '../../services/api';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();

  // Ambil informasi Admin dari localStorage
  const userData = JSON.parse(localStorage.getItem('sawittracker_user') || '{}');
  const adminName = userData.name || 'Admin Koperasi';
  const adminEmail = userData.email || 'admin@sawittracker.com';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Mitra Tani', path: '/petani', icon: Sprout },
    { name: 'Input Panen', path: '/panen', icon: Scale },
    { name: 'Kasbon', path: '/kasbon', icon: Wallet },
    { name: 'Laporan', path: '/laporan', icon: FileText },
    { name: 'Admin & Pengguna', path: '/admin', icon: Users },
  ];

  // FUNGSI LOGOUT (POST /api/logout & Bersihkan localStorage)
  const handleLogout = async () => {
    try {
      // Tembak API Logout di Laravel Sanctum untuk mencabut token
      await api.post('/logout');
    } catch (error) {
      console.warn('Logout API error / Token sudah kadaluarsa:', error.message);
    } finally {
      // Bersihkan sesi di local browser
      localStorage.removeItem('sawittracker_token');
      localStorage.removeItem('sawittracker_user');

      // Arahkan ke halaman login
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 left-0 shadow-sm z-30 transition-all duration-300 ease-in-out relative`}
    >
      {/* Floating Border Toggle Button */}
      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 flex items-center justify-center shadow-md z-40 transition-transform active:scale-95"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Brand Logo & Navigation */}
      <div>
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white transition-all overflow-hidden`}>
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6 text-white animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <h1 className="font-bold text-lg tracking-wide leading-tight">Nyawit Dulu</h1>
              <p className="text-[10px] text-emerald-100 font-medium tracking-wider uppercase">Kebun</p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className={`py-6 ${isCollapsed ? 'px-2.5' : 'px-4'} transition-all`}>
          {!isCollapsed ? (
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 whitespace-nowrap">
              Menu Utama
            </p>
          ) : (
            <div className="h-4 mb-3 border-b border-slate-100 mx-2" />
          )}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                    } rounded-xl font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-semibold'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                        {!isCollapsed && <span className="whitespace-nowrap truncate">{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'text-emerald-200 opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-emerald-600'}`} />
                      )}

                      {/* Tooltip on Hover when Collapsed */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 font-normal">
                          {item.name}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin Profile & Logout */}
      <div className={`border-t border-slate-100 bg-slate-50/50 rounded-2xl border transition-all duration-300 ${isCollapsed ? 'p-2.5 m-2' : 'p-4 m-3'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500/30 flex items-center justify-center font-bold text-emerald-700 shadow-sm shrink-0">
                {adminName.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-800 truncate">{adminName}</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate" title={adminEmail}>
                  {adminEmail}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/60 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Keluar Sistem
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-full bg-emerald-100 border-2 border-emerald-500/30 flex items-center justify-center font-bold text-emerald-700 shadow-sm text-xs cursor-pointer"
              title={`${adminName} (${adminEmail})`}
            >
              {adminName.substring(0, 2).toUpperCase()}
            </div>
            <button 
              onClick={handleLogout}
              title="Keluar Sistem (Logout)"
              className="w-full flex items-center justify-center p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors border border-rose-200/60 active:scale-95 group relative"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-rose-800 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 font-semibold">
                Keluar Sistem
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
