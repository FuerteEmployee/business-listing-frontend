import { useState, useEffect, useCallback } from "react";
import {
    Receipt, Search, Download, Filter, ChevronLeft,
    ChevronRight, Loader2, CheckCircle2, XCircle, Clock,
    RefreshCw, CreditCard, Building2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import FormSelect from "../../components/ui/FormSelect";
import AdminHeader from "../../components/admin/AdminHeader";
import { Button } from "../../components/ui/button";

const STATUS_STYLES = {
    success:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending:  "bg-amber-50 text-amber-700 border border-amber-200",
    failed:   "bg-rose-50 text-rose-700 border border-rose-200",
    refunded: "bg-sky-50 text-sky-700 border border-sky-200",
};
const STATUS_ICONS = {
    success:  CheckCircle2,
    pending:  Clock,
    failed:   XCircle,
    refunded: RefreshCw,
};

const GATEWAYS = ['', 'razorpay', 'stripe', 'manual'];
const STATUSES = ['', 'pending', 'success', 'failed', 'refunded'];

function exportCSV(transactions) {
    const rows = [["Invoice/TxID", "Business", "Amount (₹)", "Gateway", "Status", "Date"]];
    transactions.forEach(t => {
        rows.push([
            t.gatewayPaymentId || t._id,
            t.businessId?.name || "-",
            t.amount,
            t.gateway,
            t.status,
            new Date(t.createdAt).toLocaleDateString('en-IN')
        ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `transactions_${Date.now()}.csv`;
    a.click();
}

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', gateway: '', from: '', to: '', search: '' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 20, ...filters });
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/transactions?${params}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setTransactions(data.transactions);
            setTotal(data.total);
            setPages(data.pages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Transaction History"
                subtitle={`${total.toLocaleString()} transactions total recorded.`}
                badge={
                    <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-200">
                        <Receipt className="w-6 h-6 text-white" />
                    </div>
                }
                actions={
                    <Button 
                        variant="primary" 
                        leftIcon={Download} 
                        onClick={() => exportCSV(transactions)}
                        className="shadow-sm"
                    >
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search business / payment ID..."
                        value={filters.search}
                        onChange={e => setFilter('search', e.target.value)}
                    />
                </div>
                <div className="min-w-[140px]">
                    <FormSelect
                        value={filters.status}
                        onChange={e => setFilter('status', e.target.value)}
                        placeholder="All Statuses"
                        options={STATUSES.filter(Boolean).map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
                    />
                </div>
                <div className="min-w-[140px]">
                    <FormSelect
                        value={filters.gateway}
                        onChange={e => setFilter('gateway', e.target.value)}
                        placeholder="All Gateways"
                        options={GATEWAYS.filter(Boolean).map(g => ({ label: g.charAt(0).toUpperCase() + g.slice(1), value: g }))}
                    />
                </div>
                <input type="date" className="py-2 px-3 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-400"
                    value={filters.from} onChange={e => setFilter('from', e.target.value)} />
                <input type="date" className="py-2 px-3 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-400"
                    value={filters.to} onChange={e => setFilter('to', e.target.value)} />
                <button onClick={fetchData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                        <Receipt className="w-10 h-10" />
                        <p className="text-sm font-semibold">No transactions found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["Business", "Amount", "Gateway", "Payment ID", "Status", "Date"].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.map(tx => {
                                    const SIcon = STATUS_ICONS[tx.status] || Clock;
                                    return (
                                        <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-4 h-4 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{tx.businessId?.name || "—"}</p>
                                                        <p className="text-xs text-slate-400">{tx.subscriptionId?.billingCycle || "—"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-black text-slate-900">₹{tx.amount?.toLocaleString()}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                                                    <CreditCard className="w-3 h-3" /> {tx.gateway}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                    {tx.gatewayPaymentId || tx._id?.slice(-8)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[tx.status]}`}>
                                                    <SIcon className="w-3 h-3" /> {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Page {page} of {pages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
