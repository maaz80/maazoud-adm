import React from 'react';

export default function Header({ activeTab, user }) {
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
    <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 shrink-0">
      <div>
        <h1 className="text-lg font-bold uppercase tracking-wider text-stone-900">
          {titles[activeTab] || 'Admin Panel'}
        </h1>
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">Control and monitor your attar business</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-[#8c6239] text-white font-bold flex items-center justify-center text-xs shadow-sm">
          M
        </div>
        <span className="text-xs font-bold text-stone-700">{user?.email}</span>
      </div>
    </header>
  );
}
