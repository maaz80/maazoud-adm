import React from 'react';
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiLogOut,
  FiFolder,
  FiList,
  FiImage,
  FiStar
} from 'react-icons/fi';

export default function Sidebar({ activeTab, setActiveTab, user, handleLogout }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <FiGrid size={18} /> },
    { id: 'categories', name: 'Categories', icon: <FiFolder size={18} /> },
    { id: 'products', name: 'Products Catalog', icon: <FiShoppingBag size={18} /> },
    { id: 'orders', name: 'Orders Listing', icon: <FiPackage size={18} /> },
    { id: 'banners', name: 'Promotion Banners', icon: <FiImage size={18} /> },
    { id: 'blogs', name: 'Manage Blogs', icon: <FiList size={18} /> },
    { id: 'testimonials', name: 'Testimonials', icon: <FiStar size={18} /> },
  ];

  return (
    <aside className="w-64 bg-black text-white flex flex-col justify-between shrink-0">
      <div>
        <div className="p-6 border-b border-stone-950 flex flex-col items-center gap-1">
          <span className="text-xl font-bold tracking-[0.25em] text-white">MAAZ OUD</span>
          <span className="text-[8px] tracking-[0.4em] text-[#8c6239] uppercase">Control Panel</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === item.id
                  ? "bg-[#8c6239] text-white"
                  : "text-stone-400 hover:bg-stone-900 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-stone-950 flex items-center justify-between text-xs text-stone-500">
        <span>Admin: {user?.email?.split('@')[0]}</span>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
          title="Logout"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
