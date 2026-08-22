import React from 'react';
import { calculateOrderProfit } from '../../utils/helpers';

export default function ProfitListModal({
  showProfitListModal,
  setShowProfitListModal,
  nonCancelledOrders,
  products,
  calculatedSalesTotal,
  calculatedDeliveryTotal,
  calculatedProfitTotal,
  inlineEditingCell,
  setInlineEditingCell,
  inlineEditValue,
  setInlineEditValue,
  handleSaveInlineEdit
}) {
  if (!showProfitListModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-4xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[9px] uppercase font-bold text-green-700 tracking-widest block">Financial Profitability</span>
            <h3 className="text-sm font-bold text-stone-900">Net Profit Breakdown List</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowProfitListModal(false)}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="overflow-x-auto border border-stone-200 rounded">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-right">Base Cost</th>
                <th className="p-3 text-right">Delivery Cost</th>
                <th className="p-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {nonCancelledOrders.map(order => {
                const { baseCost, deliveryCost, hasDeliveryCost, sellingPrice, profit } = calculateOrderProfit(order, products);

                const isEditingSelling = inlineEditingCell?.orderId === order.id && inlineEditingCell?.field === 'sellingPrice';
                const isEditingBase = inlineEditingCell?.orderId === order.id && inlineEditingCell?.field === 'baseCost';
                const isEditingDelivery = inlineEditingCell?.orderId === order.id && inlineEditingCell?.field === 'deliveryCost';

                return (
                  <tr key={order.id} className="border-b border-stone-150 hover:bg-stone-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-stone-900">{order.id}</td>
                    <td className="p-3 text-stone-800">{order.customer_name}</td>
                    
                    {/* Selling Price */}
                    <td className="p-3 text-right">
                      {isEditingSelling ? (
                        <input
                          type="number"
                          autoFocus
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(order.id, 'sellingPrice', inlineEditValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                            }
                            if (e.key === 'Escape') setInlineEditingCell(null);
                          }}
                          className="w-20 px-1.5 py-0.5 border-2 border-purple-500 rounded text-right font-bold text-xs bg-white text-purple-900 focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setInlineEditingCell({ orderId: order.id, field: 'sellingPrice' });
                            setInlineEditValue(String(sellingPrice));
                          }}
                          className="cursor-pointer hover:bg-purple-100/70 hover:text-purple-800 px-2 py-1 rounded transition-colors font-semibold text-stone-900 border-b border-dashed border-stone-300 hover:border-purple-500"
                          title="Click to edit Selling Price"
                        >
                          Rs. {sellingPrice}
                        </span>
                      )}
                    </td>

                    {/* Base Cost */}
                    <td className="p-3 text-right">
                      {isEditingBase ? (
                        <input
                          type="number"
                          autoFocus
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(order.id, 'baseCost', inlineEditValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                            }
                            if (e.key === 'Escape') setInlineEditingCell(null);
                          }}
                          className="w-20 px-1.5 py-0.5 border-2 border-purple-500 rounded text-right font-bold text-xs bg-white text-purple-900 focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setInlineEditingCell({ orderId: order.id, field: 'baseCost' });
                            setInlineEditValue(String(baseCost));
                          }}
                          className="cursor-pointer hover:bg-purple-100/70 hover:text-purple-800 px-2 py-1 rounded transition-colors font-medium text-stone-600 border-b border-dashed border-stone-300 hover:border-purple-500"
                          title="Click to edit Base Cost"
                        >
                          Rs. {baseCost}
                        </span>
                      )}
                    </td>

                    {/* Delivery Cost */}
                    <td className="p-3 text-right">
                      {isEditingDelivery ? (
                        <input
                          type="number"
                          autoFocus
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(order.id, 'deliveryCost', inlineEditValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                            }
                            if (e.key === 'Escape') setInlineEditingCell(null);
                          }}
                          className="w-20 px-1.5 py-0.5 border-2 border-purple-500 rounded text-right font-bold text-xs bg-white text-purple-900 focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setInlineEditingCell({ orderId: order.id, field: 'deliveryCost' });
                            setInlineEditValue(hasDeliveryCost ? String(deliveryCost) : '0');
                          }}
                          className={`cursor-pointer px-2 py-1 rounded transition-colors border-b border-dashed ${
                            hasDeliveryCost 
                              ? 'font-medium text-stone-600 border-stone-300 hover:bg-purple-100/70 hover:text-purple-800 hover:border-purple-500' 
                              : 'font-bold text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Click to set/edit Delivery Charge"
                        >
                          {hasDeliveryCost ? `Rs. ${deliveryCost}` : 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Net Profit */}
                    <td className="p-3 text-right font-bold">
                      {hasDeliveryCost ? (
                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-650'}>
                          Rs. {profit}
                        </span>
                      ) : (
                        <span className="text-stone-450 italic font-normal" title="Profit will calculate once delivery cost is set">
                          Rs. 0 <span className="text-[9px] text-amber-600 not-italic">(Pending)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-[#8c6239]">Total Sales: Rs. {calculatedSalesTotal}</span>
            <span className="text-xs font-bold text-purple-700">Total Delivery Cost: Rs. {calculatedDeliveryTotal}</span>
            <span className="text-xs font-bold text-green-700">Total Net Profit: Rs. {calculatedProfitTotal}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowProfitListModal(false)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
