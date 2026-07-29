import { useState, useEffect, useCallback } from "react";
import {
    Wallet, Plus, CheckCircle2, XCircle, Clock, Loader2,
    ChevronLeft, ChevronRight, Building2, RefreshCw, X, AlertCircle, DollarSign
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import FormSelect from "../../components/ui/FormSelect";
import Dropdown from "../../components/ui/Dropdown";
import AdminHeader from "../../components/admin/AdminHeader";

const STATUS_STYLES = {
    pending:    "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-sky-50 text-sky-700 border-sky-200",
    paid:       "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed:     "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_TRANSITIONS = {
    pending:    ['processing', 'paid', 'failed'],
    processing: ['paid', 'failed'],
    paid:       [],
    failed:     ['pending'],
};

// New Payout Modal component replaced by standardized Modal

export default function PayoutTracker() {
    const [payouts, setPayouts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ businessId: '', amount: '', method: 'bank', reference: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 20, status: statusFilter });
            const [pRes, cRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/revenue/payouts?${params}`),
                companies.length === 0 ? fetchWithAuth(`${API_BASE_URL}/companies`) : Promise.resolve(null)
            ]);
            if (pRes.ok) {
                const pData = await pRes.json();
                setPayouts(pData.payouts);
                setTotal(pData.total);
                setPages(pData.pages);
            }
            if (cRes && cRes.ok) {
                const cData = await cRes.json();
                setCompanies(Array.isArray(cData) ? cData : (cData.data || cData.companies || []));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/payouts`, {
                method: 'POST', body: JSON.stringify(form)
            });
            if (res.ok) {
                showToast("Payout created successfully!");
                setShowModal(false);
                setForm({ businessId: '', amount: '', method: 'bank', reference: '', notes: '' });
                fetchData();
            } else {
                const d = await res.json();
                showToast(d.msg || "Failed to create", 'error');
            }
        } catch (e) {
            showToast("Network error", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            setUpdatingId(id);
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/payouts/${id}`, {
                method: 'PATCH', body: JSON.stringify({ status })
            });
            if (res.ok) {
                showToast(`Status updated to ${status}`);
                fetchData();
            }
        } catch (e) {
            showToast("Update failed", 'error');
        } finally {
            setUpdatingId(null);
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

            {/* New Payout Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New Payout"
                subtitle="Settle earnings with business partners"
                icon={Wallet}
                size="md"
                footer={
                    <Button 
                        type="submit" 
                        form="payout-form"
                        className="w-full sm:w-auto"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Create Payout
                    </Button>
                }
            >
                <form id="payout-form" onSubmit={handleCreate} className="space-y-5">
                    <div>
                        <FormSelect
                            label="Business Partner"
                            required
                            value={form.businessId}
                            onChange={e => setForm(f => ({ ...f, businessId: e.target.value }))}
                            placeholder="Select business..."
                            options={companies.map(c => ({ label: c.name, value: c._id }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                            <div className="relative mt-1.5">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input type="number" min="1" required
                                    className="w-full pl-9 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-400 text-sm font-bold"
                                    placeholder="0.00"
                                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <FormSelect
                                label="Payout Method"
                                value={form.method}
                                onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                                options={[
                                    { label: "Bank Transfer", value: "bank" },
                                    { label: "UPI / VPA", value: "upi" },
                                    { label: "Manual Cash", value: "manual" }
                                ]}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reference / UTR Number</label>
                        <input type="text"
                            className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono"
                            placeholder="e.g. UTR1234567890"
                            value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Internal Notes</label>
                        <textarea rows={2} className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-400 text-sm resize-none placeholder:text-slate-300"
                            placeholder="Add any internal details about this settlement..."
                            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                </form>
            </Modal>

            <AdminHeader 
                title="Payout / Settlement Tracker"
                subtitle="Settle earnings with business partners and track transaction history."
                badge={
                    <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3 flex-wrap">
                        {['all', 'pending', 'processing', 'paid', 'failed'].map(s => (
                            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                                    statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}>
                                {s}
                            </button>
                        ))}
                        <button onClick={fetchData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                        </button>
                        <Button 
                            variant="primary" 
                            leftIcon={Plus} 
                            onClick={() => setShowModal(true)}
                            className="shadow-sm"
                        >
                            New Payout
                        </Button>
                    </div>
                }
            />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                        <Wallet className="w-10 h-10" />
                        <p className="text-sm font-semibold">No payouts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["Business", "Amount", "Method", "Reference", "Status", "Created", "Update Status"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payouts.map(p => {
                                    const transitions = STATUS_TRANSITIONS[p.status] || [];
                                    return (
                                        <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-xs">{p.businessId?.name || "—"}</p>
                                                        <p className="text-[10px] text-slate-400">{p.businessId?.email || ""}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-black text-emerald-700">₹{p.amount?.toLocaleString()}</td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-xs font-bold text-slate-500 capitalize">{p.method}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                    {p.reference || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[p.status]}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">
                                                {new Date(p.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {transitions.length > 0 ? (
                                                    <Dropdown
                                                        align="right"
                                                        trigger={
                                                            <button 
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
                                                                disabled={updatingId === p._id}
                                                            >
                                                                {updatingId === p._id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update Status"}
                                                                <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                        }
                                                        items={transitions.map(s => ({
                                                            label: `Mark as ${s.charAt(0).toUpperCase() + s.slice(1)}`,
                                                            icon: s === 'paid' ? CheckCircle2 : s === 'failed' ? XCircle : Clock,
                                                            onClick: () => handleStatusUpdate(p._id, s),
                                                            className: s === 'paid' ? 'text-emerald-600' : s === 'failed' ? 'text-rose-600' : 'text-sky-600'
                                                        }))}
                                                    />
                                                ) : (
                                                    <span className="text-xs text-slate-300 font-medium">
                                                        {p.status === 'paid' ? '✓ Settled' : '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
