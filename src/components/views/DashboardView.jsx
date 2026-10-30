import React, { useState, useMemo } from 'react';
import {
  FiList,
  FiClock,
  FiPackage,
  FiCheckCircle,
  FiTrendingUp,
  FiTruck,
  FiStar,
  FiDollarSign,
  FiCreditCard,
  FiRefreshCw,
  FiLayers,
  FiShoppingBag,
  FiXCircle,
  FiAlertCircle,
  FiCalendar,
  FiTarget,
  FiRepeat
} from 'react-icons/fi';
import { calculateOrderProfit, isOrderInDateRange, getCurrentCourierStatusText, getOrderStatus, getRepeatLabel, getDateRangeBounds } from '../../utils/helpers';
import StoreMetricsModal from '../modals/StoreMetricsModal';

const formatApprox = (val) => Math.round(parseFloat(val) || 0).toLocaleString('en-IN');

export default function DashboardView({
  activeTab,
  handleDownloadSalesProfitReport,
  orderStatusCounts,
  setDeliveredDateFilter,
  setShowDeliveredListModal,
  deliveredCounts,
  deliveredCountsToday,
  calculatedSalesTotal,
  setShowSalesListModal,
  calculatedDeliveryTotal,
  setShowProfitListModal,
  setProfitListModalMode,
  calculatedProfitTotal,
  financialSummary,
  loadingFinancials,
  refreshAdminData,
  onSyncZipyOrders,
  syncingZipyOrders = false,
  setShowFinancialModal,
  setShowManualOrderModal,
  products = [],
  orders = [],
  setSelectedOrder,
  orderRepeatMap,
  dashboardDeliveredFilter,
  setDashboardDeliveredFilter,
  filterDeliveredOrdersByDate,
  allDeliveredOrders,
  deliveredRevenues,
  getOrderDeliveryDate,
  dashboardDateFilter = 'all',
  setDashboardDateFilter,
  dashboardCustomStart = '',
  setDashboardCustomStart,
  dashboardCustomEnd = '',
  setDashboardCustomEnd,
  setShowAdsModal,
  adCampaigns = []
}) {
  const [storeMetricModalType, setStoreMetricModalType] = useState(null);

  const isDateFiltered = Boolean(dashboardDateFilter && dashboardDateFilter !== 'all');

  const formattedDateRange = useMemo(() => {
    if (!isDateFiltered) return '';
    const bounds = getDateRangeBounds(dashboardDateFilter, dashboardCustomStart, dashboardCustomEnd);
    if (!bounds || (!bounds.start && !bounds.end)) return '';
    const formatD = (d) => {
      if (!d || isNaN(new Date(d).getTime())) return '';
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    const s = formatD(bounds.start);
    const e = formatD(bounds.end);
    if (s && e) return `${s} - ${e}`;
    if (s) return `${s} - End`;
    if (e) return `Start - ${e}`;
    return '';
  }, [isDateFiltered, dashboardDateFilter, dashboardCustomStart, dashboardCustomEnd]);

  // Filter schedules inside financialSummary when a date filter is selected
  const filteredFinancialSummary = useMemo(() => {
    if (!financialSummary) return financialSummary;
    if (!isDateFiltered) return financialSummary;

    const filterSchedule = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.filter(item => isOrderInDateRange(item, dashboardDateFilter, dashboardCustomStart, dashboardCustomEnd));
    };

    return {
      ...financialSummary,
      razorpay: financialSummary.razorpay ? {
        ...financialSummary.razorpay,
        settlements_schedule: filterSchedule(financialSummary.razorpay.settlements_schedule),
        pending_schedule: filterSchedule(financialSummary.razorpay.pending_schedule),
      } : financialSummary.razorpay,
      shiprocket: financialSummary.shiprocket ? {
        ...financialSummary.shiprocket,
        remittances_schedule: filterSchedule(financialSummary.shiprocket.remittances_schedule),
      } : financialSummary.shiprocket,
      zipypost: financialSummary.zipypost ? {
        ...financialSummary.zipypost,
        remittances_schedule: filterSchedule(financialSummary.zipypost.remittances_schedule),
      } : financialSummary.zipypost,
      courier_combined: financialSummary.courier_combined ? {
        ...financialSummary.courier_combined,
        remittances_schedule: filterSchedule(financialSummary.courier_combined.remittances_schedule),
        pending_schedule: filterSchedule(financialSummary.courier_combined.pending_schedule),
      } : financialSummary.courier_combined
    };
  }, [financialSummary, isDateFiltered, dashboardDateFilter, dashboardCustomStart, dashboardCustomEnd]);

  // --- Dynamic Ads Campaign Stats (Hook must be declared before any early return) ---
  const adCampaignsStats = useMemo(() => {
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let uniqueOrders = new Set();

    (adCampaigns || []).forEach(c => {
      const spend = Number(c.spend) || 0;
      totalSpend += spend;
      let orderProfitSum = 0;

      (c.order_ids || []).forEach(orderId => {
        uniqueOrders.add(orderId);
        const order = (orders || []).find(o => o.id === orderId);
        if (order) {
          const p = calculateOrderProfit(order, products);
          totalRevenue += p.sellingPrice || 0;
          orderProfitSum += p.profit || 0;
        }
      });

      totalProfit += (orderProfitSum - spend);
    });

    const roas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
    return {
      totalSpend,
      totalRevenue,
      totalProfit,
      ordersCount: uniqueOrders.size,
      roas
    };
  }, [adCampaigns, orders, products]);

  if (activeTab !== 'dashboard') return null;

  // --- Dynamic Razorpay & Payout Calculations ---
  const rtoOrders = (orders || []).filter(order => getOrderStatus(order) === 'RTO');
  const exceptionOrders = (orders || []).filter(order => getOrderStatus(order) === 'Exception');
  const getRtoStage = (order) => {
    const statusText = getCurrentCourierStatusText(order);
    if (/\b(exception|delivery attempt|attempted|undelivered|not delivered|failed delivery|ndr|out for delivery)\b/.test(statusText)) return 'other';
    if (/\b(?:rto|return|returned)\b.*\bdelivered\b|\bdelivered\b.*\b(?:rto|return|returned)\b/.test(statusText)) return 'delivered';
    if (/\b(?:rto|return|returned)\b.*\bin transit\b|\bin transit\b.*\b(?:rto|return|returned)\b/.test(statusText)) return 'in_transit';
    if (/\brto notified\b|\breturn notified\b/.test(statusText)) return 'in_transit';
    return 'other';
  };
  const rtoInTransitOrders = rtoOrders.filter(order => getRtoStage(order) === 'in_transit');
  const rtoDeliveredOrders = rtoOrders.filter(order => getRtoStage(order) === 'delivered');
  const nonCancelledOrders = (orders || []).filter(o => !['Cancelled', 'RTO'].includes(getOrderStatus(o)));
  const zipypostRtoCharges = financialSummary?.zipypost?.rto_charges_by_awb || {};
  const getRtoLedgerCharge = (order) => {
    const awb = String(order.shipment_details?.zipypost_awb || order.zipypost_awb || '').trim().toUpperCase();
    return awb ? zipypostRtoCharges[awb] || null : null;
  };
  const rtoBilledOrders = rtoOrders.filter(order => getRtoLedgerCharge(order)?.net_charge !== null && getRtoLedgerCharge(order)?.net_charge !== undefined);
  const rtoPendingOrders = rtoOrders.filter(order => !rtoBilledOrders.includes(order));
  const rtoLossActual = rtoBilledOrders.reduce((sum, order) => sum + Number(getRtoLedgerCharge(order).net_charge || 0), 0);
  const rtoPendingEstimate = rtoPendingOrders.reduce((sum, order) => {
    const { deliveryCost, hasDeliveryCost } = calculateOrderProfit(order, products);
    return sum + (hasDeliveryCost ? deliveryCost : 0);
  }, 0);
  const rtoLedgerLoaded = Boolean(financialSummary?.zipypost?.rto_charges_connected);

  const prepaidOrders = nonCancelledOrders.filter(o => {
    const pm = String(o.payment_method || '').toLowerCase();
    return pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid');
  });

  const rzpDeliveredOrders = prepaidOrders.filter(o => o.status === 'Delivered');
  const rzpPendingOrders = prepaidOrders.filter(o => o.status !== 'Delivered');

  const localRzpSettledSum = rzpDeliveredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const localRzpPendingSum = rzpPendingOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const localRzpTotalSum = prepaidOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const isRzpApiConnected = Boolean(financialSummary?.razorpay?.connected);
  const hasRazorpayReconciliationStatus = Object.prototype.hasOwnProperty.call(financialSummary?.razorpay || {}, 'pending_reconciliation_error');
  const hasRazorpayPendingVerification = hasRazorpayReconciliationStatus && !financialSummary?.razorpay?.pending_reconciliation_error;

  const rzpSettledFilteredSum = (filteredFinancialSummary?.razorpay?.settlements_schedule || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const rzpPendingFilteredSum = (filteredFinancialSummary?.razorpay?.pending_schedule || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  const razorpaySettledAmount = isDateFiltered
    ? (isRzpApiConnected && rzpSettledFilteredSum > 0 ? rzpSettledFilteredSum : localRzpSettledSum)
    : (isRzpApiConnected
        ? (financialSummary?.razorpay?.total_settled ?? localRzpSettledSum)
        : (financialSummary?.local_metrics?.prepaid_delivered_total ?? localRzpSettledSum));

  const razorpayPendingAmount = isDateFiltered
    ? (isRzpApiConnected && rzpPendingFilteredSum > 0 ? rzpPendingFilteredSum : localRzpPendingSum)
    : (isRzpApiConnected
        ? (financialSummary?.razorpay?.unsettled_balance ?? localRzpPendingSum)
        : (((financialSummary?.local_metrics?.prepaid_shipped_total || 0) + (financialSummary?.local_metrics?.prepaid_processing_total || 0)) || localRzpPendingSum));

  const razorpayTotalCaptured = isDateFiltered
    ? localRzpTotalSum
    : (isRzpApiConnected
        ? (financialSummary?.razorpay?.total_captured ?? localRzpTotalSum)
        : (financialSummary?.local_metrics?.prepaid_razorpay_total ?? localRzpTotalSum));

  const settledPercentage = razorpayTotalCaptured > 0
    ? Math.min(100, Math.round((razorpaySettledAmount / razorpayTotalCaptured) * 100))
    : 0;

  // --- Dynamic Offline Sales Calculations ---
  const isHandDelivered = (o) => {
    const pm = String(o.payment_method || '').toLowerCase();
    if (pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid')) return false;
    const courier = String(o.shiprocket_courier_name || '').toLowerCase();
    const id = String(o.id || '');
    return pm.includes('offline') || pm.includes('cash (offline)') || courier.includes('hand delivered') || courier.includes('direct') || courier.includes('self handover') || id.startsWith('ORD-OFFLINE');
  };

  const offlineOrders = nonCancelledOrders.filter(isHandDelivered);
  const offlineSalesTotal = isDateFiltered
    ? offlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
    : (financialSummary?.combined_summary?.offline_sales_total ?? offlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0));
  const offlineOrdersCount = isDateFiltered
    ? offlineOrders.length
    : (financialSummary?.combined_summary?.offline_orders_count ?? offlineOrders.length);

  const offlineProfitTotal = Number(offlineOrders.reduce((sum, o) => {
    const { profit } = calculateOrderProfit(o, products);
    return sum + profit;
  }, 0).toFixed(2));

  // --- Dynamic COD & Courier Remittance Calculations ---
  const codOrders = nonCancelledOrders.filter(o => {
    const pm = String(o?.payment_method || '').toLowerCase();
    return (pm.includes('cod') || pm.includes('cash on delivery')) && !isHandDelivered(o);
  });

  const localCodOrdersSum = codOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const totalCodAmount = isDateFiltered
    ? (offlineSalesTotal + localCodOrdersSum)
    : (financialSummary?.combined_summary?.total_cod_revenue ?? (offlineSalesTotal + localCodOrdersSum));
  const totalCodCount = isDateFiltered
    ? (offlineOrders.length + codOrders.length)
    : (financialSummary?.combined_summary?.total_cod_orders_count ?? (offlineOrders.length + codOrders.length));

  const totalCodProfitTotal = Number([...offlineOrders, ...codOrders].reduce((sum, o) => {
    const { profit } = calculateOrderProfit(o, products);
    return sum + profit;
  }, 0).toFixed(2));

  // --- Dynamic Online Sales Calculations ---
  const onlineOrders = nonCancelledOrders.filter(o => {
    const pm = String(o?.payment_method || '').toLowerCase();
    return (pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid')) && !isHandDelivered(o);
  });
  const onlineSalesTotal = Number(onlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toFixed(2));
  const onlineProfitTotal = Number(onlineOrders.reduce((sum, o) => {
    const { profit } = calculateOrderProfit(o, products);
    return sum + profit;
  }, 0).toFixed(2));

  const codDeliveredOrders = codOrders.filter(o => o.status === 'Delivered');
  const codShippedOrders = codOrders.filter(o => o.status === 'Shipped');
  const codProcessingOrders = codOrders.filter(o => o.status === 'Processing' || o.status === 'Placed');

  const localCodDeliveredSum = codDeliveredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const localCodShippedSum = codShippedOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const localCodProcessingSum = codProcessingOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const localCodDeliveredRemittedSum = codDeliveredOrders.filter(o => 
    Boolean(o.is_paid) ||
    Boolean(o.cod_remitted) ||
    String(o.payment_status || '').toLowerCase() === 'paid' ||
    Boolean(o.shipment_details?.cod_remitted) ||
    Boolean(o.shipment_details?.is_paid)
  ).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const localCodDeliveredPendingSum = codDeliveredOrders.filter(o => 
    !Boolean(o.is_paid) &&
    !Boolean(o.cod_remitted) &&
    String(o.payment_status || '').toLowerCase() !== 'paid' &&
    !Boolean(o.shipment_details?.cod_remitted) &&
    !Boolean(o.shipment_details?.is_paid)
  ).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const isSrConnected = Boolean(financialSummary?.shiprocket?.connected);
  const isZpConnected = Boolean(financialSummary?.zipypost?.connected);

  const courierRemittedFilteredSum = (filteredFinancialSummary?.courier_combined?.remittances_schedule || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const courierPendingFilteredSum = (filteredFinancialSummary?.courier_combined?.pending_schedule || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  // 1. Courier COD Received in Bank (Shiprocket + ZipyPost)
  const srReceived = isSrConnected
    ? (financialSummary?.shiprocket?.cod_received_in_bank || 0)
    : (financialSummary?.local_metrics?.cod_delivered_remitted_total || 0);
  const zpReceived = isZpConnected
    ? (financialSummary?.zipypost?.cod_received_in_bank || 0)
    : 0;
  const courierCodReceived = isDateFiltered
    ? ((isSrConnected || isZpConnected) && courierRemittedFilteredSum > 0 ? courierRemittedFilteredSum : localCodDeliveredRemittedSum)
    : (financialSummary?.combined_summary?.courier_cod_received_in_bank ?? (srReceived + zpReceived));

  // 2. Courier COD Pending Payout (Shiprocket + ZipyPost)
  const srPending = isSrConnected
    ? (financialSummary?.shiprocket?.upcoming_remittance_total ?? localCodDeliveredSum)
    : (financialSummary?.combined_summary?.cod_delivered_pending ?? localCodDeliveredSum);
  const zpPending = isZpConnected
    ? (financialSummary?.zipypost?.upcoming_remittance_total || 0)
    : 0;
  const inTransitPending = financialSummary?.local_metrics?.cod_shipped_total ?? localCodShippedSum;
  const courierCodPending = isDateFiltered
    ? ((isSrConnected || isZpConnected) && courierPendingFilteredSum > 0 ? courierPendingFilteredSum : (localCodDeliveredPendingSum + localCodShippedSum))
    : (financialSummary?.combined_summary?.courier_cod_pending_payout ?? (srPending + zpPending + inTransitPending));

  // Backward compatible references for legacy cards and widgets
  const codReceivedInBank = courierCodReceived;
  const shiprocketUpcomingRemittance = srPending;

  // Exact count of orders in Shiprocket upcoming remittance
  const shiprocketUpcomingCount = isSrConnected && Array.isArray(financialSummary?.shiprocket?.remittances_schedule)
    ? financialSummary.shiprocket.remittances_schedule.filter(r => r.status === 'Pending Payout').length
    : codDeliveredOrders.filter(o => !o.shipment_details?.cod_remitted).length;

  // Total Future Expected COD Revenue (Processing + Shipped + Delivered Pending)
  const totalFutureCodExpected = localCodProcessingSum + localCodShippedSum + srPending;

  return (
    <div className="space-y-6 font-sans text-stone-800 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#8c6239]">Store Performance & Financial Ledger</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">Simple overview of online sales, Shiprocket COD, direct offline cash, and store metrics</p>
        </div>

        {/* Date Filter & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date / Period Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded px-2.5 py-1.5 shadow-2xs">
            <FiCalendar className="text-[#8c6239] shrink-0" size={13} />
            <select
              value={dashboardDateFilter}
              onChange={(e) => setDashboardDateFilter(e.target.value)}
              className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-stone-700 outline-none cursor-pointer"
              title="Filter dashboard data by date or period"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week (Last 7 Days)</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {dashboardDateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setDashboardDateFilter('all');
                  setDashboardCustomStart('');
                  setDashboardCustomEnd('');
                }}
                className="ml-1 text-stone-400 hover:text-stone-800 font-bold text-xs px-1 hover:bg-stone-100 rounded"
                title="Reset date filter to All Time"
              >
                ✕
              </button>
            )}
          </div>

          {/* Custom Date Pickers (Visible only when 'custom' is selected) */}
          {dashboardDateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded px-2.5 py-1 shadow-2xs text-[11px]">
              <input
                type="date"
                value={dashboardCustomStart}
                onChange={(e) => setDashboardCustomStart(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-stone-700 text-[11px] outline-none"
                title="Start Date"
              />
              <span className="text-stone-400 text-xs font-semibold">to</span>
              <input
                type="date"
                value={dashboardCustomEnd}
                onChange={(e) => setDashboardCustomEnd(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-stone-700 text-[11px] outline-none"
                title="End Date"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onSyncZipyOrders}
            disabled={syncingZipyOrders}
            className="bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 disabled:opacity-60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer disabled:cursor-wait flex items-center gap-1.5 shadow-2xs"
            title="Immediately sync active ZipyPost shipment statuses"
          >
            <FiRefreshCw className={syncingZipyOrders ? 'animate-spin' : ''} size={12} />
            {syncingZipyOrders ? 'Syncing Orders...' : 'Sync Orders'}
          </button>
          <button
            type="button"
            onClick={refreshAdminData}
            disabled={loadingFinancials}
            className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Refresh all admin data"
          >
            <FiRefreshCw className={loadingFinancials ? 'animate-spin text-[#8c6239]' : 'text-stone-500'} size={12} />
            {loadingFinancials ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={handleDownloadSalesProfitReport}
            className="bg-[#8c6239] hover:bg-stone-900 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Active Date Filter Notice Banner */}
      {isDateFiltered && (
        <div className="bg-[#8c6239]/10 border border-[#8c6239]/30 rounded-md px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#8c6239] animate-pulse"></span>
            <span className="font-semibold text-[#8c6239]">Filtered Period:</span>
            <span className="capitalize font-medium">
              {dashboardDateFilter === 'custom'
                ? `${dashboardCustomStart || 'Start'} to ${dashboardCustomEnd || 'End'}`
                : dashboardDateFilter.replace('_', ' ')}
            </span>
            <span className="text-stone-500 font-mono text-[11px]">
              ({orders.length} order{orders.length === 1 ? '' : 's'} in selected period)
            </span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {formattedDateRange && (
              <span className="font-mono text-stone-800 font-bold bg-white/80 border border-[#8c6239]/30 px-2 py-0.5 rounded text-[11px] shadow-2xs">
                {formattedDateRange}
              </span>
            )}
            <button
              onClick={() => {
                setDashboardDateFilter('all');
                setDashboardCustomStart('');
                setDashboardCustomEnd('');
              }}
              className="text-[11px] font-bold text-[#8c6239] hover:underline cursor-pointer flex items-center gap-1"
            >
              Reset to All Time ✕
            </button>
          </div>
        </div>
      )}

      {/* 📊 ALL-IN-ONE PRIMARY STORE STATS GRID */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <FiShoppingBag className="text-[#8c6239]" size={15} /> Store Metrics & Order Performance
          </h3>
          <span className="text-[10px] text-stone-400 font-mono">Click card for detailed lists</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Total Orders</span>
              <FiList className="text-[#8c6239]" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.All}</h3>
              <p className="text-[9px] text-stone-500 font-light mt-0.5">All customer orders</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">Processing</span>
              <FiClock className="text-amber-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.Processing}</h3>
              <p className="text-[9px] text-stone-500 font-light mt-0.5">Pending fulfillment</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider">Shipped</span>
              <FiPackage className="text-blue-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.Shipped}</h3>
              <p className="text-[9px] text-stone-500 font-light mt-0.5">In courier transit</p>
            </div>
          </div>

          <div 
            onClick={() => {
              setDeliveredDateFilter('all');
              setShowDeliveredListModal(true);
            }}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-green-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Delivered Orders List"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-green-700 tracking-wider">Delivered</span>
              <FiCheckCircle className="text-green-600" size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.Delivered}</h3>
                <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                  Today: {deliveredCounts.today}
                </span>
              </div>
              <p className="text-[9px] text-green-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">Delivered List &rarr;</p>
            </div>
          </div>

          {/* Cancelled Orders Metric Box */}
          <div 
            onClick={() => setStoreMetricModalType('cancelled_orders')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-rose-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Cancelled Orders List"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-rose-700 tracking-wider">Cancelled</span>
              <FiXCircle className="text-rose-600" size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-rose-900">{orderStatusCounts.Cancelled}</h3>
              </div>
              <p className="text-[9px] text-rose-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">Cancelled List &rarr;</p>
            </div>
          </div>

          <div
            onClick={() => setStoreMetricModalType('exception_orders')}
            className="bg-white border border-amber-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-amber-500 transition-all hover:bg-amber-50/50 group"
            title="Click to review orders requiring another delivery attempt"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Delivery Exceptions</span>
              <FiAlertCircle className="text-amber-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900">{exceptionOrders.length}</h3>
              <p className="text-[9px] text-amber-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">Needs another attempt · View orders →</p>
            </div>
          </div>

          <div
            onClick={() => setStoreMetricModalType('rto_orders')}
            className="bg-white border border-orange-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-orange-500 transition-all hover:bg-orange-50/40 group"
            title={financialSummary?.zipypost?.rto_charges_error || 'Click to view RTO orders and ZipyPost net billed charges'}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-orange-700 tracking-wider">RTO Loss (Net)</span>
              <FiRefreshCw className="text-orange-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-800">
                {rtoLedgerLoaded ? `Rs. ${rtoLossActual.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : loadingFinancials ? 'Loading ledger…' : 'Ledger unavailable'}
              </h3>
              <p className="text-[9px] text-orange-700 font-semibold mt-0.5 uppercase tracking-wide">
                {rtoBilledOrders.length} billed · {rtoPendingOrders.length} pending · details &rarr;
              </p>
              {rtoPendingOrders.length > 0 && <p className="text-[9px] text-stone-500">Pending freight est. Rs. {rtoPendingEstimate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
            </div>
          </div>

          <div
            onClick={() => setStoreMetricModalType('rto_in_transit')}
            className="bg-white border border-amber-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-amber-500 transition-all hover:bg-amber-50/40 group"
            title="Click to view RTO shipments currently in transit"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">RTO In Transit</span>
              <FiTruck className="text-amber-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-800">{rtoInTransitOrders.length}</h3>
              <p className="text-[9px] text-amber-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">View Orders &rarr;</p>
            </div>
          </div>

          <div
            onClick={() => setStoreMetricModalType('rto_delivered')}
            className="bg-white border border-emerald-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-emerald-500 transition-all hover:bg-emerald-50/40 group"
            title="Click to view RTO shipments delivered back to sender"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">RTO Delivered</span>
              <FiCheckCircle className="text-emerald-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">{rtoDeliveredOrders.length}</h3>
              <p className="text-[9px] text-emerald-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">View Orders &rarr;</p>
            </div>
          </div>

          <div 
            onClick={() => setShowSalesListModal(true)}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-[#8c6239] transition-all hover:bg-stone-50/80"
            title="Click to view all sales orders"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Total Sales</span>
              <FiTrendingUp className="text-[#8c6239]" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#8c6239]">Rs. {formatApprox(calculatedSalesTotal)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Sales &rarr;</p>
            </div>
          </div>

          <div 
            onClick={() => {
              setProfitListModalMode?.('shipment_cost');
              setShowProfitListModal(true);
            }}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-purple-500 transition-all hover:bg-stone-50/80"
            title="Click to view delivery cost breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider">Shipment Cost</span>
              <FiTruck className="text-purple-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-600">Rs. {formatApprox(calculatedDeliveryTotal)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Courier &rarr;</p>
            </div>
          </div>

          <div 
            onClick={() => {
              setProfitListModalMode?.('total_profit');
              setShowProfitListModal(true);
            }}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-green-600 transition-all hover:bg-stone-50/80"
            title="Click to view net profit breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-green-600 tracking-wider">Total Profit</span>
              <FiStar className="text-green-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-600">Rs. {formatApprox(calculatedProfitTotal)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Profit &rarr;</p>
            </div>
          </div>
        </div>

        {/* ROW 2: 6 SALES & PROFIT CHANNEL BOXES (OFFLINE, TOTAL COD, ONLINE) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          {/* Box 1: Offline Sales */}
          <div
            onClick={() => setStoreMetricModalType('offline_sales')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-emerald-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view all Offline Sales Orders"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Offline Sales</span>
              <FiDollarSign className="text-emerald-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">₹ {formatApprox(offlineSalesTotal)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                {offlineOrdersCount} Direct Orders &rarr;
              </p>
            </div>
          </div>

          {/* Box 2: Offline Sales Profit */}
          <div
            onClick={() => setStoreMetricModalType('offline_profit')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-emerald-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Offline Sales Profit breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Offline Profit</span>
              <FiTrendingUp className="text-emerald-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">
                ₹ {formatApprox(offlineProfitTotal)}
              </h3>
              <p className="text-[9px] text-emerald-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                100% Cash In Hand &rarr;
              </p>
            </div>
          </div>

          {/* Box 3: Total COD (Offline sales + COD order) */}
          <div
            onClick={() => setStoreMetricModalType('total_cod')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-amber-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Total COD Orders (Offline Cash + Courier COD)"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Total COD Sales</span>
              <FiLayers className="text-amber-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900">₹ {formatApprox(totalCodAmount)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                {totalCodCount} Cash + Courier COD &rarr;
              </p>
            </div>
          </div>

          {/* Box 4: Total COD Profit */}
          <div
            onClick={() => setStoreMetricModalType('total_cod_profit')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-amber-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Total COD Profit breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Total COD Profit</span>
              <FiTrendingUp className="text-amber-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900">
                ₹ {formatApprox(totalCodProfitTotal)}
              </h3>
              <p className="text-[9px] text-amber-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Cash + Courier Margin &rarr;
              </p>
            </div>
          </div>

          {/* Box 5: Total Online Sales */}
          <div
            onClick={() => setStoreMetricModalType('online_sales')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-blue-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view all Online Prepaid Orders"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">Total Online Sales</span>
              <FiCreditCard className="text-blue-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">₹ {formatApprox(onlineSalesTotal)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                {onlineOrders.length} Prepaid Checkout &rarr;
              </p>
            </div>
          </div>

          {/* Box 6: Total Online Profit */}
          <div
            onClick={() => setStoreMetricModalType('online_profit')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-blue-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Total Online Profit breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">Total Online Profit</span>
              <FiTrendingUp className="text-blue-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">
                ₹ {formatApprox(onlineProfitTotal)}
              </h3>
              <p className="text-[9px] text-blue-700 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Razorpay Net Margin &rarr;
              </p>
            </div>
          </div>

        </div>

        {/* ROW 3: ADS & NET PROFIT CHANNEL (SPACIOUS 2-COLUMN ROW) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Box 7: Ads (Marketing Spend & Real Profit) */}
          <div
            onClick={() => setShowAdsModal && setShowAdsModal(true)}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-[#8c6239] transition-all hover:bg-stone-50/80 group"
            title="Click to view and manage Ads campaigns, spend & exact Profit/Loss"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider">Ads & ROI</span>
              <FiTarget className="text-[#8c6239]" size={18} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-stone-900">
                  ₹ {formatApprox(adCampaignsStats.totalSpend)}
                </h3>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  adCampaignsStats.totalProfit >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {adCampaignsStats.totalProfit >= 0 ? '+' : ''}₹{formatApprox(adCampaignsStats.totalProfit)}
                </span>
              </div>
              <p className="text-[9px] text-[#8c6239] font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                {adCampaignsStats.ordersCount} Orders &bull; {adCampaignsStats.roas.toFixed(1)}x ROAS &rarr;
              </p>
            </div>
          </div>

          {/* Box 8: Total Profit After Minus Total Ads Amount */}
          <div
            onClick={() => {
              setProfitListModalMode?.('after_ads');
              setShowProfitListModal && setShowProfitListModal(true);
            }}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-emerald-600 transition-all hover:bg-stone-50/80 group"
            title="Total Profit minus Total Ads Amount"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider">Profit (After Ads)</span>
              <FiTrendingUp className="text-emerald-600" size={18} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className={`text-xl font-bold ${
                  (calculatedProfitTotal - adCampaignsStats.totalSpend) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  ₹ {formatApprox(calculatedProfitTotal - adCampaignsStats.totalSpend)}
                </h3>
                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Net In Hand
                </span>
              </div>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Profit - ₹{formatApprox(adCampaignsStats.totalSpend)} Ads &rarr;
              </p>
            </div>
          </div>

        </div>

        {/* ROW 4: 4 LIVE BANK SETTLEMENTS & COURIER PAYOUT METRICS */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Box 7: Razorpay se kitna paisa bank me aa chuka */}
          <div
            onClick={() => setStoreMetricModalType('razorpay_received')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-blue-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Razorpay bank settlements"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">Razorpay in Bank</span>
              <FiCheckCircle className="text-blue-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-800">₹ {formatApprox(razorpaySettledAmount)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Aa Chuka Paisa &rarr;
              </p>
            </div>
          </div>

          {/* Box 8: Razorpay se kitna paisa bank me ane wala h */}
          <div
            onClick={() => setStoreMetricModalType('razorpay_pending')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-sky-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Razorpay pending settlements"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-sky-700 tracking-wider">Razorpay Pending</span>
              <FiClock className="text-sky-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-sky-800">{isRzpApiConnected && hasRazorpayPendingVerification
                ? `₹ ${formatApprox(razorpayPendingAmount)}`
                : isRzpApiConnected && !hasRazorpayReconciliationStatus ? 'Backend update needed' : 'Verification unavailable'}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Aane Wala Paisa &rarr;
              </p>
            </div>
          </div>

          {/* Box 9: Shiprocket + Zipypost se kitna paisa bank me aa chuka */}
          <div
            onClick={() => setStoreMetricModalType('courier_received')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-purple-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Shiprocket + ZipyPost remitted payouts"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-purple-700 tracking-wider">Courier in Bank</span>
              <FiTruck className="text-purple-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-900">₹ {formatApprox(courierCodReceived)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Shiprocket + ZipyPost &rarr;
              </p>
            </div>
          </div>

          {/* Box 10: Shiprocket + zipypost se kitna paisa bank me ane wala h */}
          <div
            onClick={() => setStoreMetricModalType('courier_pending')}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-purple-600 transition-all hover:bg-stone-50/80 group"
            title="Click to view Shiprocket + ZipyPost pending payouts"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-purple-700 tracking-wider">Courier Pending</span>
              <FiClock className="text-purple-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-900">₹ {formatApprox(courierCodPending)}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide group-hover:underline">
                Aane Wala Paisa &rarr;
              </p>
            </div>
          </div>

        </div>
      </div>

   

      {/* LOWER SECTION: RECENT ORDERS & DELIVERED QUICK LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Orders Activity */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-3">
          <h3 className="text-xs uppercase font-bold tracking-wider text-stone-900 border-b border-stone-150 pb-2.5 flex items-center justify-between">
            <span>Recent Orders Activity</span>
            <span className="text-[10px] font-normal text-stone-400 font-mono">{orders.length} total orders</span>
          </h3>
          {orders.length > 0 ? (
            <div className="space-y-2.5">
              {orders.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex justify-between items-center gap-4 text-xs hover:bg-stone-50 p-2.5 rounded cursor-pointer transition-colors border border-stone-150"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-stone-900">{order.id}</span>
                      <span className="font-semibold text-stone-800">{order.customer_name}</span>
                      {orderRepeatMap?.get(String(order.id))?.isRepeat && (
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200"
                          title={`Repeat Customer: Order #${orderRepeatMap.get(String(order.id)).orderIndex} (${orderRepeatMap.get(String(order.id)).totalOrders} total orders)`}
                        >
                          <FiRepeat size={8} />
                          {getRepeatLabel(orderRepeatMap.get(String(order.id)).orderIndex)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 font-light space-y-0.5">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="truncate max-w-40">
                          {item.product?.name || "Attar"} ({item.selectedSize || "3ml"}) x {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-stone-900 block">Rs. {formatApprox(order.total_amount)}</span>
                    <span className={`inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                      order.status === 'Delivered' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : order.status === 'Shipped' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 p-6 text-center font-light">No recent orders registered in database.</p>
          )}
        </div>

        {/* Right Column: Delivered Orders Dashboard View */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-150 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <FiCheckCircle className="text-green-600" size={15} />
              <h3 className="text-xs uppercase font-bold tracking-wider text-stone-900">
                Delivered Orders Ledger
              </h3>
            </div>
            
            <div className="flex items-center gap-1">
              {[
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'today', label: 'Today' },
                { id: 'last7days', label: 'Last 7 Days' },
                { id: 'all', label: 'All' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDashboardDeliveredFilter(t.id)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer transition-all ${
                    dashboardDeliveredFilter === t.id
                      ? 'bg-green-700 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {t.label} ({deliveredCounts[t.id] || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-green-50/60 border border-green-150 p-2.5 rounded text-xs">
            <span className="font-semibold text-green-800">
              {dashboardDeliveredFilter === 'yesterday'
                ? "Yesterday's Delivered"
                : dashboardDeliveredFilter === 'today'
                  ? "Today's Delivered"
                  : dashboardDeliveredFilter === 'last7days'
                    ? "Last 7 Days Delivered"
                    : "All Delivered"}
            </span>
            <span className="font-bold text-green-700 font-mono">
              {filterDeliveredOrdersByDate(allDeliveredOrders, dashboardDeliveredFilter).length} Orders &bull; Rs. {formatApprox(deliveredRevenues[dashboardDeliveredFilter] || 0)}
            </span>
          </div>

          {(() => {
            const list = filterDeliveredOrdersByDate(allDeliveredOrders, dashboardDeliveredFilter);
            if (list.length === 0) {
              return (
                <div className="p-6 text-center text-stone-400 text-xs">
                  No delivered orders found for {dashboardDeliveredFilter === 'yesterday' ? 'yesterday' : dashboardDeliveredFilter}.
                </div>
              );
            }
            return (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {list.map(order => {
                  const delDate = getOrderDeliveryDate(order);
                  const isRazorpay = String(order.payment_method || '').toLowerCase().includes('razorpay') || String(order.payment_method || '').toLowerCase().includes('payment id');
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-between gap-3 text-xs p-2.5 rounded bg-stone-50 border border-stone-150 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-stone-900">{order.id}</span>
                          <span className="font-semibold text-stone-800">{order.customer_name}</span>
                      {orderRepeatMap?.get(String(order.id))?.isRepeat && (
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200"
                          title={`Repeat Customer: Order #${orderRepeatMap.get(String(order.id)).orderIndex} (${orderRepeatMap.get(String(order.id)).totalOrders} total orders)`}
                        >
                          <FiRepeat size={8} />
                          {getRepeatLabel(orderRepeatMap.get(String(order.id)).orderIndex)}
                        </span>
                      )}
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {delDate
                            ? `Delivered: ${delDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} at ${delDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}`
                            : 'Delivery date unavailable'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-green-700 block">Rs. {formatApprox(order.total_amount)}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isRazorpay ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {isRazorpay ? 'Razorpay' : 'COD'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => {
                setDeliveredDateFilter(dashboardDeliveredFilter);
                setShowDeliveredListModal(true);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-green-700 hover:text-green-900 cursor-pointer flex items-center gap-1 ml-auto"
            >
              Open Full Delivered Orders List & Export PDF &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 📋 STORE METRICS MODAL FOR ALL METRIC BOXES */}
      <StoreMetricsModal
        isOpen={Boolean(storeMetricModalType)}
        onClose={() => setStoreMetricModalType(null)}
        modalType={storeMetricModalType}
        financialSummary={filteredFinancialSummary}
        orders={orders}
        products={products}
        setSelectedOrder={setSelectedOrder}
      />
    </div>
  );
}
