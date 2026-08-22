import React from 'react';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';

export default function BannersView({
  activeTab,
  banners,
  editingBanner,
  setEditingBanner,
  newBanner,
  setNewBanner,
  showBannerForm,
  setShowBannerForm,
  handleAddBanner,
  uploading,
  handleImageUpload,
  handleDeleteBanner
}) {
  if (activeTab !== 'banners') return null;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center gap-4">
        <span className="text-xs uppercase font-bold tracking-wider text-stone-500">{banners.length} Active Banners</span>
        <button
          onClick={() => {
            if (editingBanner) {
              setEditingBanner(null);
              setNewBanner({ title: '', image: '', link: '' });
            }
            setShowBannerForm(!showBannerForm);
          }}
          className="bg-black hover:bg-[#8c6239] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
        >
          <FiPlus size={14} />
          {editingBanner ? "Cancel Edit" : (showBannerForm ? "Cancel" : "Add Banner")}
        </button>
      </div>

      {showBannerForm && (
        <form onSubmit={handleAddBanner} className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c6239]">
            {editingBanner ? "Edit Promotion Banner" : "Add Promotion Banner"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Banner Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Eid Special Discount 25% Off"
                value={newBanner.title}
                onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Redirection Link / Path (Optional)</label>
              <input
                type="text"
                placeholder="e.g. /category/top-selling"
                value={newBanner.link}
                onChange={e => setNewBanner({ ...newBanner, link: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Upload Banner Image * {uploading && "(Uploading...)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await handleImageUpload(file, 'banners');
                      if (url) setNewBanner({ ...newBanner, image: url });
                    }
                  }}
                  className="w-full text-xs text-stone-500 border border-stone-200 rounded p-1.5 bg-stone-50 cursor-pointer focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Or Public Image URL *</label>
                <input
                  type="text"
                  placeholder="e.g. /images/eid_special_banner.jpg"
                  value={newBanner.image}
                  onChange={e => setNewBanner({ ...newBanner, image: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="bg-[#8c6239] hover:bg-stone-900 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer">
            {editingBanner ? "Update Banner" : "Save Banner"}
          </button>
        </form>
      )}

      <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-x-auto">
        {banners.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <th className="p-4">Banner Preview</th>
                <th className="p-4">Title</th>
                <th className="p-4">Redirection URL</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="border-b border-stone-200 hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <img src={banner.image} className="w-32 h-14 object-cover rounded border border-stone-200 bg-stone-50" alt="" />
                  </td>
                  <td className="p-4 font-semibold text-stone-800">{banner.title}</td>
                  <td className="p-4 text-stone-500 font-mono">{banner.link || <span className="text-stone-300 italic">None</span>}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBanner(banner);
                          setNewBanner({
                            title: banner.title,
                            image: banner.image,
                            link: banner.link || ''
                          });
                          setShowBannerForm(true);
                        }}
                        className="p-2 text-stone-400 hover:text-[#8c6239] transition-colors cursor-pointer"
                        title="Edit Banner"
                      >
                        <FiEdit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 text-stone-400 hover:text-red-650 transition-colors cursor-pointer"
                        title="Delete Banner"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-stone-450 p-8 text-center font-light">No banners registered in database yet.</p>
        )}
      </div>
    </div>
  );
}
