import React from 'react';
import { Search, Bell, Calendar } from 'lucide-react';

const Header = () => {
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-6 sm:px-8 flex items-center justify-between shadow-xs">
      {/* Left Section: Current Date */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold shadow-2xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Right Section: Search & Notifications */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative w-48 sm:w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari petani, kasbon, atau transaksi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
          />
        </div>

        {/* Notification Bell */}
        <button className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
