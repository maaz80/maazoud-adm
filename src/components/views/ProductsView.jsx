import React from 'react';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';
import Editor from 'react-simple-wysiwyg';
import { isComboProduct, extractComboItems, cleanProductDescription } from '../../utils/helpers';

export default function ProductsView({
  activeTab,
  products,
  showProductForm,
  setShowProductForm,
  editingProduct,
  setEditingProduct,
  newProduct,
  setNewProduct,
  handleAddProduct,
  categories,
  uploading,
  handleImageUpload,
  handleImageDelete,
  handleToggleStock,
  handleDeleteProduct
}) {
  if (activeTab !== 'products') return null;

  return (
    <div className="space-y-6 font-sans">

      <div className="flex justify-between items-center gap-4">
        <span className="text-xs uppercase font-bold tracking-wider text-stone-500">{products.length} Products Cataloged</span>
        <button
          onClick={() => {
            if (showProductForm) {
              setEditingProduct(null);
              setNewProduct({
                name: '',
                category: [],
                image: '',
                images: [],
                productType: 'regular',
                comboOrigPrice: '',
                comboPrice: '',
                comboItems: ['', '', ''],
                price3mlOrig: '',
                price3mlOffer: '',
                price6mlOrig: '',
                price6mlOffer: '',
                description: ''
              });
            }
            setShowProductForm(!showProductForm);
          }}
          className="bg-black hover:bg-[#8c6239] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
        >
          <FiPlus size={14} />
          {showProductForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showProductForm && (
        <form onSubmit={handleAddProduct} className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-6 max-w-4xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c6239] border-b border-stone-100 pb-2">
            {editingProduct ? "Edit Attar Product" : "Create New Attar Product"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kashmiri Kasturi Musk Imperial"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Product Type</label>
              <select
                value={newProduct.productType}
                onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              >
                <option value="regular">Regular Attar</option>
                <option value="combo">Combo Product</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Categories (Select all that apply)</label>
              <div className="flex flex-wrap gap-3 p-3 bg-stone-50 border border-stone-200 rounded">
                {categories.map(c => {
                  const isChecked = Array.isArray(newProduct.category)
                    ? newProduct.category.includes(c.id)
                    : newProduct.category === c.id;
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer bg-white px-3 py-1.5 rounded border border-stone-250 hover:border-[#8c6239] transition-all">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let current = Array.isArray(newProduct.category)
                            ? [...newProduct.category]
                            : (newProduct.category ? [newProduct.category] : []);
                          if (e.target.checked) {
                            if (!current.includes(c.id)) {
                              current.push(c.id);
                            }
                          } else {
                            current = current.filter(id => id !== c.id);
                          }
                          setNewProduct({ ...newProduct, category: current });
                        }}
                        className="accent-[#8c6239] cursor-pointer"
                      />
                      <span>{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* MULTIPLE IMAGES GALLERY CAROUSEL MANAGER */}
            <div className="md:col-span-3 space-y-3 pt-2">
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                Product Image Gallery (First image acts as main thumbnail, rest are carousel slides)
              </label>

              {newProduct.images && newProduct.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 bg-stone-50 rounded border border-stone-200">
                  {newProduct.images.map((url, idx) => (
                    <div key={idx} className="relative aspect-4/5 rounded border border-stone-200 bg-white overflow-hidden group">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => {
                          handleImageDelete(url);
                          const updated = [...newProduct.images];
                          updated.splice(idx, 1);
                          setNewProduct({ ...newProduct, images: updated });
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-[9px] hover:bg-red-750 shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Image"
                      >
                        &times;
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] uppercase tracking-wider font-bold py-0.5 text-center">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Upload Gallery Image {uploading && "(Uploading...)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'products');
                        if (url) {
                          const currentImages = newProduct.images || [];
                          setNewProduct({ ...newProduct, images: [...currentImages, url] });
                        }
                      }
                    }}
                    className="w-full text-xs text-stone-500 border border-stone-200 rounded p-1.5 bg-stone-50 cursor-pointer focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Or Paste Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="admin-gallery-url"
                      placeholder="e.g. /images/rose_bottle_angle.jpg"
                      className="flex-1 bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('admin-gallery-url');
                        if (input && input.value.trim()) {
                          const currentImages = newProduct.images || [];
                          setNewProduct({ ...newProduct, images: [...currentImages, input.value.trim()] });
                          input.value = '';
                        }
                      }}
                      className="bg-black hover:bg-[#8c6239] text-white px-4 text-xs font-bold uppercase rounded cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-stone-100 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Pricing details</span>
            {newProduct.productType === 'combo' ? (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Orig Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 700"
                    value={newProduct.comboOrigPrice}
                    onChange={e => setNewProduct({ ...newProduct, comboOrigPrice: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Combo Price * (Rs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 540"
                    value={newProduct.comboPrice}
                    onChange={e => setNewProduct({ ...newProduct, comboPrice: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Combo Includes</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {newProduct.comboItems.map((item, index) => (
                      <select
                        key={index}
                        value={item}
                        onChange={(e) => {
                          const updatedItems = [...newProduct.comboItems];
                          updatedItems[index] = e.target.value;
                          setNewProduct({ ...newProduct, comboItems: updatedItems });
                        }}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                      >
                        <option value="">Select Attar</option>
                        {products.filter(p => !isComboProduct(p)).map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                        {item && !products.some(p => p.name === item) && (
                          <option value={item}>{item}</option>
                        )}
                      </select>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">3ml Original Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={newProduct.price3mlOrig}
                    onChange={e => setNewProduct({ ...newProduct, price3mlOrig: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">3ml Offer Price * (Rs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120"
                    value={newProduct.price3mlOffer}
                    onChange={e => setNewProduct({ ...newProduct, price3mlOffer: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">6ml Original Price (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 270"
                    value={newProduct.price6mlOrig}
                    onChange={e => setNewProduct({ ...newProduct, price6mlOrig: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">6ml Offer Price * (Rs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 216"
                    value={newProduct.price6mlOffer}
                    onChange={e => setNewProduct({ ...newProduct, price6mlOffer: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-100 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
              Stock Availability Controls
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 border border-stone-200 rounded">
              <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer bg-white p-2.5 rounded border border-stone-200 hover:border-red-400">
                <input
                  type="checkbox"
                  checked={newProduct.isOutOfStock}
                  onChange={(e) => setNewProduct({ ...newProduct, isOutOfStock: e.target.checked })}
                  className="accent-red-600 cursor-pointer"
                />
                <span className={newProduct.isOutOfStock ? "text-red-600 font-bold" : ""}>
                  Entire Product Out of Stock
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer bg-white p-2.5 rounded border border-stone-200 hover:border-orange-400">
                <input
                  type="checkbox"
                  checked={newProduct.isOutOfStock3ml}
                  onChange={(e) => setNewProduct({ ...newProduct, isOutOfStock3ml: e.target.checked })}
                  className="accent-orange-600 cursor-pointer"
                />
                <span className={newProduct.isOutOfStock3ml ? "text-orange-600 font-bold" : ""}>
                  3ml Variant Out of Stock
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer bg-white p-2.5 rounded border border-stone-200 hover:border-amber-400">
                <input
                  type="checkbox"
                  checked={newProduct.isOutOfStock6ml}
                  onChange={(e) => setNewProduct({ ...newProduct, isOutOfStock6ml: e.target.checked })}
                  className="accent-amber-600 cursor-pointer"
                />
                <span className={newProduct.isOutOfStock6ml ? "text-amber-600 font-bold" : ""}>
                  6ml Variant Out of Stock
                </span>
              </label>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 space-y-1.5">
            <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">Product Rich Description *</label>
            <Editor
              value={newProduct.description}
              onChange={(html) => setNewProduct({ ...newProduct, description: html })}
            />
          </div>

          <button type="submit" className="bg-[#8c6239] hover:bg-stone-900 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer">
            {editingProduct ? "Update Product" : "Save Product"}
          </button>
        </form>
      )}

      <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-x-auto">
        {products.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <th className="p-4">Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">3ml Offer / Orig</th>
                <th className="p-4">6ml Offer / Orig</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4">Rating Stats</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} className="border-b border-stone-200 hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-11 border border-stone-200 rounded overflow-hidden shrink-0 bg-white">
                        <img src={prod.image} className="w-full h-full object-cover" alt="" />
                        {prod.images && prod.images.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-black/75 text-white font-mono text-[7px] px-1 font-bold">
                            +{prod.images.length}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 block">{prod.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono block">{prod.id}</span>
                        <span className="text-[9px] uppercase font-semibold text-[#8c6239] mt-0.5 block">
                          {isComboProduct(prod) ? 'Combo Product' : 'Regular Attar'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {Array.isArray(prod.category) && prod.category.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prod.category.map(catId => (
                          <span key={catId} className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[9px] rounded uppercase font-semibold border border-stone-200">
                            {catId}
                          </span>
                        ))}
                      </div>
                    ) : (!Array.isArray(prod.category) && prod.category) ? (
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] rounded uppercase font-semibold border border-stone-200">
                        {prod.category}
                      </span>
                    ) : (
                      <span className="text-red-500 text-[10px] font-bold uppercase italic">Unlinked</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-stone-900 block">Rs. {prod.price3mloffer}</span>
                    <span className="text-[10px] text-stone-400 line-through">Rs. {prod.price3mlorig}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-stone-900 block">Rs. {prod.price6mloffer}</span>
                    <span className="text-[10px] text-stone-400 line-through">Rs. {prod.price6mlorig}</span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 min-w-32">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(prod, 'overall')}
                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider block w-full text-center transition-all cursor-pointer ${
                          (prod.is_out_of_stock || prod.in_stock === false)
                            ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                        }`}
                        title="Click to toggle overall product stock"
                      >
                        {(prod.is_out_of_stock || prod.in_stock === false) ? "Full OOS ✖" : "Overall In Stock ✓"}
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod, '3ml')}
                          className={`flex-1 py-0.5 px-1 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                            (prod.is_out_of_stock_3ml || prod.in_stock_3ml === false || prod.is_out_of_stock || prod.in_stock === false)
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : "bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
                          }`}
                          title="Click to toggle 3ml stock"
                        >
                          3ml: {(prod.is_out_of_stock_3ml || prod.in_stock_3ml === false || prod.is_out_of_stock || prod.in_stock === false) ? "OOS" : "OK"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod, '6ml')}
                          className={`flex-1 py-0.5 px-1 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                            (prod.is_out_of_stock_6ml || prod.in_stock_6ml === false || prod.is_out_of_stock || prod.in_stock === false)
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
                          }`}
                          title="Click to toggle 6ml stock"
                        >
                          6ml: {(prod.is_out_of_stock_6ml || prod.in_stock_6ml === false || prod.is_out_of_stock || prod.in_stock === false) ? "OOS" : "OK"}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <span className="font-bold">{parseFloat(prod.rating || 5.0).toFixed(1)}</span>
                      <span className="text-stone-400">({prod.ratingcount || 0})</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(prod);
                          setNewProduct({
                            name: prod.name,
                            category: Array.isArray(prod.category) ? prod.category : (prod.category ? [prod.category] : []),
                            image: prod.image,
                            images: prod.images || [prod.image],
                            productType: isComboProduct(prod) ? 'combo' : 'regular',
                            comboOrigPrice: String(prod.price3mlorig || ''),
                            comboPrice: String(prod.price3mloffer || ''),
                            comboItems: extractComboItems(prod.description),
                            price3mlOrig: String(prod.price3mlorig || ''),
                            price3mlOffer: String(prod.price3mloffer || ''),
                            price6mlOrig: String(prod.price6mlorig || ''),
                            price6mlOffer: String(prod.price6mloffer || ''),
                            description: cleanProductDescription(prod.description || ''),
                            isOutOfStock: Boolean(prod.is_out_of_stock || prod.in_stock === false),
                            isOutOfStock3ml: Boolean(prod.is_out_of_stock_3ml || prod.in_stock_3ml === false),
                            isOutOfStock6ml: Boolean(prod.is_out_of_stock_6ml || prod.in_stock_6ml === false)
                          });
                          setShowProductForm(true);
                        }}
                        className="p-2 text-stone-400 hover:text-[#8c6239] transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <FiEdit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 text-stone-400 hover:text-red-650 transition-colors cursor-pointer"
                        title="Delete Product"
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
          <p className="text-xs text-stone-450 p-8 text-center font-light">No products registered in database. Click Add Product to create one.</p>
        )}
      </div>
    </div>
  );
}
