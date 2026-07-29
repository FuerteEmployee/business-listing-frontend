import { useState, useEffect, useCallback } from "react";
import {
    AlertCircle, RefreshCw, Loader2, ChevronLeft, ChevronRight,
    Building2, CreditCard, RotateCcw, CheckCircle2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

export default function FailedPayments() {
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 20 });
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/failed-payments?${params}`);
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
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRetry = async (id) => {
        try {
            setRetrying(id);
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/failed-payments/${id}/retry`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                showToast(`Retry #${data.retryCount} logged successfully`);
                fetchData();
            } else {
                const d = await res.json();
                showToast(d.msg || "Retry failed", 'error');
            }
        } catch (e) {
            showToast("Network error", 'error');
        } finally {
            setRetrying(null);
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 ${
                    toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            <AdminHeader 
                title="Failed Payment Retry Log"
                subtitle={`${total} failed transaction${total !== 1 ? 's' : ''}`}
                actions={
                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                }
            />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                        <CheckCircle2 className="w-10 h-10 text-emerald-300" />
                        <p className="text-sm font-semibold text-emerald-400">No failed payments — all clear!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-rose-50">
                                    {["Business", "Amount", "Gateway", "Retries", "Last Retry", "Failed On", "Action"].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-rose-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.map(tx => {
                                    const retries = tx.metadata?.retries || [];
                                    const lastRetryAt = tx.metadata?.lastRetryAt;
                                    return (
                                        <tr key={tx._id} className="hover:bg-rose-50/30 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-4 h-4 text-rose-300" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{tx.businessId?.name || "—"}</p>
                                                        <p className="text-xs text-slate-400">{tx.businessId?.email || ""}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-black text-rose-600">₹{tx.amount?.toLocaleString()}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                                                    <CreditCard className="w-3 h-3" /> {tx.gateway}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                                                    retries.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {retries.length}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-400">
                                                {lastRetryAt ? new Date(lastRetryAt).toLocaleDateString('en-IN') : "Never"}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-400">
                                                {new Date(tx.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <button
                                                    onClick={() => handleRetry(tx._id)}
                                                    disabled={retrying === tx._id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                >
                                                    {retrying === tx._id
                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                        : <RotateCcw className="w-3 h-3" />
                                                    }
                                                    Log Retry
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Page {page} of {pages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
