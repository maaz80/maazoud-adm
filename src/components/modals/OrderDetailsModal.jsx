import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { getWhatsAppLink } from '../../utils/helpers';
import { supabase } from '../../utils/supabase';

export default function OrderDetailsModal({
  selectedOrder,
  setSelectedOrder,
  getOrderDeliveryDate,
  handleUpdateDeliveryDate,
  markMessageAsSent,
  sentMessages,
  handleUpdateDeliveryCharge,
  handleDownloadLabel,
  handleDownloadManifest,
  handleSyncShiprocketOrder,
  generatingLabel,
  generatingManifest,
  syncingShipment,
  requestOrderStatusUpdate,
  fetchOrders,
  setShiprocketOrderId,
  setCourierRates,
  setSelectedCourier,
  setRateError,
  setShipmentError,
  setShiprocketWeight,
  setShiprocketLength,
  setShiprocketWidth,
  setShiprocketHeight,
  setShowShiprocketModal,
  pendingStatusUpdate,
  setPendingStatusUpdate,
  confirmOrderStatusUpdate
}) {
  if (!selectedOrder) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
        <div className="relative bg-white rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div>
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-widest block">Order Details</span>
              <h3 className="text-sm font-bold text-stone-900 font-mono">{selectedOrder.id}</h3>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

            {/* Status & Date */}
            <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Order Status</span>
                <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full mt-1 ${
                  selectedOrder.status === 'Delivered'
                    ? 'bg-green-100 text-green-800'
                    : selectedOrder.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedOrder.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Date & Time</span>
                <span className="text-xs font-semibold text-stone-800 block mt-1">
                  {new Date(selectedOrder.created_at).toLocaleString("en-US", {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {selectedOrder.status === 'Delivered' && (
              <div className="bg-green-50/80 p-3 rounded border border-green-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-green-800 tracking-wider flex items-center gap-1">
                    <FiCheckCircle className="text-green-600" size={12} />
                    Delivery Date & Time
                  </span>
                  <span className="font-bold text-green-900 block mt-0.5">
                    {getOrderDeliveryDate(selectedOrder).toLocaleString("en-US", {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const defaultDate = getOrderDeliveryDate(selectedOrder).toISOString().split('T')[0];
                    const inputDate = prompt("Set/Change Delivery Date (YYYY-MM-DD):", defaultDate);
                    if (inputDate) {
                      handleUpdateDeliveryDate(selectedOrder.id, inputDate);
                      alert("Delivery date updated successfully!");
                    }
                  }}
                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-white border border-green-300 text-green-800 rounded hover:bg-green-100 transition-colors cursor-pointer"
                >
                  Edit Delivery Date
                </button>
              </div>
            )}

            {/* Customer & Shipping Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Customer & Shipping Information</h3>
              <div className="bg-stone-50 p-4 rounded border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-0.5">Name</span>
                  <span className="font-semibold text-stone-900 block">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-0.5">Phone Number</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${selectedOrder.phone}`} className="font-semibold text-[#8c6239] hover:underline">{selectedOrder.phone}</a>
                    <a 
                      href={getWhatsAppLink(selectedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markMessageAsSent(selectedOrder.id, selectedOrder.status)}
                      className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded p-1 transition-colors"
                      title="Message on WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                      </svg>
                    </a>
                    
                    {sentMessages[selectedOrder.id]?.[selectedOrder.status === 'Placed' ? 'Processing' : selectedOrder.status] ? (
                      <span className="text-[9px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                        ✓ {selectedOrder.status === 'Processing' || selectedOrder.status === 'Placed' ? 'Placed' : selectedOrder.status} MSG Sent
                      </span>
                    ) : (
                      <span className="text-[9px] bg-stone-100 border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
                        Pending MSG
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Shipping Address</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${selectedOrder.customer_name}\n${selectedOrder.phone}\n${selectedOrder.address}\n${selectedOrder.city}, ${selectedOrder.state} - ${selectedOrder.pincode}`);
                        alert("Shipping details copied to clipboard!");
                      }}
                      className="text-[9px] uppercase font-bold text-[#8c6239] hover:underline cursor-pointer"
                    >
                      Copy Address Details
                    </button>
                  </div>
                  <span className="text-stone-850 font-light block leading-relaxed bg-white border border-stone-150 p-2.5 rounded">
                    {selectedOrder.address}<br />
                    {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                  </span>
                </div>
              </div>
            </div>

            {/* Ordered Products Gallery List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Ordered Attars</h3>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded overflow-hidden">
                {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4 p-3 bg-white hover:bg-stone-50/50 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.product?.image || "/images/placeholder.jpg"}
                        alt=""
                        className="w-8 h-10 object-cover rounded border border-stone-200 bg-stone-50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-stone-900 block truncate">{item.product?.name || "Attar Scent"}</span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">Size: {item.selectedSize || "3ml"} &bull; Price: Rs. {item.price}</span>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <span className="text-stone-500 block">Qty: {item.quantity}</span>
                      <span className="font-bold text-stone-900 block mt-0.5">Rs. {item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Breakdown & Payments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Payment Information</span>
                <div className="bg-stone-50 p-3 rounded border border-stone-200 font-light space-y-2 text-stone-750">
                  <div className="flex justify-between items-center">
                    <span>Method:</span>
                    <span className="font-bold text-stone-900">{selectedOrder.payment_method}</span>
                  </div>
                  {String(selectedOrder.payment_method || '').toLowerCase().includes('cod') && selectedOrder.status === 'Delivered' && (
                    <div className="pt-2 border-t border-stone-200 flex flex-col gap-1.5">
                      {Boolean(selectedOrder.is_paid) || Boolean(selectedOrder.shipment_details?.cod_remitted) ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2 rounded">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-green-800 block">✓ Bank Payout Received</span>
                            {selectedOrder.shipment_details?.remittance_utr && (
                              <span className="text-[9px] font-mono text-green-700 block">UTR: {selectedOrder.shipment_details.remittance_utr}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm("Mark COD payout back as Pending Payout?")) return;
                              const updatedDetails = {
                                ...(selectedOrder.shipment_details || {}),
                                cod_remitted: false
                              };
                              const { error } = await supabase
                                .from('orders')
                                .update({ shipment_details: updatedDetails })
                                .eq('id', selectedOrder.id);
                              if (error) {
                                alert("Failed: " + error.message);
                              } else {
                                alert("Updated to Pending Payout.");
                                await fetchOrders();
                                setSelectedOrder(prev => ({ ...prev, shipment_details: updatedDetails }));
                              }
                            }}
                            className="text-[9px] font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                          >
                            Undo
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            const utr = prompt("Enter Bank UTR / Reference No. (Optional):", "Bank Remitted");
                            if (utr === null) return;
                            const updatedDetails = {
                              ...(selectedOrder.shipment_details || {}),
                              cod_remitted: true,
                              cod_remitted_at: new Date().toISOString(),
                              remittance_utr: utr || 'Bank Remitted'
                            };
                            const { error } = await supabase
                              .from('orders')
                              .update({ shipment_details: updatedDetails })
                              .eq('id', selectedOrder.id);
                            if (error) {
                              alert("Failed to update status: " + error.message);
                            } else {
                              alert("COD payout marked as Received in Bank!");
                              await fetchOrders();
                              setSelectedOrder(prev => ({ ...prev, shipment_details: updatedDetails }));
                            }
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded transition-colors cursor-pointer text-center"
                        >
                          🏦 Mark COD Amount Received in Bank
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Billing Total</span>
                <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1.5 text-stone-750">
                  {(() => {
                    const items = selectedOrder.items || [];
                    const itemsSubtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                    const isCod = String(selectedOrder.payment_method || '').toLowerCase().includes('cod');
                    const codFee = isCod ? 30 : 0;
                    const deliveryCharge = 40;
                    const actualSubtotal = itemsSubtotal > 0 ? itemsSubtotal : (selectedOrder.total_amount - deliveryCharge - codFee);

                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-stone-900">Rs. {actualSubtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Charges:</span>
                          <span className="font-semibold text-stone-900">Rs. {deliveryCharge}</span>
                        </div>
                        {isCod && (
                          <div className="flex justify-between">
                            <span>COD Fee:</span>
                            <span className="font-semibold text-stone-900">Rs. {codFee}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-stone-200 pt-1.5 font-bold text-stone-900">
                          <span>Total Amount Paid:</span>
                          <span className="text-[#8c6239]">Rs. {selectedOrder.total_amount}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Shiprocket Tracking Card */}
            {selectedOrder.shiprocket_awb && (
              <div className="bg-purple-50 p-4 rounded border border-purple-200 text-xs space-y-2 mt-4">
                <div className="flex justify-between items-center border-b border-purple-100 pb-2">
                  <span className="text-[10px] uppercase font-bold text-purple-750 tracking-wider">Shiprocket Tracking Details</span>
                  <span className="text-[9px] uppercase font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{selectedOrder.shiprocket_status || 'Shipped'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Courier Partner</span>
                    <span className="font-semibold text-stone-900 block">{selectedOrder.shiprocket_courier_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">AWB (Tracking Number)</span>
                    <span className="font-semibold text-stone-900 font-mono block">{selectedOrder.shiprocket_awb}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Shipment Charge</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateDeliveryCharge(selectedOrder.id, selectedOrder.shiprocket_charge)}
                        className="text-[9px] font-bold uppercase text-purple-700 hover:underline cursor-pointer"
                      >
                        [Edit Charge]
                      </button>
                    </div>
                    <span className="font-semibold text-stone-900 block">
                      Rs. {selectedOrder.shiprocket_charge && Number(selectedOrder.shiprocket_charge) > 0 
                        ? selectedOrder.shiprocket_charge 
                        : (selectedOrder.shipment_details?.assign_awb_response?.response?.data?.freight_charges || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Track Online</span>
                    <a 
                      href={`https://shiprocket.co/tracking/${selectedOrder.shiprocket_awb}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-purple-600 font-bold hover:underline block"
                    >
                      View Live Tracking &rarr;
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-purple-100 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDownloadLabel(selectedOrder)}
                    disabled={generatingLabel}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {generatingLabel ? (
                      <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span> Generating…</>
                    ) : (
                      <>📄 Download Label</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadManifest(selectedOrder)}
                    disabled={generatingManifest}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {generatingManifest ? (
                      <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span> Generating…</>
                    ) : (
                      <>📋 Download Manifest</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSyncShiprocketOrder(selectedOrder)}
                    disabled={syncingShipment}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5 ml-auto"
                  >
                    {syncingShipment ? (
                      <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span> Syncing…</>
                    ) : (
                      <>🔄 Sync from Shiprocket</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Sync Pending Shiprocket Order Banner */}
            {!selectedOrder.shiprocket_awb && (selectedOrder.shiprocket_order_id || selectedOrder.shiprocket_shipment_id) && (
              <div className="bg-amber-50 p-4 rounded border border-amber-300 text-xs space-y-2 mt-4">
                <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Shiprocket Order Created (AWB Pending / Manual Ship)</span>
                  <span className="text-[9px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Action Needed</span>
                </div>
                <p className="text-stone-700 text-[11px] leading-relaxed">
                  This order was registered on Shiprocket (Order ID: <span className="font-mono font-bold text-amber-900">{selectedOrder.shiprocket_order_id || selectedOrder.shiprocket_shipment_id}</span>). If you shipped it or assigned courier manually in the Shiprocket dashboard, click below to sync AWB and enable Label download.
                </p>
                <div className="flex gap-2 pt-2 flex-wrap items-center">
                  <button
                    type="button"
                    onClick={() => handleSyncShiprocketOrder(selectedOrder)}
                    disabled={syncingShipment}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {syncingShipment ? (
                      <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span> Syncing with Shiprocket…</>
                    ) : (
                      <>🔄 Sync AWB & Details from Shiprocket</>
                    )}
                  </button>
                  {selectedOrder.shiprocket_shipment_id && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDownloadLabel(selectedOrder)}
                        disabled={generatingLabel}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {generatingLabel ? "Generating…" : "📄 Download Label"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadManifest(selectedOrder)}
                        disabled={generatingManifest}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {generatingManifest ? "Generating…" : "📋 Download Manifest"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center gap-3">
            <div className="flex gap-2">
              {selectedOrder.status !== 'Shipped' && selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && !selectedOrder.shiprocket_awb && (
                <button
                  type="button"
                  onClick={() => {
                    setShiprocketOrderId(selectedOrder.id);
                    setCourierRates([]);
                    setSelectedCourier(null);
                    setRateError('');
                    setShipmentError('');
                    setShiprocketWeight('0.5');
                    setShiprocketLength('10');
                    setShiprocketWidth('10');
                    setShiprocketHeight('10');
                    setShowShiprocketModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  Ship with Shiprocket
                </button>
              )}
              {selectedOrder.status !== 'Shipped' && selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => requestOrderStatusUpdate(selectedOrder, 'Shipped')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  Mark Shipped
                </button>
              )}
              {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Deliver order ${selectedOrder.id} yourself (₹0 Delivery Cost)?`)) return;
                    const updatedDetails = {
                      ...(selectedOrder.shipment_details || {}),
                      custom_delivery_date: new Date().toISOString(),
                      delivered_date: new Date().toISOString()
                    };
                    const { error } = await supabase
                      .from('orders')
                      .update({
                        status: 'Delivered',
                        shiprocket_charge: 0,
                        shiprocket_courier_name: 'Hand Delivered (Direct / Local)',
                        shipment_details: updatedDetails
                      })
                      .eq('id', selectedOrder.id);
                    if (error) {
                      alert("Failed to update order: " + error.message);
                    } else {
                      alert("Order marked as Hand-Delivered (₹0 Delivery Cost)!");
                      await fetchOrders();
                      setSelectedOrder(prev => ({
                        ...prev,
                        status: 'Delivered',
                        shiprocket_charge: 0,
                        shiprocket_courier_name: 'Hand Delivered (Direct / Local)',
                        shipment_details: updatedDetails
                      }));
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  Self / Hand Deliver (₹0 Freight)
                </button>
              )}
              {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => requestOrderStatusUpdate(selectedOrder, 'Delivered')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  Mark Delivered
                </button>
              )}
              {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => requestOrderStatusUpdate(selectedOrder, 'Cancelled')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  Cancel Order
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-5 py-2 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {pendingStatusUpdate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-md border border-stone-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-stone-200 px-5 py-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8c6239]">Confirm Status Update</span>
              <h3 className="mt-1 text-base font-bold text-stone-900">
                Mark order as {pendingStatusUpdate.newStatus}?
              </h3>
            </div>

            <div className="space-y-3 px-5 py-4 text-xs text-stone-600">
              <p>
                This will update order <span className="font-bold text-stone-900">{pendingStatusUpdate.order.id}</span>
                {pendingStatusUpdate.order.customer_name ? (
                  <> for <span className="font-bold text-stone-900">{pendingStatusUpdate.order.customer_name}</span></>
                ) : null}.
              </p>
              <p className="rounded border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                Please confirm only after the order has actually reached this stage.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setPendingStatusUpdate(null)}
                className="rounded border border-stone-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOrderStatusUpdate}
                className={`rounded px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white cursor-pointer ${
                  pendingStatusUpdate.newStatus === 'Delivered'
                    ? 'bg-green-600 hover:bg-green-700'
                    : pendingStatusUpdate.newStatus === 'Cancelled'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm {pendingStatusUpdate.newStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
