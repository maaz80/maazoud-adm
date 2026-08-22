import React from 'react';
import { FiPlus, FiEdit3, FiTrash2, FiList } from 'react-icons/fi';

export default function CategoriesView({
  activeTab,
  categories,
  showCategoryForm,
  setShowCategoryForm,
  editingCategory,
  setEditingCategory,
  newCategory,
  setNewCategory,
  uploading,
  handleImageUpload,
  handleAddCategory,
  products,
  setSelectedCategoryDetails,
  handleDeleteCategory,
  selectedCategoryDetails,
  handleToggleProductCategory
}) {
  if (activeTab !== 'categories') return null;

  return (
    <div className="space-y-8 font-sans">

      <div className="flex justify-between items-center gap-4">
        <span className="text-xs uppercase font-bold tracking-wider text-stone-500">{categories.length} Categories Registered</span>
        <button
          onClick={() => {
            if (showCategoryForm) {
              setEditingCategory(null);
              setNewCategory({ name: '', image: '', description: '' });
            }
            setShowCategoryForm(!showCategoryForm);
          }}
          className="bg-black hover:bg-[#8c6239] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
        >
          <FiPlus size={14} />
          {showCategoryForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {showCategoryForm && (
        <form onSubmit={handleAddCategory} className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c6239]">
            {editingCategory ? "Edit Category" : "Create New Category"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Musk Collection"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Upload Image (Supabase Storage) {uploading && "(Uploading...)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await handleImageUpload(file, 'categories');
                      if (url) setNewCategory({ ...newCategory, image: url });
                    }
                  }}
                  className="w-full text-xs text-stone-500 border border-stone-200 rounded p-1.5 bg-stone-50 cursor-pointer focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Or Image URL / Path</label>
                <input
                  type="text"
                  placeholder="e.g. /images/oud_bottle_gold.jpg"
                  value={newCategory.image}
                  onChange={e => setNewCategory({ ...newCategory, image: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Category Description</label>
              <textarea
                rows={3}
                placeholder="Brief summary of this attar collection..."
                value={newCategory.description}
                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
          </div>
          <button type="submit" className="bg-[#8c6239] hover:bg-stone-900 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer">
            {editingCategory ? "Update Category" : "Save Category"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white border border-stone-200 rounded-md shadow-sm overflow-x-auto h-fit">
          {categories.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Assigned Products</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const assignedProds = products.filter(p => Array.isArray(p.category) ? p.category.includes(cat.id) : p.category === cat.id);
                  return (
                    <tr key={cat.id} className="border-b border-stone-200 hover:bg-stone-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={cat.image} className="w-8 h-8 object-cover rounded border border-stone-200 bg-white" alt="" />
                          <div>
                            <span className="font-bold text-stone-900 block">{cat.name}</span>
                            <span className="text-[10px] text-stone-400 font-light block line-clamp-1">{cat.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-stone-500 font-mono">{cat.slug}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedCategoryDetails(cat)}
                          className="text-[#8c6239] font-bold hover:underline cursor-pointer"
                        >
                          {assignedProds.length} Products &rarr;
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCategory({ name: cat.name, image: cat.image, description: cat.description || '' });
                              setShowCategoryForm(true);
                            }}
                            className="p-2 text-stone-400 hover:text-[#8c6239] transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <FiEdit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-stone-450 p-8 text-center font-light">No category registers found. Click Add Category to create one.</p>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-6">
          {selectedCategoryDetails ? (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-widest block">Selected Category</span>
                <h3 className="text-sm font-bold text-stone-900">{selectedCategoryDetails.name}</h3>
                <p className="text-[11px] text-stone-400 font-light leading-relaxed mt-1">{selectedCategoryDetails.description}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Sync Products</span>
                <p className="text-[10px] text-stone-400 font-light block leading-normal">Check the products you want to show under this category:</p>

                {products.length > 0 ? (
                  <div className="space-y-2 border border-stone-100 rounded p-3 bg-stone-50/50 max-h-75 overflow-y-auto">
                    {products.map(prod => {
                      const isChecked = Array.isArray(prod.category)
                        ? prod.category.includes(selectedCategoryDetails.id)
                        : prod.category === selectedCategoryDetails.id;
                      return (
                        <label key={prod.id} className="flex items-center gap-2.5 text-xs text-stone-700 hover:text-stone-900 cursor-pointer py-1 border-b border-stone-100/50 last:border-b-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleProductCategory(prod.id, selectedCategoryDetails.id)}
                            className="accent-[#8c6239] cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold block truncate">{prod.name}</span>
                            {isChecked && <span className="text-[9px] text-[#8c6239] font-semibold block uppercase">Currently Linked</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400 italic">No products available to link.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-stone-400 gap-2 font-light">
              <FiList size={28} />
              <p className="text-xs uppercase tracking-wider">Select a category's product count to manage linkage sync</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
