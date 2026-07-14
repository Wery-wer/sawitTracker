import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sawittracker_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sawittracker_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar - Fixed Left */}
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
