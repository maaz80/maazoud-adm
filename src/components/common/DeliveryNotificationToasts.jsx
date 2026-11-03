import React, { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiRotateCcw, FiX, FiExternalLink, FiPackage } from 'react-icons/fi';
import { getOrderDeliveryDate, getRtoDeliveredAt } from '../../utils/helpers';

function DeliveryToastCard({ toast, onDismiss, onSelectOrder }) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(5000);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const { order, type } = toast;
  const isNormal = type === 'normal';

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, toast.id, onDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const delDate = isNormal ? getOrderDeliveryDate(order) : getRtoDeliveredAt(order);
  const isRazorpay = String(order?.payment_method || '').toLowerCase().includes('razorpay') ||
    String(order?.payment_method || '').toLowerCase().includes('payment id');

  const formattedTime = delDate
    ? delDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectOrder && onSelectOrder(order)}
      className={`pointer-events-auto toast-hover-pause relative w-84 sm:w-92 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border transition-all duration-200 cursor-pointer overflow-hidden group hover:scale-[1.01] ${
        isNormal
          ? 'border-emerald-200 border-l-4 border-l-emerald-600 hover:border-emerald-300 animate-toast-right'
          : 'border-amber-200 border-l-4 border-l-amber-600 hover:border-amber-300 animate-toast-left'
      }`}
    >
      <div className="p-3.5 space-y-2">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {isNormal ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                <FiCheckCircle size={11} className="text-emerald-700" />
                Delivered Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                <FiRotateCcw size={11} className="text-amber-700" />
                RTO Delivered Today
              </span>
            )}
            <span className="text-[10px] text-stone-600 font-medium">
              {formattedTime}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            className="text-stone-500 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
            title="Dismiss notification"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Content Row: Order ID & Customer */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-xs text-stone-900">
                #{order?.id}
              </span>
              <span className="font-semibold text-xs text-stone-800 truncate max-w-44">
                {order?.customer_name || 'Customer'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 truncate mt-0.5">
              {[order?.city, order?.state].filter(Boolean).join(', ') || 'Online Order'}
            </p>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <span className={`text-xs font-bold block ${isNormal ? 'text-emerald-700' : 'text-amber-800'}`}>
              ₹ {Math.round(parseFloat(order?.total_amount) || 0).toLocaleString('en-IN')}
            </span>
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
              isRazorpay
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
              {isRazorpay ? 'Razorpay' : 'COD'}
            </span>
          </div>
        </div>

        {/* Action hint */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[9px] text-stone-600">
          <span className="flex items-center gap-1 group-hover:text-stone-700 font-medium">
            <FiPackage size={10} />
            Click to view order details
          </span>
          <FiExternalLink size={10} className="text-stone-500 group-hover:text-stone-700" />
        </div>
      </div>

      {/* 5-second animated progress countdown bar */}
      <div className="w-full h-1 bg-stone-100 overflow-hidden">
        <div
          className={`h-full animate-toast-progress ${
            isNormal ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </div>
    </div>
  );
}

export default function DeliveryNotificationToasts({ toasts = [], onDismiss, onSelectOrder }) {
  const normalToasts = toasts.filter((t) => t.type === 'normal');
  const rtoToasts = toasts.filter((t) => t.type === 'rto');

  return (
    <>
      {/* 🟢 TOP RIGHT CONTAINER: Normal Order Deliveries */}
      {normalToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-70 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {normalToasts.map((toast) => (
            <DeliveryToastCard
              key={toast.id}
              toast={toast}
              onDismiss={onDismiss}
              onSelectOrder={onSelectOrder}
            />
          ))}
        </div>
      )}

      {/* 🟠 TOP LEFT CONTAINER: RTO Deliveries */}
      {rtoToasts.length > 0 && (
        <div className="fixed top-4 left-4 z-70 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {rtoToasts.map((toast) => (
            <DeliveryToastCard
              key={toast.id}
              toast={toast}
              onDismiss={onDismiss}
              onSelectOrder={onSelectOrder}
            />
          ))}
        </div>
      )}
    </>
  );
}
