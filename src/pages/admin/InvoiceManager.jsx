import { useState, useEffect, useCallback } from "react";
import {
    FileText, Search, RefreshCw, Loader2, CheckCircle2,
    ChevronLeft, ChevronRight, Building2, AlertCircle
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import AdminHeader from "../../components/admin/AdminHeader";

const STATUS_STYLES = {
    paid:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    void:     "bg-slate-100 text-slate-500 border-slate-200",
    refunded: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function InvoiceManager() {
    const [invoices, setInvoices] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 20, search });
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/invoices?${params}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setInvoices(data.invoices);
            setTotal(data.total);
            setPages(data.pages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRegenerate = async () => {
        if (!confirmModal.id) return;
        const id = confirmModal.id;
        try {
            setRegenerating(id);
            setConfirmModal({ show: false, id: null });
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/invoices/${id}/regenerate`, { method: 'POST' });
            if (res.ok) {
                showToast("Invoice regenerated successfully!");
                fetchData();
            } else {
                const d = await res.json();
                showToast(d.msg || "Regeneration failed", 'error');
            }
        } catch (e) {
            showToast("Network error", 'error');
        } finally {
            setRegenerating(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${
                    toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.show}
                onClose={() => setConfirmModal({ show: false, id: null })}
                title="Regenerate Invoice?"
                subtitle="This will replace the current invoice number"
                icon={RefreshCw}
                size="sm"
                footer={
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setConfirmModal({ show: false, id: null })}>Cancel</Button>
                        <Button className="flex-1" onClick={handleRegenerate}>Confirm</Button>
                    </div>
                }
            >
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-amber-700 leading-relaxed">
                        Are you sure you want to regenerate this invoice? The old invoice file and number will be permanently replaced.
                    </p>
                </div>
            </Modal>

            <AdminHeader 
                title="Invoice Manager"
                subtitle={`${total} invoices total`}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400"
                                placeholder="Search invoice number..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <button onClick={fetchData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                }
            />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                        <FileText className="w-10 h-10" />
                        <p className="text-sm font-semibold">No invoices found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["Invoice #", "Business", "Amount", "Tax", "Total", "Status", "Date", "Action"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map(inv => (
                                    <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                                {inv.invoiceNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-xs">{inv.businessId?.name || "—"}</p>
                                                    {inv.billingDetails?.gstin && (
                                                        <p className="text-[10px] text-slate-400">GSTIN: {inv.billingDetails.gstin}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-700">₹{inv.amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3.5 text-slate-500">₹{inv.taxAmount?.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3.5 font-black text-slate-900">₹{inv.totalAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[inv.status]}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-400">
                                            {new Date(inv.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => setConfirmModal({ show: true, id: inv._id })}
                                                disabled={regenerating === inv._id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                {regenerating === inv._id
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <RefreshCw className="w-3 h-3" />
                                                }
                                                Regenerate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
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
