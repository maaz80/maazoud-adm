import React from 'react';

export default function ZipyPostModal({
  showZipyPostModal,
  setShowZipyPostModal,
  zipypostOrderId,
  zipypostWeight,
  setZipypostWeight,
  zipypostLength,
  setZipypostLength,
  zipypostWidth,
  setZipypostWidth,
  zipypostHeight,
  setZipypostHeight,
  zipypostCourierRates,
  fetchingZipyRates,
  zipyRateError,
  zipyShipmentError,
  selectedZipyCourier,
  setSelectedZipyCourier,
  initializingZipyShipment,
  handleFetchZipyCourierRates,
  handleInitializeZipyShipment
}) {
  if (!showZipyPostModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-sky-50/70">
          <div>
            <span className="text-[9px] uppercase font-bold text-sky-750 tracking-widest block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
              ZipyPost Logistics Integration
            </span>
            <h3 className="text-sm font-bold text-stone-900 font-mono">Initialize Shipment: {zipypostOrderId}</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowZipyPostModal(false)}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
            disabled={initializingZipyShipment}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {zipyRateError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {zipyRateError}
            </div>
          )}
          {zipyShipmentError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {zipyShipmentError}
            </div>
          )}

          {/* Package Dimensions & Weight */}
          <div className="bg-stone-50 p-4 rounded border border-stone-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Package Specifications</span>
              <span className="text-[9px] text-stone-400 font-semibold">Warehouse: Jaunpur (222001)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={zipypostWeight}
                  onChange={e => setZipypostWeight(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-sky-500"
                  disabled={fetchingZipyRates || initializingZipyShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="0.5"
                  required
                  value={zipypostLength}
                  onChange={e => setZipypostLength(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-sky-500"
                  disabled={fetchingZipyRates || initializingZipyShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Width (cm)</label>
                <input
                  type="number"
                  min="0.5"
                  required
                  value={zipypostWidth}
                  onChange={e => setZipypostWidth(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-sky-500"
                  disabled={fetchingZipyRates || initializingZipyShipment}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="0.5"
                  required
                  value={zipypostHeight}
                  onChange={e => setZipypostHeight(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs text-stone-900 focus:outline-none focus:border-sky-500"
                  disabled={fetchingZipyRates || initializingZipyShipment}
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleFetchZipyCourierRates}
                disabled={fetchingZipyRates || initializingZipyShipment}
                className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-all cursor-pointer disabled:opacity-50"
              >
                {fetchingZipyRates ? "Calculating ZipyPost Rates..." : "Calculate ZipyPost Courier Rates"}
              </button>
            </div>
          </div>

          {/* Courier Selection List */}
          {zipypostCourierRates && zipypostCourierRates.length > 0 && (() => {
            const seenGroups = new Set();

            return (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <span>⚡ Preferred Couriers:</span>
                    <span className="text-sky-700 font-extrabold">1. Delhivery &rarr; 2. Ekart &rarr; 3. Shadowfax</span>
                  </span>
                  <span className="text-[9px] text-stone-400 font-semibold">{zipypostCourierRates.length} Options</span>
                </div>
                <div className="border border-stone-200 rounded divide-y divide-stone-100 overflow-hidden max-h-80 overflow-y-auto">
                  {zipypostCourierRates.map((courier, idx) => {
                    const isSelected = selectedZipyCourier?.courier_id === courier.courier_id &&
                                       selectedZipyCourier?.mode_id === courier.mode_id &&
                                       selectedZipyCourier?.slab === courier.slab;
                    const groupKey = (courier.group || courier.courier_name || '').toLowerCase();
                    const isGroupBest = !seenGroups.has(groupKey);
                    if (isGroupBest) seenGroups.add(groupKey);

                    const rankNum = groupKey.includes('delhivery') ? 1 : groupKey.includes('ekart') ? 2 : 3;

                    return (
                      <div
                        key={`${courier.courier_id}-${courier.mode_id}-${courier.slab || idx}`}
                        onClick={() => !initializingZipyShipment && setSelectedZipyCourier(courier)}
                        className={`p-3 flex justify-between items-center text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 border-l-4 border-sky-600'
                            : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-stone-100 text-stone-700 font-bold text-[9px]">
                              {rankNum}
                            </span>
                            <span className="font-bold text-stone-900 block">{courier.courier_name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-100/70 text-sky-850 font-mono font-semibold">
                              {courier.mode_name}-{courier.slab}kg
                            </span>
                            {isGroupBest && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
                                {courier.courier_name} Best Price
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-500 block font-light">
                            Zone: {courier.zone || 'Domestic'} &bull; Base: Rs. {courier.base_rate}
                            {courier.cod_charge > 0 && ` + COD: Rs. ${courier.cod_charge}`}
                            {courier.gst > 0 && ` + GST: Rs. ${courier.gst}`}
                          </span>
                        </div>
                        <div className="text-right whitespace-nowrap pl-3">
                          <span className="font-bold text-sky-700 block text-sm">Rs. {courier.rate}</span>
                          <span className="text-[9px] text-stone-400 block">Total Payable</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowZipyPostModal(false)}
            className="px-4 py-2 border border-stone-200 text-stone-700 bg-white hover:bg-stone-100 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all disabled:opacity-50"
            disabled={initializingZipyShipment}
          >
            Cancel
          </button>
          {selectedZipyCourier && (
            <button
              type="button"
              onClick={handleInitializeZipyShipment}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all disabled:opacity-50"
              disabled={initializingZipyShipment}
            >
              {initializingZipyShipment ? "Booking on ZipyPost..." : `Confirm & Ship via ZipyPost (Rs. ${selectedZipyCourier.rate})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
