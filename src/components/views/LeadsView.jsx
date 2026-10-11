import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  FiCopy,
  FiCheck,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiClock,
  FiShoppingBag,
  FiUser,
  FiCheckCircle
} from 'react-icons/fi';
import { getLeadWhatsAppLink } from '../../utils/helpers';

export default function LeadsView({
  activeTab,
  leads = [],
  leadsLoading = false,
  fetchLeads,
  updateLeadStatus,
  deleteLead,
  tableMissing = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' (pending), 'contacted', 'converted', 'all'
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (activeTab !== 'leads') return null;

  const sqlSetupScript = `-- Run this in Supabase Dashboard -> SQL Editor -> Click 'Run'
CREATE TABLE IF NOT EXISTS public.abandoned_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  customer_name TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb,
  cart_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_leads_status ON public.abandoned_leads (status);
CREATE INDEX IF NOT EXISTS idx_abandoned_leads_phone ON public.abandoned_leads (phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_leads_updated_at ON public.abandoned_leads (updated_at DESC);

ALTER TABLE public.abandoned_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to abandoned_leads" ON public.abandoned_leads;
CREATE POLICY "Allow all access to abandoned_leads" 
ON public.abandoned_leads FOR ALL USING (true) WITH CHECK (true);`;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(id);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filter leads based on tab status and search query
  const filteredLeads = leads.filter((lead) => {
    // 1. Status filter
    if (statusFilter === 'active' && lead.status !== 'pending') return false;
    if (statusFilter === 'contacted' && lead.status !== 'contacted') return false;
    if (statusFilter === 'converted' && lead.status !== 'converted') return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (lead.customer_name || '').toLowerCase();
      const phone = (lead.phone || '').toLowerCase();
      const city = (lead.city || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || city.includes(q);
    }

    return true;
  });

  // Calculate high-level summary counts
  const activeCount = leads.filter(l => l.status === 'pending').length;
  const contactedCount = leads.filter(l => l.status === 'contacted').length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;
  const potentialRevenue = leads
    .filter(l => l.status === 'pending')
    .reduce((sum, l) => sum + (Number(l.cart_total) || 0), 0);

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recently';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleWhatsAppClick = (lead) => {
    const waLink = getLeadWhatsAppLink(lead);
    window.open(waLink, '_blank', 'noopener,noreferrer');
    // If pending, offer to mark as contacted
    if (lead.status === 'pending' && updateLeadStatus) {
      updateLeadStatus(lead.id, 'contacted');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Table missing notice banner if Supabase table is not yet created */}
      {tableMissing && (
        <div className="p-5 bg-amber-50 border border-amber-300 rounded-lg shadow-xs">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                Supabase Table Setup Required (10-Second Setup)
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                The database table <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">abandoned_leads</code> is not created in your Supabase project yet. 
                Please copy the SQL query below and run it in your <strong>Supabase Dashboard &gt; SQL Editor</strong>.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="bg-[#8c6239] hover:bg-[#724e2b] text-white text-xs font-bold px-3.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {copiedSql ? <FiCheck size={14} /> : <FiCopy size={14} />}
                  {copiedSql ? 'Copied SQL to Clipboard!' : 'Copy Supabase SQL Query'}
                </button>
                <button
                  type="button"
                  onClick={fetchLeads}
                  className="bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
                >
                  <FiRefreshCw size={12} />
                  Recheck Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
            Active Abandoned
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-stone-900">{activeCount}</span>
            <span className="text-[10px] text-stone-400 font-medium">Uncompleted Form</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
            Potential Recovery
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-[#8c6239]">Rs. {potentialRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-stone-400 font-medium">In Cart</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
            Contacted on WA
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-900">{contactedCount}</span>
            <span className="text-[10px] text-stone-400 font-medium">Followed Up</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider block">
            Converted / Purchased
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-green-800">{convertedCount}</span>
            <span className="text-[10px] text-stone-400 font-medium">Recovered</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Abandoned Leads</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] ${statusFilter === 'active' ? 'bg-amber-200/80 text-amber-900' : 'bg-stone-100 text-stone-500'}`}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('contacted')}
            className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === 'contacted'
                ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Contacted</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] ${statusFilter === 'contacted' ? 'bg-blue-200/80 text-blue-900' : 'bg-stone-100 text-stone-500'}`}>
              {contactedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('converted')}
            className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === 'converted'
                ? 'bg-green-50 border-green-300 text-green-800 shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Converted (Purchased)</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] ${statusFilter === 'converted' ? 'bg-green-200/80 text-green-900' : 'bg-stone-100 text-stone-500'}`}>
              {convertedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>All Leads</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] ${statusFilter === 'all' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-500'}`}>
              {leads.length}
            </span>
          </button>
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by Name or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none placeholder-stone-400 pl-8"
            />
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchLeads}
            disabled={leadsLoading}
            title="Refresh Leads"
            className="p-2 bg-white border border-stone-200 hover:border-stone-300 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <FiRefreshCw size={14} className={leadsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
        {leadsLoading && leads.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
            <FiRefreshCw className="animate-spin text-[#8c6239]" size={20} />
            <span>Loading leads...</span>
          </div>
        ) : filteredLeads.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                <th className="p-4">Customer Details</th>
                <th className="p-4">Cart Products</th>
                <th className="p-4">Cart Total</th>
                <th className="p-4">Form Filled</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLeads.map((lead) => {
                const isConverted = lead.status === 'converted';
                const isContacted = lead.status === 'contacted';

                return (
                  <tr key={lead.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Customer Info */}
                    <td className="p-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0 font-bold text-[11px]">
                          {lead.customer_name ? lead.customer_name.charAt(0).toUpperCase() : <FiUser size={13} />}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">
                            {lead.customer_name || 'Anonymous Visitor'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-stone-600 font-semibold text-[11px]">
                              {lead.phone}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(lead.phone, lead.id)}
                              className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                              title="Copy Phone Number"
                            >
                              {copiedPhone === lead.id ? (
                                <FiCheck size={11} className="text-green-600" />
                              ) : (
                                <FiCopy size={11} />
                              )}
                            </button>
                          </div>
                          {(lead.address || lead.city) && (
                            <span
                              className="text-[10px] text-stone-400 block max-w-xs truncate mt-1"
                              title={`${lead.address || ''}, ${lead.city || ''} ${lead.pincode || ''}`}
                            >
                              {[lead.address, lead.city, lead.state, lead.pincode].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cart Items */}
                    <td className="p-4 max-w-xs">
                      {Array.isArray(lead.cart_items) && lead.cart_items.length > 0 ? (
                        <div className="space-y-1">
                          {lead.cart_items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] border-b border-stone-100 last:border-b-0 pb-0.5 last:pb-0">
                              <span className="font-medium text-stone-800 truncate mr-2">
                                {item.product?.name || item.name || 'Premium Scent'}
                              </span>
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {item.quantity}x &bull; {item.selectedSize || '3ml'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">No items listed</span>
                      )}
                    </td>

                    {/* Cart Total */}
                    <td className="p-4 font-bold text-stone-900">
                      Rs. {Number(lead.cart_total || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Form Filled Time */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-stone-700 text-[11px]">
                          {formatRelativeTime(lead.updated_at || lead.created_at)}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(lead.updated_at || lead.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                          isConverted
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : isContacted
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isConverted ? 'Converted' : isContacted ? 'Contacted' : 'Abandoned'}
                      </span>
                      {lead.order_id && (
                        <span className="block text-[9px] font-mono text-stone-400 mt-1">
                          #{lead.order_id}
                        </span>
                      )}
                    </td>

                    {/* Actions: Direct WhatsApp & Delete */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Direct WhatsApp Button */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppClick(lead)}
                          className="bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="Click to open WhatsApp chat with pre-set recovery message"
                        >
                          <FaWhatsapp size={14} />
                          <span>WhatsApp</span>
                        </button>

                        {/* Toggle Status: Contacted / Pending */}
                        {!isConverted && updateLeadStatus && (
                          <button
                            type="button"
                            onClick={() => updateLeadStatus(lead.id, isContacted ? 'pending' : 'contacted')}
                            className={`p-1.5 rounded border transition-colors cursor-pointer text-xs ${
                              isContacted
                                ? 'bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700'
                                : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                            }`}
                            title={isContacted ? 'Mark as Not Contacted (Pending)' : 'Mark as Contacted'}
                          >
                            <FiCheckCircle size={13} />
                          </button>
                        )}

                        {/* Delete Button */}
                        {deleteLead && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this lead?')) {
                                deleteLead(lead.id);
                              }
                            }}
                            className="p-1.5 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded transition-colors cursor-pointer text-xs"
                            title="Delete Lead"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-stone-400">
            <FiShoppingBag className="mx-auto mb-2 text-stone-300" size={28} />
            <p className="text-xs font-medium text-stone-600">
              No matching leads found
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {statusFilter === 'active'
                ? 'All visitors either completed their orders or no one has abandoned checkout yet!'
                : 'Try clearing your search query or switching filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
