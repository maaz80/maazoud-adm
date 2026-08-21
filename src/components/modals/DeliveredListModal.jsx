import React from 'react';
import { FiCheckCircle, FiPackage, FiTrendingUp, FiStar } from 'react-icons/fi';

export default function DeliveredListModal({
  showDeliveredListModal,
  setShowDeliveredListModal,
  deliveredDateFilter,
  setDeliveredDateFilter,
  deliveredSearchQuery,
  setDeliveredSearchQuery,
  deliveredCounts,
  deliveredRevenues,
  allDeliveredOrders,
  filterDeliveredOrdersByDate,
  getOrderDeliveryDate,
  handleDownloadDeliveredReport,
  setSelectedOrder
}) {
  if (!showDeliveredListModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-5xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <FiCheckCircle className="text-green-700" size={18} />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-green-700 tracking-widest block">Delivery Performance</span>
              <h3 className="text-sm font-bold text-stone-900">Delivered Orders List</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownloadDeliveredReport(deliveredDateFilter)}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              Download Report (PDF)
            </button>
            <button
              type="button"
              onClick={() => setShowDeliveredListModal(false)}
              className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Date Filter Tabs & Metrics Bar */}
        <div className="p-6 bg-stone-50/50 border-b border-stone-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Delivered', count: deliveredCounts.all, rev: deliveredRevenues.all },
                { id: 'today', label: "Today's Delivered", count: deliveredCounts.today, rev: deliveredRevenues.today },
                { id: 'yesterday', label: "Yesterday's Delivered", count: deliveredCounts.yesterday, rev: deliveredRevenues.yesterday },
                { id: 'last7days', label: 'Last 7 Days', count: deliveredCounts.last7days, rev: deliveredRevenues.last7days },
                { id: 'thisMonth', label: 'This Month', count: deliveredCounts.thisMonth, rev: deliveredRevenues.thisMonth },
              ].map((tab) => {
                const active = deliveredDateFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDeliveredDateFilter(tab.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer flex items-center gap-2 ${
                      active
                        ? 'bg-green-700 text-white border-green-700 shadow-sm'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-semibold ${
                      active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Internal Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search order ID, customer, phone..."
                value={deliveredSearchQuery}
                onChange={(e) => setDeliveredSearchQuery(e.target.value)}
                className="w-64 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:border-green-600"
              />
              {deliveredSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDeliveredSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary Cards for Selected Filter */}
          {(() => {
            const targetOrders = filterDeliveredOrdersByDate(allDeliveredOrders, deliveredDateFilter).filter(o => {
              const q = String(deliveredSearchQuery || '').toLowerCase().trim();
              if (!q) return true;
              return String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.phone || '').includes(q) ||
                String(o.address || '').toLowerCase().includes(q);
            });
            const totalAmt = targetOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
            const avgAmt = targetOrders.length ? Math.round(totalAmt / targetOrders.length) : 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3.5 rounded border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Filtered Count</span>
                    <h4 className="text-lg font-bold text-stone-900">{targetOrders.length} Orders</h4>
                  </div>
                  <FiPackage className="text-stone-400" size={20} />
                </div>
                <div className="bg-white p-3.5 rounded border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Delivered Value</span>
                    <h4 className="text-lg font-bold text-green-700">Rs. {totalAmt.toFixed(2)}</h4>
                  </div>
                  <FiTrendingUp className="text-green-600" size={20} />
                </div>
                <div className="bg-white p-3.5 rounded border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Avg Order Value</span>
                    <h4 className="text-lg font-bold text-stone-900">Rs. {avgAmt}</h4>
                  </div>
                  <FiStar className="text-amber-500" size={20} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Body Table */}
        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          {(() => {
            const targetOrders = filterDeliveredOrdersByDate(allDeliveredOrders, deliveredDateFilter).filter(o => {
              const q = String(deliveredSearchQuery || '').toLowerCase().trim();
              if (!q) return true;
              return String(o.id || '').toLowerCase().includes(q) ||
                String(o.customer_name || '').toLowerCase().includes(q) ||
                String(o.phone || '').includes(q) ||
                String(o.address || '').toLowerCase().includes(q);
            });

            if (targetOrders.length === 0) {
              return (
                <div className="text-center py-12 text-stone-400">
                  <FiCheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                  <p className="text-xs font-semibold">No delivered orders found for this filter selection.</p>
                </div>
              );
            }

            return (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Delivery Date</th>
                    <th className="p-3">Customer Details</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {targetOrders.map(order => {
                    const delDate = getOrderDeliveryDate(order);
                    return (
                      <tr key={order.id} className="border-b border-stone-150 hover:bg-stone-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                        <td className="p-3 text-stone-600">
                          <span className="block font-semibold">
                            {delDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {delDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-stone-900 block">{order.customer_name || 'N/A'}</span>
                          <span className="text-[10px] font-mono text-stone-500 block">{order.phone}</span>
                          <span className="text-[9px] text-stone-400 block truncate max-w-xs" title={order.address}>{order.address}</span>
                        </td>
                        <td className="p-3 max-w-xs space-y-1">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="text-[11px] text-stone-700">
                              <span className="font-semibold">{item.product?.name || 'Attar'}</span>
                              <span className="text-[9px] text-stone-400 block">Qty: {item.quantity} &bull; Size: {item.selectedSize || '3ml'} &bull; Rs. {item.price}</span>
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-stone-600">
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[9px] font-bold uppercase tracking-wider border border-stone-200">
                            {order.payment_method?.includes('Payment ID') ? 'Razorpay' : order.payment_method || 'COD'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-green-700 text-sm">
                          Rs. {order.total_amount}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeliveredListModal(false);
                            }}
                            className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-stone-100 hover:bg-[#8c6239] hover:text-white text-stone-700 rounded transition-all cursor-pointer border border-stone-200"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
          <span className="text-xs font-bold text-green-700">
            Selected Filter Total ({filterDeliveredOrdersByDate(allDeliveredOrders, deliveredDateFilter).length} Orders): Rs. {deliveredRevenues[deliveredDateFilter] || 0}
          </span>
          <button
            type="button"
            onClick={() => setShowDeliveredListModal(false)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
