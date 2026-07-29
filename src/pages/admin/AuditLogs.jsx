import { useState, useEffect, useCallback } from "react";
import { Clock, Shield, AlertCircle, Eye, Download, Filter } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormSelect from "../../components/ui/FormSelect";
import FormInput from "../../components/ui/FormInput";
import AdminHeader from "../../components/admin/AdminHeader";

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
                    <span className="text-[10px] text-slate-500">{row.category}</span>
                </div>
            )
        },
        {
            label: "User",
            key: "userName",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">{row.userName}</span>
                    <span className="text-xs text-slate-500">{row.userEmail}</span>
                </div>
            )
        },
        {
            label: "Resource",
            key: "resourceType",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{row.resourceType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{row.resourceId}</span>
                </div>
            )
        },
        {
            label: "Details",
            key: "details",
            render: (value, row) => (
                <span className="text-xs text-slate-600 truncate max-w-[200px] block">
                    {typeof row.details === 'string' ? row.details : JSON.stringify(row.details)}
                </span>
            )
        },
        {
            label: "IP Address",
            key: "ipAddress",
            render: (value) => <span className="text-xs font-mono text-slate-500">{value}</span>
        },
        {
            label: "Status",
            key: "status",
            render: (value, row) => (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    row.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                    {row.status ? row.status.toUpperCase() : "UNKNOWN"}
                </span>
            )
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
            label: "View JSON",
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

            {/* JSON Details Modal */}
            <Modal
                isOpen={jsonModal.isOpen}
                onClose={() => setJsonModal({ isOpen: false, data: null })}
                title="System Telemetry"
                subtitle="Verifying detailed log parameters"
                icon={Shield}
                size="xl"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="ghost" onClick={() => setJsonModal({ isOpen: false, data: null })}>Close Telemetry</Button>
                    </div>
                }
            >
                <div className="bg-slate-950 rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                    <pre className="text-white font-mono text-sm leading-relaxed overflow-x-auto custom-scrollbar relative z-10">
                        {JSON.stringify(jsonModal.data, null, 4)}
                    </pre>
                </div>
            </Modal>
        </div>
    );
}
