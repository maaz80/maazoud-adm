import React, { useState, useMemo } from 'react';
import {
  FiX,
  FiSearch,
  FiDollarSign,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiLayers,
  FiTrendingUp,
  FiCreditCard,
  FiXCircle
} from 'react-icons/fi';
import { calculateOrderProfit } from '../../utils/helpers';

export default function StoreMetricsModal({
  isOpen,
  onClose,
  modalType,
  financialSummary,
  orders = [],
  products = [],
  setSelectedOrder
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Reset state when modal opens/closes
  React.useEffect(() => {
    setSearchQuery('');
    setActiveTab('all');
  }, [modalType, isOpen]);

  // Non-cancelled orders helper
  const nonCancelledOrders = useMemo(() => {
    return (orders || []).filter(o => o.status !== 'Cancelled');
  }, [orders]);

  // Offline orders
  const isHandDelivered = (o) => {
    const pm = String(o?.payment_method || '').toLowerCase();
    if (pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid')) return false;
    const courier = String(o?.shiprocket_courier_name || '').toLowerCase();
    const id = String(o?.id || '');
    return pm.includes('offline') || pm.includes('cash (offline)') || courier.includes('hand delivered') || courier.includes('direct') || courier.includes('self handover') || id.startsWith('ORD-OFFLINE');
  };

  const offlineOrders = useMemo(() => {
    return nonCancelledOrders.filter(isHandDelivered);
  }, [nonCancelledOrders]);

  const codOrders = useMemo(() => {
    return nonCancelledOrders.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return (pm.includes('cod') || pm.includes('cash on delivery')) && !isHandDelivered(o);
    });
  }, [nonCancelledOrders]);

  // Combined COD orders
  const totalCodOrders = useMemo(() => {
    return [
      ...offlineOrders.map(o => ({ ...o, _codType: 'Offline Cash' })),
      ...codOrders.map(o => ({ ...o, _codType: 'Courier COD' }))
    ];
  }, [offlineOrders, codOrders]);

  // Online orders
  const onlineOrders = useMemo(() => {
    return nonCancelledOrders.filter(o => {
      const pm = String(o.payment_method || '').toLowerCase();
      return (pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid')) && !isHandDelivered(o);
    });
  }, [nonCancelledOrders]);

  // Cancelled orders
  const cancelledOrders = useMemo(() => {
    return (orders || []).filter(o => o.status === 'Cancelled');
  }, [orders]);

  // Razorpay settlements list
  const razorpaySettlements = useMemo(() => {
    return financialSummary?.razorpay?.settlements_schedule || [];
  }, [financialSummary]);

  // Razorpay pending list
  const razorpayPendingItems = useMemo(() => {
    return financialSummary?.razorpay?.pending_schedule || [];
  }, [financialSummary]);

  // Courier Remittances (Shiprocket + ZipyPost)
  const courierRemittances = useMemo(() => {
    return financialSummary?.courier_combined?.remittances_schedule || [];
  }, [financialSummary]);

  // Courier Pending Payouts (Shiprocket + ZipyPost)
  const courierPendingItems = useMemo(() => {
    return financialSummary?.courier_combined?.pending_schedule || [];
  }, [financialSummary]);

  if (!isOpen || !modalType) return null;

  // RENDER HELPERS BY MODAL TYPE
  let modalTitle = '';
  let modalSubtitle = '';
  let icon = <FiDollarSign className="text-emerald-700" size={18} />;
  let iconBg = 'bg-emerald-100 border-emerald-200';

  if (modalType === 'offline_sales') {
    modalTitle = 'Offline Sales Ledger';
    modalSubtitle = `Direct counter & self-handover orders (${offlineOrders.length} Orders)`;
    icon = <FiDollarSign className="text-emerald-700" size={18} />;
    iconBg = 'bg-emerald-100 border-emerald-200';
  } else if (modalType === 'offline_profit') {
    modalTitle = 'Offline Sales Profit Ledger';
    modalSubtitle = `Net profit margin on direct counter sales (${offlineOrders.length} Orders)`;
    icon = <FiTrendingUp className="text-emerald-700" size={18} />;
    iconBg = 'bg-emerald-100 border-emerald-200';
  } else if (modalType === 'total_cod') {
    modalTitle = 'Total COD Orders (Offline Sales + Courier COD)';
    modalSubtitle = `Complete cash-on-delivery overview (${totalCodOrders.length} Orders)`;
    icon = <FiLayers className="text-amber-700" size={18} />;
    iconBg = 'bg-amber-100 border-amber-200';
  } else if (modalType === 'total_cod_profit') {
    modalTitle = 'Total COD Profit Ledger (Offline Cash + Courier COD)';
    modalSubtitle = `Net profit margin across all COD orders (${totalCodOrders.length} Orders)`;
    icon = <FiTrendingUp className="text-amber-700" size={18} />;
    iconBg = 'bg-amber-100 border-amber-200';
  } else if (modalType === 'online_sales') {
    modalTitle = 'Total Online Sales Ledger (Prepaid / Razorpay)';
    modalSubtitle = `Website online checkout orders (${onlineOrders.length} Orders)`;
    icon = <FiCreditCard className="text-blue-700" size={18} />;
    iconBg = 'bg-blue-100 border-blue-200';
  } else if (modalType === 'online_profit') {
    modalTitle = 'Total Online Sales Profit Ledger';
    modalSubtitle = `Net profit margin on prepaid online orders (${onlineOrders.length} Orders)`;
    icon = <FiTrendingUp className="text-blue-700" size={18} />;
    iconBg = 'bg-blue-100 border-blue-200';
  } else if (modalType === 'razorpay_received') {
    modalTitle = 'Razorpay Settled in Bank (Aa Chuka Paisa)';
    modalSubtitle = `Online payments credited to bank account (${razorpaySettlements.length} Settlements)`;
    icon = <FiCheckCircle className="text-blue-700" size={18} />;
    iconBg = 'bg-blue-100 border-blue-200';
  } else if (modalType === 'razorpay_pending') {
    modalTitle = 'Razorpay Pending Bank Payout (Aane Wala Paisa)';
    modalSubtitle = 'Captured online payments in processing for next bank settlement';
    icon = <FiClock className="text-sky-700" size={18} />;
    iconBg = 'bg-sky-100 border-sky-200';
  } else if (modalType === 'courier_received') {
    modalTitle = 'Shiprocket + ZipyPost Received in Bank (Aa Chuka Paisa)';
    modalSubtitle = `Courier COD remittances credited to bank (${courierRemittances.length} Remittances)`;
    icon = <FiCheckCircle className="text-purple-700" size={18} />;
    iconBg = 'bg-purple-100 border-purple-200';
  } else if (modalType === 'courier_pending') {
    modalTitle = 'Shiprocket + ZipyPost Pending Payout (Aane Wala Paisa)';
    modalSubtitle = `Delivered awaiting payout & in-transit COD orders (${courierPendingItems.length} Shipments)`;
    icon = <FiTruck className="text-purple-700" size={18} />;
    iconBg = 'bg-purple-100 border-purple-200';
  } else if (modalType === 'cancelled_orders') {
    modalTitle = 'Cancelled Orders Ledger (Excluded from Sales)';
    modalSubtitle = `List of all cancelled customer orders (${cancelledOrders.length} Orders)`;
    icon = <FiXCircle className="text-rose-700" size={18} />;
    iconBg = 'bg-rose-100 border-rose-200';
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-5xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${iconBg} border flex items-center justify-center shrink-0`}>
              {icon}
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-widest block">Store Metrics Ledger</span>
              <h3 className="text-sm font-bold text-stone-900">{modalTitle}</h3>
              <p className="text-[10px] text-stone-500 font-light">{modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-xl font-bold"
          >
            <FiX />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 grow">
          
          {/* 1. OFFLINE SALES MODAL */}
          {modalType === 'offline_sales' && (() => {
            const filtered = offlineOrders.filter(o => {
              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.phone || '').toLowerCase().includes(q) ||
                String(o.payment_method || '').toLowerCase().includes(q)
              );
            });

            const totalSum = filtered.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);

            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/60 p-3.5 rounded border border-emerald-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Total Offline Cash Sales</span>
                    <h4 className="text-xl font-bold text-emerald-800">₹ {totalSum.toLocaleString('en-IN')}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Orders Count</span>
                    <span className="text-sm font-bold text-emerald-900">{filtered.length} Direct Orders</span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer name, Phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239] transition-all"
                  />
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-bold text-[9px]">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filtered.length > 0 ? (
                        filtered.map(order => (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder && setSelectedOrder(order)}
                            className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                          >
                            <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                            <td className="p-3 text-stone-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="p-3 font-medium text-stone-800">{order.customer_name}</td>
                            <td className="p-3 text-stone-500 font-mono">{order.phone || 'N/A'}</td>
                            <td className="p-3 text-stone-600">{order.payment_method || 'Cash (Offline)'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {order.status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-800">₹ {parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-stone-400 italic">No offline orders matching search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* OFFLINE SALES PROFIT MODAL */}
          {modalType === 'offline_profit' && (() => {
            const filtered = offlineOrders.filter(o => {
              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.phone || '').toLowerCase().includes(q)
              );
            });

            const totalRev = filtered.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
            const totalProfit = filtered.reduce((s, o) => s + calculateOrderProfit(o, products).profit, 0);
            const totalBaseCost = filtered.reduce((s, o) => s + calculateOrderProfit(o, products).baseCost, 0);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-emerald-50/70 p-4 rounded border border-emerald-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Total Net Profit</span>
                    <h4 className="text-2xl font-bold text-emerald-900 mt-0.5">₹ {totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                    <span className="text-[10px] text-emerald-700">{filtered.length} Direct Orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Total Offline Revenue</span>
                    <h4 className="text-lg font-bold text-stone-900 mt-0.5">₹ {totalRev.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-stone-500">Gross counter sales</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Manufacturing Base Cost</span>
                    <h4 className="text-lg font-bold text-stone-800 mt-0.5">₹ {totalBaseCost.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-stone-500">Product unit costs</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Courier Logistics Cost</span>
                    <h4 className="text-lg font-bold text-emerald-800 mt-0.5">₹ 0.00</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold">100% Cash In Hand</span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer name, Phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239] transition-all"
                  />
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-emerald-100/70 text-emerald-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Items</th>
                        <th className="p-3 text-right">Selling Price (₹)</th>
                        <th className="p-3 text-right">Base Cost (₹)</th>
                        <th className="p-3 text-right">Courier Fee (₹)</th>
                        <th className="p-3 text-right">Net Profit (₹)</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {filtered.length > 0 ? (
                        filtered.map(order => {
                          const { sellingPrice, baseCost, profit, itemsProfit } = calculateOrderProfit(order, products);
                          const itemsSummary = (itemsProfit || []).map(i => `${i.quantity}x ${i.name || 'Attar'} (${i.size})`).join(', ') || 'Attar';

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder && setSelectedOrder(order)}
                              className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                            >
                              <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                              <td className="p-3 text-stone-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 font-medium text-stone-800">
                                <div>{order.customer_name}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{order.phone || ''}</div>
                              </td>
                              <td className="p-3 text-stone-600 text-[11px] max-w-[200px] truncate" title={itemsSummary}>
                                {itemsSummary}
                              </td>
                              <td className="p-3 text-right font-medium text-stone-800">₹ {sellingPrice.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-stone-500 font-mono">₹ {baseCost.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-emerald-700 font-mono font-semibold">₹ 0.00</td>
                              <td className="p-3 text-right font-bold text-emerald-800 text-sm">
                                ₹ {profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-stone-400 italic">No offline orders found matching search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 2. TOTAL COD MODAL */}
          {modalType === 'total_cod' && (() => {
            const filtered = totalCodOrders.filter(o => {
              if (activeTab === 'offline' && o._codType !== 'Offline Cash') return false;
              if (activeTab === 'courier' && o._codType !== 'Courier COD') return false;

              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.shiprocket_awb || o.zipypost_awb || '').toLowerCase().includes(q) ||
                String(o.shiprocket_courier_name || o.zipypost_courier_name || '').toLowerCase().includes(q)
              );
            });

            const offlineSum = offlineOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
            const courierSum = codOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
            const totalSum = offlineSum + courierSum;

            return (
              <div className="space-y-4">
                {/* Metrics header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-amber-50 p-3 rounded border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Total COD Amount</span>
                    <h4 className="text-xl font-bold text-amber-900 mt-0.5">₹ {totalSum.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-amber-700">{totalCodOrders.length} Total Orders</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Offline Sales Cash</span>
                    <h4 className="text-xl font-bold text-emerald-900 mt-0.5">₹ {offlineSum.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-emerald-700">{offlineOrders.length} Handover Orders</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Courier COD</span>
                    <h4 className="text-xl font-bold text-purple-900 mt-0.5">₹ {courierSum.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-purple-700">{codOrders.length} Shipped / Transit Orders</span>
                  </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5 bg-stone-100 p-1 rounded border border-stone-200">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'all' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All COD ({totalCodOrders.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('courier')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'courier' ? 'bg-white text-purple-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Courier COD ({codOrders.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('offline')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'offline' ? 'bg-white text-emerald-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Offline Cash ({offlineOrders.length})
                    </button>
                  </div>

                  <div className="relative grow sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search orders, customers, AWB..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-bold text-[9px]">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Courier / Partner</th>
                        <th className="p-3">AWB Code</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filtered.length > 0 ? (
                        filtered.map(order => {
                          const isOff = order._codType === 'Offline Cash';
                          const awb = order.zipypost_awb || order.shiprocket_awb || order.shipment_details?.awb || '—';
                          const courier = order.shipping_partner === 'zipypost'
                            ? (order.zipypost_courier_name || 'ZipyPost')
                            : (order.shiprocket_courier_name || (isOff ? 'Direct Handover' : 'Courier Partner'));

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder && setSelectedOrder(order)}
                              className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                            >
                              <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  isOff ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                }`}>
                                  {order._codType}
                                </span>
                              </td>
                              <td className="p-3 text-stone-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 font-medium text-stone-800">{order.customer_name}</td>
                              <td className="p-3 text-stone-600">{courier}</td>
                              <td className="p-3 font-mono text-stone-500 text-[10px]">{awb}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  order.status === 'Delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'Shipped'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-amber-900">₹ {parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-stone-400 italic">No COD orders matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TOTAL COD PROFIT MODAL */}
          {modalType === 'total_cod_profit' && (() => {
            const filtered = totalCodOrders.filter(o => {
              if (activeTab === 'offline' && o._codType !== 'Offline Cash') return false;
              if (activeTab === 'courier' && o._codType !== 'Courier COD') return false;

              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.shiprocket_awb || o.zipypost_awb || '').toLowerCase().includes(q) ||
                String(o.shiprocket_courier_name || o.zipypost_courier_name || '').toLowerCase().includes(q)
              );
            });

            const offlineProf = offlineOrders.reduce((s, o) => s + calculateOrderProfit(o, products).profit, 0);
            const courierProf = codOrders.reduce((s, o) => s + calculateOrderProfit(o, products).profit, 0);
            const totalProf = offlineProf + courierProf;

            const totalDelivery = totalCodOrders.reduce((s, o) => s + calculateOrderProfit(o, products).deliveryCost, 0);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-amber-50/70 p-4 rounded border border-amber-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Total COD Net Profit</span>
                    <h4 className="text-2xl font-bold text-amber-950 mt-0.5">₹ {totalProf.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                    <span className="text-[10px] text-amber-700">{totalCodOrders.length} Total COD Orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Offline Cash Profit</span>
                    <h4 className="text-lg font-bold text-emerald-900 mt-0.5">₹ {offlineProf.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                    <span className="text-[10px] text-emerald-700">{offlineOrders.length} Orders (₹0 Courier)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Courier COD Profit</span>
                    <h4 className="text-lg font-bold text-purple-900 mt-0.5">₹ {courierProf.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                    <span className="text-[10px] text-purple-700">{codOrders.length} Orders (After Delivery Fee)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Total Courier Logistics</span>
                    <h4 className="text-lg font-bold text-stone-800 mt-0.5">₹ {totalDelivery.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-stone-500">Shipping & COD handling fees</span>
                  </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5 bg-stone-100 p-1 rounded border border-stone-200">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'all' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All COD ({totalCodOrders.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('offline')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'offline' ? 'bg-white text-emerald-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Offline Cash ({offlineOrders.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('courier')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'courier' ? 'bg-white text-purple-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Courier COD ({codOrders.length})
                    </button>
                  </div>

                  <div className="relative grow sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search orders, customers, AWB..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-amber-100/70 text-amber-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Channel / Type</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Courier / Partner</th>
                        <th className="p-3 text-right">Selling Price (₹)</th>
                        <th className="p-3 text-right">Base Cost (₹)</th>
                        <th className="p-3 text-right">Courier Fee (₹)</th>
                        <th className="p-3 text-right">Net Profit (₹)</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {filtered.length > 0 ? (
                        filtered.map(order => {
                          const isOff = order._codType === 'Offline Cash';
                          const { sellingPrice, baseCost, deliveryCost, profit } = calculateOrderProfit(order, products);
                          const courier = order.shipping_partner === 'zipypost'
                            ? (order.zipypost_courier_name || 'ZipyPost')
                            : (order.shiprocket_courier_name || (isOff ? 'Direct Handover' : 'Courier Partner'));

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder && setSelectedOrder(order)}
                              className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                            >
                              <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  isOff ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                }`}>
                                  {order._codType}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-stone-800">{order.customer_name}</td>
                              <td className="p-3 text-stone-600">{courier}</td>
                              <td className="p-3 text-right font-medium text-stone-800">₹ {sellingPrice.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-stone-500 font-mono">₹ {baseCost.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-purple-700 font-mono">₹ {deliveryCost.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right font-bold text-amber-950 text-sm">
                                ₹ {profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  order.status === 'Delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'Shipped'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-stone-400 italic">No COD orders matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TOTAL ONLINE SALES MODAL */}
          {modalType === 'online_sales' && (() => {
            const filtered = onlineOrders.filter(o => {
              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.payment_method || '').toLowerCase().includes(q) ||
                String(o.shiprocket_awb || o.zipypost_awb || '').toLowerCase().includes(q)
              );
            });

            const totalSum = filtered.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);

            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 p-4 rounded border border-blue-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">Total Online Prepaid Sales</span>
                    <h4 className="text-2xl font-bold text-blue-900 mt-0.5">₹ {totalSum.toLocaleString('en-IN')}</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">Website checkout orders paid online via Razorpay gateway</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">Orders Count</span>
                    <span className="text-sm font-bold text-blue-900">{filtered.length} Online Orders</span>
                  </div>
                </div>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer name, Payment ID, AWB..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                  />
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-blue-100/70 text-blue-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Payment ID / Ref</th>
                        <th className="p-3">Courier / AWB</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {filtered.length > 0 ? (
                        filtered.map(order => {
                          const awb = order.zipypost_awb || order.shiprocket_awb || order.shipment_details?.awb || '—';
                          const courier = order.shipping_partner === 'zipypost'
                            ? (order.zipypost_courier_name || 'ZipyPost')
                            : (order.shiprocket_courier_name || 'Courier Partner');

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder && setSelectedOrder(order)}
                              className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                            >
                              <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                              <td className="p-3 text-stone-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 font-medium text-stone-800">
                                <div>{order.customer_name}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{order.phone || ''}</div>
                              </td>
                              <td className="p-3 text-stone-600 text-[10px] font-mono max-w-[200px] truncate" title={order.payment_method}>
                                {order.payment_method || 'Razorpay Prepaid'}
                              </td>
                              <td className="p-3 text-stone-600">
                                <div>{courier}</div>
                                <div className="text-[10px] font-mono text-stone-400">{awb}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  order.status === 'Delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'Shipped'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-blue-900 text-sm">₹ {parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-stone-400 italic">No online orders matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TOTAL ONLINE PROFIT MODAL */}
          {modalType === 'online_profit' && (() => {
            const filtered = onlineOrders.filter(o => {
              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.shiprocket_awb || o.zipypost_awb || '').toLowerCase().includes(q)
              );
            });

            const totalRev = filtered.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
            const totalProfit = filtered.reduce((s, o) => s + calculateOrderProfit(o, products).profit, 0);
            const totalBaseCost = filtered.reduce((s, o) => s + calculateOrderProfit(o, products).baseCost, 0);
            const totalDelivery = filtered.reduce((s, o) => s + calculateOrderProfit(o, products).deliveryCost, 0);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-blue-50/70 p-4 rounded border border-blue-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">Total Online Net Profit</span>
                    <h4 className="text-2xl font-bold text-blue-950 mt-0.5">₹ {totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                    <span className="text-[10px] text-blue-700">{filtered.length} Prepaid Orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Online Gross Sales</span>
                    <h4 className="text-lg font-bold text-stone-900 mt-0.5">₹ {totalRev.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-stone-500">Collected via Razorpay</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Manufacturing Base Cost</span>
                    <h4 className="text-lg font-bold text-stone-800 mt-0.5">₹ {totalBaseCost.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-stone-500">Product unit costs</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Courier Logistics Cost</span>
                    <h4 className="text-lg font-bold text-purple-900 mt-0.5">₹ {totalDelivery.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-purple-600">Prepaid shipping charges</span>
                  </div>
                </div>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Customer, AWB..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                  />
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-blue-100/70 text-blue-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Courier / AWB</th>
                        <th className="p-3 text-right">Selling Price (₹)</th>
                        <th className="p-3 text-right">Base Cost (₹)</th>
                        <th className="p-3 text-right">Courier Fee (₹)</th>
                        <th className="p-3 text-right">Net Profit (₹)</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {filtered.length > 0 ? (
                        filtered.map(order => {
                          const { sellingPrice, baseCost, deliveryCost, profit } = calculateOrderProfit(order, products);
                          const awb = order.zipypost_awb || order.shiprocket_awb || order.shipment_details?.awb || '—';
                          const courier = order.shipping_partner === 'zipypost'
                            ? (order.zipypost_courier_name || 'ZipyPost')
                            : (order.shiprocket_courier_name || 'Courier Partner');

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder && setSelectedOrder(order)}
                              className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                            >
                              <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                              <td className="p-3 text-stone-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 font-medium text-stone-800">
                                <div>{order.customer_name}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{order.phone || ''}</div>
                              </td>
                              <td className="p-3 text-stone-600">
                                <div>{courier}</div>
                                <div className="text-[10px] font-mono text-stone-400">{awb}</div>
                              </td>
                              <td className="p-3 text-right font-medium text-stone-800">₹ {sellingPrice.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-stone-500 font-mono">₹ {baseCost.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-purple-700 font-mono">₹ {deliveryCost.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right font-bold text-blue-900 text-sm">
                                ₹ {profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  order.status === 'Delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'Shipped'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-stone-400 italic">No online orders found matching search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 3. RAZORPAY SETTLED IN BANK MODAL */}
          {modalType === 'razorpay_received' && (() => {
            const filtered = razorpaySettlements.filter(s => {
              const q = searchQuery.toLowerCase();
              return (
                String(s.id || '').toLowerCase().includes(q) ||
                String(s.utr || '').toLowerCase().includes(q) ||
                String(s.date || '').toLowerCase().includes(q)
              );
            });

            const totalSettled = filtered.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 p-4 rounded border border-blue-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">Total Credited into Bank via Razorpay</span>
                    <h4 className="text-2xl font-bold text-blue-900 mt-0.5">₹ {totalSettled.toLocaleString('en-IN')}</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">Official payouts settled by Razorpay gateway directly to merchant bank</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">Transfers</span>
                    <span className="text-sm font-bold text-blue-900">{filtered.length} Bank Transfers</span>
                  </div>
                </div>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by Settlement ID, UTR reference, Date..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                  />
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-blue-100/60 text-blue-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Settlement ID</th>
                        <th className="p-3">Settlement Date</th>
                        <th className="p-3">Bank Reference (UTR)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Fees & Tax</th>
                        <th className="p-3 text-right">Net Credited (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {filtered.length > 0 ? (
                        filtered.map((s, idx) => (
                          <tr key={s.id || idx} className="hover:bg-blue-50/50 transition-colors">
                            <td className="p-3 font-mono font-bold text-stone-900">{s.id}</td>
                            <td className="p-3 text-stone-600">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                            <td className="p-3 font-mono text-stone-700 font-semibold">{s.utr || 'Direct Bank Credit'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">
                                {s.status || 'Processed'}
                              </span>
                            </td>
                            <td className="p-3 text-stone-500 font-mono">₹ {(parseFloat(s.fees || 0) + parseFloat(s.tax || 0)).toFixed(2)}</td>
                            <td className="p-3 text-right font-bold text-blue-900 text-sm">₹ {parseFloat(s.amount).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-stone-400 italic">No settlements found matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 4. RAZORPAY PENDING BANK PAYOUT MODAL */}
          {modalType === 'razorpay_pending' && (() => {
            const pendingTotal = razorpayPendingItems.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const unsettled = pendingTotal > 0 ? pendingTotal : (financialSummary?.razorpay?.unsettled_balance || 0);

            return (
              <div className="space-y-4">
                <div className="bg-sky-50 p-4 rounded border border-sky-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block">Pending Razorpay Transfer to Bank</span>
                    <h4 className="text-2xl font-bold text-sky-900 mt-0.5">₹ {unsettled.toLocaleString('en-IN')}</h4>
                    <p className="text-[10px] text-sky-700 mt-0.5">
                      Razorpay settlements trigger automatically next business morning (T+1 Daily Cycle) into your registered bank account.
                    </p>
                  </div>
                  <div className="bg-white px-3 py-2 rounded border border-sky-200 text-right">
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">Settlement Schedule</span>
                    <span className="text-xs font-bold text-sky-850">T+1 Daily Auto-Credit</span>
                  </div>
                </div>

                {razorpayPendingItems.length > 0 ? (
                  <div className="overflow-x-auto border border-stone-200 rounded">
                    <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-sky-100/60 text-sky-950 font-bold uppercase text-[9px] tracking-wider">
                          <th className="p-3">Payment ID</th>
                          <th className="p-3">Captured Date</th>
                          <th className="p-3">Customer Email / Contact</th>
                          <th className="p-3">Payment Mode</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-50">
                        {razorpayPendingItems.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-sky-50/50">
                            <td className="p-3 font-mono font-bold text-stone-900">{p.id}</td>
                            <td className="p-3 text-stone-600">{new Date(p.date).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-stone-700">{p.customer_email || p.customer_contact || 'Customer'}</td>
                            <td className="p-3 font-mono text-stone-600 uppercase text-[10px]">{p.method || 'UPI'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                {p.status || 'Pending Payout'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-sky-900">₹ {parseFloat(p.amount).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <FiCheckCircle size={22} />
                    </div>
                    <h5 className="font-bold text-emerald-900 text-sm">All Captured Online Payments Are Fully Settled!</h5>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      There are currently no pending unsettled payments held in Razorpay. All captured funds have been remitted to your bank account.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. SHIPROCKET + ZIPYPOST RECEIVED IN BANK MODAL */}
          {modalType === 'courier_received' && (() => {
            const filtered = courierRemittances.filter(r => {
              if (activeTab === 'shiprocket' && r.partner !== 'Shiprocket') return false;
              if (activeTab === 'zipypost' && r.partner !== 'ZipyPost') return false;

              const q = searchQuery.toLowerCase();
              return (
                String(r.id || '').toLowerCase().includes(q) ||
                String(r.awb || '').toLowerCase().includes(q) ||
                String(r.courier || '').toLowerCase().includes(q) ||
                String(r.utr || '').toLowerCase().includes(q)
              );
            });

            const srTotal = courierRemittances.filter(r => r.partner === 'Shiprocket').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
            const zpFiltered = courierRemittances.filter(r => r.partner === 'ZipyPost').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
            const zpTotal = zpFiltered > 0 ? zpFiltered : (financialSummary?.zipypost?.cod_received_in_bank || 0);
            const combinedTotal = srTotal + zpTotal;

            return (
              <div className="space-y-4">
                {/* Summary boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-purple-50 p-3.5 rounded border border-purple-200">
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Total Courier COD in Bank</span>
                    <h4 className="text-2xl font-bold text-purple-950 mt-0.5">₹ {combinedTotal.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-purple-700">Combined Shiprocket + ZipyPost</span>
                  </div>
                  <div className="bg-purple-100/50 p-3.5 rounded border border-purple-200">
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Shiprocket Remitted</span>
                    <h4 className="text-xl font-bold text-purple-900 mt-0.5">₹ {srTotal.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-purple-600">{courierRemittances.filter(r => r.partner === 'Shiprocket').length} Shipments</span>
                  </div>
                  <div className="bg-sky-50 p-3.5 rounded border border-sky-200">
                    <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block">ZipyPost Remitted</span>
                    <h4 className="text-xl font-bold text-sky-900 mt-0.5">₹ {zpTotal.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-sky-600">Union Bank Remittance (Live)</span>
                  </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5 bg-stone-100 p-1 rounded border border-stone-200">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'all' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All Partners ({courierRemittances.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('shiprocket')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'shiprocket' ? 'bg-white text-purple-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Shiprocket ({courierRemittances.filter(r => r.partner === 'Shiprocket').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('zipypost')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'zipypost' ? 'bg-white text-sky-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      ZipyPost ({courierRemittances.filter(r => r.partner === 'ZipyPost').length})
                    </button>
                  </div>

                  <div className="relative grow sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search AWB, Order ID, UTR..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-purple-100/60 text-purple-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Partner</th>
                        <th className="p-3">Order / ID</th>
                        <th className="p-3">AWB Code</th>
                        <th className="p-3">Courier</th>
                        <th className="p-3">Remittance Date</th>
                        <th className="p-3">Bank UTR</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Amount Credited (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {filtered.length > 0 ? (
                        filtered.map((r, idx) => (
                          <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                r.partner === 'ZipyPost' ? 'bg-sky-100 text-sky-850 border border-sky-200' : 'bg-purple-100 text-purple-850 border border-purple-200'
                              }`}>
                                {r.partner || 'Shiprocket'}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-stone-900">{r.id}</td>
                            <td className="p-3 font-mono text-stone-600 text-[10px]">{r.awb || '—'}</td>
                            <td className="p-3 text-stone-700">{r.courier || 'Courier Partner'}</td>
                            <td className="p-3 text-stone-500">{r.date ? new Date(r.date).toLocaleDateString('en-IN') : 'Completed'}</td>
                            <td className="p-3 font-mono text-stone-800 font-semibold">{r.utr || 'Remitted'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">
                                {r.status || 'Received in Bank'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-purple-950 text-sm">₹ {parseFloat(r.amount).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-stone-400 italic">No remitted payouts matching search query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 6. SHIPROCKET + ZIPYPOST PENDING BANK PAYOUT MODAL */}
          {modalType === 'courier_pending' && (() => {
            const filtered = courierPendingItems.filter(p => {
              if (activeTab === 'delivered' && !String(p.status || '').toLowerCase().includes('pending')) return false;
              if (activeTab === 'transit' && !String(p.status || '').toLowerCase().includes('transit')) return false;

              const q = searchQuery.toLowerCase();
              return (
                String(p.id || '').toLowerCase().includes(q) ||
                String(p.awb || '').toLowerCase().includes(q) ||
                String(p.courier || '').toLowerCase().includes(q) ||
                String(p.partner || '').toLowerCase().includes(q)
              );
            });

            const computedPending = courierPendingItems.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const totalPending = computedPending > 0
              ? computedPending
              : (financialSummary?.combined_summary?.courier_cod_pending_payout || 0);

            const deliveredPendingSum = courierPendingItems
              .filter(p => !String(p.status || '').toLowerCase().includes('transit'))
              .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

            const inTransitSum = courierPendingItems
              .filter(p => String(p.status || '').toLowerCase().includes('transit'))
              .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

            return (
              <div className="space-y-4">
                {/* Metric Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-purple-50 p-3.5 rounded border border-purple-200">
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Total Expected Courier COD</span>
                    <h4 className="text-2xl font-bold text-purple-950 mt-0.5">₹ {totalPending.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-purple-700">Shiprocket + ZipyPost + In-Transit</span>
                  </div>
                  <div className="bg-amber-50 p-3.5 rounded border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Delivered (Pending Remittance)</span>
                    <h4 className="text-xl font-bold text-amber-900 mt-0.5">₹ {deliveredPendingSum.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-amber-700">Cash collected by couriers</span>
                  </div>
                  <div className="bg-blue-50 p-3.5 rounded border border-blue-200">
                    <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">Shipped (In Transit)</span>
                    <h4 className="text-xl font-bold text-blue-900 mt-0.5">₹ {inTransitSum.toLocaleString('en-IN')}</h4>
                    <span className="text-[10px] text-blue-700">Out for delivery to customers</span>
                  </div>
                </div>

                {/* Filter Tabs & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5 bg-stone-100 p-1 rounded border border-stone-200">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'all' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All Pending ({courierPendingItems.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('delivered')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'delivered' ? 'bg-white text-amber-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Delivered (Remittance Due)
                    </button>
                    <button
                      onClick={() => setActiveTab('transit')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                        activeTab === 'transit' ? 'bg-white text-blue-900 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      In Transit (Shipped)
                    </button>
                  </div>

                  <div className="relative grow sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search AWB, Order ID, courier..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-purple-100/60 text-purple-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Partner</th>
                        <th className="p-3">Order / Reference</th>
                        <th className="p-3">AWB Code</th>
                        <th className="p-3">Courier</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Delivery Stage</th>
                        <th className="p-3">Payout Status</th>
                        <th className="p-3 text-right">Pending Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {filtered.length > 0 ? (
                        filtered.map((p, idx) => {
                          const isInTransit = String(p.status || '').toLowerCase().includes('transit');

                          return (
                            <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  p.partner === 'ZipyPost' ? 'bg-sky-100 text-sky-850 border border-sky-200' : 'bg-purple-100 text-purple-850 border border-purple-200'
                                }`}>
                                  {p.partner || 'Shiprocket'}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-stone-900">{p.id}</td>
                              <td className="p-3 font-mono text-stone-600 text-[10px]">{p.awb || '—'}</td>
                              <td className="p-3 text-stone-700">{p.courier || 'Courier Partner'}</td>
                              <td className="p-3 text-stone-500">{p.date ? new Date(p.date).toLocaleDateString('en-IN') : 'Recent'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isInTransit ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-green-100 text-green-800 border border-green-200'
                                }`}>
                                  {isInTransit ? 'In Transit' : 'Delivered'}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-amber-800 text-[10px]">{p.utr || 'Pending Bank Payout'}</td>
                              <td className="p-3 text-right font-bold text-purple-950 text-sm">₹ {parseFloat(p.amount).toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-stone-400 italic">No pending courier COD payouts matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 7. CANCELLED ORDERS MODAL */}
          {modalType === 'cancelled_orders' && (() => {
            const filtered = cancelledOrders.filter(o => {
              const q = searchQuery.toLowerCase();
              return (
                String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.phone || '').includes(q) ||
                String(o.city || '').toLowerCase().includes(q) ||
                String(o.payment_method || '').toLowerCase().includes(q)
              );
            });

            const totalCancelledValue = filtered.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);

            return (
              <div className="space-y-4">
                {/* Cancelled Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-rose-50/60 border border-rose-200 p-3.5 rounded">
                    <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">Total Cancelled Orders</span>
                    <h4 className="text-xl font-bold text-rose-900 mt-1">{filtered.length} Orders</h4>
                    <p className="text-[10px] text-rose-600">Zero revenue impact (Excluded from sales)</p>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Cancelled Order Value</span>
                    <h4 className="text-xl font-bold text-stone-800 mt-1">₹ {totalCancelledValue.toLocaleString('en-IN')}</h4>
                    <p className="text-[10px] text-stone-500">Not charged / Payment not collected</p>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="text-xs text-rose-700 font-semibold bg-rose-50 px-3 py-1.5 rounded border border-rose-200 w-full sm:w-auto">
                    ⚠️ Note: Cancelled orders are strictly excluded from Total Sales, COD, and Profit metrics.
                  </div>

                  <div className="relative grow sm:max-w-xs w-full">
                    <FiSearch className="absolute left-3 top-2.5 text-stone-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search order ID, customer, phone..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-stone-200 rounded">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-rose-100/60 text-rose-950 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Customer Details</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Order Total (₹)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {filtered.length > 0 ? (
                        filtered.map((order, idx) => {
                          const itemsSummary = (order.items || []).map(i => `${i.product?.name || 'Attar'} (${i.selectedSize || '6ml'} x${i.quantity || 1})`).join(', ');

                          return (
                            <tr key={order.id || idx} className="hover:bg-rose-50/40 transition-colors">
                              <td className="p-3">
                                <span className="font-mono font-bold text-stone-900 block">{order.id}</span>
                                <span className="text-[10px] text-stone-400">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-stone-800">{order.customer_name || 'Customer'}</div>
                                <div className="text-[10px] text-stone-500 font-mono">{order.phone || 'No phone'}</div>
                              </td>
                              <td className="p-3 text-stone-600">
                                <div>{order.city || 'N/A'}</div>
                                <div className="text-[10px] text-stone-400">{order.state || ''} {order.pincode ? `(${order.pincode})` : ''}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-stone-100 text-stone-750 border border-stone-200">
                                  {order.payment_method || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3 max-w-[200px] truncate text-[11px] text-stone-600" title={itemsSummary}>
                                {itemsSummary || '—'}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                                  <FiXCircle size={10} /> Cancelled
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="line-through text-stone-400 font-medium mr-1.5 text-[11px]">₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}</span>
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">₹0</span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder && setSelectedOrder(order)}
                                  className="text-[10px] font-bold text-stone-700 hover:text-stone-900 border border-stone-200 bg-white hover:bg-stone-50 px-2 py-1 rounded cursor-pointer transition-colors"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-stone-400 italic">No cancelled orders matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
