import React from 'react';
import { FiCheckCircle, FiPackage, FiTrendingUp, FiStar, FiRepeat } from 'react-icons/fi';
import { getRepeatLabel, getRtoDeliveredAt, filterRtoDeliveredOrdersByDate } from '../../utils/helpers';

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
  setSelectedOrder,
  orderRepeatMap
}) {
  React.useEffect(() => {
    if (showDeliveredListModal) setDeliveredDateFilter('today');
  }, [showDeliveredListModal, setDeliveredDateFilter]);

  if (!showDeliveredListModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-5xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
        
        {/* Header */}
        {(() => {
          const isRto = modalLedgerType === 'rto';
          const currentOrders = isRto ? allRtoDeliveredOrders : allDeliveredOrders;
          const currentFilterFn = isRto ? filterRtoDeliveredOrdersByDate : filterDeliveredOrdersByDate;
          const currentCounts = isRto ? (rtoDeliveredCounts || {}) : deliveredCounts;
          const currentRevenues = isRto ? (rtoDeliveredRevenues || {}) : deliveredRevenues;
          const currentDateGetter = isRto ? getRtoDeliveredAt : getOrderDeliveryDate;

          return (
            <>
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                    isRto ? 'bg-amber-100 border-amber-200' : 'bg-green-100 border-green-200'
                  }`}>
                    <FiCheckCircle className={isRto ? "text-amber-700" : "text-green-700"} size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase font-bold tracking-widest block ${
                        isRto ? 'text-amber-700' : 'text-green-700'
                      }`}>
                        {isRto ? 'RTO Delivery Performance' : 'Delivery Performance'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-stone-900">
                        {isRto ? 'RTO Delivered Orders List' : 'Delivered Orders List'}
                      </h3>
                      {/* Pill toggle */}
                      <div className="inline-flex items-center rounded bg-stone-200/80 p-0.5 border border-stone-300">
                        <button
                          type="button"
                          onClick={() => setModalLedgerType('delivered')}
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer transition-all ${
                            !isRto
                              ? 'bg-green-700 text-white shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Delivered
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalLedgerType('rto')}
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer transition-all ${
                            isRto
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          RTO
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadDeliveredReport(deliveredDateFilter)}
                    className={`text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      isRto ? 'bg-amber-700 hover:bg-amber-800' : 'bg-green-700 hover:bg-green-800'
                    }`}
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
                      { id: 'all', label: isRto ? 'All RTO' : 'All Delivered', count: currentCounts.all || 0, rev: currentRevenues.all || 0 },
                      { id: 'today', label: isRto ? "Today's RTO" : "Today's Delivered", count: currentCounts.today || 0, rev: currentRevenues.today || 0 },
                      { id: 'yesterday', label: isRto ? "Yesterday's RTO" : "Yesterday's Delivered", count: currentCounts.yesterday || 0, rev: currentRevenues.yesterday || 0 },
                      { id: 'last7days', label: 'Last 7 Days', count: currentCounts.last7days || 0, rev: currentRevenues.last7days || 0 },
                      { id: 'thisMonth', label: 'This Month', count: currentCounts.thisMonth || 0, rev: currentRevenues.thisMonth || 0 },
                    ].map((tab) => {
                      const active = deliveredDateFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDeliveredDateFilter(tab.id)}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer flex items-center gap-2 ${
                            active
                              ? (isRto ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-green-700 text-white border-green-700 shadow-sm')
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
                      className={`w-64 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded focus:outline-none ${
                        isRto ? 'focus:border-amber-600' : 'focus:border-green-600'
                      }`}
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
                  const targetOrders = currentFilterFn(currentOrders, deliveredDateFilter).filter(o => {
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
                          <h4 className={`text-lg font-bold ${isRto ? 'text-amber-700' : 'text-green-700'}`}>Rs. {totalAmt.toFixed(2)}</h4>
                        </div>
                        <FiTrendingUp className={isRto ? "text-amber-600" : "text-green-600"} size={20} />
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
                  const targetOrders = currentFilterFn(currentOrders, deliveredDateFilter).filter(o => {
                    const q = String(deliveredSearchQuery || '').toLowerCase().trim();
                    if (!q) return true;
                    return String(o.id || '').toLowerCase().includes(q) ||
                      String(o.customer_name || '').toLowerCase().includes(q) ||
                      String(o.phone || '').includes(q) ||
                      String(o.address || '').toLowerCase().includes(q);
                  });

                  if (targetOrders.length === 0) {
                    return (
                      <div className="text-center py-12 text-stone-400 space-y-2">
                        <FiPackage size={32} className="mx-auto text-stone-300" />
                        <p className="text-xs">No {isRto ? 'RTO delivered' : 'delivered'} orders found matching your criteria.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-stone-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">{isRto ? 'RTO Delivered Date' : 'Delivery Date'}</th>
                          <th className="p-3">Customer Details</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3 text-right">Total Amount</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {targetOrders.map(order => {
                          const delDate = currentDateGetter(order);
                          return (
                            <tr key={order.id} className="border-b border-stone-150 hover:bg-stone-50/70 transition-colors">
                              <td className="p-3 font-mono font-bold text-stone-900">
                                {order.id}
                                {isRto && (
                                  <span className="ml-1.5 px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                    RTO
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-stone-600">
                                <span className="block font-semibold">
                                  {delDate ? delDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not recorded'}
                                </span>
                                {delDate && (
                                  <span className="text-[10px] text-stone-400">
                                    {delDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900 block">{order.customer_name || 'N/A'}</span>
                                  {orderRepeatMap?.get(String(order.id))?.isRepeat && (
                                    <span 
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200"
                                      title={`Repeat Customer: Order #${orderRepeatMap.get(String(order.id)).orderIndex} from this phone number (${orderRepeatMap.get(String(order.id)).totalOrders} total orders)`}
                                    >
                                      <FiRepeat size={9} />
                                      {getRepeatLabel(orderRepeatMap.get(String(order.id)).orderIndex)}
                                    </span>
                                  )}
                                </div>
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
                              <td className={`p-3 text-right font-bold text-sm ${isRto ? 'text-amber-700' : 'text-green-700'}`}>
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
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50">
                <span className="text-xs font-semibold text-stone-500">
                  Selected Filter Total ({currentFilterFn(currentOrders, deliveredDateFilter).length} Orders): Rs. {currentRevenues[deliveredDateFilter] || 0}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeliveredListModal(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
