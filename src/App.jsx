import React, { useState, useEffect } from 'react';
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiSettings,
  FiTrendingUp,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiFolder,
  FiEdit3,
  FiList,
  FiLock,
  FiImage
} from 'react-icons/fi';
import Editor from './components/Editor';
import { supabase } from './utils/supabase';

const getWhatsAppLink = (order) => {
  if (!order) return "#";
  const status = order.status;
  const amount = order.total_amount;
  const itemsStr = order.items?.map(i => i.product?.name || "Attar").join(", ");
  
  const orderDate = new Date(order.created_at);
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

  let text = "";
  if (status === "Placed" || status === "Processing") {
    text = `Hello ${order.customer_name},\n\nCongratulations! Your order for ${itemsStr} (Rs. ${amount}) has been successfully placed. Your approximate delivery date is ${formattedDeliveryDate}.\n\nThank you for shopping with Maaz Oud!`;
  } else if (status === "Shipped") {
    text = `Hello ${order.customer_name},\n\nGreat news! Your order for ${itemsStr} (Rs. ${amount}) has been successfully shipped. Your approximate delivery date is ${formattedDeliveryDate}.\n\nThank you for shopping with Maaz Oud!`;
  } else if (status === "Delivered") {
    text = `Hello ${order.customer_name},\n\nCongratulations! Your order for ${itemsStr} (Rs. ${amount}) has been successfully delivered. We hope you enjoy the fragrance!\n\nIf you loved our attars, we would be incredibly grateful if you could take a moment to leave a review on our website. Your feedback means the world to us!\n\nThank you for shopping with Maaz Oud!`;
  } else {
    text = `Hello ${order.customer_name},\n\nYour order for ${itemsStr} is currently marked as ${status}.`;
  }

  let phone = order.phone.replace(/[^0-9]/g, '');
  if (phone.length === 10) {
    phone = '91' + phone;
  }
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

// Authorized Admin Email address
const ADMIN_EMAIL = 'maazforlap@gmail.com';
const COMBO_PRODUCT_MARKER = '<!-- product-type:combo -->';
const isComboProduct = (product) => String(product?.description || '').includes(COMBO_PRODUCT_MARKER);
const cleanProductDescription = (description = '') => String(description || '').replace(COMBO_PRODUCT_MARKER, '').trim();
const extractComboItems = (description = '') => {
  const text = String(description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const match = text.match(/Combo includes:\s*(.+)/i);
  if (!match) return ['', '', ''];
  return match[1].split(',').map((item) => item.trim()).slice(0, 3).concat(['', '', '']).slice(0, 3);
};
const withProductTypeMarker = (description = '', productType = 'regular') => {
  const cleanDescription = cleanProductDescription(description || '<p>Premium pure attar formulation.</p>');
  return productType === 'combo' ? `${COMBO_PRODUCT_MARKER}${cleanDescription}` : cleanDescription;
};
const buildProductDescription = (description = '', productType = 'regular', comboItems = []) => {
  const cleanDescription = cleanProductDescription(description || '<p>Premium pure attar formulation.</p>');
  if (productType !== 'combo') return cleanDescription;
  const normalizedItems = (comboItems || []).filter(Boolean);
  const comboText = normalizedItems.length > 0 ? normalizedItems.join(', ') : '3 unique attars';
  const comboHtml = `<p><strong>Combo includes:</strong> ${comboText}</p>`;
  const body = `${cleanDescription}${cleanDescription ? ' ' : ''}${comboHtml}`.trim();
  return `${COMBO_PRODUCT_MARKER}${body}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginStep, setLoginStep] = useState('email'); // 'email' or 'otp'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Real-time Database state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Editing state hooks
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  // Forms state
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: [],
    image: '',
    images: [],
    productType: 'regular',
    comboOrigPrice: '',
    comboOrigPrice: '',
    comboPrice: '',
    comboItems: ['', '', ''],
    price3mlOrig: '',
    price3mlOffer: '',
    price6mlOrig: '',
    price6mlOffer: '',
    description: ''
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    image: '',
    description: ''
  });

  const [newBanner, setNewBanner] = useState({
    title: '',
    image: '',
    link: ''
  });

  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: '',
    image: '',
    content: ''
  });
  const [blogFaqs, setBlogFaqs] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);

  // Check Auth Session on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (session.user.email === ADMIN_EMAIL) {
          setUser(session.user);
        } else {
          supabase.auth.signOut();
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.email === ADMIN_EMAIL) {
          setUser(session.user);
        } else {
          setAuthError(`Access Denied: ${session.user.email} is not authorized.`);
          supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all tables data once admin user is authenticated
  useEffect(() => {
    if (user) {
      loadAllDbData();
    }
  }, [user]);

  const loadAllDbData = async () => {
    setDbLoading(true);
    await Promise.all([
      fetchCategories(),
      fetchProducts(),
      fetchOrders(),
      fetchBanners(),
      fetchBlogs()
    ]);
    setDbLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error categories fetch:", error.message);
    else if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error products fetch:", error.message);
    else if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error orders fetch:", error.message);
    else if (data) {
      setOrders(data);
    }
  };

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error banners fetch:", error.message);
    else if (data) setBanners(data);
  };

  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error blogs fetch:", error.message);
    else if (data) setBlogs(data);
  };

  // Auth Handlers
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (loginEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      setAuthError(`Unauthorized: Only ${ADMIN_EMAIL} can access this admin panel.`);
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      setAuthSuccessMsg(`Verification code sent to ${loginEmail}`);
      setLoginStep('otp');
    } catch (err) {
      setAuthError(err.message || "Failed to send OTP code.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: loginEmail.trim().toLowerCase(),
        token: loginOtp.trim(),
        type: 'email'
      });
      if (error) throw error;

      if (data.user?.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        throw new Error("Access Denied: Unauthorized email.");
      }

      setLoginEmail('');
      setLoginOtp('');
      setLoginStep('email');
    } catch (err) {
      setAuthError(err.message || "Invalid OTP code.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCategories([]);
    setProducts([]);
    setOrders([]);
    setBanners([]);
  };

  // Canvas-based Client-side Image Compression (max 1200px width/height, 80% JPEG quality)
  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Image Upload helper
  const handleImageUpload = async (file, type) => {
    if (!file) return null;

    setUploading(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        try {
          fileToUpload = await compressImage(file);
        } catch (compressErr) {
          console.error("Image compression failed, uploading original:", compressErr);
        }
      }

      const originalName = file.name || "image";
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const fileExt = lastDotIndex !== -1 ? originalName.substring(lastDotIndex + 1) : 'jpg';

      // Sanitize filename for Google Image SEO (alphanumeric and hyphens only)
      const sanitizedBase = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const randomSuffix = Math.floor(1 + Math.random() * 9);
      const fileName = `${sanitizedBase}-${randomSuffix}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('maazoud')
        .upload(filePath, fileToUpload);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('maazoud')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      alert("Error uploading image: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (url) => {
    if (!url) return;
    try {
      // Extract path after the bucket name 'maazoud'
      const match = url.match(/\/maazoud\/(.+)$/);
      if (match && match[1]) {
        const pathToRemove = match[1];
        const { error } = await supabase.storage.from('maazoud').remove([pathToRemove]);
        if (error) console.error("Error deleting image from bucket:", error);
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  // Handler: Add or Edit Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update({
          name: newCategory.name,
          image: newCategory.image || "/images/placeholder.jpg",
          description: newCategory.description
        })
        .eq('id', editingCategory.id);

      if (error) {
        alert("Error updating category: " + error.message);
        return;
      }
      setEditingCategory(null);
    } else {
      const id = newCategory.name.toLowerCase().replace(/\s+/g, '-');
      const categoryToAdd = {
        id,
        slug: id,
        name: newCategory.name,
        image: newCategory.image || "/images/placeholder.jpg",
        description: newCategory.description
      };

      const { error } = await supabase.from('categories').insert([categoryToAdd]);
      if (error) {
        alert("Error writing category: " + error.message);
        return;
      }
    }

    setNewCategory({ name: '', image: '', description: '' });
    setShowCategoryForm(false);
    fetchCategories();
  };

  // Handler: Add or Edit Product (Dynamic Images Carousel support)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name) return;

    const productType = newProduct.productType === 'combo' ? 'combo' : 'regular';
    const comboPrice = Number(newProduct.comboPrice || 0);
    const comboOrigPrice = Number(newProduct.comboOrigPrice || newProduct.comboPrice || 0);

    if (productType === 'combo') {
      if (!comboPrice) return;
    } else if (!newProduct.price3mlOffer || !newProduct.price6mlOffer) {
      return;
    }

    // Set fallback list if images list is empty
    const galleryImages = newProduct.images && newProduct.images.length > 0
      ? newProduct.images
      : [newProduct.image || "/images/placeholder.jpg"];

    const mainThumbnail = galleryImages[0];
    const description = buildProductDescription(newProduct.description, productType, newProduct.comboItems);
    const price3mlOrigValue = productType === 'combo'
      ? comboOrigPrice
      : Number(newProduct.price3mlOrig || newProduct.price3mlOffer || 0);
    const price3mlOfferValue = productType === 'combo'
      ? comboPrice
      : Number(newProduct.price3mlOffer || 0);
    const price6mlOrigValue = productType === 'combo'
      ? comboOrigPrice
      : Number(newProduct.price6mlOrig || newProduct.price6mlOffer || 0);
    const price6mlOfferValue = productType === 'combo'
      ? comboPrice
      : Number(newProduct.price6mlOffer || 0);

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          name: newProduct.name,
          category: newProduct.category || null,
          image: mainThumbnail,
          images: galleryImages,
          price3mlorig: price3mlOrigValue,
          price3mloffer: price3mlOfferValue,
          price6mlorig: price6mlOrigValue,
          price6mloffer: price6mlOfferValue,
          description: description || "<p>Premium pure attar formulation.</p>"
        })
        .eq('id', editingProduct.id);

      if (error) {
        alert("Error updating product: " + error.message);
        return;
      }
      setEditingProduct(null);
    } else {
      const id = newProduct.name.toLowerCase().replace(/\s+/g, '-');
      const productToAdd = {
        id,
        name: newProduct.name,
        category: newProduct.category || null,
        image: mainThumbnail,
        images: galleryImages,
        price3mlorig: price3mlOrigValue,
        price3mloffer: price3mlOfferValue,
        price6mlorig: price6mlOrigValue,
        price6mloffer: price6mlOfferValue,
        description: description || "<p>Premium pure attar formulation.</p>"
      };

      const { error } = await supabase.from('products').insert([productToAdd]);
      if (error) {
        alert("Error writing product: " + error.message);
        return;
      }
    }

    setNewProduct({
      name: '',
      category: [],
      image: '',
      images: [],
      productType: 'regular',
      comboOrigPrice: '',
    comboOrigPrice: '',
    comboPrice: '',
      comboItems: ['', '', ''],
      price3mlOrig: '',
      price3mlOffer: '',
      price6mlOrig: '',
      price6mlOffer: '',
      description: ''
    });
    setShowProductForm(false);
    fetchProducts();
  };

  // Handler: Add or Edit Banner
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.image) return;

    const bannerData = {
      title: newBanner.title,
      image: newBanner.image,
      link: newBanner.link || null
    };

    if (editingBanner) {
      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', editingBanner.id);

      if (error) {
        alert("Error updating banner: " + error.message);
        return;
      }
      setEditingBanner(null);
    } else {
      const { error } = await supabase.from('banners').insert([bannerData]);
      if (error) {
        alert("Error writing banner: " + error.message);
        return;
      }
    }

    setNewBanner({ title: '', image: '', link: '' });
    setShowBannerForm(false);
    fetchBanners();
  };

  // Delete handlers
  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert("Error deleting product: " + error.message);
      return;
    }
    fetchProducts();
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      alert("Error deleting category: " + error.message);
      return;
    }
    if (selectedCategoryDetails?.id === id) {
      setSelectedCategoryDetails(null);
    }
    fetchCategories();
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) {
      alert("Error deleting banner: " + error.message);
      return;
    }
    fetchBanners();
  };

  const handleAddBlog = async (e) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.content || !newBlog.image) return;

    // Generate slug
    const slug = newBlog.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const blogData = {
      title: newBlog.title,
      image: newBlog.image,
      content: newBlog.content,
      slug: slug,
      faqs: blogFaqs
    };

    if (editingBlog) {
      const { error } = await supabase
        .from('blogs')
        .update(blogData)
        .eq('id', editingBlog.id);

      if (error) {
        alert("Error updating blog: " + error.message);
        return;
      }
      setEditingBlog(null);
    } else {
      const { error } = await supabase.from('blogs').insert([blogData]);
      if (error) {
        alert("Error writing blog: " + error.message);
        return;
      }
    }

    setNewBlog({ title: '', image: '', content: '' });
    setBlogFaqs([]);
    setShowBlogForm(false);
    fetchBlogs();
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) {
      alert("Error deleting blog: " + error.message);
      return;
    }
    fetchBlogs();
  };

  // Toggle products inside Category detail modal
  const handleToggleProductCategory = async (productId, categoryId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    let currentCategories = Array.isArray(prod.category) ? prod.category : (prod.category ? [prod.category] : []);
    let newCategoryVal;
    if (currentCategories.includes(categoryId)) {
      newCategoryVal = currentCategories.filter(c => c !== categoryId);
    } else {
      newCategoryVal = [...currentCategories, categoryId];
    }

    const { error } = await supabase
      .from('products')
      .update({ category: newCategoryVal })
      .eq('id', productId);

    if (error) {
      alert("Error updating product category link: " + error.message);
      return;
    }
    fetchProducts();
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Error updating status: " + error.message);
      return false;
    }
    await fetchOrders();
    return true;
  };

  const requestOrderStatusUpdate = (order, newStatus) => {
    setPendingStatusUpdate({ order, newStatus });
  };

  const confirmOrderStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;

    const { order, newStatus } = pendingStatusUpdate;
    const updated = await handleUpdateOrderStatus(order.id, newStatus);
    if (updated) {
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      setPendingStatusUpdate(null);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'Delivered' ? (o.total_amount || 0) : 0), 0);
  const getOrderStatus = (order) => order.status || 'Processing';
  const orderStatusCounts = orders.reduce((counts, order) => {
    const status = getOrderStatus(order);
    if (counts[status] !== undefined) counts[status] += 1;
    counts.All += 1;
    return counts;
  }, { All: 0, Processing: 0, Shipped: 0, Delivered: 0 });
  const orderStatusFilters = ['All', 'Processing', 'Shipped', 'Delivered'];

  const filteredOrders = orders.filter(order => {
    const query = orderSearchQuery.toLowerCase().trim();
    const matchesSearch = order.id.toLowerCase().includes(query);
    const matchesStatus = orderStatusFilter === 'All' || getOrderStatus(order) === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading && !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-[#8c6239] rounded-full animate-spin"></div>
          <span className="text-xs text-stone-400 uppercase tracking-widest">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-100 p-4 relative font-sans">
        <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-sm z-0" />

        <div className="relative bg-white rounded-lg max-w-sm w-full shadow-2xl border border-stone-200 p-8 space-y-6 z-10">
          <div className="text-center space-y-2">
            <span className="text-2xl font-bold tracking-[0.25em] text-stone-950 block">MAAZ OUD</span>
            <span className="text-[9px] tracking-[0.4em] text-[#8c6239] uppercase font-bold block">Admin Dashboard</span>

            <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto text-[#8c6239] shadow-sm mt-4">
              <FiLock size={20} />
            </div>
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest pt-2">
              Authentication Required
            </h2>
            <p className="text-[10px] text-stone-455 font-light leading-normal">
              Only authorized administrators can log in to update catalog and manage order records.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-[10px] rounded text-center leading-normal">
              {authError}
            </div>
          )}
          {authSuccessMsg && (
            <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-[10px] rounded text-center leading-normal">
              {authSuccessMsg}
            </div>
          )}

          {loginStep === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter administrator email..."
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded py-2.5 px-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow cursor-pointer"
              >
                Send Verification Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={loginOtp}
                  onChange={e => setLoginOtp(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded py-2.5 px-3 text-center tracking-[0.5em] font-bold text-sm text-stone-900 placeholder-stone-305 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow cursor-pointer"
              >
                Verify & Access Dashboard
              </button>

              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('email');
                    setAuthError('');
                    setAuthSuccessMsg('');
                  }}
                  className="text-stone-400 hover:text-black transition-colors cursor-pointer"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[#8c6239] hover:text-[#5c3e21] transition-colors cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-2 border-t border-stone-100">
            <span className="text-[8px] text-stone-400 uppercase tracking-widest">Powered by Supabase Auth</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 overflow-hidden font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="p-6 border-b border-stone-950 flex flex-col items-center gap-1">
            <span className="text-xl font-bold tracking-[0.25em] text-white">MAAZ OUD</span>
            <span className="text-[8px] tracking-[0.4em] text-[#8c6239] uppercase">Control Panel</span>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: <FiGrid size={18} /> },
              { id: 'categories', name: 'Categories', icon: <FiFolder size={18} /> },
              { id: 'products', name: 'Products Catalog', icon: <FiShoppingBag size={18} /> },
              { id: 'orders', name: 'Orders Listing', icon: <FiPackage size={18} /> },
              { id: 'banners', name: 'Promotion Banners', icon: <FiImage size={18} /> },
              { id: 'blogs', name: 'Manage Blogs', icon: <FiList size={18} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === item.id
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
          <span>Admin: {user.email.split('@')[0]}</span>
          <button
            onClick={handleLogout}
            className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Logout"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider text-stone-900">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'categories' && 'Categories Management'}
              {activeTab === 'products' && 'Product Operations'}
              {activeTab === 'orders' && 'Recent Orders'}
              {activeTab === 'banners' && 'Promotion Banners'}
              {activeTab === 'blogs' && 'Blog Management'}
            </h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">Control and monitor your attar business</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#8c6239] text-white font-bold flex items-center justify-center text-xs shadow-sm">
              M
            </div>
            <span className="text-xs font-bold text-stone-700">{user.email}</span>
          </div>
        </header>

        {/* Loading Spinner */}
        {dbLoading ? (
          <div className="flex-grow flex items-center justify-center bg-stone-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-stone-300 border-t-[#8c6239] rounded-full animate-spin"></div>
              <span className="text-xs text-stone-400 uppercase tracking-widest">Loading Database...</span>
            </div>
          </div>
        ) : (
          <main className="flex-grow overflow-y-auto p-8">

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {[
                    { name: "Total Orders", value: orderStatusCounts.All, icon: <FiList className="text-[#8c6239]" size={24} />, desc: "All customer orders" },
                    { name: "Processing Orders", value: orderStatusCounts.Processing, icon: <FiClock className="text-amber-600" size={24} />, desc: "New orders to pack" },
                    { name: "Shipped Orders", value: orderStatusCounts.Shipped, icon: <FiPackage className="text-blue-600" size={24} />, desc: "Orders sent for delivery" },
                    { name: "Delivered Orders", value: orderStatusCounts.Delivered, icon: <FiCheckCircle className="text-green-600" size={24} />, desc: `Delivered revenue Rs. ${totalRevenue}` },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-stone-200 p-6 rounded-md shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{stat.name}</span>
                        {stat.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-stone-900">{stat.value}</h3>
                        <p className="text-[10px] text-stone-500 font-light mt-1">{stat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-stone-900 border-b border-stone-100 pb-3">Recent Orders Activity</h3>
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.slice(0, 4).map(order => (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="flex justify-between items-center gap-4 text-xs hover:bg-stone-50 p-2 rounded cursor-pointer transition-colors border border-transparent hover:border-stone-200"
                          >
                            <div>
                              <span className="font-bold text-stone-850 block">{order.customer_name}</span>
                              <div className="text-[10px] text-stone-400 font-light space-y-0.5 mt-0.5">
                                {order.items && order.items.map((item, idx) => (
                                  <div key={idx} className="truncate max-w-60">
                                    {item.product?.name || "Attar"} ({item.selectedSize || "3ml"}) x {item.quantity}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-stone-900 block">Rs. {order.total_amount}</span>
                              <span className={`inline-block text-[9px] uppercase font-bold tracking-wider mt-0.5 ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-amber-600'
                                }`}>{order.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-450 p-8 text-center font-light">No recent orders registered in database.</p>
                    )}
                  </div>

                  <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-[#8c6239] border-b border-stone-100 pb-3">Secure Supabase Session</h3>
                    <div className="text-xs text-stone-600 space-y-3 font-light leading-relaxed">
                      <p>Your session is authenticated under {user.email}.</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>**Role-Level Security (RLS)**: Row insertions and storage bucket uploads negotiate requests with JWT tokens.</li>
                        <li>**Storage Bucket Protection**: Only requests matching `auth.jwt() -&gt;&gt; 'email' = '{ADMIN_EMAIL}'` are permitted to execute write transactions.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-8">

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
                  <div className="xl:col-span-2 bg-white border border-stone-200 rounded-md shadow-sm overflow-hidden h-fit">
                    {categories.length > 0 ? (
                      <table className="w-full text-left text-xs border-collapse">
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
                          <p className="text-[11px] text-stone-455 font-light leading-relaxed mt-1">{selectedCategoryDetails.description}</p>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Sync Products</span>
                          <p className="text-[10px] text-stone-400 font-light block leading-normal">Check the products you want to show under this category:</p>

                          {products.length > 0 ? (
                            <div className="space-y-2 border border-stone-100 rounded p-3 bg-stone-50/50 max-h-[300px] overflow-y-auto">
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
            )}

            {/* TAB 3: PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6">

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
                              className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
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
                              className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
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

                <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-hidden">
                  {products.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                          <th className="p-4">Product Info</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">3ml Offer / Orig</th>
                          <th className="p-4">6ml Offer / Orig</th>
                          <th className="p-4">Rating Stats</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((prod) => (
                          <tr key={prod.id} className="border-b border-stone-200 hover:bg-stone-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-9 h-11 border border-stone-200 rounded overflow-hidden flex-shrink-0 bg-white">
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
                                      description: prod.description || ''
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
            )}

            {/* TAB 4: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-stone-500">
                    {filteredOrders.length} of {orders.length} Orders Shown
                  </span>

                  {/* Search Bar */}
                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="Search Order ID..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none placeholder-stone-400 pl-8"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-450 text-xs">
                      &#128269;
                    </span>
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-450 hover:text-stone-700 text-xs cursor-pointer"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {orderStatusFilters.map((status) => {
                    const active = orderStatusFilter === status;
                    const colorClass = status === 'Delivered'
                      ? 'text-green-700 border-green-200 bg-green-50'
                      : status === 'Shipped'
                        ? 'text-blue-700 border-blue-200 bg-blue-50'
                        : status === 'Processing'
                          ? 'text-amber-700 border-amber-200 bg-amber-50'
                          : 'text-stone-700 border-stone-200 bg-white';

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderStatusFilter(status)}
                        className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${active ? colorClass : 'bg-white border-stone-200 text-stone-450 hover:text-stone-800 hover:border-stone-300'
                          }`}
                      >
                        <span>{status}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] ${active ? 'bg-white/80' : 'bg-stone-100 text-stone-500'}`}>
                          {orderStatusCounts[status]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-hidden">
                  {filteredOrders.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Product Details</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Payment Method</th>
                          <th className="p-4">Total</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Update Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="border-b border-stone-200 hover:bg-stone-50/70 transition-colors cursor-pointer"
                          >
                            <td className="p-4 font-bold text-stone-900">{order.id}</td>
                            <td className="p-4">
                              <span className="font-bold text-stone-850 block">{order.customer_name}</span>
                              <span className="text-[10px] text-stone-450 font-mono block mt-0.5">{order.phone}</span>
                              <span className="text-[9px] text-stone-400 block max-w-xs truncate mt-0.5" title={order.address}>{order.address}</span>
                            </td>
                            <td className="p-4 space-y-2 max-w-xs">
                              {order.items && order.items.map((item, idx) => (
                                <div key={idx} className="border-b border-stone-100 last:border-b-0 pb-1 last:pb-0">
                                  <span className="font-semibold block text-stone-900">{item.product?.name || "Premium Scent"}</span>
                                  <span className="text-[10px] text-stone-400 font-light">
                                    Qty: {item.quantity} &bull; Size: {item.selectedSize || "3ml"} &bull; Rs. {item.price}
                                  </span>
                                </div>
                              ))}
                            </td>
                            <td className="p-4 text-stone-550">
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="p-4 text-stone-600 font-medium">{order.payment_method}</td>
                            <td className="p-4 font-bold text-stone-900">Rs. {order.total_amount}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${order.status === 'Delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'Shipped'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => requestOrderStatusUpdate(order, 'Shipped')}
                                  className="p-1.5 bg-stone-50 hover:bg-blue-50 text-blue-600 border border-stone-200 hover:border-blue-300 rounded transition-colors cursor-pointer"
                                  title="Mark as Shipped"
                                >
                                  <FiClock size={12} />
                                </button>
                                <button
                                  onClick={() => requestOrderStatusUpdate(order, 'Delivered')}
                                  className="p-1.5 bg-stone-50 hover:bg-green-50 text-green-600 border border-stone-200 hover:border-green-300 rounded transition-colors cursor-pointer"
                                  title="Mark as Delivered"
                                >
                                  <FiCheckCircle size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-stone-450 p-8 text-center font-light">No matching orders found.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: BANNERS */}
            {activeTab === 'banners' && (
              <div className="space-y-6">
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

                <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-hidden">
                  {banners.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
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
            )}

            {/* TAB 6: BLOGS */}
            {activeTab === 'blogs' && (
              <div className="space-y-6">
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
                        value={newBlog.content}
                        onChange={(html) => setNewBlog({ ...newBlog, content: html })}
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

                <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-hidden">
                  {blogs.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
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
            )}

          </main>
        )}
      </div>

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="relative bg-white rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden border border-stone-200">

            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-widest block">Order Detail Overview</span>
                <h2 className="text-sm font-bold text-stone-900 font-mono">
                  {selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Order Status</span>
                  <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full mt-1 ${selectedOrder.status === 'Delivered'
                      ? 'bg-green-100 text-green-800'
                      : selectedOrder.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Date & Time</span>
                  <span className="text-xs font-semibold text-stone-800 block mt-1">
                    {new Date(selectedOrder.created_at).toLocaleString("en-US", {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Customer & Shipping Information</h3>
                <div className="bg-stone-50 p-4 rounded border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-0.5">Name</span>
                    <span className="font-semibold text-stone-900 block">{selectedOrder.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-0.5">Phone Number</span>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${selectedOrder.phone}`} className="font-semibold text-[#8c6239] hover:underline">{selectedOrder.phone}</a>
                      <a 
                        href={getWhatsAppLink(selectedOrder)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded p-1 transition-colors"
                        title="Message on WhatsApp"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Shipping Address</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${selectedOrder.customer_name}\n${selectedOrder.phone}\n${selectedOrder.address}\n${selectedOrder.city}, ${selectedOrder.state} - ${selectedOrder.pincode}`);
                          alert("Shipping details copied to clipboard!");
                        }}
                        className="text-[9px] uppercase font-bold text-[#8c6239] hover:underline cursor-pointer"
                      >
                        Copy Address Details
                      </button>
                    </div>
                    <span className="text-stone-850 font-light block leading-relaxed bg-white border border-stone-150 p-2.5 rounded">
                      {selectedOrder.address}<br />
                      {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ordered Products Gallery List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Ordered Attars</h3>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4 p-3 bg-white hover:bg-stone-50/50 text-xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={item.product?.image || "/images/placeholder.jpg"}
                          alt=""
                          className="w-8 h-10 object-cover rounded border border-stone-200 bg-stone-50 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-stone-900 block truncate">{item.product?.name || "Attar Scent"}</span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">Size: {item.selectedSize || "3ml"} &bull; Price: Rs. {item.price}</span>
                        </div>
                      </div>
                      <div className="text-right pl-2 flex-shrink-0">
                        <span className="text-stone-500 block">Qty: {item.quantity}</span>
                        <span className="font-bold text-stone-900 block mt-0.5">Rs. {item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown & Payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Payment Information</span>
                  <div className="bg-stone-50 p-3 rounded border border-stone-200 font-light space-y-1.5 text-stone-750">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-bold text-stone-900">{selectedOrder.payment_method}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Billing Total</span>
                  <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1.5 text-stone-750">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-stone-900">Rs. {selectedOrder.total_amount - 50}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charges:</span>
                      <span className="font-semibold text-stone-900">Rs. 50</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-1.5 font-bold text-stone-900">
                      <span>Total Amount Paid:</span>
                      <span className="text-[#8c6239]">Rs. {selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center gap-3">
              <div className="flex gap-2">
                {selectedOrder.status !== 'Shipped' && selectedOrder.status !== 'Delivered' && (
                  <button
                    onClick={() => requestOrderStatusUpdate(selectedOrder, 'Shipped')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                  >
                    Mark Shipped
                  </button>
                )}
                {selectedOrder.status !== 'Delivered' && (
                  <button
                    onClick={() => requestOrderStatusUpdate(selectedOrder, 'Delivered')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {pendingStatusUpdate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-md border border-stone-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-stone-200 px-5 py-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8c6239]">Confirm Status Update</span>
              <h3 className="mt-1 text-base font-bold text-stone-900">
                Mark order as {pendingStatusUpdate.newStatus}?
              </h3>
            </div>

            <div className="space-y-3 px-5 py-4 text-xs text-stone-600">
              <p>
                This will update order <span className="font-bold text-stone-900">{pendingStatusUpdate.order.id}</span>
                {pendingStatusUpdate.order.customer_name ? (
                  <> for <span className="font-bold text-stone-900">{pendingStatusUpdate.order.customer_name}</span></>
                ) : null}.
              </p>
              <p className="rounded border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                Please confirm only after the order has actually reached this stage.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setPendingStatusUpdate(null)}
                className="rounded border border-stone-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOrderStatusUpdate}
                className={`rounded px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white cursor-pointer ${pendingStatusUpdate.newStatus === 'Delivered' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Confirm {pendingStatusUpdate.newStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
