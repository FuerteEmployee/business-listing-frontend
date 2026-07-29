import { useState, useEffect, useCallback } from "react";
import {
    RotateCcw, CheckCircle2, XCircle, Clock, Loader2,
    Building2, DollarSign, ChevronLeft, ChevronRight, RefreshCw, AlertCircle
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import AdminHeader from "../../components/admin/AdminHeader";

const STATUS_STYLES = {
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function RefundCard({ refund, onReview }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-sm">{refund.businessId?.name || "Unknown Business"}</p>
                        <p className="text-xs text-slate-400">{refund.businessId?.email || ""}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[refund.status]}`}>
                    {refund.status === 'pending' && <Clock className="w-3 h-3" />}
                    {refund.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {refund.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {refund.status}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 font-semibold mb-0.5">Refund Amount</p>
                    <p className="font-black text-slate-800">₹{refund.amount?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 font-semibold mb-0.5">Original Transaction</p>
                    <p className="font-black text-slate-800">₹{refund.transactionId?.amount?.toLocaleString() || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2 sm:col-span-1">
                    <p className="text-slate-400 font-semibold mb-0.5">Requested On</p>
                    <p className="font-black text-slate-800">{new Date(refund.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-xs">
                <p className="text-amber-600 font-semibold mb-0.5">Reason</p>
                <p className="text-amber-800 font-medium">{refund.reason}</p>
            </div>

            {refund.adminNote && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs">
                    <p className="text-slate-400 font-semibold mb-0.5">Admin Note</p>
                    <p className="text-slate-600">{refund.adminNote}</p>
                </div>
            )}

            {refund.status === 'pending' && (
                <Button 
                    variant="outline" 
                    className="w-full rounded-xl py-2.5 text-sm font-bold"
                    onClick={() => onReview(refund)}
                >
                    Review Refund
                </Button>
            )}
        </div>
    );
}

export default function RefundQueue() {
    const [refunds, setRefunds] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState({ show: false, refund: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNote, setAdminNote] = useState("");

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 12, status: statusFilter });
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/refunds?${params}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setRefunds(data.refunds);
            setTotal(data.total);
            setPages(data.pages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleReview = (refund) => {
        setAdminNote(refund.adminNote || "");
        setReviewModal({ show: true, refund });
    };

    const handleAction = async (status) => {
        if (!reviewModal.refund) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/refunds/${reviewModal.refund._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status, adminNote })
            });
            if (res.ok) {
                setReviewModal({ show: false, refund: null });
                fetchData();
            }
        } catch (e) { 
            console.error(e); 
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Review Modal */}
            <Modal
                isOpen={reviewModal.show}
                onClose={() => setReviewModal({ show: false, refund: null })}
                title="Review Refund Request"
                subtitle={`Review request from ${reviewModal.refund?.businessId?.name}`}
                icon={RotateCcw}
                size="md"
            >
                <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-5 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refund Amount</p>
                            <p className="text-xl font-black text-slate-900">₹{reviewModal.refund?.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Trans.</p>
                            <p className="text-xl font-black text-slate-900">₹{reviewModal.refund?.transactionId?.amount?.toLocaleString() || "—"}</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Customer Reason</p>
                        <p className="text-sm font-medium text-amber-900 leading-relaxed italic">"{reviewModal.refund?.reason}"</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Resolution Note</label>
                        <textarea
                            className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder:text-slate-300"
                            rows={3}
                            placeholder="Add a note explaining the approval or rejection..."
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button 
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 h-12 rounded-2xl font-black group shadow-lg shadow-emerald-100"
                            onClick={() => handleAction('approved')}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            Approve Refund
                        </Button>
                        <Button 
                            variant="danger"
                            className="flex-1 h-12 rounded-2xl font-black group"
                            onClick={() => handleAction('rejected')}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            Reject Request
                        </Button>
                    </div>
                </div>
            </Modal>

            <AdminHeader 
                title="Refund Queue"
                subtitle={`${total} refund request${total !== 1 ? 's' : ''} awaiting moderation.`}
                badge={
                    <div className="p-2 bg-rose-500 rounded-xl shadow-lg shadow-rose-200">
                        <RotateCcw className="w-6 h-6 text-white" />
                    </div>
                }
                actions={
                    <div className="flex gap-2">
                        {['pending', 'approved', 'rejected', 'all'].map(s => (
                            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                                    statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}>
                                {s}
                            </button>
                        ))}
                        <button onClick={fetchData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
                </div>
            ) : refunds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300 bg-white rounded-2xl border border-slate-100">
                    <RotateCcw className="w-10 h-10" />
                    <p className="text-sm font-semibold">No {statusFilter} refund requests</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {refunds.map(r => <RefundCard key={r._id} refund={r} onReview={handleReview} />)}
                </div>
            )}

            {pages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-slate-600">Page {page} / {pages}</span>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
