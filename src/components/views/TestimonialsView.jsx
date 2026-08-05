import React from 'react';
import { FiPlus, FiStar } from 'react-icons/fi';

export default function TestimonialsView({
  activeTab,
  testimonials,
  editingTestimonial,
  setEditingTestimonial,
  newTestimonial,
  setNewTestimonial,
  showTestimonialForm,
  setShowTestimonialForm,
  handleAddTestimonial,
  handleDeleteTestimonial,
  uploading,
  handleImageUpload
}) {
  if (activeTab !== 'testimonials') return null;

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900">Testimonials</h2>
          <p className="text-xs text-stone-500 mt-1">Manage client testimonials</p>
        </div>
        <button
          onClick={() => {
            setEditingTestimonial(null);
            setNewTestimonial({ name: '', role: '', text: '', image: '' });
            setShowTestimonialForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#8c6239] text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#7a5531] transition-colors cursor-pointer"
        >
          <FiPlus size={12} /> Add Testimonial
        </button>
      </div>

      {showTestimonialForm && (
        <form onSubmit={handleAddTestimonial} className="bg-stone-50 p-6 rounded border border-stone-200 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-800">{editingTestimonial ? 'Edit' : 'Add'} Testimonial</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Name</label>
              <input
                type="text"
                required
                value={newTestimonial.name}
                onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#8c6239]"
                placeholder="Client Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Role/Title</label>
              <input
                type="text"
                value={newTestimonial.role}
                onChange={e => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#8c6239]"
                placeholder="e.g. Verified Buyer"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Review Text</label>
            <textarea
              required
              value={newTestimonial.text}
              onChange={e => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#8c6239]"
              rows="3"
              placeholder="Testimonial content..."
            ></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Client Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (e.target.files[0]) {
                  const url = await handleImageUpload(e.target.files[0], 'testimonials');
                  if (url) setNewTestimonial({ ...newTestimonial, image: url });
                }
              }}
              className="w-full text-xs"
            />
            {newTestimonial.image && <img src={newTestimonial.image} alt="Preview" className="h-16 mt-2 rounded object-cover" />}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowTestimonialForm(false)}
              className="px-4 py-2 bg-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-stone-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-[#8c6239] text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#7a5531] cursor-pointer"
            >
              {uploading ? '...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map(t => (
          <div key={t.id} className="bg-white border border-stone-200 rounded p-4 flex gap-4 items-start shadow-sm">
            {t.image ? (
              <img src={t.image} className="w-12 h-12 rounded-full object-cover border border-stone-200" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                <FiStar className="text-stone-400" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-sm font-bold text-stone-900">{t.name}</h4>
              <p className="text-[10px] text-[#8c6239] uppercase tracking-widest">{t.role}</p>
              <p className="text-xs text-stone-600 mt-2 italic line-clamp-3">"{t.text}"</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditingTestimonial(t);
                    setNewTestimonial({ name: t.name, role: t.role || '', text: t.text, image: t.image || '' });
                    setShowTestimonialForm(true);
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-[#8c6239] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTestimonial(t.id)}
                  className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
