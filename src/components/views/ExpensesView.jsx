import React, { useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiCopy, FiEdit2, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const setupSql = `CREATE TABLE IF NOT EXISTS public.business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item TEXT NOT NULL,
  quantity TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_expenses_date ON public.business_expenses (expense_date DESC);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to business_expenses" ON public.business_expenses;
CREATE POLICY "Admin access to business_expenses"
ON public.business_expenses FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') = 'maazforlap@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'maazforlap@gmail.com');`;

export default function ExpensesView({ expenses = [], loading = false, tableMissing = false, error = '', onRefresh, onSave, onDelete }) {
  const [form, setForm] = useState({ expense_date: getToday(), item: '', quantity: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...expenses]
      .filter(row => !q || String(row.item || '').toLowerCase().includes(q) || String(row.quantity || '').toLowerCase().includes(q))
      .sort((a, b) => String(b.expense_date || '').localeCompare(String(a.expense_date || '')));
  }, [expenses, search]);

  const total = expenses.reduce((sum, row) => sum + (Number(row.price) || 0), 0);
  const resetForm = () => {
    setForm({ expense_date: getToday(), item: '', quantity: '', price: '' });
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.expense_date || !form.item.trim() || !form.quantity.trim() || form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) return;
    setSaving(true);
    try {
      const saved = await onSave({ ...form, item: form.item.trim(), quantity: form.quantity.trim(), price: Number(form.price), id: editingId || undefined });
      if (saved) resetForm();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      expense_date: expense.expense_date || getToday(),
      item: expense.item || '',
      quantity: expense.quantity || '',
      price: String(expense.price ?? '')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copySql = async () => {
    await navigator.clipboard.writeText(setupSql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-6 font-sans">
      {tableMissing && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-amber-700" size={20} />
            <div className="flex-1">
              <h2 className="text-sm font-bold text-amber-950">Expenses database setup required</h2>
              <p className="mt-1 text-xs text-amber-800">Run this SQL once in Supabase Dashboard → SQL Editor, then recheck the table.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={copySql} className="inline-flex items-center gap-2 rounded bg-[#8c6239] px-3 py-2 text-xs font-bold text-white hover:bg-[#724e2b]">
                  {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}{copied ? 'SQL copied' : 'Copy setup SQL'}
                </button>
                <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">
                  <FiRefreshCw size={14} /> Recheck
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !tableMissing && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Total expenses</span>
          <strong className="mt-1 block text-2xl font-extrabold text-[#8c6239]">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Expense entries</span>
          <strong className="mt-1 block text-2xl font-extrabold text-stone-900">{expenses.length}</strong>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900">{editingId ? 'Edit expense' : 'Add an expense'}</h2>
            <p className="mt-1 text-xs text-stone-500">For example: attar purchase, boxes, labels or packing supplies.</p>
          </div>
          {editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900"><FiX /> Cancel edit</button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-stone-600">Date<input required type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className="mt-1 w-full rounded border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#8c6239]" /></label>
          <label className="text-xs font-semibold text-stone-600">Item<input required type="text" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} placeholder="e.g. Attar, boxes" className="mt-1 w-full rounded border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#8c6239]" /></label>
          <label className="text-xs font-semibold text-stone-600">Quantity<input required type="text" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 12, 2 boxes, SKU-A4" className="mt-1 w-full rounded border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#8c6239]" /></label>
          <label className="text-xs font-semibold text-stone-600">Price (₹)<input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="mt-1 w-full rounded border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#8c6239]" /></label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={saving || tableMissing} className="inline-flex items-center gap-2 rounded bg-[#8c6239] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#724e2b] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiPlus size={14} />}{editingId ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-bold text-stone-900">Expense history</h2><p className="mt-1 text-xs text-stone-500">{filteredExpenses.length} entries</p></div>
          <div className="flex gap-2">
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item or quantity" className="w-full rounded border border-stone-300 px-3 py-2 text-xs outline-none focus:border-[#8c6239] sm:w-56" />
            <button type="button" onClick={onRefresh} title="Refresh expenses" className="rounded border border-stone-300 p-2 text-stone-600 hover:bg-stone-50"><FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {loading && expenses.length === 0 ? <tr><td colSpan="5" className="px-4 py-10 text-center text-xs text-stone-500">Loading expenses…</td></tr> : filteredExpenses.length === 0 ? <tr><td colSpan="5" className="px-4 py-10 text-center text-xs text-stone-500">{expenses.length ? 'No matching expenses.' : 'No expenses recorded yet.'}</td></tr> : filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-stone-50/70">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-600">{expense.expense_date ? new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-stone-900">{expense.item}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">{expense.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-stone-900">₹{Number(expense.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => startEdit(expense)} title="Edit expense" className="rounded p-2 text-stone-500 hover:bg-stone-100 hover:text-[#8c6239]"><FiEdit2 size={15} /></button><button type="button" onClick={() => onDelete(expense)} title="Delete expense" className="rounded p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"><FiTrash2 size={15} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
