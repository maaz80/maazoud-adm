import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './utils/supabase';
import {
  ADMIN_EMAIL,
  COMBO_PRODUCT_MARKER,
  API_BASE,
  isComboProduct,
  cleanProductDescription,
  extractComboItems,
  withProductTypeMarker,
  buildProductDescription,
  calculateOrderProfit,
  formatDeliveryEstimate
} from './utils/helpers';

// Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AuthScreen from './components/layout/AuthScreen';

import DashboardView from './components/views/DashboardView';
import CategoriesView from './components/views/CategoriesView';
import ProductsView from './components/views/ProductsView';
import OrdersView from './components/views/OrdersView';
import BannersView from './components/views/BannersView';
import BlogsView from './components/views/BlogsView';
import TestimonialsView from './components/views/TestimonialsView';

import OrderDetailsModal from './components/modals/OrderDetailsModal';
import ShiprocketModal from './components/modals/ShiprocketModal';
import SalesListModal from './components/modals/SalesListModal';
import ProfitListModal from './components/modals/ProfitListModal';
import DeliveredListModal from './components/modals/DeliveredListModal';
import FinancialModal from './components/modals/FinancialModal';
import ManualOrderModal from './components/modals/ManualOrderModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState('email');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Financial summary & modal states
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);

  // Lists modals
  const [showSalesListModal, setShowSalesListModal] = useState(false);
  const [showProfitListModal, setShowProfitListModal] = useState(false);
  const [showDeliveredListModal, setShowDeliveredListModal] = useState(false);
  const [deliveredDateFilter, setDeliveredDateFilter] = useState('all');
  const [deliveredSearchQuery, setDeliveredSearchQuery] = useState('');
  const [dashboardDeliveredFilter, setDashboardDeliveredFilter] = useState('yesterday');

  // Inline editing in profit breakdown modal
  const [inlineEditingCell, setInlineEditingCell] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState('');

  // Form & selection states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', image: '', description: '' });
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
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
    description: '',
    isOutOfStock: false,
    isOutOfStock3ml: false,
    isOutOfStock6ml: false
  });
  const [uploading, setUploading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderDeliveredSubFilter, setOrderDeliveredSubFilter] = useState('all');

  // Track WhatsApp message sent status per order and per status
  const [sentMessages, setSentMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('maaz_sent_messages');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const markMessageAsSent = (orderId, status) => {
    setSentMessages(prev => {
      const updated = {
        ...prev,
        [orderId]: {
          ...(prev[orderId] || {}),
          [status]: true
        }
      };
      localStorage.setItem('maaz_sent_messages', JSON.stringify(updated));
      return updated;
    });
  };

  // Shiprocket states
  const [showShiprocketModal, setShowShiprocketModal] = useState(false);
  const [shiprocketOrderId, setShiprocketOrderId] = useState('');
  const [shiprocketWeight, setShiprocketWeight] = useState('0.5');
  const [shiprocketLength, setShiprocketLength] = useState('10');
  const [shiprocketWidth, setShiprocketWidth] = useState('10');
  const [shiprocketHeight, setShiprocketHeight] = useState('10');
  const [shiprocketPickupDate, setShiprocketPickupDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [courierRates, setCourierRates] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [initializingShipment, setInitializingShipment] = useState(false);
  const [rateError, setRateError] = useState('');
  const [shipmentError, setShipmentError] = useState('');
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [generatingManifest, setGeneratingManifest] = useState(false);
  const [syncingShipment, setSyncingShipment] = useState(false);

  // Manual / Offline Order Creation states
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualSelectedProductId, setManualSelectedProductId] = useState('');
  const [manualSelectedSize, setManualSelectedSize] = useState('3ml');
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualSellingPrice, setManualSellingPrice] = useState('');
  const [manualBaseCost, setManualBaseCost] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('Cash (Offline)');
  const [manualStatus, setManualStatus] = useState('Delivered');
  const [manualDeliveryCharge, setManualDeliveryCharge] = useState('0');
  const [savingManualOrder, setSavingManualOrder] = useState(false);

  // Content forms
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [newBanner, setNewBanner] = useState({ title: '', image: '', link: '' });

  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({ title: '', image: '', content: '' });
  const [blogFaqs, setBlogFaqs] = useState([]);

  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', text: '', image: '' });

  useEffect(() => {
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (session.user.email === ADMIN_EMAIL) {
          setUser(session.user);
          fetchDatabaseData();
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setAuthError('Unauthorized email. Access restricted.');
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (session.user.email === ADMIN_EMAIL) {
          setUser(session.user);
          fetchDatabaseData();
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setAuthError('Unauthorized email. Access restricted.');
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (loginEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      setAuthError('Access Denied: Only administrator email is permitted.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail.trim(),
        options: { shouldCreateUser: false }
      });
      if (error) throw error;

      setLoginStep('otp');
      setAuthSuccessMsg(`Verification code sent to ${loginEmail}. Please check your inbox.`);
    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP. Ensure email is registered.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: loginEmail.trim(),
        token: loginOtp.trim(),
        type: 'email'
      });
      if (error) throw error;

      if (data?.session?.user) {
        setUser(data.session.user);
        fetchDatabaseData();
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired OTP code.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoginStep('email');
    setLoginOtp('');
  };

  const fetchDatabaseData = async () => {
    setDbLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchOrders(),
        fetchBanners(),
        fetchBlogs(),
        fetchTestimonials(),
        fetchFinancialSummary()
      ]);
    } catch (err) {
      console.error("Failed to load initial database content:", err);
    } finally {
      setDbLoading(false);
    }
  };

  const calculateLocalFinancialSummary = (allOrders = orders) => {
    const nonCancelled = (allOrders || []).filter(o => o.status !== 'Cancelled');

    const offlineOrders = nonCancelled.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return pm.includes('offline') || pm.includes('cash (offline)') || String(o.id || '').startsWith('ORD-OFFLINE');
    });
    const offlineSum = offlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const codDelivered = nonCancelled.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return (pm.includes('cod') || pm.includes('cash on delivery')) && o.status === 'Delivered';
    });
    const codDeliveredSum = codDelivered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const codShipped = nonCancelled.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return (pm.includes('cod') || pm.includes('cash on delivery')) && o.status === 'Shipped';
    });
    const codShippedSum = codShipped.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const codProcessing = nonCancelled.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return (pm.includes('cod') || pm.includes('cash on delivery')) && (o.status === 'Processing' || o.status === 'Placed');
    });
    const codProcessingSum = codProcessing.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const prepaidOrders = nonCancelled.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid');
    });
    const prepaidTotal = prepaidOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const prepaidDelivered = prepaidOrders.filter(o => o.status === 'Delivered');
    const prepaidDeliveredSum = prepaidDelivered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const prepaidShipped = prepaidOrders.filter(o => o.status === 'Shipped');
    const prepaidShippedSum = prepaidShipped.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const prepaidProcessing = prepaidOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Shipped');
    const prepaidProcessingSum = prepaidProcessing.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const fullCodFuture = codDeliveredSum + codShippedSum + codProcessingSum;

    return {
      shiprocket: {
        connected: false,
        wallet_balance: 0,
        upcoming_remittance_total: Number(codDeliveredSum.toFixed(2)),
        remittances_schedule: [],
        error: null
      },
      razorpay: {
        connected: false,
        total_captured: Number(prepaidTotal.toFixed(2)),
        total_settled: Number(prepaidTotal.toFixed(2)),
        unsettled_balance: 0,
        settlements_schedule: [],
        error: null
      },
      local_metrics: {
        offline_sales_total: Number(offlineSum.toFixed(2)),
        offline_orders_count: offlineOrders.length,
        cod_delivered_total: Number(codDeliveredSum.toFixed(2)),
        cod_delivered_count: codDelivered.length,
        cod_shipped_total: Number(codShippedSum.toFixed(2)),
        cod_shipped_count: codShipped.length,
        cod_processing_total: Number(codProcessingSum.toFixed(2)),
        cod_processing_count: codProcessing.length,
        cod_pipeline_total: Number(fullCodFuture.toFixed(2)),
        cod_future_total: Number(fullCodFuture.toFixed(2)),
        prepaid_delivered_total: Number(prepaidDeliveredSum.toFixed(2)),
        prepaid_delivered_count: prepaidDelivered.length,
        prepaid_shipped_total: Number(prepaidShippedSum.toFixed(2)),
        prepaid_shipped_count: prepaidShipped.length,
        prepaid_processing_total: Number(prepaidProcessingSum.toFixed(2)),
        prepaid_processing_count: prepaidProcessing.length,
        prepaid_pipeline_total: Number(prepaidTotal.toFixed(2)),
        cod_delivered_unremitted_estimate: Number(codDeliveredSum.toFixed(2)),
        prepaid_razorpay_total: Number(prepaidTotal.toFixed(2))
      },
      combined_summary: {
        offline_self_handover_total: Number(offlineSum.toFixed(2)),
        cod_delivered_pending: Number(codDeliveredSum.toFixed(2)),
        cod_shipped_in_transit: Number(codShippedSum.toFixed(2)),
        cod_processing_total: Number(codProcessingSum.toFixed(2)),
        cod_pipeline_total: Number(fullCodFuture.toFixed(2)),
        prepaid_unsettled_balance: 0,
        prepaid_shipped_in_transit: Number(prepaidShippedSum.toFixed(2)),
        prepaid_pipeline_total: Number(prepaidTotal.toFixed(2)),
        total_pending_bank_payout: Number(codDeliveredSum.toFixed(2)),
        total_already_received_in_bank: Number(prepaidTotal.toFixed(2))
      }
    };
  };

  const fetchFinancialSummary = async (currentOrders = orders) => {
    setLoadingFinancials(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/financial-summary`, { headers });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setFinancialSummary(data);
      } else {
        console.warn("Financial summary API route returned status:", res.status);
        setFinancialSummary(calculateLocalFinancialSummary(currentOrders));
      }
    } catch (err) {
      console.error("Error fetching financial summary:", err);
      setFinancialSummary(calculateLocalFinancialSummary(currentOrders));
    } finally {
      setLoadingFinancials(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) {
      setOrders(data);
      if (!financialSummary) {
        setFinancialSummary(calculateLocalFinancialSummary(data));
      }
    }
  };

  const fetchBanners = async () => {
    const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
    if (data) setBanners(data);
  };

  const fetchBlogs = async () => {
    const { data } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (data) setBlogs(data);
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (data) setTestimonials(data);
  };

  // Storage Upload Helper
  const handleImageUpload = async (file, folder = 'general') => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('oud_assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('oud_assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      alert("Image Upload Failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (url) => {
    if (!url || !url.includes('oud_assets')) return;
    try {
      const path = url.split('/oud_assets/')[1];
      if (path) {
        await supabase.storage.from('oud_assets').remove([path]);
      }
    } catch (err) {
      console.error("Failed to remove deleted image from bucket:", err);
    }
  };

  // Categories Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const slug = newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (editingCategory) {
      const { error } = await supabase.from('categories').update({
        name: newCategory.name,
        slug,
        image: newCategory.image,
        description: newCategory.description
      }).eq('id', editingCategory.id);

      if (!error) {
        setEditingCategory(null);
        setNewCategory({ name: '', image: '', description: '' });
        setShowCategoryForm(false);
        fetchCategories();
      } else {
        alert("Failed to update category: " + error.message);
      }
    } else {
      const { error } = await supabase.from('categories').insert([{
        id: slug,
        name: newCategory.name,
        slug,
        image: newCategory.image,
        description: newCategory.description
      }]);

      if (!error) {
        setNewCategory({ name: '', image: '', description: '' });
        setShowCategoryForm(false);
        fetchCategories();
      } else {
        alert("Failed to add category: " + error.message);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) fetchCategories();
      else alert("Error deleting: " + error.message);
    }
  };

  const handleToggleProductCategory = async (productId, categoryId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let currentCategories = [];
    if (Array.isArray(product.category)) {
      currentCategories = [...product.category];
    } else if (product.category) {
      currentCategories = [product.category];
    }

    if (currentCategories.includes(categoryId)) {
      currentCategories = currentCategories.filter(c => c !== categoryId);
    } else {
      currentCategories.push(categoryId);
    }

    const { error } = await supabase
      .from('products')
      .update({ category: currentCategories })
      .eq('id', productId);

    if (error) {
      alert("Failed to update product category: " + error.message);
    } else {
      fetchProducts();
    }
  };

  // Stock Control Handler
  const handleToggleStock = async (product, variantType = 'overall') => {
    let updatePayload = {};

    if (variantType === 'overall') {
      const nextVal = !(product.is_out_of_stock || product.in_stock === false);
      updatePayload = {
        is_out_of_stock: nextVal,
        in_stock: !nextVal
      };
    } else if (variantType === '3ml') {
      const nextVal = !(product.is_out_of_stock_3ml || product.in_stock_3ml === false);
      updatePayload = {
        is_out_of_stock_3ml: nextVal,
        in_stock_3ml: !nextVal
      };
    } else if (variantType === '6ml') {
      const nextVal = !(product.is_out_of_stock_6ml || product.in_stock_6ml === false);
      updatePayload = {
        is_out_of_stock_6ml: nextVal,
        in_stock_6ml: !nextVal
      };
    }

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product.id);

    if (error) {
      alert(`Failed to update stock for ${product.name}: ` + error.message);
    } else {
      fetchProducts();
    }
  };

  // Products Handlers
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const id = editingProduct ? editingProduct.id : newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const finalCategories = Array.isArray(newProduct.category) ? newProduct.category : (newProduct.category ? [newProduct.category] : []);
    const mainImg = (newProduct.images && newProduct.images.length > 0) ? newProduct.images[0] : (newProduct.image || "/images/placeholder.jpg");
    const formattedDesc = buildProductDescription(
      newProduct.description,
      newProduct.productType,
      newProduct.comboItems
    );

    const price3mlOffer = newProduct.productType === 'combo' ? Number(newProduct.comboPrice || 0) : Number(newProduct.price3mlOffer || 0);
    const price3mlOrig = newProduct.productType === 'combo' ? Number(newProduct.comboOrigPrice || price3mlOffer) : Number(newProduct.price3mlOrig || price3mlOffer);
    const price6mlOffer = newProduct.productType === 'combo' ? Number(newProduct.comboPrice || 0) : Number(newProduct.price6mlOffer || 0);
    const price6mlOrig = newProduct.productType === 'combo' ? Number(newProduct.comboOrigPrice || price6mlOffer) : Number(newProduct.price6mlOrig || price6mlOffer);

    const payload = {
      id,
      name: newProduct.name,
      category: finalCategories,
      image: mainImg,
      images: newProduct.images || [mainImg],
      price3mlorig: price3mlOrig,
      price3mloffer: price3mlOffer,
      price6mlorig: price6mlOrig,
      price6mloffer: price6mlOffer,
      description: formattedDesc,
      is_out_of_stock: Boolean(newProduct.isOutOfStock),
      in_stock: !Boolean(newProduct.isOutOfStock),
      is_out_of_stock_3ml: Boolean(newProduct.isOutOfStock3ml),
      in_stock_3ml: !Boolean(newProduct.isOutOfStock3ml),
      is_out_of_stock_6ml: Boolean(newProduct.isOutOfStock6ml),
      in_stock_6ml: !Boolean(newProduct.isOutOfStock6ml)
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (!error) {
        setEditingProduct(null);
        resetProductForm();
        setShowProductForm(false);
        fetchProducts();
      } else alert("Failed to update product: " + error.message);
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (!error) {
        resetProductForm();
        setShowProductForm(false);
        fetchProducts();
      } else alert("Failed to add product: " + error.message);
    }
  };

  const resetProductForm = () => {
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
      description: '',
      isOutOfStock: false,
      isOutOfStock3ml: false,
      isOutOfStock6ml: false
    });
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) fetchProducts();
      else alert("Error deleting product: " + error.message);
    }
  };

  // Orders Handlers
  const requestOrderStatusUpdate = (order, newStatus) => {
    if (!order || !newStatus) return;
    if (order.status === newStatus) return;
    setPendingStatusUpdate({ order, newStatus });
  };

  const confirmOrderStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;
    const { order, newStatus } = pendingStatusUpdate;

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) {
      fetchOrders();
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } else {
      alert("Error updating order status: " + error.message);
    }
    setPendingStatusUpdate(null);
  };

  const handleUpdateDeliveryDate = async (orderId, newDateStr) => {
    if (!orderId || !newDateStr) return;
    const dateObj = new Date(newDateStr);
    if (isNaN(dateObj.getTime())) {
      alert("Invalid date format. Please use YYYY-MM-DD");
      return;
    }

    const order = orders.find(o => o.id === orderId);
    const existingShipmentDetails = order?.shipment_details || {};
    const updatedDetails = {
      ...existingShipmentDetails,
      custom_delivery_date: dateObj.toISOString(),
      delivered_date: dateObj.toISOString()
    };

    const { error } = await supabase
      .from('orders')
      .update({ shipment_details: updatedDetails })
      .eq('id', orderId);

    if (error) {
      alert("Failed to update delivery date: " + error.message);
    } else {
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, shipment_details: updatedDetails }));
      }
    }
  };

  const handleUpdateDeliveryCharge = async (orderId, currentCharge) => {
    const input = prompt("Set actual courier shipping charge (Rs.):", currentCharge || 40);
    if (input === null) return;
    const charge = parseFloat(input);
    if (isNaN(charge) || charge < 0) {
      alert("Please enter a valid shipping charge amount.");
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ shiprocket_charge: charge })
      .eq('id', orderId);

    if (error) {
      alert("Failed to update delivery charge: " + error.message);
    } else {
      alert("Shipment delivery charge updated!");
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, shiprocket_charge: charge }));
      }
    }
  };

  // Inline editing handler for sellingPrice, baseCost, and deliveryCost inside Profit Breakdown Modal
  const handleSaveInlineEdit = async (orderId, field, value) => {
    setInlineEditingCell(null);
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    let payload = {};
    if (field === 'sellingPrice') payload = { total_amount: num };
    else if (field === 'baseCost') payload = { manual_base_cost: num };
    else if (field === 'deliveryCost') payload = { shiprocket_charge: num };

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) {
      alert(`Failed to update ${field}: ` + error.message);
    } else {
      await fetchOrders();
    }
  };

  // SHIPROCKET API CALLS & ACTIONS
  const handleFetchCourierRates = async () => {
    setRateError('');
    setFetchingRates(true);
    setCourierRates([]);
    setSelectedCourier(null);

    const targetOrder = orders.find(o => o.id === shiprocketOrderId);
    if (!targetOrder || !targetOrder.pincode) {
      setRateError("Target order not found or missing delivery pincode.");
      setFetchingRates(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const isCod = String(targetOrder?.payment_method || '').toLowerCase().includes('cod') || String(targetOrder?.payment_method || '').toLowerCase().includes('cash on delivery');

      const res = await fetch(`${API_BASE}/api/shipping-rates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'get_rates',
          order_id: targetOrder.id,
          delivery_pincode: targetOrder.pincode,
          is_cod: isCod,
          weight: shiprocketWeight,
          length: shiprocketLength,
          width: shiprocketWidth,
          height: shiprocketHeight,
          pickup_date: shiprocketPickupDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch courier rates from Shiprocket.');

      const couriers = data.couriers || data.available_courier_companies || [];
      if (couriers.length > 0) {
        setCourierRates(couriers);
        setSelectedCourier(couriers[0]); // Select cheapest by default
      } else {
        setRateError('No couriers available for this delivery pincode.');
      }
    } catch (err) {
      setRateError(err.message || 'Server error while fetching courier rates.');
    } finally {
      setFetchingRates(false);
    }
  };

  const handleInitializeShipment = async () => {
    if (!selectedCourier) return;
    setShipmentError('');
    setInitializingShipment(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/shipping-rates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create_shipment',
          order_id: shiprocketOrderId,
          courier_id: selectedCourier.courier_company_id,
          courier_rate: selectedCourier.rate,
          pickup_date: shiprocketPickupDate,
          weight: shiprocketWeight,
          length: shiprocketLength,
          width: shiprocketWidth,
          height: shiprocketHeight
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize Shiprocket shipment.');

      alert(`Shipment Initialized Successfully!\nAWB: ${data.shiprocket_awb}\nCourier: ${data.courier_name}\nCharge: Rs. ${data.rate || selectedCourier.rate}`);
      setShowShiprocketModal(false);
      await fetchOrders();

      if (selectedOrder && selectedOrder.id === shiprocketOrderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'Shipped',
          shiprocket_awb: data.shiprocket_awb,
          shiprocket_courier_name: data.courier_name,
          shiprocket_charge: data.rate || selectedCourier.rate,
          shiprocket_status: 'AWB Assigned'
        });
      }
    } catch (err) {
      setShipmentError(err.message || 'Failed to complete shipment booking.');
    } finally {
      setInitializingShipment(false);
    }
  };

  const handleDownloadLabel = async (order) => {
    if (!order) return;
    setGeneratingLabel(true);

    try {
      const shipmentId = order.shiprocket_shipment_id || order.shipment_details?.create_order_response?.response?.shipment_id;
      const awb = order.shiprocket_awb;

      if (!shipmentId && !awb) {
        alert("No Shiprocket shipment or AWB found for this order.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/shipping-rates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate_label', shipment_id: shipmentId, awb_code: awb })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate shipping label.');

      if (data.label_url) {
        window.open(data.label_url, '_blank');
      } else {
        alert("Label URL not returned by Shiprocket.");
      }
    } catch (err) {
      alert("Label Download Error: " + err.message);
    } finally {
      setGeneratingLabel(false);
    }
  };

  const handleDownloadManifest = async (order) => {
    if (!order) return;
    setGeneratingManifest(true);

    try {
      const shipmentId = order.shiprocket_shipment_id || order.shipment_details?.create_order_response?.response?.shipment_id;

      if (!shipmentId) {
        alert("No Shiprocket shipment ID found for this order.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/shipping-rates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate_manifest', shipment_id: shipmentId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate manifest.');

      if (data.manifest_url) {
        window.open(data.manifest_url, '_blank');
      } else {
        alert("Manifest URL not returned by Shiprocket.");
      }
    } catch (err) {
      alert("Manifest Download Error: " + err.message);
    } finally {
      setGeneratingManifest(false);
    }
  };

  const handleSyncShiprocketOrder = async (order) => {
    if (!order) return;
    setSyncingShipment(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/shipping-rates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'sync_shipment', order_id: order.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync with Shiprocket.');

      const updatedOrder = data.order || {};
      alert(`Shiprocket Sync Complete!\nStatus: ${updatedOrder.shiprocket_status || 'Synced'}\nAWB: ${updatedOrder.shiprocket_awb || 'Pending'}\nCourier: ${updatedOrder.shiprocket_courier_name || 'N/A'}`);
      await fetchOrders();

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder(prev => ({
          ...prev,
          ...updatedOrder
        }));
      }
    } catch (err) {
      alert("Shiprocket Sync Error: " + err.message);
    } finally {
      setSyncingShipment(false);
    }
  };

  // MANUAL / OFFLINE ORDER CREATION HANDLER
  const handleCreateManualOrder = async (e) => {
    e.preventDefault();
    if (!manualCustomerName || !manualSelectedProductId || !manualSellingPrice) {
      alert("Please fill in Customer Name, Product, and Selling Price.");
      return;
    }

    setSavingManualOrder(true);
    try {
      const chosenProd = products.find(p => p.id === manualSelectedProductId);
      const prodName = chosenProd ? chosenProd.name : 'Attar Scent';
      const prodImg = chosenProd ? chosenProd.image : '/images/placeholder.jpg';

      const manualOrderId = `ORD-OFFLINE-${Date.now().toString().slice(-6)}`;
      const sellPrice = parseFloat(manualSellingPrice) || 0;
      const baseCost = parseFloat(manualBaseCost) || (manualSelectedSize === '6ml' ? 156 : 100);
      const deliveryCharge = parseFloat(manualDeliveryCharge) || 0;

      const orderPayload = {
        id: manualOrderId,
        customer_name: manualCustomerName.trim(),
        phone: manualPhone.trim() || 'Direct In-Person Sale',
        address: 'Hand Delivered / Offline Store Handover',
        city: 'Bareilly',
        state: 'Uttar Pradesh',
        pincode: '243001',
        payment_method: manualPaymentMethod,
        total_amount: sellPrice,
        status: manualStatus,
        shiprocket_charge: deliveryCharge,
        shiprocket_courier_name: 'Self Handover (Offline)',
        manual_base_cost: baseCost,
        delivery_date: manualStatus === 'Delivered' ? new Date().toISOString() : null,
        items: [
          {
            product_id: manualSelectedProductId,
            selectedSize: manualSelectedSize,
            quantity: parseInt(manualQuantity) || 1,
            price: sellPrice,
            product: {
              id: manualSelectedProductId,
              name: prodName,
              image: prodImg
            }
          }
        ]
      };

      const { error } = await supabase.from('orders').insert([orderPayload]);
      if (error) throw error;

      alert(`Manual order ${manualOrderId} saved successfully!`);
      setShowManualOrderModal(false);

      setManualCustomerName('');
      setManualPhone('');
      setManualSelectedProductId('');
      setManualSellingPrice('');
      setManualBaseCost('');
      setManualDeliveryCharge('0');

      await fetchOrders();
      await fetchFinancialSummary();
    } catch (err) {
      alert("Failed to create manual order: " + err.message);
    } finally {
      setSavingManualOrder(false);
    }
  };

  // PDF Financial Report Download Handler
  const handleDownloadSalesProfitReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("MAAZ OUD - MASTER FINANCIAL & PROFITABILITY REPORT", 14, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()} | Administrator Ledger Record`, 14, 25);
      doc.line(14, 28, 196, 28);

      // Section 1: Executive Overview Cards
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("1. Master Financial & Bank Payout Summary", 14, 36);

      const overviewData = [
        ["Total Revenue (All Non-Cancelled Orders)", `Rs. ${calculatedSalesTotal}`],
        ["Total Courier Delivery Charges Paid", `Rs. ${calculatedDeliveryTotal}`],
        ["Total Net Profit Margin", `Rs. ${calculatedProfitTotal}`],
        ["Money Already Received in Bank (Prepaid Settled)", `Rs. ${financialSummary?.combined_summary?.total_already_received_in_bank || 0}`],
        ["Money Received in Cash (Self / Hand Delivered)", `Rs. ${financialSummary?.combined_summary?.offline_self_handover_total || 0}`],
        ["Total Received in Hand/Bank", `Rs. ${((financialSummary?.combined_summary?.total_already_received_in_bank || 0) + (financialSummary?.combined_summary?.offline_self_handover_total || 0)).toLocaleString('en-IN')}`],
        ["Immediate Bank Payout Due (Delivered COD + Unsettled)", `Rs. ${financialSummary?.combined_summary?.total_pending_bank_payout || 0}`],
        ["Total COD Pipeline Value (Shipped + Delivered)", `Rs. ${financialSummary?.combined_summary?.cod_pipeline_total || 0}`],
      ];

      autoTable(doc, {
        startY: 40,
        head: [['Financial Metric', 'Value (INR)']],
        body: overviewData,
        theme: 'striped',
        headStyles: { fillColor: [140, 98, 57], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
      });

      // Section 2: Order-by-Order Net Profit Breakdown Table
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 120;
      doc.text("2. Order-by-Order Profitability Ledger", 14, currentY);

      const tableRows = nonCancelledOrders.map(order => {
        const { baseCost, deliveryCost, hasDeliveryCost, sellingPrice, profit } = calculateOrderProfit(order, products);
        return [
          order.id,
          new Date(order.created_at).toLocaleDateString(),
          order.customer_name || 'N/A',
          String(order.payment_method || '').includes('Payment ID') ? 'Razorpay' : order.payment_method || 'COD',
          `Rs. ${sellingPrice}`,
          `Rs. ${baseCost}`,
          hasDeliveryCost ? `Rs. ${deliveryCost}` : 'Pending',
          hasDeliveryCost ? `Rs. ${profit}` : 'Pending'
        ];
      });

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Order ID', 'Date', 'Customer', 'Payment', 'Selling Price', 'Base Cost', 'Freight Cost', 'Net Profit']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
        columnStyles: {
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right', fontStyle: 'bold' }
        }
      });

      doc.save(`Maaz_Oud_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      alert("Failed to export PDF report: " + err.message);
    }
  };

  // PDF Delivered Orders Report Download Handler
  const handleDownloadDeliveredReport = (dateFilter = 'all') => {
    try {
      const filtered = filterDeliveredOrdersByDate(allDeliveredOrders, dateFilter);
      const totalRev = filtered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);

      const labelMap = {
        all: "ALL DELIVERED ORDERS",
        today: "TODAY'S DELIVERED ORDERS",
        yesterday: "YESTERDAY'S DELIVERED ORDERS",
        last7days: "LAST 7 DAYS DELIVERED ORDERS",
        thisMonth: "THIS MONTH DELIVERED ORDERS"
      };

      doc.text(`MAAZ OUD - ${labelMap[dateFilter] || 'DELIVERED ORDERS REPORT'}`, 14, 18);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()} | Filter: ${dateFilter.toUpperCase()} | Total Orders: ${filtered.length} | Revenue: Rs. ${totalRev.toFixed(2)}`, 14, 25);
      doc.line(14, 28, 196, 28);

      const tableRows = filtered.map(order => {
        const delDate = getOrderDeliveryDate(order);
        const itemsText = order.items ? order.items.map(i => `${i.product?.name || 'Attar'} (${i.selectedSize || '3ml'}) x${i.quantity}`).join(', ') : 'N/A';
        return [
          order.id,
          delDate.toLocaleDateString(),
          order.customer_name || 'N/A',
          order.phone || '',
          itemsText,
          String(order.payment_method || '').includes('Payment ID') ? 'Razorpay' : order.payment_method || 'COD',
          `Rs. ${order.total_amount}`
        ];
      });

      autoTable(doc, {
        startY: 32,
        head: [['Order ID', 'Delivery Date', 'Customer', 'Phone', 'Items', 'Payment', 'Amount']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
        columnStyles: {
          6: { halign: 'right', fontStyle: 'bold' }
        }
      });

      doc.save(`Maaz_Oud_Delivered_Orders_${dateFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      alert("Failed to export Delivered PDF report: " + err.message);
    }
  };

  // Content Handlers
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (editingBanner) {
      const { error } = await supabase.from('banners').update({
        title: newBanner.title,
        image: newBanner.image,
        link: newBanner.link
      }).eq('id', editingBanner.id);

      if (!error) {
        setEditingBanner(null);
        setNewBanner({ title: '', image: '', link: '' });
        setShowBannerForm(false);
        fetchBanners();
      } else alert("Error updating banner: " + error.message);
    } else {
      const { error } = await supabase.from('banners').insert([{
        title: newBanner.title,
        image: newBanner.image,
        link: newBanner.link
      }]);

      if (!error) {
        setNewBanner({ title: '', image: '', link: '' });
        setShowBannerForm(false);
        fetchBanners();
      } else alert("Error adding banner: " + error.message);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (confirm("Delete this promotion banner?")) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) fetchBanners();
      else alert("Error deleting: " + error.message);
    }
  };

  const handleAddBlog = async (e) => {
    e.preventDefault();
    const slug = newBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (editingBlog) {
      const { error } = await supabase.from('blogs').update({
        title: newBlog.title,
        slug,
        image: newBlog.image,
        content: newBlog.content,
        faqs: blogFaqs
      }).eq('id', editingBlog.id);

      if (!error) {
        setEditingBlog(null);
        setNewBlog({ title: '', image: '', content: '' });
        setBlogFaqs([]);
        setShowBlogForm(false);
        fetchBlogs();
      } else alert("Error updating blog: " + error.message);
    } else {
      const { error } = await supabase.from('blogs').insert([{
        title: newBlog.title,
        slug,
        image: newBlog.image,
        content: newBlog.content,
        faqs: blogFaqs
      }]);

      if (!error) {
        setNewBlog({ title: '', image: '', content: '' });
        setBlogFaqs([]);
        setShowBlogForm(false);
        fetchBlogs();
      } else alert("Error adding blog: " + error.message);
    }
  };

  const handleDeleteBlog = async (id) => {
    if (confirm("Delete this blog post?")) {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (!error) fetchBlogs();
      else alert("Error deleting: " + error.message);
    }
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    if (editingTestimonial) {
      const { error } = await supabase.from('testimonials').update({
        name: newTestimonial.name,
        role: newTestimonial.role,
        text: newTestimonial.text,
        image: newTestimonial.image
      }).eq('id', editingTestimonial.id);

      if (!error) {
        setEditingTestimonial(null);
        setNewTestimonial({ name: '', role: '', text: '', image: '' });
        setShowTestimonialForm(false);
        fetchTestimonials();
      } else alert("Error updating testimonial: " + error.message);
    } else {
      const { error } = await supabase.from('testimonials').insert([{
        name: newTestimonial.name,
        role: newTestimonial.role,
        text: newTestimonial.text,
        image: newTestimonial.image
      }]);

      if (!error) {
        setNewTestimonial({ name: '', role: '', text: '', image: '' });
        setShowTestimonialForm(false);
        fetchTestimonials();
      } else alert("Error adding testimonial: " + error.message);
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (confirm("Delete this testimonial?")) {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (!error) fetchTestimonials();
      else alert("Error deleting: " + error.message);
    }
  };

  // Helper getters
  const getOrderStatus = (order) => {
    const s = String(order?.status || '').toLowerCase();
    if (s === 'delivered') return 'Delivered';
    if (s === 'shipped') return 'Shipped';
    if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
    return 'Processing';
  };

  const getOrderDeliveryDate = (order) => {
    if (order?.delivery_date) {
      return new Date(order.delivery_date);
    }
    const sd = order?.shipment_details;
    if (Array.isArray(sd)) {
      for (let i = sd.length - 1; i >= 0; i--) {
        const item = sd[i];
        if (item?.custom_delivery_date) return new Date(item.custom_delivery_date);
        if (item?.last_webhook_payload?.delivered_date) return new Date(item.last_webhook_payload.delivered_date);
        if (item?.delivered_date) return new Date(item.delivered_date);
        if (item?.shipment_track?.[0]?.delivered_date) return new Date(item.shipment_track[0].delivered_date);
        if (item?.tracking_data?.shipment_track?.[0]?.delivered_date) return new Date(item.tracking_data.shipment_track[0].delivered_date);
      }
    } else if (sd && typeof sd === 'object') {
      if (sd.custom_delivery_date) return new Date(sd.custom_delivery_date);
      if (sd.last_webhook_payload?.delivered_date) return new Date(sd.last_webhook_payload.delivered_date);
      if (sd.delivered_date) return new Date(sd.delivered_date);
      if (sd.shipment_track?.[0]?.delivered_date) return new Date(sd.shipment_track[0].delivered_date);
      if (sd.tracking_data?.shipment_track?.[0]?.delivered_date) return new Date(sd.tracking_data.shipment_track[0].delivered_date);
    }
    return new Date(order?.created_at || Date.now());
  };

  const filterDeliveredOrdersByDate = (allDeliveredList, filterType) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return allDeliveredList.filter(order => {
      const delDate = getOrderDeliveryDate(order);
      if (filterType === 'today') {
        return delDate >= todayStart;
      } else if (filterType === 'yesterday') {
        return delDate >= yesterdayStart && delDate < todayStart;
      } else if (filterType === 'last7days') {
        return delDate >= last7DaysStart;
      } else if (filterType === 'thisMonth') {
        return delDate >= thisMonthStart;
      }
      return true; // 'all'
    });
  };

  // Financial & Order calculations
  const nonCancelledOrders = orders.filter(o => getOrderStatus(o) !== 'Cancelled');
  const allDeliveredOrders = orders.filter(o => getOrderStatus(o) === 'Delivered');

  const orderStatusCounts = {
    All: orders.length,
    Processing: orders.filter(o => getOrderStatus(o) === 'Processing').length,
    Shipped: orders.filter(o => getOrderStatus(o) === 'Shipped').length,
    Delivered: allDeliveredOrders.length,
    Cancelled: orders.filter(o => getOrderStatus(o) === 'Cancelled').length
  };

  const deliveredCounts = {
    all: allDeliveredOrders.length,
    today: filterDeliveredOrdersByDate(allDeliveredOrders, 'today').length,
    yesterday: filterDeliveredOrdersByDate(allDeliveredOrders, 'yesterday').length,
    last7days: filterDeliveredOrdersByDate(allDeliveredOrders, 'last7days').length,
    thisMonth: filterDeliveredOrdersByDate(allDeliveredOrders, 'thisMonth').length,
  };

  const deliveredRevenues = {
    all: filterDeliveredOrdersByDate(allDeliveredOrders, 'all').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
    today: filterDeliveredOrdersByDate(allDeliveredOrders, 'today').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
    yesterday: filterDeliveredOrdersByDate(allDeliveredOrders, 'yesterday').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
    last7days: filterDeliveredOrdersByDate(allDeliveredOrders, 'last7days').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
    thisMonth: filterDeliveredOrdersByDate(allDeliveredOrders, 'thisMonth').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
  };

  const calculatedSalesTotal = Number(nonCancelledOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toFixed(2));

  const calculatedDeliveryTotal = Number(nonCancelledOrders.reduce((sum, o) => {
    const { deliveryCost, hasDeliveryCost } = calculateOrderProfit(o, products);
    return sum + (hasDeliveryCost ? deliveryCost : 0);
  }, 0).toFixed(2));

  const calculatedProfitTotal = Number(nonCancelledOrders.reduce((sum, o) => {
    const { profit, hasDeliveryCost } = calculateOrderProfit(o, products);
    return sum + (hasDeliveryCost ? profit : 0);
  }, 0).toFixed(2));

  const filteredOrders = orders.filter(order => {
    const query = String(orderSearchQuery || '').toLowerCase().trim();
    const matchesSearch = String(order.id || '').toLowerCase().includes(query) ||
      String(order.customer_name || '').toLowerCase().includes(query) ||
      String(order.phone || '').includes(query);
    const matchesStatus = orderStatusFilter === 'All' || getOrderStatus(order) === orderStatusFilter;

    if (!matchesSearch || !matchesStatus) return false;

    if (orderStatusFilter === 'Delivered' && orderDeliveredSubFilter !== 'all') {
      const deliveredInSubFilter = filterDeliveredOrdersByDate([order], orderDeliveredSubFilter);
      if (deliveredInSubFilter.length === 0) return false;
    }

    return true;
  });

  const orderStatusFilters = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (authLoading && !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-[#8c6239] rounded-full animate-spin"></div>
          <span className="text-xs text-stone-400 uppercase tracking-widest">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        authLoading={authLoading}
        user={user}
        authError={authError}
        authSuccessMsg={authSuccessMsg}
        loginStep={loginStep}
        setLoginStep={setLoginStep}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginOtp={loginOtp}
        setLoginOtp={setLoginOtp}
        handleSendOtp={handleSendOtp}
        handleVerifyOtp={handleVerifyOtp}
        setAuthError={setAuthError}
        setAuthSuccessMsg={setAuthSuccessMsg}
      />
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 overflow-hidden font-sans">

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <Header
          activeTab={activeTab}
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Loading Spinner */}
        {dbLoading ? (
          <div className="grow flex items-center justify-center bg-stone-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-stone-300 border-t-[#8c6239] rounded-full animate-spin"></div>
              <span className="text-xs text-stone-400 uppercase tracking-widest">Loading Database...</span>
            </div>
          </div>
        ) : (
          <main className="grow overflow-y-auto p-3 sm:p-6 lg:p-8">
            <DashboardView
              activeTab={activeTab}
              handleDownloadSalesProfitReport={handleDownloadSalesProfitReport}
              orderStatusCounts={orderStatusCounts}
              setDeliveredDateFilter={setDeliveredDateFilter}
              setShowDeliveredListModal={setShowDeliveredListModal}
              deliveredCounts={deliveredCounts}
              deliveredCountsToday={deliveredCounts.today}
              calculatedSalesTotal={calculatedSalesTotal}
              setShowSalesListModal={setShowSalesListModal}
              calculatedDeliveryTotal={calculatedDeliveryTotal}
              setShowProfitListModal={setShowProfitListModal}
              calculatedProfitTotal={calculatedProfitTotal}
              financialSummary={financialSummary}
              loadingFinancials={loadingFinancials}
              fetchFinancialSummary={fetchFinancialSummary}
              setShowFinancialModal={setShowFinancialModal}
              setShowManualOrderModal={setShowManualOrderModal}
              products={products}
              orders={orders}
              setSelectedOrder={setSelectedOrder}
              dashboardDeliveredFilter={dashboardDeliveredFilter}
              setDashboardDeliveredFilter={setDashboardDeliveredFilter}
              filterDeliveredOrdersByDate={filterDeliveredOrdersByDate}
              allDeliveredOrders={allDeliveredOrders}
              deliveredRevenues={deliveredRevenues}
              getOrderDeliveryDate={getOrderDeliveryDate}
            />

            <CategoriesView
              activeTab={activeTab}
              categories={categories}
              showCategoryForm={showCategoryForm}
              setShowCategoryForm={setShowCategoryForm}
              editingCategory={editingCategory}
              setEditingCategory={setEditingCategory}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              handleAddCategory={handleAddCategory}
              products={products}
              setSelectedCategoryDetails={setSelectedCategoryDetails}
              handleDeleteCategory={handleDeleteCategory}
              selectedCategoryDetails={selectedCategoryDetails}
              handleToggleProductCategory={handleToggleProductCategory}
            />

            <ProductsView
              activeTab={activeTab}
              products={products}
              showProductForm={showProductForm}
              setShowProductForm={setShowProductForm}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              handleAddProduct={handleAddProduct}
              categories={categories}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              handleImageDelete={handleImageDelete}
              handleToggleStock={handleToggleStock}
              handleDeleteProduct={handleDeleteProduct}
            />

            <OrdersView
              activeTab={activeTab}
              filteredOrders={filteredOrders}
              orders={orders}
              setShowManualOrderModal={setShowManualOrderModal}
              orderSearchQuery={orderSearchQuery}
              setOrderSearchQuery={setOrderSearchQuery}
              orderStatusFilters={orderStatusFilters}
              orderStatusFilter={orderStatusFilter}
              setOrderStatusFilter={setOrderStatusFilter}
              orderStatusCounts={orderStatusCounts}
              deliveredCounts={deliveredCounts}
              orderDeliveredSubFilter={orderDeliveredSubFilter}
              setOrderDeliveredSubFilter={setOrderDeliveredSubFilter}
              setSelectedOrder={setSelectedOrder}
              sentMessages={sentMessages}
              requestOrderStatusUpdate={requestOrderStatusUpdate}
            />

            <BannersView
              activeTab={activeTab}
              banners={banners}
              editingBanner={editingBanner}
              setEditingBanner={setEditingBanner}
              newBanner={newBanner}
              setNewBanner={setNewBanner}
              showBannerForm={showBannerForm}
              setShowBannerForm={setShowBannerForm}
              handleAddBanner={handleAddBanner}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              handleDeleteBanner={handleDeleteBanner}
            />

            <BlogsView
              activeTab={activeTab}
              blogs={blogs}
              editingBlog={editingBlog}
              setEditingBlog={setEditingBlog}
              newBlog={newBlog}
              setNewBlog={setNewBlog}
              blogFaqs={blogFaqs}
              setBlogFaqs={setBlogFaqs}
              showBlogForm={showBlogForm}
              setShowBlogForm={setShowBlogForm}
              handleAddBlog={handleAddBlog}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
              handleDeleteBlog={handleDeleteBlog}
            />

            <TestimonialsView
              activeTab={activeTab}
              testimonials={testimonials}
              editingTestimonial={editingTestimonial}
              setEditingTestimonial={setEditingTestimonial}
              newTestimonial={newTestimonial}
              setNewTestimonial={setNewTestimonial}
              showTestimonialForm={showTestimonialForm}
              setShowTestimonialForm={setShowTestimonialForm}
              handleAddTestimonial={handleAddTestimonial}
              handleDeleteTestimonial={handleDeleteTestimonial}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
            />
          </main>
        )}
      </div>

      {/* Modals */}
      <OrderDetailsModal
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        getOrderDeliveryDate={getOrderDeliveryDate}
        handleUpdateDeliveryDate={handleUpdateDeliveryDate}
        markMessageAsSent={markMessageAsSent}
        sentMessages={sentMessages}
        handleUpdateDeliveryCharge={handleUpdateDeliveryCharge}
        handleDownloadLabel={handleDownloadLabel}
        handleDownloadManifest={handleDownloadManifest}
        handleSyncShiprocketOrder={handleSyncShiprocketOrder}
        generatingLabel={generatingLabel}
        generatingManifest={generatingManifest}
        syncingShipment={syncingShipment}
        requestOrderStatusUpdate={requestOrderStatusUpdate}
        fetchOrders={fetchOrders}
        setShiprocketOrderId={setShiprocketOrderId}
        setCourierRates={setCourierRates}
        setSelectedCourier={setSelectedCourier}
        setRateError={setRateError}
        setShipmentError={setShipmentError}
        setShiprocketWeight={setShiprocketWeight}
        setShiprocketLength={setShiprocketLength}
        setShiprocketWidth={setShiprocketWidth}
        setShiprocketHeight={setShiprocketHeight}
        setShowShiprocketModal={setShowShiprocketModal}
        pendingStatusUpdate={pendingStatusUpdate}
        setPendingStatusUpdate={setPendingStatusUpdate}
        confirmOrderStatusUpdate={confirmOrderStatusUpdate}
      />

      <ShiprocketModal
        showShiprocketModal={showShiprocketModal}
        setShowShiprocketModal={setShowShiprocketModal}
        shiprocketOrderId={shiprocketOrderId}
        shiprocketWeight={shiprocketWeight}
        setShiprocketWeight={setShiprocketWeight}
        shiprocketLength={shiprocketLength}
        setShiprocketLength={setShiprocketLength}
        shiprocketWidth={shiprocketWidth}
        setShiprocketWidth={setShiprocketWidth}
        shiprocketHeight={shiprocketHeight}
        setShiprocketHeight={setShiprocketHeight}
        shiprocketPickupDate={shiprocketPickupDate}
        setShiprocketPickupDate={setShiprocketPickupDate}
        courierRates={courierRates}
        fetchingRates={fetchingRates}
        rateError={rateError}
        shipmentError={shipmentError}
        selectedCourier={selectedCourier}
        setSelectedCourier={setSelectedCourier}
        initializingShipment={initializingShipment}
        handleFetchCourierRates={handleFetchCourierRates}
        handleInitializeShipment={handleInitializeShipment}
      />

      <SalesListModal
        showSalesListModal={showSalesListModal}
        setShowSalesListModal={setShowSalesListModal}
        nonCancelledOrders={nonCancelledOrders}
        calculatedSalesTotal={calculatedSalesTotal}
      />

      <ProfitListModal
        showProfitListModal={showProfitListModal}
        setShowProfitListModal={setShowProfitListModal}
        nonCancelledOrders={nonCancelledOrders}
        products={products}
        calculatedSalesTotal={calculatedSalesTotal}
        calculatedDeliveryTotal={calculatedDeliveryTotal}
        calculatedProfitTotal={calculatedProfitTotal}
        inlineEditingCell={inlineEditingCell}
        setInlineEditingCell={setInlineEditingCell}
        inlineEditValue={inlineEditValue}
        setInlineEditValue={setInlineEditValue}
        handleSaveInlineEdit={handleSaveInlineEdit}
      />

      <DeliveredListModal
        showDeliveredListModal={showDeliveredListModal}
        setShowDeliveredListModal={setShowDeliveredListModal}
        deliveredDateFilter={deliveredDateFilter}
        setDeliveredDateFilter={setDeliveredDateFilter}
        deliveredSearchQuery={deliveredSearchQuery}
        setDeliveredSearchQuery={setDeliveredSearchQuery}
        deliveredCounts={deliveredCounts}
        deliveredRevenues={deliveredRevenues}
        allDeliveredOrders={allDeliveredOrders}
        filterDeliveredOrdersByDate={filterDeliveredOrdersByDate}
        getOrderDeliveryDate={getOrderDeliveryDate}
        handleDownloadDeliveredReport={handleDownloadDeliveredReport}
        setSelectedOrder={setSelectedOrder}
      />

      <FinancialModal
        showFinancialModal={showFinancialModal}
        setShowFinancialModal={setShowFinancialModal}
        financialSummary={financialSummary}
        fetchFinancialSummary={fetchFinancialSummary}
        loadingFinancials={loadingFinancials}
      />

      <ManualOrderModal
        showManualOrderModal={showManualOrderModal}
        setShowManualOrderModal={setShowManualOrderModal}
        manualCustomerName={manualCustomerName}
        setManualCustomerName={setManualCustomerName}
        manualPhone={manualPhone}
        setManualPhone={setManualPhone}
        manualSelectedProductId={manualSelectedProductId}
        setManualSelectedProductId={setManualSelectedProductId}
        manualSelectedSize={manualSelectedSize}
        setManualSelectedSize={setManualSelectedSize}
        manualQuantity={manualQuantity}
        setManualQuantity={setManualQuantity}
        manualSellingPrice={manualSellingPrice}
        setManualSellingPrice={setManualSellingPrice}
        manualBaseCost={manualBaseCost}
        setManualBaseCost={setManualBaseCost}
        manualPaymentMethod={manualPaymentMethod}
        setManualPaymentMethod={setManualPaymentMethod}
        manualStatus={manualStatus}
        setManualStatus={setManualStatus}
        manualDeliveryCharge={manualDeliveryCharge}
        setManualDeliveryCharge={setManualDeliveryCharge}
        savingManualOrder={savingManualOrder}
        products={products}
        handleCreateManualOrder={handleCreateManualOrder}
      />
    </div>
  );
}
