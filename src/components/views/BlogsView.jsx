import React from 'react';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';
import Editor from '../Editor';

export default function BlogsView({
  activeTab,
  blogs,
  editingBlog,
  setEditingBlog,
  newBlog,
  setNewBlog,
  blogFaqs,
  setBlogFaqs,
  showBlogForm,
  setShowBlogForm,
  handleAddBlog,
  uploading,
  handleImageUpload,
  handleDeleteBlog
}) {
  if (activeTab !== 'blogs') return null;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center gap-4">
        <span className="text-xs uppercase font-bold tracking-wider text-stone-500">{blogs.length} Active Blogs</span>
        <button
          onClick={() => {
            if (editingBlog) {
              setEditingBlog(null);
              setNewBlog({ title: '', image: '', content: '' });
              setBlogFaqs([]);
            }
            setShowBlogForm(!showBlogForm);
          }}
          className="bg-black hover:bg-[#8c6239] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
        >
          <FiPlus size={14} />
          {editingBlog ? "Cancel Edit" : (showBlogForm ? "Cancel" : "Add Blog")}
        </button>
      </div>

      {showBlogForm && (
        <form onSubmit={handleAddBlog} className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c6239]">
            {editingBlog ? "Edit Blog Post" : "Add Blog Post"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Blog Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Benefits of Cambodian Oud Oil"
                value={newBlog.title}
                onChange={e => setNewBlog({ ...newBlog, title: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Upload Cover Image * {uploading && "(Uploading...)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const url = await handleImageUpload(file, 'blogs');
                      if (url) setNewBlog({ ...newBlog, image: url });
                    }
                  }}
                  className="w-full text-xs text-stone-500 border border-stone-200 rounded p-1.5 bg-stone-50 cursor-pointer focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Or Public Image URL *</label>
                <input
                  type="text"
                  placeholder="e.g. /images/blog_cover.jpg"
                  value={newBlog.image}
                  onChange={e => setNewBlog({ ...newBlog, image: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Blog Content *</label>
            <Editor
              value={typeof newBlog.content === 'string' ? newBlog.content : ''}
              onChange={(val) => {
                const text = typeof val === 'string' ? val : (val?.target?.value || '');
                setNewBlog({ ...newBlog, content: text });
              }}
            />
          </div>

          {/* Blog FAQs Section */}
          <div className="border-t border-stone-200 pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8c6239]">
              Blog Post FAQs (Dynamic)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-stone-50 p-4 rounded border border-stone-200">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Question</label>
                <input
                  type="text"
                  placeholder="e.g. Is Cambodia Oud safe for skin?"
                  id="faq-question-input"
                  className="w-full bg-white border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">Answer</label>
                <input
                  type="text"
                  placeholder="e.g. Yes, our attars are completely organic..."
                  id="faq-answer-input"
                  className="w-full bg-white border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const qInput = document.getElementById('faq-question-input');
                    const aInput = document.getElementById('faq-answer-input');
                    const q = qInput.value.trim();
                    const a = aInput.value.trim();
                    if (q && a) {
                      setBlogFaqs([...blogFaqs, { q, a }]);
                      qInput.value = '';
                      aInput.value = '';
                    } else {
                      alert('Both Question and Answer are required to add an FAQ item.');
                    }
                  }}
                  className="bg-stone-900 hover:bg-[#8c6239] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  Add FAQ Item
                </button>
              </div>
            </div>

            {blogFaqs.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Added FAQs ({blogFaqs.length})</span>
                <div className="space-y-2 border border-stone-200 rounded divide-y divide-stone-100 bg-white">
                  {blogFaqs.map((faq, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-start gap-4 text-xs">
                      <div className="space-y-1 grow">
                        <div className="font-semibold text-stone-800">Q: {faq.q}</div>
                        <div className="text-stone-500 font-light">A: {faq.a}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBlogFaqs(blogFaqs.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic font-light">No FAQs added to this blog post yet.</p>
            )}
          </div>

          <button type="submit" className="bg-[#8c6239] hover:bg-stone-900 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer">
            {editingBlog ? "Update Blog" : "Save Blog"}
          </button>
        </form>
      )}

      <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-x-auto">
        {blogs.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <th className="p-4">Cover Image</th>
                <th className="p-4">Title</th>
                <th className="p-4">Slug</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id} className="border-b border-stone-200 hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <img src={blog.image} className="w-24 h-14 object-cover rounded border border-stone-200 bg-stone-50" alt="" />
                  </td>
                  <td className="p-4 font-semibold text-stone-800">{blog.title}</td>
                  <td className="p-4 text-stone-500 font-mono">{blog.slug}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBlog(blog);
                          setNewBlog({
                            title: blog.title,
                            image: blog.image,
                            content: blog.content
                          });
                          setBlogFaqs(Array.isArray(blog.faqs) ? blog.faqs : []);
                          setShowBlogForm(true);
                        }}
                        className="p-2 text-stone-400 hover:text-[#8c6239] transition-colors cursor-pointer"
                        title="Edit Blog"
                      >
                        <FiEdit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="p-2 text-stone-400 hover:text-red-650 transition-colors cursor-pointer"
                        title="Delete Blog"
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
          <p className="text-xs text-stone-450 p-8 text-center font-light">No blogs registered in database yet.</p>
        )}
      </div>
    </div>
  );
}
