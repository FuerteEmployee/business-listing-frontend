import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    AlertCircle, CheckCircle, ExternalLink, X, Info, ShieldCheck, Flag, Copy, 
    Trash2, Calendar, Download, MoreVertical, Eye, History, Edit3, Check, Filter,
    Building2, MapPin, Tag, User, Mail, Phone, ChevronRight, Search, Upload, FileSpreadsheet
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth, getApiUrl } from "../../config/api";
import { parseImportWorkbook, downloadImportTemplate, IMPORT_SHEETS } from "../../utils/importTemplate";

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Modal from "../../components/ui/Modal";
import AdminHeader from "../../components/admin/AdminHeader";
import { Spinner, Skeleton } from "../../components/ui/Loading";
import Alert from "../../components/ui/Alert";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import { FormTextarea } from "../../components/ui/FormTextarea";

// Custom/Legacy UI
import StatusBadge from "../../components/admin/StatusBadge";

export default function Listings() {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedListings, setSelectedListings] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

    // Filter state
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        category: "",
        city: "",
        plan: "",
        dateStart: "",
        dateEnd: ""
    });

    // Modal states
    const [detailModal, setDetailModal] = useState({ isOpen: false, listing: null, activeTab: 'summary' });
    const [auditTrail, setAuditTrail] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    
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

    const [actionLoading, setActionLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [plans, setPlans] = useState([]);

    // Spreadsheet Import State and Handlers
    const fileInputRef = useRef(null);
    const [importLoading, setImportLoading] = useState(false);
    const [formatModalOpen, setFormatModalOpen] = useState(false);
    const [importResultModal, setImportResultModal] = useState({
        isOpen: false,
        msg: "",
        totals: null,
        results: null,
        generatedCredentials: [],
        warnings: [],
        usedSheets: []
    });

    const handleImportSpreadsheet = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset the file input value so that selecting the same file again triggers onChange
        e.target.value = "";

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setImportLoading(true);
                setError(null);

                const { payload, warnings, usedSheets } = parseImportWorkbook(event.target.result);
                const rowCount = payload.categories.length + payload.users.length + payload.listings.length;

                if (rowCount === 0) {
                    setError(
                        (warnings.length ? warnings.join("\n") : "No data rows were found in the uploaded file.")
                        + "\n\nUse \"Download Template\" to get the expected format."
                    );
                    setImportLoading(false);
                    return;
                }

                const res = await fetchWithAuth(`${API_BASE_URL}/admin/import`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) {
                    setError(data.msg || "Failed to import the spreadsheet");
                    return;
                }

                setImportResultModal({
                    isOpen: true,
                    msg: data.msg,
                    totals: data.totals,
                    results: data.results,
                    generatedCredentials: data.generatedCredentials || [],
                    warnings,
                    usedSheets
                });
                await fetchListings(1);
            } catch (err) {
                console.error("Error reading sheet:", err);
                setError(`Error parsing spreadsheet file: ${err.message}`);
            } finally {
                setImportLoading(false);
            }
        };
        reader.onerror = () => {
            setImportLoading(false);
            setError("Could not read the selected file. It may be corrupted or unreadable.");
        };

        reader.readAsArrayBuffer(file);
    };

    const getApprovalStage = (listing) => {
        if (listing?.approvalStatus?.stage) return listing.approvalStatus.stage;
        if (listing?.status === 'Active') return 'Approved';
        return listing?.status || "Pending";
    };

    // Shared by fetchListings and handleExportCSV so the two never drift —
    // only include filters that are actually set, instead of sending every
    // filter key (including empty ones) verbatim. Takes the filter state as a
    // parameter (rather than closing over `filters`) so callers that just
    // updated filters via setFilters can pass the new values immediately,
    // without waiting on React's next render to see them.
    const buildFilterParams = (filterState, extra = {}) => new URLSearchParams({
        ...(filterState.search && { search: filterState.search }),
        ...(filterState.status && { status: filterState.status }),
        ...(filterState.category && { category: filterState.category }),
        ...(filterState.city && { city: filterState.city }),
        ...(filterState.plan && { plan: filterState.plan }),
        ...(filterState.dateStart && { dateStart: filterState.dateStart }),
        ...(filterState.dateEnd && { dateEnd: filterState.dateEnd }),
        ...extra
    });

    const fetchListings = useCallback(async (page = 1, filterState = filters) => {
        try {
            setIsLoading(true);
            setError(null);

            const params = buildFilterParams(filterState, { limit: pagination.limit, page });

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings?${params}`);
            if (res.ok) {
                const data = await res.json();
                setListings(data.listings || []);
                setPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0 }));
            } else {
                const errData = await res.json();
                setError(errData.msg || "Failed to fetch listings");
            }
        } catch (err) {
            console.error("Error fetching listings:", err);
            setError("Error loading listings");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    // Fetch initial options
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cRes, ciRes, pRes] = await Promise.all([
                    fetchWithAuth(`${API_BASE_URL}/categories`),
                    fetchWithAuth(`${API_BASE_URL}/locations/cities`),
                    fetchWithAuth(`${API_BASE_URL}/plans`)
                ]);

                if (cRes.ok) {
                    const data = await cRes.json();
                    setCategories(data.categories || data || []);
                }
                if (ciRes.ok) {
                    const data = await ciRes.json();
                    setCities(data.data || data.cities || (Array.isArray(data) ? data : []));
                }
                if (pRes.ok) {
                    const data = await pRes.json();
                    setPlans(data.plans || data || []);
                }
            } catch (err) {
                console.error("Error fetching options:", err);
            }
        };
        fetchData();
        fetchListings(1);
    }, [fetchListings]);

    // Actions
    const handleStatusUpdate = async (listingId, status, reason = "") => {
        try {
            setActionLoading(true);
            const endpoint = status === 'Approved' ? 'approve' : status === 'Rejected' ? 'reject' : 'flag';
            const payload = endpoint === 'flag' 
                ? { reason: 'Spam', description: reason } 
                : { reason, details: reason };

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${listingId}/${endpoint}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await fetchListings(pagination.page);
                setConfirmModal({ isOpen: false });
            } else {
                const data = await res.json();
                setError(data.msg || "Update failed");
            }
        } catch (err) {
            setError("Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedListings.length === 0) return;
        
        const confirmMsg = `Are you sure you want to ${action} ${selectedListings.length} listings?`;
        setConfirmModal({
            isOpen: true,
            title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: confirmMsg,
            type: action === 'delete' ? 'danger' : 'info',
            actionLabel: `Bulk ${action}`,
            needsReason: action === 'reject',
            reason: "",
            onConfirm: async (reason) => {
                try {
                    setActionLoading(true);
                    const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/bulk-action`, {
                        method: 'POST',
                        body: JSON.stringify({ ids: selectedListings, action, reason })
                    });
                    if (res.ok) {
                        await fetchListings(1);
                        setConfirmModal({ isOpen: false });
                        setSelectedListings([]);
                    } else {
                        const data = await res.json();
                        setError(data.msg || "Bulk action failed");
                    }
                } catch (err) {
                    setError("Bulk action failed");
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleExportCSV = async () => {
        try {
            const params = buildFilterParams(filters);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/export/csv?${params}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `listings_export_${new Date().getTime()}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const data = await res.json();
                setError(data.msg || "Export failed");
            }
        } catch (err) {
            setError("Export failed");
        }
    };

    const fetchAuditTrail = async (listingId) => {
        try {
            setAuditLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${listingId}/audit`);
            if (res.ok) {
                const data = await res.json();
                setAuditTrail(data.auditTrail || []);
            }
        } catch (err) {
            console.error("Audit trail fetch failed");
        } finally {
            setAuditLoading(false);
        }
    };

    // Table Config
    const columns = [
        {
            label: "Business Name",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        {row.image ? <img src={row.image} alt="" className="w-full h-full object-cover rounded-xl" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 leading-tight">{row.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{row.owner?.email || row.email || "Unclaimed"}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Category & City",
            key: "meta",
            render: (value, row) => (
                <div>
                    <div className="text-sm font-semibold text-slate-700">{row.category_id?.name || row.category || "Uncategorized"}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3" /> {row.city_id?.name || "Unknown"}
                    </div>
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (value, row) => <StatusBadge status={getApprovalStage(row)} />
        },
        {
            label: "Plan",
            key: "plan",
            render: (value, row) => {
                const plan = row.plan?.name || "Free";
                return (
                    <Badge variant={plan === 'Premium' ? 'success' : plan === 'Standard' ? 'warning' : 'secondary'}>
                        {plan}
                    </Badge>
                );
            }
        },
        {
            label: "Submitted",
            key: "createdAt",
            render: (value, row) => (
                <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )
        }
    ];
    
    const handleUpdateRank = async (listingId, rank) => {
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${listingId}/rank`, {
                method: 'PUT',
                body: JSON.stringify({ rank })
            });
            if (res.ok) {
                await fetchListings(pagination.page);
                setConfirmModal({ isOpen: false });
            } else {
                const data = await res.json();
                setError(data.msg || "Rank update failed");
            }
        } catch (err) {
            setError("Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const tableActions = [
        {
            label: "Quick Detail",
            icon: Eye,
            onClick: (listing) => {
                setDetailModal({ isOpen: true, listing, activeTab: 'summary' });
                setAuditTrail([]);
                fetchAuditTrail(listing._id);
            }
        },
        {
            label: "Edit Listing",
            icon: Edit3,
            onClick: (listing) => navigate(`/admin/listings/${listing.slug || listing._id}/edit`)
        },
        {
            label: "Approve",
            icon: CheckCircle,
            condition: (row) => ['Pending', 'AwaitingReview', 'UnderReview'].includes(getApprovalStage(row)),
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Approve Listing",
                message: `Are you sure you want to approve "${row.name}"?`,
                type: "info",
                actionLabel: "Approve",
                onConfirm: () => handleStatusUpdate(row._id, 'Approved')
            })
        },
        {
            label: "Reject",
            icon: X,
            isDangerous: true,
            condition: (row) => ['Pending', 'AwaitingReview', 'UnderReview'].includes(getApprovalStage(row)),
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Reject Listing",
                message: `Reject listing for "${row.name}".`,
                type: "danger",
                actionLabel: "Reject",
                needsReason: true,
                reason: "",
                onConfirm: (reason) => handleStatusUpdate(row._id, 'Rejected', reason)
            })
        },
        {
            label: "Verify Badge",
            icon: ShieldCheck,
            condition: (row) => !row.businessBadgeVerified,
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Verify Badge",
                message: `Grant verification badge to "${row.name}"?`,
                type: "info",
                actionLabel: "Verify",
                onConfirm: async () => {
                    try {
                        setActionLoading(true);
                        const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${row._id}/verify-badge`, { method: 'PUT' });
                        if (res.ok) {
                            await fetchListings(pagination.page);
                            setConfirmModal({ isOpen: false });
                        } else {
                            const data = await res.json();
                            setError(data.msg || "Badge verification failed");
                        }
                    } catch (err) {
                        console.error("Badge verification error:", err);
                        setError("Badge verification failed");
                    } finally {
                        setActionLoading(false);
                    }
                }
            })
        },
        {
            label: "Flag as Spam",
            icon: Flag,
            isDangerous: true,
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Flag Listing",
                message: `Flag listing "${row.name}" as spam?`,
                type: "danger",
                actionLabel: "Flag",
                needsReason: true,
                reason: "",
                onConfirm: (reason) => handleStatusUpdate(row._id, 'Flagged', reason)
            })
        },
        {
            label: "Set Priority",
            icon: History,
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Set Listing Priority",
                message: `Set manual rank for "${row.name}". Higher numbers appear first.`,
                type: "info",
                actionLabel: "Update Rank",
                needsReason: true,
                reasonType: "number",
                reasonLabel: "Manual Rank",
                reasonPlaceholder: "e.g. 10",
                reason: String(row.manualRank || 0),
                onConfirm: (rank) => handleUpdateRank(row._id, rank)
            })
        },
        {
            label: "Delete",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({
                isOpen: true,
                title: "Delete Listing",
                message: `Permanently delete "${row.name}"? This cannot be undone.`,
                type: "danger",
                actionLabel: "Delete Permanent",
                onConfirm: async () => {
                    try {
                        setActionLoading(true);
                        const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${row._id}`, { method: 'DELETE' });
                        if (res.ok) {
                            await fetchListings(pagination.page);
                            setConfirmModal({ isOpen: false });
                        } else {
                            const data = await res.json();
                            setError(data.msg || "Delete failed");
                        }
                    } catch (err) {
                        console.error("Delete listing error:", err);
                        setError("Delete failed");
                    } finally {
                        setActionLoading(false);
                    }
                }
            })
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Business Listings"
                subtitle="Moderate and manage business presence across the platform"
                actions={
                    <div className="flex items-center gap-3">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportSpreadsheet}
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                        />
                        <Button variant="primary" leftIcon={Building2} onClick={() => navigate('/admin/listings/create')}>Create Listing</Button>
                        <Button
                            variant="outline"
                            leftIcon={Upload}
                            onClick={() => fileInputRef.current?.click()}
                            isLoading={importLoading}
                        >
                            Import CSV
                        </Button>
                        <Button variant="ghost" leftIcon={Info} onClick={() => setFormatModalOpen(true)}>Format</Button>
                        <Button variant="outline" leftIcon={Download} onClick={handleExportCSV}>Export CSV</Button>
                        {selectedListings.length > 0 && (
                            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                                <span className="text-xs font-bold uppercase tracking-widest mr-2">{selectedListings.length} Selected</span>
                                <div className="h-4 w-[1px] bg-slate-700 mr-2"></div>
                                <Button variant="ghost" className="h-8 px-2 text-emerald-400 hover:text-emerald-300" onClick={() => handleBulkAction('approve')}>Approve</Button>
                                <Button variant="ghost" className="h-8 px-2 text-rose-400 hover:text-rose-300" onClick={() => handleBulkAction('reject')}>Reject</Button>
                                <Button variant="ghost" className="h-8 px-2 text-slate-400 hover:text-white" onClick={() => handleBulkAction('delete')}>Delete</Button>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <FormInput
                            placeholder="Search listings..."
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
                            { label: "Flagged", value: "Flagged" },
                            { label: "Suspended", value: "Suspended" }
                        ]}
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    />
                    <FormSelect
                        options={[
                            { label: "All Categories", value: "" },
                            ...(Array.isArray(categories) ? categories : []).map(c => ({ label: c.name, value: c._id }))
                        ]}
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    />
                    <FormSelect
                        options={[
                            { label: "All Cities", value: "" },
                            ...(Array.isArray(cities) ? cities : []).map(c => ({ label: c.name, value: c._id }))
                        ]}
                        value={filters.city}
                        onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
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
                        <Button variant="outline" size="sm" onClick={() => {
                            const emptyFilters = { search: "", status: "", category: "", city: "", plan: "", dateStart: "", dateEnd: "" };
                            setFilters(emptyFilters);
                            setSelectedListings([]);
                            fetchListings(1, emptyFilters);
                        }}>Reset</Button>
                        <Button variant="primary" size="sm" onClick={() => {
                            setSelectedListings([]);
                            fetchListings(1);
                        }}>Apply Filters</Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {error && (
                <Alert type="error" className="rounded-3xl border-rose-100 bg-rose-50/50">
                    {error}
                </Alert>
            )}

            <DataTable
                data={listings}
                columns={columns}
                actions={tableActions}
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={fetchListings}
                showCheckbox={true}
                selectedRows={selectedListings}
                onSelectRows={setSelectedListings}
                actionMode="dropdown"
            />

            {/* Detail Modal */}
            <Modal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal({ isOpen: false, listing: null, activeTab: 'summary' })}
                title={detailModal.listing?.name}
                size="xl"
            >
                <div className="flex gap-4 border-b border-slate-100 mb-6">
                    {['summary', 'photos', 'audit'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setDetailModal(prev => ({ ...prev, activeTab: tab }))}
                            className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                                detailModal.activeTab === tab 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab} {tab === 'photos' && detailModal.listing?.images?.length ? `(${detailModal.listing.images.length})` : ''}
                        </button>
                    ))}
                </div>

                {detailModal.activeTab === 'summary' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Business Information</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Email</span>
                                        <span className="text-sm font-semibold">{detailModal.listing?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Phone</span>
                                        <span className="text-sm font-semibold">{detailModal.listing?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Category</span>
                                        <span className="text-sm font-semibold">{detailModal.listing?.category_id?.name || detailModal.listing?.category}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Location</span>
                                        <span className="text-sm font-semibold">{detailModal.listing?.city_id?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                             <div className="bg-slate-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ownership & Plan</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Owner</span>
                                        <span className="text-sm font-semibold">{detailModal.listing?.owner?.name || 'Unclaimed'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Plan</span>
                                        <Badge variant="primary">{detailModal.listing?.plan?.name || 'Free'}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Verification</span>
                                        {detailModal.listing?.businessBadgeVerified ? (
                                            <Badge variant="success" icon={ShieldCheck}>Verified</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Verified</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : detailModal.activeTab === 'photos' ? (
                    <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2">
                        {!detailModal.listing?.images || detailModal.listing.images.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 italic">No images uploaded for this listing</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {detailModal.listing.images.map((img) => (
                                    <div key={img._id} className="relative group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between">
                                        <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute top-2 right-2">
                                                <Badge variant={img.status === 'Approved' ? 'success' : img.status === 'Rejected' ? 'danger' : 'warning'}>
                                                    {img.status || 'Pending'}
                                                </Badge>
                                            </div>
                                            {img.isCover && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-md uppercase">
                                                    Cover
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 flex gap-1 bg-slate-50 border-t border-slate-100">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${detailModal.listing._id}/photos/${img._id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'Approved' })
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            setDetailModal(prev => ({
                                                                ...prev,
                                                                listing: {
                                                                    ...prev.listing,
                                                                    images: prev.listing.images.map(i => i._id === img._id ? { ...i, status: 'Approved' } : i)
                                                                }
                                                            }));
                                                        } else {
                                                            const data = await res.json();
                                                            setError(data.msg || "Photo approval failed");
                                                        }
                                                    } catch (err) {
                                                        console.error("Photo approval error:", err);
                                                        setError("Photo approval failed");
                                                    }
                                                }}
                                                className="flex-1 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings/${detailModal.listing._id}/photos/${img._id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'Rejected' })
                                                        });
                                                        if (res.ok) {
                                                            setDetailModal(prev => ({
                                                                ...prev,
                                                                listing: {
                                                                    ...prev.listing,
                                                                    images: prev.listing.images.map(i => i._id === img._id ? { ...i, status: 'Rejected' } : i)
                                                                }
                                                            }));
                                                        } else {
                                                            const data = await res.json();
                                                            setError(data.msg || "Photo rejection failed");
                                                        }
                                                    } catch (err) {
                                                        console.error("Photo rejection error:", err);
                                                        setError("Photo rejection failed");
                                                    }
                                                }}
                                                className="flex-1 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2">
                        {auditLoading ? (
                             <div className="flex flex-col gap-4">
                                 {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                             </div>
                        ) : auditTrail.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 italic">No history available for this listing</div>
                        ) : (
                            auditTrail.map((log, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 text-indigo-500 shrink-0">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            {new Date(log.date).toLocaleString()} by {log.changedBy?.name || 'System'}
                                        </div>
                                        <div className="text-sm font-semibold text-slate-800">
                                            Changed <span className="text-indigo-600">{log.field}</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs">
                                            <span className="line-through text-slate-400">{String(log.oldValue || 'None')}</span>
                                            <ChevronRight className="w-3 h-3 text-slate-300" />
                                            <span className="text-emerald-600 font-bold">{String(log.newValue || 'None')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={() => setDetailModal({ isOpen: false, listing: null, activeTab: 'summary' })}>Close</Button>
                    <Button variant="primary" icon={Edit3} onClick={() => navigate(`/admin/listings/${detailModal.listing?.slug || detailModal.listing?._id}/edit`)}>Full Editor</Button>
                </div>
            </Modal>

            {/* Confirm Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                        <Button
                            variant={confirmModal.type === 'danger' ? 'danger' : 'primary'}
                            onClick={() => {
                                // Modal isn't a real <form>, so the reason field's native
                                // `required` never fires — enforce it explicitly here.
                                if (confirmModal.needsReason) {
                                    if (confirmModal.reasonType === 'number') {
                                        if (confirmModal.reason === '' || Number.isNaN(Number(confirmModal.reason))) {
                                            setError(`${confirmModal.reasonLabel || 'This field'} must be a valid number`);
                                            return;
                                        }
                                    } else if (!confirmModal.reason || !confirmModal.reason.trim()) {
                                        setError(`${confirmModal.reasonLabel || 'Reason'} is required`);
                                        return;
                                    }
                                }
                                confirmModal.onConfirm(confirmModal.reason);
                            }}
                            isLoading={actionLoading}
                        >
                            {confirmModal.actionLabel}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 font-medium">{confirmModal.message}</p>
                    {confirmModal.needsReason && (
                        confirmModal.reasonType === 'number' ? (
                            <FormInput
                                type="number"
                                label={confirmModal.reasonLabel || "Reason / Comments"}
                                placeholder={confirmModal.reasonPlaceholder || ""}
                                value={confirmModal.reason}
                                onChange={(e) => setConfirmModal(prev => ({ ...prev, reason: e.target.value }))}
                                required
                            />
                        ) : (
                            <FormTextarea
                                label={confirmModal.reasonLabel || "Reason / Comments"}
                                placeholder={confirmModal.reasonPlaceholder || "Add internal notes or rejection reason..."}
                                value={confirmModal.reason}
                                onChange={(e) => setConfirmModal(prev => ({ ...prev, reason: e.target.value }))}
                                required
                            />
                        )
                    )}
                </div>
            </Modal>

            {/* Import Result Modal */}
            <Modal
                isOpen={importResultModal.isOpen}
                onClose={() => setImportResultModal(prev => ({ ...prev, isOpen: false }))}
                title="Spreadsheet Import Results"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="primary" onClick={() => setImportResultModal(prev => ({ ...prev, isOpen: false }))}>OK</Button>
                    </div>
                }
            >
                <div className="space-y-5">
                    {importResultModal.totals && (
                        <div className="grid grid-cols-4 gap-3 text-center">
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-100">
                                <div className="text-2xl font-bold">{importResultModal.totals.created}</div>
                                <div className="text-xs font-semibold mt-1 uppercase tracking-wide">Created</div>
                            </div>
                            <div className="bg-sky-50 text-sky-800 p-3 rounded-2xl border border-sky-100">
                                <div className="text-2xl font-bold">{importResultModal.totals.updated}</div>
                                <div className="text-xs font-semibold mt-1 uppercase tracking-wide">Updated</div>
                            </div>
                            <div className="bg-slate-50 text-slate-700 p-3 rounded-2xl border border-slate-200">
                                <div className="text-2xl font-bold">{importResultModal.totals.skipped}</div>
                                <div className="text-xs font-semibold mt-1 uppercase tracking-wide">Skipped</div>
                            </div>
                            <div className="bg-rose-50 text-rose-800 p-3 rounded-2xl border border-rose-100">
                                <div className="text-2xl font-bold">{importResultModal.totals.failed}</div>
                                <div className="text-xs font-semibold mt-1 uppercase tracking-wide">Failed</div>
                            </div>
                        </div>
                    )}

                    {importResultModal.usedSheets.length > 0 && (
                        <p className="text-xs text-slate-500 font-medium">
                            Sheets read: {importResultModal.usedSheets.join(", ")}
                        </p>
                    )}

                    {/* Per-sheet breakdown with row-level messages */}
                    {importResultModal.results && IMPORT_SHEETS.map((sheet) => {
                        const result = importResultModal.results[sheet.payloadKey];
                        if (!result) return null;
                        const touched = result.created + result.updated + result.skipped + result.failed;
                        if (!touched && !result.messages.length) return null;

                        return (
                            <div key={sheet.payloadKey} className="space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {sheet.label} — {result.created} created, {result.updated} updated, {result.skipped} skipped, {result.failed} failed
                                </p>
                                {result.messages.length > 0 && (
                                    <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2 text-sm">
                                        {result.messages.map((msg, idx) => (
                                            <div key={idx} className="flex justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                                                <span className="text-slate-700 font-medium whitespace-nowrap">
                                                    {msg.row ? `Row ${msg.row}` : "Sheet"}{msg.name ? `: ${msg.name}` : ""}
                                                </span>
                                                <span className={
                                                    msg.level === "error" ? "text-rose-600 font-semibold text-right"
                                                        : msg.level === "warning" ? "text-amber-600 font-semibold text-right"
                                                            : "text-slate-500 text-right"
                                                }>
                                                    {msg.message}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Auto-generated passwords are shown once and never again */}
                    {importResultModal.generatedCredentials.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                                New accounts — passwords shown only once
                            </p>
                            <div className="max-h-[180px] overflow-y-auto border border-amber-200 rounded-2xl p-3 bg-amber-50 space-y-1 text-sm font-mono">
                                {importResultModal.generatedCredentials.map((cred, idx) => (
                                    <div key={idx} className="flex justify-between gap-3">
                                        <span className="text-slate-700">{cred.email}</span>
                                        <span className="text-slate-900 font-bold">{cred.password}</span>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                leftIcon={Copy}
                                onClick={() => navigator.clipboard?.writeText(
                                    importResultModal.generatedCredentials.map(c => `${c.email}\t${c.password}`).join("\n")
                                )}
                            >
                                Copy credentials
                            </Button>
                        </div>
                    )}

                    {importResultModal.warnings.length > 0 && (
                        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                            {importResultModal.warnings.map((w, idx) => <p key={idx}>{w}</p>)}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Sheet Format Reference */}
            <Modal
                isOpen={formatModalOpen}
                onClose={() => setFormatModalOpen(false)}
                title="Import Sheet Format"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" leftIcon={FileSpreadsheet} onClick={downloadImportTemplate}>Download Template</Button>
                        <Button variant="primary" onClick={() => setFormatModalOpen(false)}>Close</Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="text-sm text-slate-600 space-y-2">
                        <p>
                            One workbook, three sheets named <strong>Categories</strong>, <strong>Users</strong> and <strong>Listings</strong>.
                            Every sheet is optional and they are processed in that order, so a listing can point at a
                            category or owner defined in the same file.
                        </p>
                        <p>
                            Columns marked <span className="text-rose-600 font-bold">*</span> are mandatory; the rest can be
                            reordered or removed. Attach an owner to a listing through the <strong>Owner Email</strong> column.
                            Locations and plans must already exist; categories are created on the fly.
                        </p>
                    </div>

                    {IMPORT_SHEETS.map((sheet) => (
                        <div key={sheet.payloadKey} className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {sheet.label} sheet — {sheet.columns.length} columns
                            </p>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {sheet.columns.map((column) => (
                                            <tr key={column.key} className="border-b border-slate-100 last:border-b-0 align-top">
                                                <td className="p-2 font-semibold text-slate-800 whitespace-nowrap w-48">
                                                    {column.header}
                                                    {column.required && <span className="text-rose-600">*</span>}
                                                </td>
                                                <td className="p-2 text-slate-500">{column.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
