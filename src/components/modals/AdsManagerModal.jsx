import React, { useState, useMemo } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiCalendar,
  FiList,
  FiCheckSquare,
  FiSquare,
  FiChevronDown,
  FiChevronUp,
  FiTarget,
  FiX
} from 'react-icons/fi';
import { calculateOrderProfit } from '../../utils/helpers';

const formatCurrency = (val) => Math.round(Number(val) || 0).toLocaleString('en-IN');

export default function AdsManagerModal({
  showAdsModal,
  setShowAdsModal,
  adCampaigns = [],
  saveAdCampaign,
  deleteAdCampaign,
  orders = [],
  products = []
}) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'form'
  const [editingCampaignId, setEditingCampaignId] = useState(null);

  // Form State
  const [adName, setAdName] = useState('');
  const [platform, setPlatform] = useState('Meta / Instagram');
  const [spend, setSpend] = useState('');
  const [adDate, setAdDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [notes, setNotes] = useState('');

  // Orders Picker Filter inside Form
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'last7'
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  if (!showAdsModal) return null;

  // Filter out Cancelled orders for attribution
  const validOrders = useMemo(() => {
    return (orders || []).filter(o => o.status !== 'Cancelled');
  }, [orders]);

  // Order map for fast lookup
  const orderMap = useMemo(() => {
    const map = new Map();
    validOrders.forEach(o => map.set(o.id, o));
    return map;
  }, [validOrders]);

  // Reset form
  const resetForm = () => {
    setAdName('');
    setPlatform('Meta / Instagram');
    setSpend('');
    setAdDate(new Date().toISOString().split('T')[0]);
    setSelectedOrderIds([]);
    setNotes('');
    setEditingCampaignId(null);
    setOrderSearchQuery('');
    setOrderDateFilter('all');
  };

  // Open Form to Add New
  const handleOpenAddForm = () => {
    resetForm();
    setActiveView('form');
  };

  // Open Form to Edit
  const handleOpenEditForm = (campaign) => {
    setEditingCampaignId(campaign.id);
    setAdName(campaign.ad_name || '');
    setPlatform(campaign.platform || 'Meta / Instagram');
    setSpend(String(campaign.spend || ''));
    setAdDate(campaign.ad_date || new Date().toISOString().split('T')[0]);
    setSelectedOrderIds(Array.isArray(campaign.order_ids) ? [...campaign.order_ids] : []);
    setNotes(campaign.notes || '');
    setActiveView('form');
  };

  // Toggle order selection in form
  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Filter orders in picker
  const filteredOrdersForPicker = useMemo(() => {
    return validOrders.filter(order => {
      // 1. Date filter
      if (orderDateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 3600 * 1000);

        if (orderDateFilter === 'today' && orderDate < startOfToday) return false;
        if (orderDateFilter === 'yesterday' && (orderDate < startOfYesterday || orderDate >= startOfToday)) return false;
        if (orderDateFilter === 'last7' && orderDate < new Date(now.getTime() - 7 * 24 * 3600 * 1000)) return false;
      }

      // 2. Search query filter
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const id = String(order.id || '').toLowerCase();
        const name = String(order.customer_name || '').toLowerCase();
        const phone = String(order.phone || '').toLowerCase();
        return id.includes(q) || name.includes(q) || phone.includes(q);
      }

      return true;
    });
  }, [validOrders, orderDateFilter, orderSearchQuery]);

  // Live P&L metrics for the form based on currently selected orders and spend
  const liveFormMetrics = useMemo(() => {
    const numSpend = parseFloat(spend) || 0;
    let totalRevenue = 0;
    let totalBaseCost = 0;
    let totalDeliveryCost = 0;
    let totalOrderProfit = 0;

    selectedOrderIds.forEach(orderId => {
      const order = orderMap.get(orderId);
      if (order) {
        const profitDetails = calculateOrderProfit(order, products);
        totalRevenue += profitDetails.sellingPrice || 0;
        totalBaseCost += profitDetails.baseCost || 0;
        totalDeliveryCost += profitDetails.deliveryCost || 0;
        totalOrderProfit += profitDetails.profit || 0;
      }
    });

    const netProfitLoss = totalOrderProfit - numSpend;
    const roas = numSpend > 0 ? (totalRevenue / numSpend) : 0;

    return {
      numSpend,
      totalRevenue,
      totalBaseCost,
      totalDeliveryCost,
      totalOrderProfit,
      netProfitLoss,
      roas
    };
  }, [selectedOrderIds, spend, orderMap, products]);

  // Compute metrics for a specific campaign in the list
  const getCampaignMetrics = (campaign) => {
    const numSpend = Number(campaign.spend) || 0;
    const cOrderIds = Array.isArray(campaign.order_ids) ? campaign.order_ids : [];
    let totalRevenue = 0;
    let totalOrderProfit = 0;

    cOrderIds.forEach(orderId => {
      const order = orderMap.get(orderId);
      if (order) {
        const profitDetails = calculateOrderProfit(order, products);
        totalRevenue += profitDetails.sellingPrice || 0;
        totalOrderProfit += profitDetails.profit || 0;
      }
    });

    const netProfitLoss = totalOrderProfit - numSpend;
    const roas = numSpend > 0 ? (totalRevenue / numSpend) : 0;

    return {
      numSpend,
      ordersCount: cOrderIds.length,
      totalRevenue,
      totalOrderProfit,
      netProfitLoss,
      roas
    };
  };

  // Overall totals across all campaigns
  const overallCampaignTotals = useMemo(() => {
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let uniqueOrderIds = new Set();

    adCampaigns.forEach(c => {
      const m = getCampaignMetrics(c);
      totalSpend += m.numSpend;
      totalRevenue += m.totalRevenue;
      totalProfit += m.netProfitLoss;
      (c.order_ids || []).forEach(id => uniqueOrderIds.add(id));
    });

    const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;

    return {
      totalSpend,
      totalRevenue,
      totalProfit,
      uniqueOrdersCount: uniqueOrderIds.size,
      overallRoas
    };
  }, [adCampaigns, orderMap, products]);

  // Handle Form Submission
  const handleSubmitCampaign = (e) => {
    e.preventDefault();
    if (!adName.trim()) {
      alert('Please enter an Ad/Campaign Name');
      return;
    }

    const payload = {
      id: editingCampaignId || undefined,
      ad_name: adName.trim(),
      platform: platform.trim(),
      spend: parseFloat(spend) || 0,
      ad_date: adDate,
      order_ids: selectedOrderIds,
      notes: notes.trim()
    };

    saveAdCampaign(payload);
    resetForm();
    setActiveView('list');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-4xl w-full shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh] animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <FiTarget size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider">Marketing ROI</span>
                <span className="text-[10px] text-stone-400 font-mono">({adCampaigns.length} campaigns)</span>
              </div>
              <h3 className="text-sm font-bold text-stone-900">Ads Spend & Real Profit / Loss Tracker</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'list' ? (
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="bg-[#8c6239] hover:bg-[#744f2b] text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <FiPlus size={14} />
                <span>+ New Ad Entry</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveView('list');
                }}
                className="bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
              >
                <FiList size={14} />
                <span>View All Ads</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAdsModal(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer text-lg font-bold ml-2"
              title="Close Modal"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          
          {/* ======================================================== */}
          {/* VIEW 1: CAMPAIGNS LIST VIEW */}
          {/* ======================================================== */}
          {activeView === 'list' && (
            <div className="space-y-5">
              {/* Overall Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 border border-stone-200 rounded-lg p-3.5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Total Ad Spend</span>
                  <span className="text-lg font-extrabold text-stone-900 mt-0.5 block">
                    ₹ {formatCurrency(overallCampaignTotals.totalSpend)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Revenue From Ads</span>
                  <span className="text-lg font-extrabold text-[#8c6239] mt-0.5 block">
                    ₹ {formatCurrency(overallCampaignTotals.totalRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Net Profit / Loss</span>
                  <span className={`text-lg font-extrabold mt-0.5 block ${
                    overallCampaignTotals.totalProfit >= 0 ? 'text-green-700' : 'text-rose-600'
                  }`}>
                    {overallCampaignTotals.totalProfit >= 0 ? '+' : ''}₹ {formatCurrency(overallCampaignTotals.totalProfit)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Blended ROAS</span>
                  <span className="text-lg font-extrabold text-blue-700 mt-0.5 block">
                    {overallCampaignTotals.overallRoas.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Campaigns Table */}
              {adCampaigns.length > 0 ? (
                <div className="border border-stone-200 rounded-lg overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                        <th className="p-3">Ad Name / Platform</th>
                        <th className="p-3 text-right">Ad Spend</th>
                        <th className="p-3 text-center">Linked Orders</th>
                        <th className="p-3 text-right">Revenue</th>
                        <th className="p-3 text-right">Net Profit / Loss</th>
                        <th className="p-3 text-center">ROAS</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {adCampaigns.map(campaign => {
                        const m = getCampaignMetrics(campaign);
                        const isExpanded = expandedCampaignId === campaign.id;
                        const isProfitable = m.netProfitLoss >= 0;

                        return (
                          <React.Fragment key={campaign.id}>
                            <tr className="hover:bg-stone-50/70 transition-colors">
                              <td className="p-3">
                                <span className="font-bold text-stone-900 block">{campaign.ad_name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-semibold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                                    {campaign.platform || 'Meta'}
                                  </span>
                                  {campaign.ad_date && (
                                    <span className="text-[10px] text-stone-400 font-mono">
                                      {campaign.ad_date}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3 text-right font-bold text-stone-900 font-mono">
                                ₹ {formatCurrency(m.numSpend)}
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                  title="View linked orders"
                                >
                                  <span>{m.ordersCount} orders</span>
                                  {isExpanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                                </button>
                              </td>

                              <td className="p-3 text-right font-bold text-[#8c6239] font-mono">
                                ₹ {formatCurrency(m.totalRevenue)}
                              </td>

                              <td className="p-3 text-right">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                                  isProfitable
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {isProfitable ? '+' : ''}₹ {formatCurrency(m.netProfitLoss)}
                                </span>
                              </td>

                              <td className="p-3 text-center font-bold text-stone-700 font-mono">
                                {m.roas.toFixed(2)}x
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditForm(campaign)}
                                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                                    title="Edit Campaign"
                                  >
                                    <FiEdit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete ad entry "${campaign.ad_name}"?`)) {
                                        deleteAdCampaign(campaign.id);
                                      }
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Delete Campaign"
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Row: Linked Orders List */}
                            {isExpanded && (
                              <tr className="bg-stone-50/80">
                                <td colSpan={7} className="p-3 border-t border-stone-200">
                                  <div className="space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                                      Orders Attributed to this Ad ({m.ordersCount}):
                                    </span>
                                    {m.ordersCount > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {(campaign.order_ids || []).map(orderId => {
                                          const order = orderMap.get(orderId);
                                          if (!order) {
                                            return (
                                              <div key={orderId} className="p-2 bg-white border border-stone-200 rounded text-[11px] text-stone-400">
                                                Order #{orderId} (Not in active list)
                                              </div>
                                            );
                                          }
                                          const orderProfit = calculateOrderProfit(order, products);

                                          return (
                                            <div key={orderId} className="p-2 bg-white border border-stone-200 rounded flex justify-between items-center text-[11px] shadow-2xs">
                                              <div>
                                                <span className="font-bold text-stone-800 block">{order.id}</span>
                                                <span className="text-[10px] text-stone-500 truncate block max-w-[120px]">{order.customer_name}</span>
                                              </div>
                                              <div className="text-right">
                                                <span className="font-bold text-stone-900 block">₹ {order.total_amount}</span>
                                                <span className="text-[10px] font-semibold text-green-700 block">
                                                  +₹ {formatCurrency(orderProfit.profit)} profit
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-stone-400 italic">No orders linked to this ad yet.</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-stone-300 rounded-lg">
                  <FiTarget className="mx-auto text-stone-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-stone-700">No Ad Campaigns Added Yet</p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-sm mx-auto">
                    Track your Facebook, Instagram, or Google ad spend and select the orders that came from it to see exact profit and loss!
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddForm}
                    className="mt-4 bg-[#8c6239] hover:bg-[#744f2b] text-white text-xs font-bold px-4 py-2 rounded transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <FiPlus size={14} />
                    <span>Create First Ad Entry</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: FORM (+ ADD / EDIT CAMPAIGN) */}
          {/* ======================================================== */}
          {activeView === 'form' && (
            <form onSubmit={handleSubmitCampaign} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Ad Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Ad / Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Instagram Reels - Combo Pack Ad #1"
                    value={adName}
                    onChange={(e) => setAdName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  >
                    <option value="Meta / Instagram">Meta / Instagram</option>
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Influencer / Shoutout">Influencer / Shoutout</option>
                    <option value="WhatsApp Broadcast">WhatsApp Broadcast</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Ad Spend */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Ad Spend / Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 500"
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>

                {/* Ad Date */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Campaign Date
                  </label>
                  <input
                    type="date"
                    value={adDate}
                    onChange={(e) => setAdDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Target: Delhi & Mumbai"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-Time Live Profit / Loss Calculation Preview Banner */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    Live Calculation Preview (Selected Orders vs Ad Spend)
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {selectedOrderIds.length} orders selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded border border-stone-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Ad Spend</span>
                    <span className="text-sm font-bold text-rose-700 font-mono block">
                      -₹ {formatCurrency(liveFormMetrics.numSpend)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Total Sales</span>
                    <span className="text-sm font-bold text-stone-900 font-mono block">
                      ₹ {formatCurrency(liveFormMetrics.totalRevenue)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Orders Gross Profit</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono block">
                      +₹ {formatCurrency(liveFormMetrics.totalOrderProfit)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Net Profit / Loss</span>
                    <span className={`text-sm font-bold font-mono block ${
                      liveFormMetrics.netProfitLoss >= 0 ? 'text-green-700' : 'text-rose-600'
                    }`}>
                      {liveFormMetrics.netProfitLoss >= 0 ? '+' : ''}₹ {formatCurrency(liveFormMetrics.netProfitLoss)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                  <span>
                    Formula: <code className="bg-stone-200 px-1 rounded text-stone-800">Net P&L = Orders Gross Profit - Ad Spend</code>
                  </span>
                  <span className="font-bold text-blue-700 font-mono">
                    ROAS: {liveFormMetrics.roas.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Order Picker Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Select Orders Attributed To This Ad ({selectedOrderIds.length} Selected)
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      Click any order to link or unlink it from this ad campaign
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const filteredIds = filteredOrdersForPicker.map(o => o.id);
                        setSelectedOrderIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                      }}
                      className="text-[10px] font-bold uppercase text-blue-700 hover:underline cursor-pointer"
                    >
                      Select All Filtered
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderIds([])}
                      className="text-[10px] font-bold uppercase text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar for Orders */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {['all', 'today', 'yesterday', 'last7'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setOrderDateFilter(f)}
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded border transition-colors cursor-pointer ${
                          orderDateFilter === f
                            ? 'bg-stone-800 text-white border-stone-800'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : 'Last 7 Days'}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-60">
                    <input
                      type="text"
                      placeholder="Search order ID or name..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none pl-7"
                    />
                    <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders List Box */}
                <div className="border border-stone-200 rounded-lg overflow-y-auto max-h-64 divide-y divide-stone-100 bg-white">
                  {filteredOrdersForPicker.length > 0 ? (
                    filteredOrdersForPicker.map(order => {
                      const isSelected = selectedOrderIds.includes(order.id);
                      const profitDetails = calculateOrderProfit(order, products);

                      return (
                        <div
                          key={order.id}
                          onClick={() => toggleOrderSelection(order.id)}
                          className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/70' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[#8c6239]">
                              {isSelected ? <FiCheckSquare size={16} /> : <FiSquare size={16} className="text-stone-300" />}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs">{order.id}</span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-600 block">
                                {order.customer_name} &bull; {order.phone}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-stone-900 text-xs block">
                              ₹ {order.total_amount}
                            </span>
                            <span className="text-[10px] font-semibold text-green-700 block">
                              +₹ {formatCurrency(profitDetails.profit)} profit
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-stone-400">
                      No matching orders found.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveView('list');
                  }}
                  className="bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold px-4 py-2 rounded transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#8c6239] hover:bg-[#744f2b] text-white text-xs font-bold px-5 py-2 rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FiCheck size={14} />
                  <span>{editingCampaignId ? 'Update Ad Campaign' : 'Save Ad Campaign'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
