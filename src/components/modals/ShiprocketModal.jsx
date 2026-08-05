import React from 'react';

export default function ShiprocketModal({
  showShiprocketModal,
  setShowShiprocketModal,
  shiprocketOrderId,
  shiprocketWeight,
  setShiprocketWeight,
  shiprocketLength,
  setShiprocketLength,
  shiprocketWidth,
  setShiprocketWidth,
  shiprocketHeight,
  setShiprocketHeight,
  shiprocketPickupDate,
  setShiprocketPickupDate,
  courierRates,
  fetchingRates,
  rateError,
  shipmentError,
  selectedCourier,
  setSelectedCourier,
  initializingShipment,
  handleFetchCourierRates,
  handleInitializeShipment
}) {
  if (!showShiprocketModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[9px] uppercase font-bold text-purple-750 tracking-widest block">Shiprocket Integration</span>
            <h3 className="text-sm font-bold text-stone-900 font-mono">Initialize Shipment: {shiprocketOrderId}</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowShiprocketModal(false)}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
            disabled={initializingShipment}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {rateError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {rateError}
            </div>
          )}
          {shipmentError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {shipmentError}
            </div>
          )}

          {/* Package Dimensions & Weight */}
          <div className="bg-stone-50 p-4 rounded border border-stone-200 space-y-3">
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Package Specifications</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={shiprocketWeight}
                  onChange={e => setShiprocketWeight(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-purple-500"
                  disabled={fetchingRates || initializingShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="0.5"
                  required
                  value={shiprocketLength}
                  onChange={e => setShiprocketLength(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-purple-500"
                  disabled={fetchingRates || initializingShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Width (cm)</label>
                <input
                  type="number"
                  min="0.5"
                  required
                  value={shiprocketWidth}
                  onChange={e => setShiprocketWidth(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-purple-500"
                  disabled={fetchingRates || initializingShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="0.5"
                  required
                  value={shiprocketHeight}
                  onChange={e => setShiprocketHeight(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-purple-500"
                  disabled={fetchingRates || initializingShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Pickup Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  required
                  value={shiprocketPickupDate}
                  onChange={e => setShiprocketPickupDate(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-purple-500"
                  disabled={fetchingRates || initializingShipment}
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleFetchCourierRates}
                disabled={fetchingRates || initializingShipment}
                className="bg-[#8c6239] hover:bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-all cursor-pointer disabled:opacity-50"
              >
                {fetchingRates ? "Calculating Rates..." : "Calculate Courier Rates"}
              </button>
            </div>
          </div>

          {/* Courier Selection List */}
          {courierRates.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Select Shipping Partner (Cheapest First)</span>
              <div className="border border-stone-200 rounded divide-y divide-stone-100 overflow-hidden max-h-60 overflow-y-auto">
                {courierRates.map((courier, idx) => (
                  <div
                    key={courier.courier_company_id || idx}
                    onClick={() => !initializingShipment && setSelectedCourier(courier)}
                    className={`p-3 flex justify-between items-center text-xs transition-colors cursor-pointer ${
                      selectedCourier?.courier_company_id === courier.courier_company_id
                        ? 'bg-purple-50 border-l-4 border-purple-500'
                        : 'bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-stone-850 block">{courier.courier_name}</span>
                      <span className="text-[10px] text-stone-400 block font-light">ETD: {courier.etd} &bull; Rating: {courier.rating}/5</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-700 block">Rs. {courier.rate}</span>
                      {idx === 0 && <span className="text-[8px] bg-emerald-100 text-emerald-800 uppercase font-bold tracking-wider px-1.5 py-0.5 rounded block mt-0.5 w-fit ml-auto">Best Rate</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowShiprocketModal(false)}
            className="px-4 py-2 border border-stone-200 text-stone-700 bg-white hover:bg-stone-100 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all disabled:opacity-50"
            disabled={initializingShipment}
          >
            Cancel
          </button>
          {selectedCourier && (
            <button
              type="button"
              onClick={handleInitializeShipment}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all disabled:opacity-50"
              disabled={initializingShipment}
            >
              {initializingShipment ? "Booking shipment..." : `Confirm & Ship (Rs. ${selectedCourier.rate})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
