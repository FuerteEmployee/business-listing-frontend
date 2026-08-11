import { useState, useEffect, useCallback } from "react";
import {
    CheckCircle, XCircle, Image as ImageIcon, ExternalLink, ChevronLeft,
    ChevronRight, CheckSquare, Square, LayoutGrid, Building2, ArrowLeft
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { FullPageLoader } from "../../components/ui/Loading";
import Alert from "../../components/ui/Alert";

export default function PhotoModeration() {
    const [viewMode, setViewMode] = useState("groups"); // 'groups' or 'detail'
    const [groups, setGroups] = useState([]);
    const [activeListing, setActiveListing] = useState(null);

    const [photos, setPhotos] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, pages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState(null);

    const fetchGroups = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/photos/pending-groups`);
            const data = await res.json();
            if (res.ok && data.success) {
                setGroups(data.data || []);
            } else {
                setError(data.msg || "Failed to load pending photo groups.");
            }
        } catch (err) {
            setError("Network error loading photo groups.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPhotos = useCallback(async (page = 1, listingId = null) => {
        try {
            setIsLoading(true);
            setError(null);
            let url = `${API_BASE_URL}/admin/photos/pending?page=${page}&limit=${pagination.limit}`;
            if (listingId) {
                url += `&listingId=${listingId}`;
            }
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (res.ok && data.success) {
                setPhotos(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 24, total: 0, pages: 0 });
            } else {
                setError(data.msg || "Failed to load pending photos.");
            }
        } catch (err) {
            setError("Network error loading photos.");
        } finally {
            setIsLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        if (viewMode === "groups") {
            fetchGroups();
        } else if (viewMode === "detail" && activeListing) {
            fetchPhotos(1, activeListing._id);
        }
    }, [viewMode, activeListing, fetchGroups, fetchPhotos]);

    const handleAction = async (listingId, photoId, status) => {
        setProcessingId(photoId);
        setSuccess(null);
        setError(null);
        try {
            const res = await fetchWithAuth(
                `${API_BASE_URL}/admin/listings/${listingId}/photos/${photoId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status })
                }
            );
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(`Photo ${status.toLowerCase()} successfully`);
                // Remove from current list
                setPhotos(prev => prev.filter(p => p.photoId.toString() !== photoId));
                setSelectedPhotos(prev => prev.filter(s => s.photoId !== photoId));
                setPagination(prev => {
                    const newTotal = Math.max(0, prev.total - 1);
                    if (newTotal === 0 && viewMode === 'detail') {
                        // Automatically go back to groups if all done
                        setTimeout(() => setViewMode('groups'), 1500);
                    }
                    return { ...prev, total: newTotal };
                });
            } else {
                setError(data.msg || `Failed to ${status.toLowerCase()} photo.`);
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedPhotos.length === 0) return;
        setIsBulkProcessing(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/photos/bulk-action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: selectedPhotos,
                    action
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(data.msg);
                const processed = new Set(selectedPhotos.map(s => s.photoId));
                setPhotos(prev => prev.filter(p => !processed.has(p.photoId.toString())));
                setSelectedPhotos([]);
                setPagination(prev => {
                    const newTotal = Math.max(0, prev.total - data.successCount);
                    if (newTotal === 0 && viewMode === 'detail') {
                        // Automatically go back to groups if all done
                        setTimeout(() => setViewMode('groups'), 1500);
                    }
                    return { ...prev, total: newTotal };
                });
            } else {
                setError(data.msg || `Bulk ${action} failed.`);
            }
        } catch (err) {
            setError("Network error during bulk action.");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const toggleSelect = (listingId, photoId) => {
        const key = photoId;
        setSelectedPhotos(prev => {
            const exists = prev.find(s => s.photoId === key);
            if (exists) return prev.filter(s => s.photoId !== key);
            return [...prev, { listingId: listingId.toString(), photoId: key }];
        });
    };

    const toggleSelectAll = () => {
        if (selectedPhotos.length === photos.length) {
            setSelectedPhotos([]);
        } else {
            setSelectedPhotos(photos.map(p => ({
                listingId: p.listingId.toString(),
                photoId: p.photoId.toString()
            })));
        }
    };

    const isSelected = (photoId) =>
        selectedPhotos.some(s => s.photoId === photoId.toString());

    if (isLoading && ((viewMode === 'groups' && groups.length === 0) || (viewMode === 'detail' && photos.length === 0))) {
        return <FullPageLoader label="Loading photo moderation queue..." />;
    }

    return (
        <div className="space-y-6">
            <AdminHeader
                title={viewMode === 'groups' ? "Photo Moderation" : `Moderating: ${activeListing?.name}`}
                subtitle={
                    viewMode === 'groups' 
                        ? `${groups.length} brand${groups.length !== 1 ? 's' : ''} awaiting review`
                        : `${pagination.total} photo${pagination.total !== 1 ? 's' : ''} awaiting review`
                }
                badge={
                    (viewMode === 'detail' && pagination.total > 0) ? (
                        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black uppercase tracking-widest w-fit">
                            {pagination.total} Pending
                        </div>
                    ) : null
                }
                actions={
                    <div className="flex items-center gap-3">
                        {viewMode === 'detail' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setViewMode('groups');
                                    setActiveListing(null);
                                    setSelectedPhotos([]);
                                }}
                                leftIcon={ArrowLeft}
                            >
                                Back to Brands
                            </Button>
                        )}
                        {viewMode === 'detail' && selectedPhotos.length > 0 && (
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 ml-1">
                                <span className="text-sm font-bold text-slate-500">
                                    {selectedPhotos.length} selected
                                </span>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleBulkAction("approve")}
                                    disabled={isBulkProcessing}
                                    leftIcon={CheckCircle}
                                >
                                    Approve All
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleBulkAction("reject")}
                                    disabled={isBulkProcessing}
                                    leftIcon={XCircle}
                                >
                                    Reject All
                                </Button>
                            </div>
                        )}
                    </div>
                }
            />

            {error && (
                <Alert type="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert type="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* GROUPS VIEW */}
            {viewMode === 'groups' && (
                groups.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                        <div className="p-4 bg-emerald-50 rounded-2xl mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 mb-1">All caught up!</h3>
                        <p className="text-sm text-slate-400 font-medium">
                            No photos are pending moderation.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groups.map(group => (
                            <div
                                key={group._id}
                                onClick={() => {
                                    setActiveListing(group);
                                    setViewMode('detail');
                                }}
                                className="group relative bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 line-clamp-1" title={group.name}>{group.name}</h3>
                                            <p className="text-xs font-medium text-slate-500">ID: {group._id.slice(-6)}</p>
                                        </div>
                                    </div>
                                    <Badge variant="warning" className="shrink-0">{group.pendingCount} Pending</Badge>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Review Photos</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* DETAIL VIEW */}
            {viewMode === 'detail' && (
                photos.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                        <div className="p-4 bg-emerald-50 rounded-2xl mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 mb-1">All caught up!</h3>
                        <p className="text-sm text-slate-400 font-medium">
                            No photos are pending moderation for this business.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => setViewMode('groups')}>
                            Return to Brands
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Selection controls */}
                        <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-slate-100">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                {selectedPhotos.length === photos.length ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                ) : (
                                    <Square className="w-4 h-4" />
                                )}
                                {selectedPhotos.length === photos.length
                                    ? "Deselect all"
                                    : "Select all on page"}
                            </button>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <LayoutGrid className="w-4 h-4" />
                                {photos.length} on this page
                            </div>
                        </div>

                        {/* Photo grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {photos.map((photo) => {
                                const selected = isSelected(photo.photoId);
                                const isProcessing = processingId === photo.photoId.toString();

                                return (
                                    <div
                                        key={photo.photoId}
                                        className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg ${
                                            selected
                                                ? "border-indigo-300 ring-2 ring-indigo-100"
                                                : "border-slate-100 hover:border-slate-200"
                                        }`}
                                    >
                                        {/* Selection checkbox */}
                                        <button
                                            onClick={() => toggleSelect(photo.listingId, photo.photoId.toString())}
                                            className="absolute top-2 left-2 z-10 p-1 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
                                        >
                                            {selected ? (
                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>

                                        {/* Image */}
                                        <div
                                            className="aspect-square bg-slate-50 cursor-pointer overflow-hidden"
                                            onClick={() => setPreviewPhoto(photo)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.listingName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.src = "";
                                                    e.target.parentElement.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                                                <circle cx="9" cy="9" r="2"/>
                                                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                                            </svg>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            {/* Action buttons */}
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() =>
                                                        handleAction(photo.listingId, photo.photoId.toString(), "Approved")
                                                    }
                                                    disabled={isProcessing}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleAction(photo.listingId, photo.photoId.toString(), "Rejected")
                                                    }
                                                    disabled={isProcessing}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-3 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPhotos(pagination.page - 1, activeListing._id)}
                                    disabled={pagination.page <= 1 || isLoading}
                                    leftIcon={ChevronLeft}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-bold text-slate-500">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPhotos(pagination.page + 1, activeListing._id)}
                                    disabled={pagination.page >= pagination.pages || isLoading}
                                    rightIcon={ChevronRight}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )
            )}

            {/* Full-size preview overlay */}
            {previewPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                            <a
                                href={previewPhoto.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/90 rounded-xl shadow-sm hover:bg-white transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 text-slate-600" />
                            </a>
                            <button
                                onClick={() => setPreviewPhoto(null)}
                                className="p-2 bg-white/90 rounded-xl shadow-sm hover:bg-white transition-colors"
                            >
                                <XCircle className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>
                        <img
                            src={previewPhoto.url}
                            alt={previewPhoto.listingName}
                            className="max-w-full max-h-[75vh] object-contain"
                        />
                        <div className="p-5 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-black text-slate-700">{previewPhoto.listingName}</h4>
                                    <Badge variant="warning" className="mt-1">Pending</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            handleAction(previewPhoto.listingId, previewPhoto.photoId.toString(), "Approved");
                                            setPreviewPhoto(null);
                                        }}
                                        leftIcon={CheckCircle}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                            handleAction(previewPhoto.listingId, previewPhoto.photoId.toString(), "Rejected");
                                            setPreviewPhoto(null);
                                        }}
                                        leftIcon={XCircle}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
