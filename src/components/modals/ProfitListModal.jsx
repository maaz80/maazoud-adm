import React from 'react';
import { calculateOrderProfit, isRtoOrder } from '../../utils/helpers';

export default function ProfitListModal({
  showProfitListModal,
  setShowProfitListModal,
  nonCancelledOrders,
  shipmentOrders = [],
  products,
  financialSummary,
  calculatedSalesTotal,
  calculatedDeliveryTotal,
  calculatedProfitTotal,
  adCampaigns = [],
  mode = 'normal',
  inlineEditingCell,
  setInlineEditingCell,
  inlineEditValue,
  setInlineEditValue,
  handleSaveInlineEdit
}) {
  const [rtoFilter, setRtoFilter] = React.useState('all');
  React.useEffect(() => {
    if (showProfitListModal) setRtoFilter('all');
  }, [showProfitListModal, mode]);

  if (!showProfitListModal) return null;
  const isAfterAdsMode = mode === 'after_ads';
  const isShipmentCostMode = mode === 'shipment_cost';
  const isTotalProfitMode = mode === 'total_profit';
  const includesRtoOrders = isShipmentCostMode || isTotalProfitMode;
  const ordersToShow = includesRtoOrders
    ? shipmentOrders.filter(order => rtoFilter === 'all' || (rtoFilter === 'rto' ? isRtoOrder(order) : !isRtoOrder(order)))
    : nonCancelledOrders;

  const adCostByOrder = new Map();
  let totalAdSpend = 0;
  (adCampaigns || []).forEach(campaign => {
    const spend = Number(campaign.spend) || 0;
    totalAdSpend += spend;
    const orderIds = [...new Set(Array.isArray(campaign.order_ids) ? campaign.order_ids.map(String) : [])];
    if (orderIds.length === 0) return;
    const adCostPerOrder = spend / orderIds.length;
    orderIds.forEach(orderId => {
      adCostByOrder.set(orderId, (adCostByOrder.get(orderId) || 0) + adCostPerOrder);
    });
  });
  const formatAmount = value => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const getRtoDeliveryCharge = (order) => {
    const awb = String(order.shipment_details?.zipypost_awb || order.zipypost_awb || '').trim().toUpperCase();
    const ledger = awb ? financialSummary?.zipypost?.rto_charges_by_awb?.[awb] : null;
    if (ledger?.net_charge !== null && ledger?.net_charge !== undefined && Number.isFinite(Number(ledger.net_charge))) {
      return { charge: Number(ledger.net_charge), hasCharge: true };
    }
    const { deliveryCost, hasDeliveryCost } = calculateOrderProfit(order, products);
    return { charge: hasDeliveryCost ? deliveryCost : 0, hasCharge: hasDeliveryCost };
  };
  const getOrderDeliveryCharge = (order) => {
    if (isRtoOrder(order)) return getRtoDeliveryCharge(order).charge;
    const { deliveryCost, hasDeliveryCost } = calculateOrderProfit(order, products);
    return hasDeliveryCost ? deliveryCost : 0;
  };
  const displaySalesTotal = includesRtoOrders
    ? ordersToShow.reduce((total, order) => total + (isRtoOrder(order) ? 0 : Number(order.total_amount) || 0), 0)
    : calculatedSalesTotal;
  const displayDeliveryTotal = includesRtoOrders
    ? ordersToShow.reduce((total, order) => total + getOrderDeliveryCharge(order), 0)
    : calculatedDeliveryTotal;
  const totalProfitForTotalModal = isTotalProfitMode
    ? ordersToShow.reduce((total, order) => {
        if (isRtoOrder(order)) return total - getRtoDeliveryCharge(order).charge;
        const { profit, hasDeliveryCost } = calculateOrderProfit(order, products);
        return total + (hasDeliveryCost ? profit : 0);
      }, 0)
    : calculatedProfitTotal;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-5xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[9px] uppercase font-bold text-green-700 tracking-widest block">Financial Profitability</span>
            <h3 className="text-sm font-bold text-stone-900">
              {isShipmentCostMode ? 'Shipment Cost Breakdown List' : isTotalProfitMode ? 'Total Profit Breakdown List' : isAfterAdsMode ? 'Profit After Ads: Order Breakdown' : 'Net Profit Breakdown List'}
            </h3>
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
          {includesRtoOrders && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Orders:</span>
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'rto', label: 'RTO Only' },
                { id: 'without_rto', label: 'Without RTO' }
              ].map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setRtoFilter(filter.id)}
                  className={`rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    rtoFilter === filter.id
                      ? 'border-purple-700 bg-purple-700 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
          <div className="overflow-x-auto border border-stone-200 rounded">
            <table className="w-full text-left text-xs border-collapse min-w-212.5">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-right">Base Cost</th>
                <th className="p-3 text-right">Delivery Cost</th>
                <th className="p-3 text-right">{isAfterAdsMode ? 'Order Profit' : 'Net Profit'}</th>
                {isAfterAdsMode && <>
                  <th className="p-3 text-right">Ad Cost / Order</th>
                  <th className="p-3 text-right">Final Profit</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {ordersToShow.length ? ordersToShow.map(order => {
                const orderProfit = calculateOrderProfit(order, products);
                const isRto = includesRtoOrders && isRtoOrder(order);
                const rtoChargeInfo = isRto ? getRtoDeliveryCharge(order) : null;
                const deliveryCost = isRto
                  ? rtoChargeInfo.charge
                  : orderProfit.deliveryCost;
                const hasDeliveryCost = isRto ? rtoChargeInfo.hasCharge : orderProfit.hasDeliveryCost;
                const baseCost = isRto ? 0 : orderProfit.baseCost;
                const sellingPrice = isRto ? 0 : orderProfit.sellingPrice;
                const profit = isRto ? (hasDeliveryCost ? -deliveryCost : 0) : orderProfit.profit;
                const adCost = adCostByOrder.get(String(order.id)) || 0;
                const finalProfit = profit - adCost;

                const isEditingSelling = !isRto && inlineEditingCell?.orderId === order.id && inlineEditingCell?.field === 'sellingPrice';
                const isEditingBase = !isRto && inlineEditingCell?.orderId === order.id && inlineEditingCell?.field === 'baseCost';
                const isEditingDelivery = !isRto && inlineEditingCell?.orderId === order.id && inlineEditingCell?.field === 'deliveryCost';

                return (
                  <tr key={order.id} className="border-b border-stone-150 hover:bg-stone-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-stone-900">
                      {order.id}
                      {isRto && <span className="ml-1.5 rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-sans font-bold uppercase text-orange-800">RTO</span>}
                    </td>
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
                            if (isRto) return;
                            setInlineEditingCell({ orderId: order.id, field: 'sellingPrice' });
                            setInlineEditValue(String(sellingPrice));
                          }}
                          className={`${isRto ? '' : 'cursor-pointer hover:bg-purple-100/70 hover:text-purple-800 border-b border-dashed border-stone-300 hover:border-purple-500'} px-2 py-1 rounded transition-colors font-semibold text-stone-900`}
                          title={isRto ? 'RTO order: sale amount is zero' : 'Click to edit Selling Price'}
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
                            if (isRto) return;
                            setInlineEditingCell({ orderId: order.id, field: 'baseCost' });
                            setInlineEditValue(String(baseCost));
                          }}
                          className={`${isRto ? '' : 'cursor-pointer hover:bg-purple-100/70 hover:text-purple-800 border-b border-dashed border-stone-300 hover:border-purple-500'} px-2 py-1 rounded transition-colors font-medium text-stone-600`}
                          title={isRto ? 'RTO order: returned product cost is zero' : 'Click to edit Base Cost'}
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
                            if (isRto) return;
                            setInlineEditingCell({ orderId: order.id, field: 'deliveryCost' });
                            setInlineEditValue(hasDeliveryCost ? String(deliveryCost) : '0');
                          }}
                          className={`${isRto ? '' : 'cursor-pointer'} px-2 py-1 rounded transition-colors border-b border-dashed ${
                            isRto && hasDeliveryCost
                              ? 'font-semibold text-orange-800 border-orange-300'
                              : hasDeliveryCost
                              ? 'font-medium text-stone-600 border-stone-300 hover:bg-purple-100/70 hover:text-purple-800 hover:border-purple-500' 
                              : 'font-bold text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
                          }`}
                          title={isRto ? 'RTO net charge from courier ledger' : 'Click to set/edit Delivery Charge'}
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
                    {isAfterAdsMode && <>
                      <td className="p-3 text-right font-semibold text-amber-700">
                        - Rs. {formatAmount(adCost)}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {hasDeliveryCost ? (
                          <span className={finalProfit >= 0 ? 'text-green-600' : 'text-red-650'}>
                            Rs. {formatAmount(finalProfit)}
                          </span>
                        ) : (
                          <span className="text-stone-450 italic font-normal" title="Final profit will calculate once delivery cost is set">
                            Pending
                          </span>
                        )}
                      </td>
                    </>}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={isAfterAdsMode ? 8 : 6} className="p-6 text-center text-stone-400 italic">No orders match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-[#8c6239]">Total Sales: Rs. {formatAmount(displaySalesTotal)}</span>
            <span className="text-xs font-bold text-purple-700">Total Delivery Cost: Rs. {formatAmount(displayDeliveryTotal)}</span>
            {isAfterAdsMode ? <>
              <span className="text-xs font-bold text-stone-600">Profit Before Ads: Rs. {calculatedProfitTotal}</span>
              <span className="text-xs font-bold text-amber-700">Ad Spend: Rs. {formatAmount(totalAdSpend)}</span>
              <span className="text-xs font-bold text-green-700">Profit After Ads: Rs. {formatAmount(calculatedProfitTotal - totalAdSpend)}</span>
            </> : !isShipmentCostMode ? (
              <span className="text-xs font-bold text-green-700">Total Net Profit: Rs. {formatAmount(totalProfitForTotalModal)}</span>
            ) : null}
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
