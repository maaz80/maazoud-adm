import React from 'react';
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
  FiArrowUpRight,
  FiLayers,
  FiShoppingBag
} from 'react-icons/fi';
import { calculateOrderProfit } from '../../utils/helpers';

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
  calculatedProfitTotal,
  financialSummary,
  loadingFinancials,
  fetchFinancialSummary,
  setShowFinancialModal,
  setShowManualOrderModal,
  products = [],
  orders = [],
  setSelectedOrder,
  dashboardDeliveredFilter,
  setDashboardDeliveredFilter,
  filterDeliveredOrdersByDate,
  allDeliveredOrders,
  deliveredRevenues,
  getOrderDeliveryDate
}) {
  if (activeTab !== 'dashboard') return null;

  // --- Dynamic Razorpay & Payout Calculations ---
  const nonCancelledOrders = (orders || []).filter(o => o.status !== 'Cancelled');

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

  const razorpaySettledAmount = isRzpApiConnected
    ? (financialSummary?.razorpay?.total_settled ?? localRzpSettledSum)
    : (financialSummary?.local_metrics?.prepaid_delivered_total ?? localRzpSettledSum);

  const razorpayPendingAmount = isRzpApiConnected
    ? (financialSummary?.razorpay?.unsettled_balance ?? localRzpPendingSum)
    : (((financialSummary?.local_metrics?.prepaid_shipped_total || 0) + (financialSummary?.local_metrics?.prepaid_processing_total || 0)) || localRzpPendingSum);

  const razorpayTotalCaptured = isRzpApiConnected
    ? (financialSummary?.razorpay?.total_captured ?? localRzpTotalSum)
    : (financialSummary?.local_metrics?.prepaid_razorpay_total ?? localRzpTotalSum);

  const settledPercentage = razorpayTotalCaptured > 0
    ? Math.min(100, Math.round((razorpaySettledAmount / razorpayTotalCaptured) * 100))
    : 0;

  // --- Dynamic Offline Sales Calculations ---
  const offlineOrders = nonCancelledOrders.filter(o => {
    const pm = String(o.payment_method || '').toLowerCase();
    return pm.includes('offline') || pm.includes('cash (offline)') || String(o.id || '').startsWith('ORD-OFFLINE');
  });

  const offlineSalesTotal = offlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const offlineProfitTotal = Number(offlineOrders.reduce((sum, o) => {
    const { profit } = calculateOrderProfit(o, products);
    return sum + profit;
  }, 0).toFixed(2));

  // --- Dynamic COD & Shiprocket Remittance Calculations ---
  const codOrders = nonCancelledOrders.filter(o => {
    const pm = String(o.payment_method || '').toLowerCase();
    return (pm.includes('cod') || pm.includes('cash on delivery')) && !pm.includes('offline');
  });

  const codDeliveredOrders = codOrders.filter(o => o.status === 'Delivered');
  const codShippedOrders = codOrders.filter(o => o.status === 'Shipped');
  const codProcessingOrders = codOrders.filter(o => o.status === 'Processing' || o.status === 'Placed');

  const localCodDeliveredSum = codDeliveredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const localCodShippedSum = codShippedOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const localCodProcessingSum = codProcessingOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const isSrConnected = Boolean(financialSummary?.shiprocket?.connected);

  // 1. COD Remitted to Bank (Already Received)
  const codReceivedInBank = isSrConnected
    ? (financialSummary?.combined_summary?.cod_already_received_in_bank || 0)
    : 0;

  // 2. Shiprocket Upcoming Remittance (Delivered Pending Remittance)
  const shiprocketUpcomingRemittance = isSrConnected
    ? (financialSummary?.shiprocket?.upcoming_remittance_total ?? localCodDeliveredSum)
    : (financialSummary?.combined_summary?.cod_delivered_pending ?? localCodDeliveredSum);

  // Exact count of orders in Shiprocket upcoming remittance
  const shiprocketUpcomingCount = isSrConnected && Array.isArray(financialSummary?.shiprocket?.remittances_schedule)
    ? financialSummary.shiprocket.remittances_schedule.filter(r => r.status === 'Pending Payout').length
    : codDeliveredOrders.filter(o => !o.shipment_details?.cod_remitted).length;

  // 3. Total Future Expected COD Revenue (Processing + Shipped + Delivered Pending)
  const totalFutureCodExpected = localCodProcessingSum + localCodShippedSum + shiprocketUpcomingRemittance;

  return (
    <div className="space-y-6 font-sans text-stone-800 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#8c6239]">Store Performance & Financial Ledger</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">Simple overview of online sales, Shiprocket COD, direct offline cash, and store metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFinancialSummary}
            disabled={loadingFinancials}
            className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Refresh bank payouts and order counts"
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

      {/* 💳, 🚚 & 🤝 PAYOUT & SALES TRACKERS GRID (3 COLUMNS: ONLINE, COD, OFFLINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 💳 1. RAZORPAY BANK PAYOUT BOX */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                <FiCreditCard size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Razorpay Settlements
                  </h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isRzpApiConnected 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {isRzpApiConnected ? 'Live API' : 'Order Sync'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Online prepaid payouts</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="text-[10px] font-bold text-[#8c6239] hover:text-stone-900 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            >
              Details &rarr;
            </button>
          </div>

          {/* Metrics 3 Cards */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {/* Card 1: Bank Me Aa Chuka */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Bank Me Aa Chuka</span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {rzpDeliveredOrders.length} Orders
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {razorpaySettledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">Credited to Bank Account</p>
            </div>

            {/* Card 2: Bank Me Aane Wala */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Bank Me Aane Wala</span>
                <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {rzpPendingOrders.length} Orders
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {razorpayPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">Captured, pending bank transfer</p>
            </div>

            {/* Card 3: Total Online */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-stone-600 tracking-wider">Total Online</span>
                <span className="text-[9px] font-semibold text-stone-700 bg-stone-100 px-1 py-0.2 rounded border border-stone-200">
                  {prepaidOrders.length} Prepaid
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {razorpayTotalCaptured.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">{settledPercentage}% Settled to Bank</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs space-y-1.5">
            <div className="flex justify-between text-[10px] text-stone-600">
              <span>Settlement Progress</span>
              <span className="font-mono">
                <strong className="text-emerald-700">₹{razorpaySettledAmount.toLocaleString('en-IN')}</strong> in Bank
              </span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded overflow-hidden flex">
              <div style={{ width: `${settledPercentage}%` }} className="bg-emerald-600 h-full"></div>
              <div style={{ width: `${100 - settledPercentage}%` }} className="bg-amber-500 h-full"></div>
            </div>
          </div>
        </div>

        {/* 🚚 2. SHIPROCKET COD PAYOUT BOX */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                <FiTruck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Shiprocket COD Payouts
                  </h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isSrConnected 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {isSrConnected ? 'Live API' : 'Order Sync'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Courier cash remittances</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="text-[10px] font-bold text-[#8c6239] hover:text-stone-900 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            >
              Details &rarr;
            </button>
          </div>

          {/* Metrics 3 Cards */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {/* Card 1: Bank Me Aa Gaya */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Bank Me Aa Gaya</span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Remitted
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {codReceivedInBank.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">COD remitted to bank account</p>
            </div>

            {/* Card 2: Shiprocket Upcoming */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-purple-700 tracking-wider">Upcoming Payout</span>
                <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                  {shiprocketUpcomingCount} Delivered
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {shiprocketUpcomingRemittance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">Delivered COD pending remittance</p>
            </div>

            {/* Card 3: Future Total Expected */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Future Total COD</span>
                <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {codOrders.length} Active COD
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {totalFutureCodExpected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">Processing + Shipped + Delivered</p>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-600 block uppercase tracking-wider">
              COD Pipeline Breakdown:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
              <div className="bg-white border border-stone-200 px-1.5 py-1 rounded flex justify-between items-center">
                <span className="text-stone-600">Del:</span>
                <strong className="text-purple-700">₹{shiprocketUpcomingRemittance.toLocaleString('en-IN')}</strong>
              </div>
              <div className="bg-white border border-stone-200 px-1.5 py-1 rounded flex justify-between items-center">
                <span className="text-stone-600">Ship:</span>
                <strong className="text-blue-700">₹{localCodShippedSum.toLocaleString('en-IN')}</strong>
              </div>
              <div className="bg-white border border-stone-200 px-1.5 py-1 rounded flex justify-between items-center">
                <span className="text-stone-600">Proc:</span>
                <strong className="text-amber-700">₹{localCodProcessingSum.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 🤝 3. DIRECT OFFLINE & CASH SALES BOX */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                <FiDollarSign size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Offline & Cash Sales
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                    Cash In Hand
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Handover sales & manual orders</p>
              </div>
            </div>

            {setShowManualOrderModal && (
              <button
                type="button"
                onClick={() => setShowManualOrderModal(true)}
                className="bg-[#8c6239] hover:bg-stone-900 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
              >
                + Add Order
              </button>
            )}
          </div>

          {/* Metrics 3 Cards */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {/* Card 1: Total Cash In Hand */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Total Cash In Hand</span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {offlineOrders.length} Orders
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {offlineSalesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">100% Direct cash received</p>
            </div>

            {/* Card 2: Offline Profit */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-wider">Net Offline Profit</span>
                <span className="text-[9px] font-semibold text-[#8c6239] bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  Direct Profit
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {offlineProfitTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-stone-500">Earned profit on local sales</p>
            </div>

            {/* Card 3: Payment Status */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-stone-600 tracking-wider">Delivery Cost</span>
                <span className="text-[9px] font-semibold text-stone-700 bg-stone-100 px-1 py-0.2 rounded border border-stone-200">
                  ₹ 0.00 Cost
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                100% Cash In Hand
              </h3>
              <p className="text-[9px] text-stone-500">Zero courier logistics charges</p>
            </div>
          </div>

          {/* Recent Offline Orders Sub-list */}
          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-600 block uppercase tracking-wider">
              Recent Offline Orders ({offlineOrders.length}):
            </span>
            {offlineOrders.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {offlineOrders.slice(0, 3).map(o => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="bg-white border border-stone-200 p-1.5 rounded flex justify-between items-center cursor-pointer hover:bg-stone-100 transition-colors text-[9px]"
                  >
                    <div className="truncate max-w-[140px]">
                      <span className="font-mono font-bold text-stone-900">{o.id}</span>
                      <span className="ml-1.5 font-semibold text-stone-800 truncate">{o.customer_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-700">₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-stone-400 italic py-0.5">No offline / manual orders recorded yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* 📊 ALL-IN-ONE PRIMARY STORE STATS GRID */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <FiShoppingBag className="text-[#8c6239]" size={15} /> Store Metrics & Order Performance
          </h3>
          <span className="text-[10px] text-stone-400 font-mono">Click card for detailed lists</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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
              <h3 className="text-xl font-bold text-[#8c6239]">Rs. {calculatedSalesTotal}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Sales &rarr;</p>
            </div>
          </div>

          <div 
            onClick={() => setShowProfitListModal(true)}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-purple-500 transition-all hover:bg-stone-50/80"
            title="Click to view delivery cost breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider">Shipment Cost</span>
              <FiTruck className="text-purple-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-600">Rs. {calculatedDeliveryTotal}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Courier &rarr;</p>
            </div>
          </div>

          <div 
            onClick={() => setShowProfitListModal(true)}
            className="bg-white border border-stone-200 p-4 rounded-md shadow-2xs space-y-2 cursor-pointer hover:border-green-600 transition-all hover:bg-stone-50/80"
            title="Click to view net profit breakdown"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-green-600 tracking-wider">Total Profit</span>
              <FiStar className="text-green-600" size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-600">Rs. {calculatedProfitTotal}</h3>
              <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Profit &rarr;</p>
            </div>
          </div>
        </div>
      </div>

      {/* 💼 COMBINED MASTER BANK PAYOUTS & COD LEDGER (WHITE BG & LIGHT GRAY BORDER) */}
      <div className="bg-white border border-stone-200 p-5 rounded-md shadow-2xs space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-stone-150 pb-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-widest block">Combined Payout Ledger</span>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
              <FiDollarSign className="text-emerald-600" size={16} />
              Master Financial & Bank Payout Breakdown
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFinancialSummary}
              disabled={loadingFinancials}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
            >
              {loadingFinancials ? 'Syncing...' : '🔄 Refresh Data'}
            </button>
            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="bg-[#8c6239] hover:bg-stone-900 text-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
            >
              Detailed Schedules &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 1: MONEY RECEIVED IN BANK */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-150 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              ✅ 1. Money Already Received (Aa chuke paise)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Bank Settled + Cash In Hand</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">1. Total Received (Bank + Cash)</span>
              <h3 className="text-lg font-bold text-emerald-700 mt-0.5">
                ₹ {((financialSummary?.combined_summary?.total_already_received_in_bank || razorpaySettledAmount) + (financialSummary?.combined_summary?.offline_self_handover_total || offlineSalesTotal)).toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5 font-mono">
                Bank: ₹{razorpaySettledAmount.toLocaleString('en-IN')} + Cash: ₹{offlineSalesTotal.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">2. COD Received in Bank</span>
              <h3 className="text-lg font-bold text-purple-700 mt-0.5">
                ₹ {codReceivedInBank.toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">Shiprocket COD payouts remitted to bank</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">3. Razorpay Received in Bank</span>
              <h3 className="text-lg font-bold text-blue-700 mt-0.5">
                ₹ {razorpaySettledAmount.toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">Razorpay online settled to bank</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">4. Direct Cash In Hand</span>
              <h3 className="text-lg font-bold text-amber-700 mt-0.5">
                ₹ {offlineSalesTotal.toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">
                {offlineOrders.length} Direct Offline / Cash Orders
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: MONEY PENDING TO COME TO BANK */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-150 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              ⏳ 2. Money Pending To Come To Bank (Aane baaki paise)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Processing + Shipped + Unsettled Orders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">5. Total Pending To Come</span>
              <h3 className="text-lg font-bold text-amber-700 mt-0.5">
                ₹ {(totalFutureCodExpected + razorpayPendingAmount).toLocaleString('en-IN')}
              </h3>
              <div className="mt-1 text-[9px] text-stone-600 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Razorpay Pending:</span>
                  <span className="text-blue-700 font-bold">₹ {razorpayPendingAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>COD Future Total:</span>
                  <span className="text-amber-700 font-bold">₹ {totalFutureCodExpected.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">6. COD Total Future</span>
              <h3 className="text-lg font-bold text-purple-700 mt-0.5">
                ₹ {totalFutureCodExpected.toLocaleString('en-IN')}
              </h3>
              <div className="mt-1 text-[9px] text-stone-600 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Delivered Pending ({shiprocketUpcomingCount}):</span>
                  <span className="text-purple-700 font-bold">₹ {shiprocketUpcomingRemittance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipped In-Transit ({codShippedOrders.length}):</span>
                  <span className="text-blue-700 font-bold">₹ {localCodShippedSum.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">7. Razorpay Prepaid Pending</span>
              <h3 className="text-lg font-bold text-blue-700 mt-0.5">
                ₹ {razorpayPendingAmount.toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">Razorpay captured unsettled balance pending bank transfer</p>
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{order.id}</span>
                      <span className="font-semibold text-stone-800">{order.customer_name}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 font-light space-y-0.5">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="truncate max-w-60">
                          {item.product?.name || "Attar"} ({item.selectedSize || "3ml"}) x {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-stone-900 block">Rs. {order.total_amount}</span>
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
            <div className="flex items-center gap-2">
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
              {filterDeliveredOrdersByDate(allDeliveredOrders, dashboardDeliveredFilter).length} Orders &bull; Rs. {deliveredRevenues[dashboardDeliveredFilter] || 0}
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
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{order.id}</span>
                          <span className="font-semibold text-stone-800">{order.customer_name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          Delivered: {delDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} at {delDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-green-700 block">Rs. {order.total_amount}</span>
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
    </div>
  );
}
