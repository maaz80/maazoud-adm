   Line 200
    {/* 💳, 🚚 & 🤝 PAYOUT & SALES TRACKERS GRID (3 COLUMNS: ONLINE, COD, OFFLINE) */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 💳 1. RAZORPAY BANK PAYOUT BOX */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                <FiCreditCard size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Razorpay Settlements
                  </h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isRzpApiConnected 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {isRzpApiConnected ? 'Live API' : 'Order Sync'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Online prepaid payouts</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="text-[10px] font-bold text-[#8c6239] hover:text-stone-900 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            >
              Details &rarr;
            </button>
          </div>

          {/* Metrics 3 Cards */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {/* Card 1: Bank Me Aa Chuka */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Bank Me Aa Chuka</span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {rzpDeliveredOrders.length} Orders
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(razorpaySettledAmount)}
              </h3>
              <p className="text-[9px] text-stone-500">Credited to Bank Account</p>
            </div>

            {/* Card 2: Bank Me Aane Wala */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Bank Me Aane Wala</span>
                <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {rzpPendingOrders.length} Orders
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(razorpayPendingAmount)}
              </h3>
              <p className="text-[9px] text-stone-500">Captured, pending bank transfer</p>
            </div>

            {/* Card 3: Total Online */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-stone-600 tracking-wider">Total Online</span>
                <span className="text-[9px] font-semibold text-stone-700 bg-stone-100 px-1 py-0.2 rounded border border-stone-200">
                  {prepaidOrders.length} Prepaid
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(razorpayTotalCaptured)}
              </h3>
              <p className="text-[9px] text-stone-500">{settledPercentage}% Settled to Bank</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs space-y-1.5">
            <div className="flex justify-between text-[10px] text-stone-600">
              <span>Settlement Progress</span>
              <span className="font-mono">
                <strong className="text-emerald-700">₹{formatApprox(razorpaySettledAmount)}</strong> in Bank
              </span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded overflow-hidden flex">
              <div style={{ width: `${settledPercentage}%` }} className="bg-emerald-600 h-full"></div>
              <div style={{ width: `${100 - settledPercentage}%` }} className="bg-amber-500 h-full"></div>
            </div>
          </div>
        </div>

        {/* 🚚 2. SHIPROCKET COD PAYOUT BOX */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                <FiTruck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Shiprocket COD Payouts
                  </h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isSrConnected 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {isSrConnected ? 'Live API' : 'Order Sync'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Courier cash remittances</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="text-[10px] font-bold text-[#8c6239] hover:text-stone-900 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            >
              Details &rarr;
            </button>
          </div>

          {/* Metrics 3 Cards */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {/* Card 1: Bank Me Aa Gaya */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Bank Me Aa Gaya</span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Remitted
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(codReceivedInBank)}
              </h3>
              <p className="text-[9px] text-stone-500">COD remitted to bank account</p>
            </div>

            {/* Card 2: Shiprocket Upcoming */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-purple-700 tracking-wider">Upcoming Payout</span>
                <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                  {shiprocketUpcomingCount} Delivered
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(shiprocketUpcomingRemittance)}
              </h3>
              <p className="text-[9px] text-stone-500">Delivered COD pending remittance</p>
            </div>

            {/* Card 3: Future Total Expected */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Future Total COD</span>
                <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {codOrders.length} Active COD
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(totalFutureCodExpected)}
              </h3>
              <p className="text-[9px] text-stone-500">Processing + Shipped + Delivered</p>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-600 block uppercase tracking-wider">
              COD Pipeline Breakdown:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
              <div className="bg-white border border-stone-200 px-1.5 py-1 rounded flex justify-between items-center">
                <span className="text-stone-600">Del:</span>
                <strong className="text-purple-700">₹{formatApprox(shiprocketUpcomingRemittance)}</strong>
              </div>
              <div className="bg-white border border-stone-200 px-1.5 py-1 rounded flex justify-between items-center">
                <span className="text-stone-600">Ship:</span>
                <strong className="text-blue-700">₹{formatApprox(localCodShippedSum)}</strong>
              </div>
              <div className="bg-white border border-stone-200 px-1.5 py-1 rounded flex justify-between items-center">
                <span className="text-stone-600">Proc:</span>
                <strong className="text-amber-700">₹{formatApprox(localCodProcessingSum)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 🤝 3. DIRECT OFFLINE & CASH SALES BOX */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                <FiDollarSign size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Offline & Cash Sales
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                    Cash In Hand
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Handover sales & manual orders</p>
              </div>
            </div>

            {setShowManualOrderModal && (
              <button
                type="button"
                onClick={() => setShowManualOrderModal(true)}
                className="bg-[#8c6239] hover:bg-stone-900 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
              >
                + Add Order
              </button>
            )}
          </div>

          {/* Metrics 3 Cards */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {/* Card 1: Total Cash In Hand */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Total Cash In Hand</span>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {offlineOrders.length} Orders
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(offlineSalesTotal)}
              </h3>
              <p className="text-[9px] text-stone-500">100% Direct cash received</p>
            </div>

            {/* Card 2: Offline Profit */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-wider">Net Offline Profit</span>
                <span className="text-[9px] font-semibold text-[#8c6239] bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  Direct Profit
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                ₹ {formatApprox(offlineProfitTotal)}
              </h3>
              <p className="text-[9px] text-stone-500">Earned profit on local sales</p>
            </div>

            {/* Card 3: Payment Status */}
            <div className="bg-stone-50/80 border border-stone-200 p-3.5 rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-stone-600 tracking-wider">Delivery Cost</span>
                <span className="text-[9px] font-semibold text-stone-700 bg-stone-100 px-1 py-0.2 rounded border border-stone-200">
                  ₹ 0 Cost
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                100% Cash In Hand
              </h3>
              <p className="text-[9px] text-stone-500">Zero courier logistics charges</p>
            </div>
          </div>

          {/* Recent Offline Orders Sub-list */}
          <div className="bg-stone-50 border border-stone-200 p-2.5 rounded text-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-600 block uppercase tracking-wider">
              Recent Offline Orders ({offlineOrders.length}):
            </span>
            {offlineOrders.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {offlineOrders.slice(0, 3).map(o => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="bg-white border border-stone-200 p-1.5 rounded flex justify-between items-center cursor-pointer hover:bg-stone-100 transition-colors text-[9px]"
                  >
                    <div className="truncate max-w-[140px]">
                      <span className="font-mono font-bold text-stone-900">{o.id}</span>
                      <span className="ml-1.5 font-semibold text-stone-800 truncate">{o.customer_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-700">₹{formatApprox(o.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-stone-400 italic py-0.5">No offline / manual orders recorded yet.</p>
            )}
          </div>
        </div>

      </div>



      Line 530
         {/* 💼 COMBINED MASTER BANK PAYOUTS & COD LEDGER (WHITE BG & LIGHT GRAY BORDER) */}
      <div className="bg-white border border-stone-200 p-5 rounded-md shadow-2xs space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-stone-150 pb-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8c6239] tracking-widest block">Combined Payout Ledger</span>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
              <FiDollarSign className="text-emerald-600" size={16} />
              Master Financial & Bank Payout Breakdown
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFinancialSummary}
              disabled={loadingFinancials}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
            >
              {loadingFinancials ? 'Syncing...' : '🔄 Refresh Data'}
            </button>
            <button
              type="button"
              onClick={() => setShowFinancialModal(true)}
              className="bg-[#8c6239] hover:bg-stone-900 text-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
            >
              Detailed Schedules &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 1: MONEY RECEIVED IN BANK */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-150 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              ✅ 1. Money Already Received (Aa chuke paise)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Bank Settled + Cash In Hand</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">1. Total Received (Bank + Cash)</span>
              <h3 className="text-lg font-bold text-emerald-700 mt-0.5">
                ₹ {formatApprox((financialSummary?.combined_summary?.total_already_received_in_bank || razorpaySettledAmount) + (financialSummary?.combined_summary?.offline_self_handover_total || offlineSalesTotal))}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5 font-mono">
                Bank: ₹{formatApprox(razorpaySettledAmount)} + Cash: ₹{formatApprox(offlineSalesTotal)}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">2. COD Received in Bank</span>
              <h3 className="text-lg font-bold text-purple-700 mt-0.5">
                ₹ {formatApprox(codReceivedInBank)}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">Shiprocket COD payouts remitted to bank</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">3. Razorpay Received in Bank</span>
              <h3 className="text-lg font-bold text-blue-700 mt-0.5">
                ₹ {formatApprox(razorpaySettledAmount)}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">Razorpay online settled to bank</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">4. Direct Cash In Hand</span>
              <h3 className="text-lg font-bold text-amber-700 mt-0.5">
                ₹ {formatApprox(offlineSalesTotal)}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">
                {offlineOrders.length} Direct Offline / Cash Orders
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: MONEY PENDING TO COME TO BANK */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-150 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              ⏳ 2. Money Pending To Come To Bank (Aane baaki paise)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Processing + Shipped + Unsettled Orders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">5. Total Pending To Come</span>
              <h3 className="text-lg font-bold text-amber-700 mt-0.5">
                ₹ {formatApprox(totalFutureCodExpected + razorpayPendingAmount)}
              </h3>
              <div className="mt-1 text-[9px] text-stone-600 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Razorpay Pending:</span>
                  <span className="text-blue-700 font-bold">₹ {formatApprox(razorpayPendingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>COD Future Total:</span>
                  <span className="text-amber-700 font-bold">₹ {formatApprox(totalFutureCodExpected)}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">6. COD Total Future</span>
              <h3 className="text-lg font-bold text-purple-700 mt-0.5">
                ₹ {formatApprox(totalFutureCodExpected)}
              </h3>
              <div className="mt-1 text-[9px] text-stone-600 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Delivered Pending ({shiprocketUpcomingCount}):</span>
                  <span className="text-purple-700 font-bold">₹ {formatApprox(shiprocketUpcomingRemittance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipped In-Transit ({codShippedOrders.length}):</span>
                  <span className="text-blue-700 font-bold">₹ {formatApprox(localCodShippedSum)}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">7. Razorpay Prepaid Pending</span>
              <h3 className="text-lg font-bold text-blue-700 mt-0.5">
                ₹ {formatApprox(razorpayPendingAmount)}
              </h3>
              <p className="text-[9px] text-stone-500 mt-0.5">Razorpay captured unsettled balance pending bank transfer</p>
            </div>
          </div>
        </div>
      </div>