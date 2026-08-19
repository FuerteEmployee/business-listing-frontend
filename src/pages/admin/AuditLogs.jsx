import { useState, useEffect, useCallback } from "react";
import { 
    Clock, 
    Shield, 
    AlertCircle, 
    Eye, 
    Download, 
    Filter,
    User, 
    FileText, 
    MessageSquare, 
    Layers, 
    CreditCard, 
    Ticket, 
    Settings, 
    MapPin 
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormSelect from "../../components/ui/FormSelect";
import FormInput from "../../components/ui/FormInput";
import AdminHeader from "../../components/admin/AdminHeader";

// Helper to map targetType to corresponding Lucide Icon
const getActionIcon = (targetType) => {
    switch (targetType) {
        case 'User':
        case 'AdminUser':
            return User;
        case 'Listing':
            return FileText;
        case 'Review':
            return MessageSquare;
        case 'Role':
            return Shield;
        case 'Plan':
            return Layers;
        case 'Subscription':
            return CreditCard;
        case 'Coupon':
            return Ticket;
        case 'Refund':
        case 'Invoice':
        case 'Transaction':
        case 'Payout':
            return CreditCard;
        default:
            return Settings;
    }
};

// Clean UI Card for Audit Log Details
const AuditLogDetailsCard = ({ log }) => {
    if (!log) return null;

    // 1. Format action name to Title case (e.g. USER_CREATED -> User created)
    const formatAction = (action) => {
        if (!action) return "";
        return action
            .split("_")
            .map((part, idx) => {
                if (idx === 0) return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                return part.toLowerCase();
            })
            .join(" ");
    };

    // 2. Resolve affected resource name (target)
    const getAffectedResource = (row) => {
        const name =
            row.changes?.after?.name ||
            row.changes?.before?.name ||
            row.changes?.after?.title ||
            row.changes?.before?.title ||
            row.changes?.after?._id?.name ||
            row.changes?.before?._id?.name;
        if (name) return name;

        if (row.notes) {
            const parts = row.notes.split(":");
            if (parts.length > 1) return parts[1].trim();
        }

        return `${row.targetType || "System"} (${row.targetId || "N/A"})`;
    };

    // 3. Compare before/after to compute changed fields diff
    const getDiff = (changes) => {
        if (!changes) return [];
        const before = changes.before || {};
        const after = changes.after || {};

        const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
        const diff = [];

        for (const key of allKeys) {
            // Skip database internals and passwords
            if (["password", "_id", "__v", "createdAt", "updatedAt", "id", "lastLogin", "lastAdminAction"].includes(key)) {
                continue;
            }

            const oldVal = before[key];
            const newVal = after[key];

            if (oldVal === newVal) continue;

            diff.push({
                field: key,
                oldValue: oldVal,
                newValue: newVal,
            });
        }
        return diff;
    };

    const diffItems = getDiff(log.changes);
    const actionName = formatAction(log.action);
    const affected = getAffectedResource(log);
    const operator = log.adminId?.name || "System";
    const timestamp = new Date(log.createdAt).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    const IconComponent = getActionIcon(log.targetType);
    const isSuccess = log.status?.toLowerCase() === "success";

    // Detect if field is an enum / status / role that should be badges
    const isEnumField = (field) => {
        const enumFields = ["role", "status", "type", "category", "action", "level", "permission"];
        return enumFields.includes(field.toLowerCase());
    };

    // Pill badge colors matching role/status values
    const getPillBadgeStyle = (value) => {
        if (value === undefined || value === null) return "bg-slate-100 text-slate-500 border border-slate-200";
        const valStr = String(value).toLowerCase();

        if (["member", "user", "pending", "inactive", "warning"].includes(valStr)) {
            return "bg-amber-50 text-amber-700 border border-amber-200/50";
        }
        if (["moderator", "admin", "superadmin", "info", "blue"].includes(valStr)) {
            return "bg-indigo-50 text-indigo-700 border border-indigo-200/50";
        }
        if (["active", "approved", "success", "true"].includes(valStr)) {
            return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
        }
        if (["banned", "suspended", "failed", "rejected", "false", "danger", "deleted"].includes(valStr)) {
            return "bg-rose-50 text-rose-700 border border-rose-200/50";
        }
        return "bg-slate-50 text-slate-650 border border-slate-200/60";
    };

    const formatFieldLabel = (field) => {
        return field
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .trim()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

    return (
        <div className="bg-slate-50 text-slate-700 rounded-[32px] p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <IconComponent className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">{actionName}</h4>
                </div>
                <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${
                        isSuccess
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}
                >
                    {isSuccess ? "success" : "unsuccess"}
                </span>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-slate-500 mb-6 pl-1 font-medium">
                {affected} <span className="text-slate-300 mx-1.5">·</span> by {operator}{" "}
                <span className="text-slate-300 mx-1.5">·</span> {timestamp}
            </p>

            <div className="border-t border-slate-200/60 my-4" />

            {/* Diff Section */}
            <div className="space-y-5 my-5 pl-1">
                {diffItems.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                        {log.notes || "No structural modifications logged."}
                    </div>
                ) : (
                    diffItems.map((item, idx) => {
                        const isEnum = isEnumField(item.field);
                        const label = formatFieldLabel(item.field);

                        return (
                            <div key={idx} className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                                <div className="flex items-center gap-3">
                                    {isEnum ? (
                                        <>
                                            <span
                                                className={`px-3 py-1 text-xs font-bold rounded-lg ${getPillBadgeStyle(
                                                    item.oldValue
                                                )} line-through opacity-60`}
                                            >
                                                {String(item.oldValue ?? "None")}
                                            </span>
                                            <span className="text-slate-400 text-sm font-semibold">→</span>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-lg ${getPillBadgeStyle(item.newValue)}`}>
                                                {String(item.newValue ?? "None")}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm text-rose-500/80 line-through font-medium flex-wrap break-all max-w-[200px]">
                                                {item.oldValue !== undefined && item.oldValue !== null ? String(item.oldValue) : "None"}
                                            </span>
                                            <span className="text-slate-400 text-sm font-semibold">→</span>
                                            <span className="text-sm text-emerald-600 font-semibold flex-wrap break-all max-w-[200px]">
                                                {item.newValue !== undefined && item.newValue !== null ? String(item.newValue) : "None"}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="border-t border-slate-200/60 my-4" />

            {/* Footer row */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pl-1 mt-4">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.ipAddress || "127.0.0.1"}</span>
                </div>
                <span>ID: {log._id}</span>
            </div>
        </div>
    );
};

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
    const [isExporting, setIsExporting] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [jsonModal, setJsonModal] = useState({ isOpen: false, data: null });

    // Filter state
    const [filters, setFilters] = useState({
        search: "",
        action: "",
        targetType: "",
        dateStart: "",
        dateEnd: ""
    });

    // Fetch audit logs
    const fetchLogs = useCallback(async (page = 1, isAuto = false) => {
        try {
            if (!isAuto) setIsLoading(true);
            setError(null);

            const params = new URLSearchParams({
                limit: 50, // Fixed limit to avoid dependency loop
                page,
                ...(filters.action && { action: filters.action }),
                ...(filters.targetType && { targetType: filters.targetType }),
                ...(filters.dateStart && { startDate: filters.dateStart }),
                ...(filters.dateEnd && { endDate: filters.dateEnd })
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/audit-logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setPagination(prev => ({ 
                    ...prev, 
                    page, 
                    total: data.pagination?.total || 0 
                }));
            }
        } catch (err) {
            if (!isAuto) setError("Error loading audit logs");
        } finally {
            if (!isAuto) setIsLoading(false);
        }
    }, [filters]); // Only depends on filters

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    // Auto-refresh polling
    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchLogs(pagination.page, true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs, pagination.page]);

    // Export logs to CSV
    const handleExportLogs = async () => {
        try {
            setIsExporting(true);
            const params = new URLSearchParams({
                ...(filters.action && { action: filters.action }),
                ...(filters.targetType && { targetType: filters.targetType }),
                ...(filters.dateStart && { startDate: filters.dateStart }),
                ...(filters.dateEnd && { endDate: filters.dateEnd })
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/audit-logs/export/csv?${params}`);
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                setError("Failed to generate export");
            }
        } catch (err) {
            console.error("Export error:", err);
            setError("Network error during export");
        } finally {
            setIsExporting(false);
        }
    };

    // DataTable columns definition
    const columns = [
        {
            label: "Action",
            key: "action",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 uppercase text-xs tracking-wider">{row.action}</span>
                    <span className="text-[10px] text-slate-500">{row.targetType || "System"}</span>
                </div>
            )
        },
        {
            label: "User",
            key: "adminId",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">{row.adminId?.name || "System"}</span>
                    <span className="text-xs text-slate-500">{row.adminId?.email || "N/A"}</span>
                </div>
            )
        },
        {
            label: "Resource",
            key: "targetType",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{row.targetType || "System"}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{row.targetId || "N/A"}</span>
                </div>
            )
        },
        {
            label: "Details",
            key: "notes",
            render: (value, row) => (
                <span className="text-xs text-slate-600 truncate max-w-[200px] block" title={row.notes}>
                    {row.notes || "No details provided"}
                </span>
            )
        },
        {
            label: "IP Address",
            key: "ipAddress",
            render: (value) => <span className="text-xs font-mono text-slate-500">{value || "N/A"}</span>
        },
        {
            label: "Status",
            key: "status",
            render: (value, row) => {
                const isSuccess = row.status?.toLowerCase() === 'success';
                return (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                        {isSuccess ? "SUCCESS" : "UNSUCCESS"}
                    </span>
                );
            }
        },
        {
            label: "Timestamp",
            key: "createdAt",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm text-slate-700">{new Date(row.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-400">{new Date(row.createdAt).toLocaleTimeString()}</span>
                </div>
            )
        }
    ];
    
    const tableActions = [
        {
            label: "View Details",
            icon: Eye,
            onClick: (log) => {
                setJsonModal({ isOpen: true, data: log });
            }
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Audit Logs"
                subtitle="Track every administrative decision, security event, and system state change across the platform in real-time."
                badge={<Badge variant="premium">Administrative Hub</Badge>}
                actions={
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <label className="flex items-center gap-3 p-2.5 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer group hover:border-indigo-200 transition-all">
                            <div className={`w-10 h-5 rounded-full relative transition-all ${autoRefresh ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${autoRefresh ? 'left-6' : 'left-1'}`} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700">
                                Live Stream {autoRefresh && <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-pulse ml-1" />}
                            </span>
                            <input type="checkbox" className="hidden" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
                        </label>
                        <Button
                            variant="outline"
                            leftIcon={Download}
                            onClick={handleExportLogs}
                            isLoading={isExporting}
                        >
                            Export CSV
                        </Button>
                    </div>
                }
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormSelect 
                        value={filters.action}
                        onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                        options={[
                            { label: "All Actions", value: "" },
                            { label: "Create", value: "CREATE" },
                            { label: "Update", value: "UPDATE" },
                            { label: "Delete", value: "DELETE" },
                            { label: "Login", value: "LOGIN" },
                            { label: "Logout", value: "LOGOUT" },
                            { label: "Approve", value: "APPROVE" },
                            { label: "Reject", value: "REJECT" }
                        ]}
                    />
                    <FormSelect 
                        value={filters.targetType}
                        onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
                        options={[
                            { label: "All Target Domains", value: "" },
                            { label: "User", value: "User" },
                            { label: "Business", value: "Business" },
                            { label: "Listing", value: "Listing" },
                            { label: "Review", value: "Review" },
                            { label: "Product", value: "Product" },
                            { label: "Article", value: "Article" },
                            { label: "Page", value: "Page" },
                            { label: "Banner", value: "Banner" },
                            { label: "SEO", value: "SEO" },
                            { label: "Settings", value: "Settings" }
                        ]}
                    />
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">From</span>
                        <input type="date" value={filters.dateStart} onChange={(e) => setFilters(prev => ({ ...prev, dateStart: e.target.value }))} className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-medium py-2.5" />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">To</span>
                        <input type="date" value={filters.dateEnd} onChange={(e) => setFilters(prev => ({ ...prev, dateEnd: e.target.value }))} className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-medium py-2.5" />
                    </div>
                </div>
                
                <div className="flex items-center justify-end pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            setFilters({ search: "", action: "", targetType: "", dateStart: "", dateEnd: "" });
                            fetchLogs(1);
                        }}>Reset</Button>
                        <Button variant="primary" size="sm" onClick={() => fetchLogs(1)}>Apply Filters</Button>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <DataTable
                data={logs}
                columns={columns}
                actions={tableActions}
                actionMode="dropdown"
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={(page) => fetchLogs(page)}
            />

            {/* Event Details Modal */}
            <Modal
                isOpen={jsonModal.isOpen}
                onClose={() => setJsonModal({ isOpen: false, data: null })}
                title="Event Details"
                subtitle="Operational change telemetry log"
                icon={Shield}
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="ghost" onClick={() => setJsonModal({ isOpen: false, data: null })}>Close Details</Button>
                    </div>
                }
            >
                <AuditLogDetailsCard log={jsonModal.data} />
            </Modal>
        </div>
    );
}
