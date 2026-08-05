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
  FiCreditCard
} from 'react-icons/fi';

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
  orders,
  setSelectedOrder,
  dashboardDeliveredFilter,
  setDashboardDeliveredFilter,
  filterDeliveredOrdersByDate,
  allDeliveredOrders,
  deliveredRevenues,
  getOrderDeliveryDate
}) {
  if (activeTab !== 'dashboard') return null;

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-stone-200">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#8c6239]">Performance & Sales Report</h3>
          <p className="text-[10px] text-stone-400 mt-1">Financial summary and courier tracking metrics</p>
        </div>
        <button
          onClick={handleDownloadSalesProfitReport}
          className="bg-[#8c6239] hover:bg-stone-900 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          Download Financial Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <div className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Total Orders</span>
            <FiList className="text-[#8c6239]" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.All}</h3>
            <p className="text-[9px] text-stone-500 font-light mt-0.5">All customer orders</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Processing Orders</span>
            <FiClock className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.Processing}</h3>
            <p className="text-[9px] text-stone-500 font-light mt-0.5">New orders to pack</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Shipped Orders</span>
            <FiPackage className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.Shipped}</h3>
            <p className="text-[9px] text-stone-500 font-light mt-0.5">Sent for delivery</p>
          </div>
        </div>

        <div 
          onClick={() => {
            setDeliveredDateFilter('all');
            setShowDeliveredListModal(true);
          }}
          className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3 cursor-pointer hover:border-green-600 transition-all hover:bg-stone-50/80 group"
          title="Click to view Delivered Orders List (Today, Yesterday, etc.)"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 group-hover:text-green-700 tracking-wider transition-colors">Delivered Orders</span>
            <FiCheckCircle className="text-green-600" size={20} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-stone-900">{orderStatusCounts.Delivered}</h3>
              <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200" title="Delivered Today">
                Today: {deliveredCounts.today}
              </span>
            </div>
            <p className="text-[9px] text-stone-500 font-semibold mt-1 uppercase tracking-wide group-hover:text-green-700 transition-colors">View Delivered List &rarr;</p>
          </div>
        </div>

        <div 
          onClick={() => setShowSalesListModal(true)}
          className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3 cursor-pointer hover:border-[#8c6239] transition-all hover:bg-stone-50/80"
          title="Click to view all sales orders"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Total Sales</span>
            <FiTrendingUp className="text-[#8c6239]" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#8c6239]">Rs. {calculatedSalesTotal}</h3>
            <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Sales List &rarr;</p>
          </div>
        </div>

        <div 
          onClick={() => setShowProfitListModal(true)}
          className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3 cursor-pointer hover:border-purple-500 transition-all hover:bg-stone-50/80"
          title="Click to view delivery cost breakdown"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Total Shipment Cost</span>
            <FiTruck className="text-purple-600" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-600">Rs. {calculatedDeliveryTotal}</h3>
            <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Delivery List &rarr;</p>
          </div>
        </div>

        <div 
          onClick={() => setShowProfitListModal(true)}
          className="bg-white border border-stone-200 p-5 rounded-md shadow-sm space-y-3 cursor-pointer hover:border-[#8c6239] transition-all hover:bg-stone-50/80"
          title="Click to view net profit breakdown"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Total Profit</span>
            <FiStar className="text-green-600" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-600">Rs. {calculatedProfitTotal}</h3>
            <p className="text-[9px] text-stone-500 font-semibold mt-0.5 uppercase tracking-wide">View Profit List &rarr;</p>
          </div>
        </div>
      </div>

      {/* FINANCIAL SETTLEMENTS & PAYOUTS MASTER DASHBOARD SECTION */}
      <div className="bg-stone-900 text-white p-6 rounded-xl shadow-md border border-stone-800 space-y-6 animate-fadeIn">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-stone-800 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest block">Live Bank Payouts & Sales Ledger</span>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <FiDollarSign className="text-emerald-400" size={18} />
              Master Financial & Bank Payout Summary
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchFinancialSummary}
              disabled={loadingFinancials}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
            >
              {loadingFinancials ? 'Syncing...' : '🔄 Refresh Live Data'}
            </button>
            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="bg-[#8c6239] hover:bg-stone-800 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer border border-[#8c6239]"
            >
              Detailed Schedules &rarr;
            </button>
          </div>
        </div>

        {/* 1. MONEY RECEIVED SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              ✅ 1. Money Already Received (Aa chuke paise)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Bank Settled + Cash In Hand</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-stone-800/90 border border-emerald-900/60 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">1. Total Received (Bank + Cash)</span>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">
                ₹ {((financialSummary?.combined_summary?.total_already_received_in_bank || 0) + (financialSummary?.combined_summary?.offline_self_handover_total || 0)).toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] text-stone-400 mt-0.5 font-mono">
                Bank: ₹{financialSummary?.combined_summary?.total_already_received_in_bank || 0} + Cash: ₹{financialSummary?.combined_summary?.offline_self_handover_total || 0}
              </p>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">2. COD Received in Bank</span>
              <h3 className="text-xl font-bold text-purple-400 mt-1">
                ₹ 0.00
              </h3>
              <p className="text-[9px] text-stone-400 mt-0.5">Shiprocket COD payouts remitted to bank</p>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">3. Prepaid Received in Bank</span>
              <h3 className="text-xl font-bold text-blue-400 mt-1">
                ₹ {financialSummary?.combined_summary?.total_already_received_in_bank || 0}
              </h3>
              <p className="text-[9px] text-stone-400 mt-0.5">Razorpay online settled to bank</p>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">4. Self Delivered (Ghar Cash)</span>
              <h3 className="text-xl font-bold text-amber-400 mt-1">
                ₹ {financialSummary?.combined_summary?.offline_self_handover_total || 0}
              </h3>
              <p className="text-[9px] text-stone-400 mt-0.5">
                {financialSummary?.local_metrics?.offline_orders_count || 0} Direct Offline Orders Cash
              </p>
            </div>
          </div>
        </div>

        {/* 2. MONEY PENDING SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              ⏳ 2. Money Pending To Come To Bank (Aane baaki paise)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Processing + Shipped + Delivered Orders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-800/90 border border-amber-900/60 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">5. Total Pending To Come</span>
              <h3 className="text-xl font-bold text-amber-400 mt-1">
                ₹ {((financialSummary?.combined_summary?.cod_pipeline_total || 0) + (financialSummary?.combined_summary?.prepaid_unsettled_balance || 0)).toLocaleString('en-IN')}
              </h3>
              <div className="mt-1 text-[9px] text-stone-300 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Immediate Delivered Pending:</span>
                  <span className="text-amber-300 font-bold">₹ {financialSummary?.combined_summary?.total_pending_bank_payout || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipped In-Transit Pipeline:</span>
                  <span className="text-purple-300 font-bold">₹ {financialSummary?.combined_summary?.cod_shipped_in_transit || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">6. COD Total Pending</span>
              <h3 className="text-xl font-bold text-purple-300 mt-1">
                ₹ {financialSummary?.combined_summary?.cod_pipeline_total || 0}
              </h3>
              <div className="mt-1 text-[9px] text-stone-300 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Delivered Pending:</span>
                  <span className="text-emerald-300 font-bold">₹ {financialSummary?.combined_summary?.cod_delivered_pending || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipped In-Transit:</span>
                  <span className="text-amber-300 font-bold">₹ {financialSummary?.combined_summary?.cod_shipped_in_transit || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">7. Prepaid Total Pending</span>
              <h3 className="text-xl font-bold text-blue-300 mt-1">
                ₹ {financialSummary?.combined_summary?.prepaid_unsettled_balance || 0}
              </h3>
              <p className="text-[9px] text-stone-400 mt-0.5">Razorpay captured unsettled balance pending bank payout</p>
            </div>
          </div>
        </div>

        {/* 3. STORE PERFORMANCE SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              📈 3. Overall Store Sales, Shipping & Profit
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Gross Business Totals</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg cursor-pointer hover:border-[#8c6239]" onClick={() => setShowSalesListModal(true)}>
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">8. Total Sales (Home Page)</span>
              <h3 className="text-xl font-bold text-[#d4af37] mt-1">Rs. {calculatedSalesTotal}</h3>
              <p className="text-[9px] text-stone-400 mt-0.5 font-mono">Gross Sales Revenue</p>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg cursor-pointer hover:border-purple-500" onClick={() => setShowProfitListModal(true)}>
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">9. Total Shipping Cost</span>
              <h3 className="text-xl font-bold text-purple-400 mt-1">Rs. {calculatedDeliveryTotal}</h3>
              <p className="text-[9px] text-stone-400 mt-0.5 font-mono">Total Courier Logistics Cost</p>
            </div>

            <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-lg cursor-pointer hover:border-green-500" onClick={() => setShowProfitListModal(true)}>
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">10. Total Profit (Home Page)</span>
              <h3 className="text-xl font-bold text-green-400 mt-1">Rs. {calculatedProfitTotal}</h3>
              <p className="text-[9px] text-stone-400 mt-0.5 font-mono">Net Profit Revenue</p>
            </div>
          </div>
        </div>
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
                    <span className={`inline-block text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
                      order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-amber-600'
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-600" size={16} />
              <h3 className="text-xs uppercase font-bold tracking-wider text-stone-900">
                Delivered Orders (Dashboard View)
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

          <div className="flex justify-between items-center bg-green-50/60 border border-green-100 p-2.5 rounded text-xs">
            <span className="font-semibold text-green-800">
              {dashboardDeliveredFilter === 'yesterday'
                ? "Yesterday's Delivered"
                : dashboardDeliveredFilter === 'today'
                  ? "Today's Delivered"
                  : dashboardDeliveredFilter === 'last7days'
                    ? "Last 7 Days Delivered"
                    : "All Delivered"}
            </span>
            <span className="font-bold text-green-700">
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
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {list.map(order => {
                  const delDate = getOrderDeliveryDate(order);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-between gap-3 text-xs p-2.5 rounded bg-stone-50/70 border border-stone-150 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{order.id}</span>
                          <span className="font-semibold text-stone-800">{order.customer_name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          Delivered: {delDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} at {delDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-700 block">Rs. {order.total_amount}</span>
                        <span className="text-[9px] font-bold text-stone-400 uppercase">{order.payment_method?.includes('Payment ID') ? 'Razorpay' : 'COD'}</span>
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
