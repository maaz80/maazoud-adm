import React from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header({ activeTab, user, mobileMenuOpen, setMobileMenuOpen }) {
  const titles = {
    dashboard: 'Dashboard Overview',
    categories: 'Categories Management',
    products: 'Product Operations',
    orders: 'Recent Orders',
    banners: 'Promotion Banners',
    blogs: 'Blog Management',
    testimonials: 'Testimonials'
  };

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-stone-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-3">
        {setMobileMenuOpen && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        )}
        <div>
          <h1 className="text-sm sm:text-lg font-bold uppercase tracking-wider text-stone-900">
            {titles[activeTab] || 'Admin Panel'}
          </h1>
          <p className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-widest mt-0.5 hidden xs:block">
            Control and monitor your attar business
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#8c6239] text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
          M
        </div>
        <span className="text-[11px] sm:text-xs font-bold text-stone-700 truncate max-w-[100px] sm:max-w-none">
          {user?.email}
        </span>
      </div>
    </header>
  );
}
