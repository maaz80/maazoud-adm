import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

export default function OrdersView({
  activeTab,
  filteredOrders,
  orders,
  setShowManualOrderModal,
  orderSearchQuery,
  setOrderSearchQuery,
  orderStatusFilters,
  orderStatusFilter,
  setOrderStatusFilter,
  orderStatusCounts,
  deliveredCounts,
  orderDeliveredSubFilter,
  setOrderDeliveredSubFilter,
  setSelectedOrder,
  sentMessages,
  requestOrderStatusUpdate
}) {
  if (activeTab !== 'orders') return null;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-wider text-stone-500">
            {filteredOrders.length} of {orders.length} Orders Shown
          </span>
          <button
            type="button"
            onClick={() => setShowManualOrderModal(true)}
            className="bg-[#8c6239] hover:bg-[#76512d] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
          >
            + Add Manual / Offline Order
          </button>
        </div>

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
                : status === 'Cancelled'
                  ? 'text-red-700 border-red-200 bg-red-50'
                  : 'text-stone-700 border-stone-200 bg-white';

          return (
            <button
              key={status}
              type="button"
              onClick={() => setOrderStatusFilter(status)}
              className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                active ? colorClass : 'bg-white border-stone-200 text-stone-450 hover:text-stone-800 hover:border-stone-300'
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

      {orderStatusFilter === 'Delivered' && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-green-50/70 border border-green-200/80 rounded-md animate-fadeIn">
          <span className="text-[9px] uppercase font-bold text-green-800 mr-1 flex items-center gap-1">
            <FiCheckCircle className="text-green-600" size={12} />
            Filter Delivered Date:
          </span>
          {[
            { id: 'all', label: 'All Delivered', count: deliveredCounts.all },
            { id: 'today', label: "Today's Delivered", count: deliveredCounts.today },
            { id: 'yesterday', label: "Yesterday's Delivered", count: deliveredCounts.yesterday },
            { id: 'last7days', label: 'Last 7 Days', count: deliveredCounts.last7days },
            { id: 'thisMonth', label: 'This Month', count: deliveredCounts.thisMonth },
          ].map((f) => {
            const isActive = orderDeliveredSubFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setOrderDeliveredSubFilter(f.id)}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-green-700 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {f.label} ({f.count})
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-md shadow-sm overflow-x-auto">
        {filteredOrders.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
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
                    
                    {/* Sent messages indicators */}
                    <div className="flex gap-1 mt-1">
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase leading-none ${
                        sentMessages[order.id]?.['Processing'] || sentMessages[order.id]?.['Placed']
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-stone-50 text-stone-400 border-stone-100'
                      }`} title="Placed Message Status">
                        Placed
                      </span>
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase leading-none ${
                        sentMessages[order.id]?.['Shipped']
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-stone-50 text-stone-400 border-stone-100'
                      }`} title="Shipped Message Status">
                        Ship
                      </span>
                      {order.status === 'Cancelled' && (
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase leading-none ${
                          sentMessages[order.id]?.['Cancelled']
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-stone-50 text-stone-400 border-stone-100'
                        }`} title="Cancelled Message Status">
                          Cancel
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-400 block max-w-xs truncate mt-1.5" title={order.address}>{order.address}</span>
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
                    <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => requestOrderStatusUpdate(order, 'Shipped')}
                          className="p-1.5 bg-stone-50 hover:bg-blue-50 text-blue-600 border border-stone-200 hover:border-blue-300 rounded transition-colors cursor-pointer"
                          title="Mark as Shipped"
                        >
                          <FiClock size={12} />
                        </button>
                      )}
                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => requestOrderStatusUpdate(order, 'Delivered')}
                          className="p-1.5 bg-stone-50 hover:bg-green-50 text-green-600 border border-stone-200 hover:border-green-300 rounded transition-colors cursor-pointer"
                          title="Mark as Delivered"
                        >
                          <FiCheckCircle size={12} />
                        </button>
                      )}
                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => requestOrderStatusUpdate(order, 'Cancelled')}
                          className="p-1.5 bg-stone-50 hover:bg-red-50 text-red-650 border border-stone-200 hover:border-red-300 rounded transition-colors cursor-pointer"
                          title="Cancel Order"
                        >
                          <FiXCircle size={12} />
                        </button>
                      )}
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
  );
}
