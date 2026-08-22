import React from 'react';
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiLogOut,
  FiFolder,
  FiList,
  FiImage,
  FiStar,
  FiX
} from 'react-icons/fi';

export default function Sidebar({ activeTab, setActiveTab, user, handleLogout, mobileMenuOpen, setMobileMenuOpen }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <FiGrid size={18} /> },
    { id: 'categories', name: 'Categories', icon: <FiFolder size={18} /> },
    { id: 'products', name: 'Products Catalog', icon: <FiShoppingBag size={18} /> },
    { id: 'orders', name: 'Orders Listing', icon: <FiPackage size={18} /> },
    { id: 'banners', name: 'Promotion Banners', icon: <FiImage size={18} /> },
    { id: 'blogs', name: 'Manage Blogs', icon: <FiList size={18} /> },
    { id: 'testimonials', name: 'Testimonials', icon: <FiStar size={18} /> },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  const sidebarInner = (
    <div className="flex flex-col justify-between h-full bg-black text-white">
      <div>
        <div className="p-6 border-b border-stone-900 flex items-center justify-between">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xl font-bold tracking-[0.25em] text-white">MAAZ OUD</span>
            <span className="text-[8px] tracking-[0.4em] text-[#8c6239] uppercase">Control Panel</span>
          </div>
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
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

      <div className="p-6 border-t border-stone-900 flex items-center justify-between text-xs text-stone-500">
        <span className="truncate pr-2">Admin: {user?.email?.split('@')[0]}</span>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
          title="Logout"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0">
        {sidebarInner}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
