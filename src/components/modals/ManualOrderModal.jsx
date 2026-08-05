import React from 'react';

export default function ManualOrderModal({
  showManualOrderModal,
  setShowManualOrderModal,
  manualCustomerName,
  setManualCustomerName,
  manualPhone,
  setManualPhone,
  manualSelectedProductId,
  setManualSelectedProductId,
  manualSelectedSize,
  setManualSelectedSize,
  manualQuantity,
  setManualQuantity,
  manualSellingPrice,
  setManualSellingPrice,
  manualBaseCost,
  setManualBaseCost,
  manualPaymentMethod,
  setManualPaymentMethod,
  manualStatus,
  setManualStatus,
  manualDeliveryCharge,
  setManualDeliveryCharge,
  savingManualOrder,
  products,
  handleCreateManualOrder
}) {
  if (!showManualOrderModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-md border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-0 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-widest block">Offline / In-Person Sale</span>
            <h3 className="text-sm font-bold text-stone-900">Add Manual Order</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowManualOrderModal(false)}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateManualOrder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={manualCustomerName}
                onChange={(e) => setManualCustomerName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Select Product *
              </label>
              <select
                value={manualSelectedProductId}
                onChange={(e) => setManualSelectedProductId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              >
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Size
              </label>
              <select
                value={manualSelectedSize}
                onChange={(e) => setManualSelectedSize(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              >
                <option value="3ml">3ml Bottle</option>
                <option value="6ml">6ml Bottle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={manualQuantity}
                onChange={(e) => setManualQuantity(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Selling Price (Rs.) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 250"
                value={manualSellingPrice}
                onChange={(e) => setManualSellingPrice(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Base Cost (Rs.)
              </label>
              <input
                type="number"
                placeholder={manualSelectedSize === '6ml' ? '156' : '100'}
                value={manualBaseCost}
                onChange={(e) => setManualBaseCost(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={manualPaymentMethod}
                onChange={(e) => setManualPaymentMethod(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              >
                <option value="Cash (Offline)">Cash (Offline)</option>
                <option value="UPI / QR">UPI / QR Code</option>
                <option value="Google Pay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Order Status
              </label>
              <select
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
              >
                <option value="Delivered">Delivered (Completed)</option>
                <option value="Processing">Processing (Pending)</option>
                <option value="Shipped">Shipped</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Delivery Cost (Rs.)
              </label>
              <input
                type="number"
                value={manualDeliveryCharge}
                onChange={(e) => setManualDeliveryCharge(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none font-semibold"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowManualOrderModal(false)}
              className="px-4 py-2 border border-stone-200 text-stone-700 bg-white hover:bg-stone-100 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingManualOrder}
              className="px-5 py-2 bg-[#8c6239] hover:bg-[#76512d] text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all disabled:opacity-50"
            >
              {savingManualOrder ? "Saving..." : "Save Manual Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
