import React from 'react';
import { FiDollarSign, FiTruck, FiCreditCard } from 'react-icons/fi';

export default function FinancialModal({
  showFinancialModal,
  setShowFinancialModal,
  financialSummary,
  fetchFinancialSummary,
  loadingFinancials
}) {
  if (!showFinancialModal) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative bg-white rounded-lg max-w-5xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <FiDollarSign className="text-amber-700" size={18} />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-amber-700 tracking-widest block">Bank Payouts & Balance</span>
              <h3 className="text-sm font-bold text-stone-900">Shiprocket & Razorpay Financial Settlements</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchFinancialSummary}
              disabled={loadingFinancials}
              className="bg-[#8c6239] hover:bg-stone-900 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
            >
              {loadingFinancials ? 'Syncing...' : 'Sync Financials'}
            </button>
            <button
              type="button"
              onClick={() => setShowFinancialModal(false)}
              className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* Combined Executive Financial Overview */}
          <div className="bg-stone-900 text-white rounded-xl p-5 shadow-lg border border-stone-800 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <div>
                <h4 className="text-sm font-bold tracking-wide uppercase text-emerald-400">Complete Financial & Order Payout Summary</h4>
                <p className="text-[11px] text-stone-400">Live Breakdown across COD, Prepaid, Shipped Pipeline & Self Handover Sales</p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-stone-800 text-emerald-400 border border-stone-700">
                Live Order Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Immediate Pending Bank Payout */}
              <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Immediate Bank Payout Due</span>
                <h3 className="text-xl font-bold text-amber-400 mt-1">
                  ₹ {financialSummary?.combined_summary?.total_pending_bank_payout || 0}
                </h3>
                <div className="mt-1 text-[10px] space-y-0.5 font-medium text-stone-300">
                  <div className="flex justify-between">
                    <span>Delivered COD Pending:</span>
                    <span className="text-amber-300 font-bold">₹ {financialSummary?.combined_summary?.cod_delivered_pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prepaid Unsettled:</span>
                    <span className="text-blue-300 font-bold">₹ {financialSummary?.combined_summary?.prepaid_unsettled_balance || 0}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Full COD Order Pipeline */}
              <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total COD Pipeline (Shipped+Delivered)</span>
                <h3 className="text-xl font-bold text-amber-300 mt-1">
                  ₹ {financialSummary?.combined_summary?.cod_pipeline_total || 0}
                </h3>
                <div className="mt-1 text-[10px] space-y-0.5 font-medium text-stone-300">
                  <div className="flex justify-between">
                    <span>Shipped (In-Transit):</span>
                    <span className="text-purple-300 font-bold">₹ {financialSummary?.combined_summary?.cod_shipped_in_transit || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivered (Pending):</span>
                    <span className="text-emerald-300 font-bold">₹ {financialSummary?.combined_summary?.cod_delivered_pending || 0}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Self Handover / Offline Sales */}
              <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Self Handover (Ghar Se Cash)</span>
                <h3 className="text-xl font-bold text-emerald-400 mt-1">
                  ₹ {financialSummary?.combined_summary?.offline_self_handover_total || 0}
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {financialSummary?.local_metrics?.offline_orders_count || 0} Offline / Direct Sales Cash
                </p>
              </div>

              {/* Card 4: Total Already Received in Bank */}
              <div className="bg-stone-800/80 p-3.5 rounded-lg border border-stone-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Received in Bank</span>
                <h3 className="text-xl font-bold text-teal-300 mt-1">
                  ₹ {financialSummary?.combined_summary?.total_already_received_in_bank || 0}
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Online Prepaid Settled to Bank</p>
              </div>
            </div>
          </div>

          {/* Shiprocket Section */}
          <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-purple-200/60 pb-3">
              <div className="flex items-center gap-2">
                <FiTruck className="text-purple-700" size={18} />
                <h4 className="text-sm font-bold text-purple-900">Shiprocket COD Remittances & Wallet</h4>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                COD Payouts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-purple-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Shiprocket Wallet Balance</span>
                <h3 className="text-xl font-bold text-emerald-700 mt-1">₹ {financialSummary?.shiprocket?.wallet_balance || 0}</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Used for courier shipping charges</p>
              </div>
              <div className="bg-white p-4 rounded border border-purple-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Estimated Pending COD Remittance</span>
                <h3 className="text-xl font-bold text-amber-700 mt-1">
                  ₹ {financialSummary?.shiprocket?.upcoming_remittance_total || financialSummary?.local_metrics?.cod_delivered_unremitted_estimate || 0}
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5">COD cash collected by couriers pending payout</p>
              </div>
            </div>

            {financialSummary?.shiprocket?.remittances_schedule && financialSummary.shiprocket.remittances_schedule.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse bg-white rounded border border-purple-200 overflow-hidden">
                <thead>
                  <tr className="bg-purple-100/60 text-purple-900 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-3">Remittance ID</th>
                    <th className="p-3">Remittance Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Bank UTR</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {financialSummary.shiprocket.remittances_schedule.map((r, i) => (
                    <tr key={i} className="border-b border-purple-100 last:border-b-0 hover:bg-purple-50/50">
                      <td className="p-3 font-mono font-bold text-stone-900">{r.id}</td>
                      <td className="p-3 text-stone-600">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="p-3 font-bold uppercase text-[10px] text-green-700">{r.status}</td>
                      <td className="p-3 font-mono text-stone-500">{r.utr}</td>
                      <td className="p-3 text-right font-bold text-purple-900">₹ {r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="bg-white p-4 rounded border border-purple-200 text-xs text-stone-600 leading-relaxed space-y-1">
                <p className="font-semibold text-stone-800">📌 Shiprocket Remittance Schedule Info:</p>
                <p>Shiprocket remits COD funds weekly directly to your registered bank account. Total estimated COD value from delivered/shipped orders: <strong className="text-purple-800">₹ {financialSummary?.local_metrics?.cod_delivered_unremitted_estimate || 0}</strong>.</p>
              </div>
            )}
          </div>

          {/* Razorpay Section */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-blue-200/60 pb-3">
              <div className="flex items-center gap-2">
                <FiCreditCard className="text-blue-700" size={18} />
                <h4 className="text-sm font-bold text-blue-900">Razorpay Online Payment Settlements</h4>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                Online Prepaid
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-blue-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Total Online Prepaid Collected</span>
                <h3 className="text-xl font-bold text-blue-700 mt-1">₹ {financialSummary?.local_metrics?.prepaid_razorpay_total || 0}</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Gross prepaid revenue captured via Razorpay</p>
              </div>
              <div className="bg-white p-4 rounded border border-blue-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Pending Bank Payout</span>
                <h3 className="text-xl font-bold text-purple-700 mt-1">₹ {financialSummary?.razorpay?.unsettled_balance || 0}</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Unsettled online payments pending bank transfer</p>
              </div>
            </div>

            {financialSummary?.razorpay?.settlements_schedule && financialSummary.razorpay.settlements_schedule.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse bg-white rounded border border-blue-200 overflow-hidden">
                <thead>
                  <tr className="bg-blue-100/60 text-blue-900 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-3">Settlement ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Fees & Tax</th>
                    <th className="p-3">Bank UTR</th>
                    <th className="p-3 text-right">Net Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {financialSummary.razorpay.settlements_schedule.map((s, i) => (
                    <tr key={i} className="border-b border-blue-100 last:border-b-0 hover:bg-blue-50/50">
                      <td className="p-3 font-mono font-bold text-stone-900">{s.id}</td>
                      <td className="p-3 text-stone-600">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          s.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-stone-500">₹ {s.fees} (+ ₹{s.tax})</td>
                      <td className="p-3 font-mono text-stone-500">{s.utr}</td>
                      <td className="p-3 text-right font-bold text-blue-900">₹ {s.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="bg-white p-4 rounded border border-blue-200 text-xs text-stone-600 leading-relaxed space-y-1">
                <p className="font-semibold text-stone-800">📌 Razorpay Settlement Cycle Info:</p>
                <p>Razorpay settles online prepaid payments automatically on a T+1 / T+2 rolling basis directly into your linked bank account. Total online sales collected: <strong className="text-blue-800">₹ {financialSummary?.local_metrics?.prepaid_razorpay_total || 0}</strong>.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
          <span className="text-xs font-bold text-stone-600">
            Live Financial Summary &bull; Maaz Oud Admin
          </span>
          <button
            type="button"
            onClick={() => setShowFinancialModal(false)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
