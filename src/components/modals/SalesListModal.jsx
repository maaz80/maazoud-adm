import React from 'react';

export default function SalesListModal({
  showSalesListModal,
  setShowSalesListModal,
  nonCancelledOrders,
  calculatedSalesTotal
}) {
  if (!showSalesListModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[9px] uppercase font-bold text-stone-500 tracking-widest block">Financial Summary</span>
            <h3 className="text-sm font-bold text-stone-900">Total Sales List ({nonCancelledOrders.length} Orders)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowSalesListModal(false)}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <th className="p-3">Order ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Sale Amount</th>
              </tr>
            </thead>
            <tbody>
              {nonCancelledOrders.map(order => (
                <tr key={order.id} className="border-b border-stone-150 hover:bg-stone-50/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                  <td className="p-3 text-stone-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-stone-800">{order.customer_name}</td>
                  <td className="p-3 text-stone-500 truncate max-w-40" title={order.payment_method}>
                    {String(order.payment_method || '').includes('Payment ID') ? 'Razorpay' : order.payment_method || 'COD'}
                  </td>
                  <td className="p-3 text-right font-bold text-stone-900">Rs. {order.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
          <span className="text-xs font-bold text-[#8c6239]">Total Sales: Rs. {calculatedSalesTotal}</span>
          <button
            type="button"
            onClick={() => setShowSalesListModal(false)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
