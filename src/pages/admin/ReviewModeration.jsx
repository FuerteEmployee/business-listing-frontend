import { useState, useEffect, useCallback } from "react";
import { 
    AlertCircle, CheckCircle, X, Star, Flag, MessageSquare, Trash2, 
    MoreVertical, Eye, Download, History, ShieldCheck, User, Search, 
    Calendar, Filter, ChevronRight, ChevronLeft
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Modal from "../../components/ui/Modal";
import { Spinner, Skeleton } from "../../components/ui/Loading";
import Alert from "../../components/ui/Alert";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import { FormTextarea } from "../../components/ui/FormTextarea";

export default function ReviewModeration() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReviews, setSelectedReviews] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

    // Filter state
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        rating: "",
        dateStart: "",
        dateEnd: ""
    });

    // Modal states
    const [detailModal, setDetailModal] = useState({ isOpen: false, review: null });
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        title: "", 
        message: "", 
        onConfirm: null, 
        type: "info",
        actionLabel: "Confirm",
        needsReason: false,
        reason: ""
    });
    const [activeImage, setActiveImage] = useState(null);
    const [lightboxData, setLightboxData] = useState(null);

    const [actionLoading, setActionLoading] = useState(false);

    const fetchReviews = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams({
                limit: pagination.limit,
                page,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.rating && { rating: filters.rating }),
                ...(filters.dateStart && { dateStart: filters.dateStart }),
                ...(filters.dateEnd && { dateEnd: filters.dateEnd })
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/reviews?${params}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
                setPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0 }));
                setSelectedReviews([]);
            } else {
                const errData = await res.json();
                setError(errData.msg || "Failed to fetch reviews");
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError("Error loading reviews");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchReviews(1);
    }, [fetchReviews]);

    const handleBulkAction = async (action, reason = "") => {
        if (selectedReviews.length === 0) return;
        
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/reviews/bulk-action`, {
                method: 'POST',
                body: JSON.stringify({ ids: selectedReviews, action, reason })
            });
            if (res.ok) {
                await fetchReviews(pagination.page);
                setConfirmModal({ isOpen: false });
                setSelectedReviews([]);
                setError(null);
            } else {
                const errData = await res.json();
                setError(errData.message || errData.msg || "Access Denied: You do not have 'Write / Create' permissions for this action.");
                setConfirmModal({ isOpen: false });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError("Bulk action failed. Please try again.");
            setConfirmModal({ isOpen: false });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSingleStatusUpdate = async (reviewId, status, reason = "") => {
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/reviews/bulk-action`, {
                method: 'POST',
                body: JSON.stringify({ ids: [reviewId], action: status, reason })
            });
            if (res.ok) {
                await fetchReviews(pagination.page);
                setConfirmModal({ isOpen: false });
                setError(null);
            } else {
                const errData = await res.json();
                setError(errData.message || errData.msg || "Access Denied: You do not have 'Write / Create' permissions for this action.");
                setConfirmModal({ isOpen: false });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError("Update failed. Please try again.");
            setConfirmModal({ isOpen: false });
        } finally {
            setActionLoading(false);
        }
    };

    // Table Config
    const columns = [
        {
            label: "Reviewer",
            key: "user",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        {row.userId?.image ? <img src={row.userId.image} alt="" className="w-full h-full object-cover rounded-xl" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                        {row.userId ? (
                            <>
                                <div className="font-bold text-slate-900 leading-tight">{row.userId.name}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{row.userId.email || "N/A"}</div>
                            </>
                        ) : (
                            <div>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-xs font-bold">Deleted User</span>
                                <div className="text-[11px] text-slate-400 font-medium mt-0.5">ID: {row.userId?._id || 'N/A'}</div>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            label: "Business",
            key: "business",
            render: (value, row) => (
                row.businessId ? (
                    <div className="font-semibold text-slate-700">{row.businessId.name}</div>
                ) : (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">Deleted Business</span>
                )
            )
        },
        {
            label: "Rating",
            key: "rating",
            render: (value, row) => (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full w-fit">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-black text-amber-700">{row.rating}</span>
                </div>
            )
        },
        {
            label: "Comment",
            key: "comment",
            render: (value, row) => (
                <div className="space-y-2">
                    <div className="text-sm text-slate-600 font-medium max-w-md truncate">
                        {value}
                    </div>
                    {row.images && row.images.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                            {row.images.map((img, idx) => (
                                <img 
                                    key={idx} 
                                    src={img} 
                                    alt="" 
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm cursor-pointer hover:scale-105 transition-transform" 
                                    onClick={(e) => { e.stopPropagation(); setLightboxData({ images: row.images, index: idx }); }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (value) => (
                <Badge variant={value === 'Approved' ? 'success' : value === 'Pending' ? 'warning' : 'danger'}>
                    {value}
                </Badge>
            )
        },
        {
            label: "Date",
            key: "createdAt",
            render: (value) => (
                <div className="text-sm text-slate-500 font-medium">
                    {new Date(value).toLocaleDateString()}
                </div>
            )
        }
    ];

    const tableActions = [
        {
            label: "Quick View",
            icon: Eye,
            onClick: (review) => setDetailModal({ isOpen: true, review })
        },
        {
            label: "Approve",
            icon: CheckCircle,
            condition: (row) => row && row.status === 'Pending',
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Approve Review",
                message: "Are you sure you want to approve this review? It will become visible and affect the business rating.",
                type: "info",
                actionLabel: "Approve",
                onConfirm: () => handleSingleStatusUpdate(row._id, 'Approved')
            })
        },
        {
            label: "Reject",
            icon: X,
            isDangerous: true,
            condition: (row) => row && row.status === 'Pending',
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Reject Review",
                message: "Please provide a reason for rejecting this review.",
                type: "danger",
                actionLabel: "Reject",
                needsReason: true,
                reason: "",
                onConfirm: (reason) => handleSingleStatusUpdate(row._id, 'Rejected', reason)
            })
        },
        {
            label: "Add Note",
            icon: MessageSquare,
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Internal Moderation Note",
                message: "Add an internal note for other moderators.",
                type: "info",
                actionLabel: "Save Note",
                needsReason: true,
                reason: row.moderationNotes || "",
                onConfirm: async (note) => {
                    try {
                        setActionLoading(true);
                        const res = await fetchWithAuth(`${API_BASE_URL}/admin/reviews/${row._id}/note`, {
                            method: 'PUT',
                            body: JSON.stringify({ note })
                        });
                        if (res.ok) {
                            await fetchReviews(pagination.page);
                            setConfirmModal({ isOpen: false });
                            setError(null);
                        } else {
                            const errData = await res.json();
                            setError(errData.message || errData.msg || "Access Denied: You do not have 'Write / Create' permissions for this action.");
                            setConfirmModal({ isOpen: false });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } catch (err) {
                        setError("Failed to save note. Please try again.");
                        setConfirmModal({ isOpen: false });
                    } finally {
                        setActionLoading(false);
                    }
                }
            })
        },
        {
            label: "Delete Permanent",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Delete Review",
                message: "This action is irreversible. Are you absolutely sure?",
                type: "danger",
                actionLabel: "Delete",
                onConfirm: () => handleSingleStatusUpdate(row._id, 'Delete')
            })
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <AdminHeader 
                title="Review Moderation"
                subtitle="Maintain platform integrity by moderating user feedback"
                actions={
                    selectedReviews.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-xs font-bold uppercase tracking-widest mr-2">{selectedReviews.length} Selected</span>
                            <div className="h-4 w-[1px] bg-slate-700 mr-2"></div>
                            <Button variant="ghost" className="h-8 px-2 text-emerald-400 hover:text-emerald-300" onClick={() => handleBulkAction('Approved')}>Approve</Button>
                            <Button variant="ghost" className="h-8 px-2 text-rose-400 hover:text-rose-300" onClick={() => handleBulkAction('Rejected')}>Reject</Button>
                            <Button variant="ghost" className="h-8 px-2 text-slate-400 hover:text-white" onClick={() => handleBulkAction('Delete')}>Delete</Button>
                        </div>
                    )
                }
            />

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative col-span-1 md:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <FormInput
                            placeholder="Search review content or internal notes..."
                            className="pl-11"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <FormSelect
                        options={[
                            { label: "All Statuses", value: "" },
                            { label: "Pending", value: "Pending" },
                            { label: "Approved", value: "Approved" },
                            { label: "Rejected", value: "Rejected" },
                            { label: "Suspended", value: "Suspended" }
                        ]}
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    />
                    <FormSelect
                        options={[
                            { label: "Any Rating", value: "" },
                            { label: "5 Stars", value: "5" },
                            { label: "4 Stars", value: "4" },
                            { label: "3 Stars", value: "3" },
                            { label: "2 Stars", value: "2" },
                            { label: "1 Star", value: "1" }
                        ]}
                        value={filters.rating}
                        onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                    />
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</span>
                             <input type="date" value={filters.dateStart} onChange={e => setFilters(prev => ({ ...prev, dateStart: e.target.value }))} className="text-xs font-semibold text-slate-600 bg-slate-50 border-none rounded-lg p-1 focus:ring-0" />
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</span>
                             <input type="date" value={filters.dateEnd} onChange={e => setFilters(prev => ({ ...prev, dateEnd: e.target.value }))} className="text-xs font-semibold text-slate-600 bg-slate-50 border-none rounded-lg p-1 focus:ring-0" />
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setFilters({ search: "", status: "", rating: "", dateStart: "", dateEnd: "" })}>Reset</Button>
                        <Button variant="primary" size="sm" onClick={() => fetchReviews(1)}>Apply Filters</Button>
                    </div>
                </div>
            </div>

            {error && (
                <Alert type="error" className="rounded-3xl border-rose-100 bg-rose-50/50">
                    {error}
                </Alert>
            )}

            <DataTable
                data={reviews}
                columns={columns}
                actions={tableActions}
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={fetchReviews}
                showCheckbox={true}
                selectedRows={selectedReviews}
                onSelectRows={setSelectedReviews}
                actionMode="dropdown"
            />

            {/* Detail Modal */}
            <Modal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal({ isOpen: false, review: null })}
                title="Review Explorer"
                subtitle={detailModal.review ? `Review ID: ${detailModal.review._id.substring(0, 12)}... • ${detailModal.review.rating} Star Rating` : "Loading Metadata..."}
                icon={Eye}
                size="lg"
            >
                <div className="space-y-8">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                                {detailModal.review?.rating}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{detailModal.review?.businessId?.name || "Business Identity"}</h3>
                                <p className="text-sm text-slate-500 font-medium">Submitted by {detailModal.review?.userId?.name || "Anonymous"}</p>
                            </div>
                        </div>
                        <Badge variant={detailModal.review?.status === 'Approved' ? 'success' : detailModal.review?.status === 'Pending' ? 'warning' : 'danger'}>
                            {detailModal.review?.status}
                        </Badge>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 italic text-slate-700 leading-relaxed relative">
                        <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-indigo-100 fill-indigo-50" />
                        <div>"{detailModal.review?.comment}"</div>
                        {detailModal.review?.images && detailModal.review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-4 not-italic">
                                {detailModal.review.images.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setLightboxData({ images: detailModal.review.images, index: idx })}
                                        className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {detailModal.review?.moderationNotes && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Moderation Note</p>
                            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-sm text-amber-800 font-medium">
                                {detailModal.review?.moderationNotes}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submission Date</p>
                             <p className="text-sm font-bold text-slate-700">{detailModal.review ? new Date(detailModal.review.createdAt).toLocaleString() : "N/A"}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Audited By</p>
                             <p className="text-sm font-bold text-slate-700">{detailModal.review?.moderatedBy?.name || 'System / Pending'}</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setDetailModal({ isOpen: false, review: null })}>Dismiss Explorer</Button>
                        {detailModal.review?.status === 'Pending' && (
                            <>
                                <Button variant="danger" onClick={() => {
                                    setDetailModal({ isOpen: false, review: null });
                                    setConfirmModal({
                                        isOpen: true,
                                        title: "Reject Review",
                                        message: "Are you sure you want to reject this review?",
                                        type: "danger",
                                        actionLabel: "Reject Submission",
                                        needsReason: true,
                                        reason: "",
                                        onConfirm: (reason) => handleSingleStatusUpdate(detailModal.review._id, 'Rejected', reason)
                                    });
                                }}>Reject</Button>
                                <Button variant="primary" onClick={() => handleSingleStatusUpdate(detailModal.review._id, 'Approved')}>Approve Now</Button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Confirm Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                subtitle="Moderation Security Check"
                icon={ShieldCheck}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Discard</Button>
                        <Button 
                            variant={confirmModal.type === 'danger' ? 'danger' : 'primary'} 
                            onClick={() => confirmModal.onConfirm(confirmModal.reason)}
                            isLoading={actionLoading}
                        >
                            {confirmModal.actionLabel}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 font-bold leading-relaxed">{confirmModal.message}</p>
                    {confirmModal.needsReason && (
                        <FormTextarea
                            label="Moderation Notes"
                            placeholder="Enter the rationale for this action..."
                            value={confirmModal.reason}
                            onChange={(e) => setConfirmModal(prev => ({ ...prev, reason: e.target.value }))}
                            required
                        />
                    )}
                </div>
            </Modal>
            {/* Image Lightbox Modal */}
            {lightboxData && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLightboxData(null)}></div>
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <button 
                            type="button"
                            onClick={() => setLightboxData(null)} 
                            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-[210]"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="relative flex items-center justify-center w-full max-h-[70vh]">
                            {lightboxData.images.length > 1 && (
                                <>
                                    <button 
                                        type="button"
                                        onClick={() => setLightboxData(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all hover:scale-105 z-10 animate-in fade-in duration-200"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setLightboxData(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all hover:scale-105 z-10 animate-in fade-in duration-200"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}
                            <img src={lightboxData.images[lightboxData.index]} alt="Large preview" className="w-full h-auto max-h-[70vh] rounded-3xl object-contain shadow-2xl border border-white/10" />
                        </div>

                        {lightboxData.images.length > 1 && (
                            <div className="flex justify-center gap-2 mt-6 overflow-x-auto max-w-full py-2 px-4 z-10">
                                {lightboxData.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setLightboxData(prev => ({ ...prev, index: idx }))}
                                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${lightboxData.index === idx ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20' : 'border-white/20 hover:border-white/50'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
