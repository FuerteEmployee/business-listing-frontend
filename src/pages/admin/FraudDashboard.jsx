import { useCallback, useEffect, useState } from "react";
import { Shield, AlertTriangle, Eye, CheckCircle, XCircle, Search, AlertOctagon, MessageSquare, User, Building, ShieldCheck } from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import AdminHeader from "../../components/admin/AdminHeader";
import { Button } from "../../components/ui/button";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import Modal from "../../components/ui/Modal";
import { FormTextarea } from "../../components/ui/FormTextarea";

const DEFAULT_FILTERS = {
    type: '',
    status: '',
    severity: ''
};

const processStats = (todayStats = []) => {
    const stats = {
        total: 0,
        byType: { listing: 0, review: 0, account: 0, enquiry: 0 },
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 }
    };

    todayStats.forEach((stat) => {
        stats.total += stat.count;

        if (stat._id?.type) {
            stats.byType[stat._id.type] = (stats.byType[stat._id.type] || 0) + stat.count;
        }

        if (stat._id?.severity) {
            stats.bySeverity[stat._id.severity] = (stats.bySeverity[stat._id.severity] || 0) + stat.count;
        }
    });

    return stats;
};

const buildDashboardQuery = (filters, page, limit) => {
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit)
    });

    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            queryParams.set(key, value);
        }
    });

    return queryParams.toString();
};

const FraudDashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(() => processStats());
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal state
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

    const [infoModal, setInfoModal] = useState({
        isOpen: false,
        message: ""
    });

    const fetchFraudData = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            setError(null);
            const queryParams = buildDashboardQuery(filters, page, pagination.limit);

            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/dashboard?${queryParams}`);

            if (!response.ok) throw new Error('Failed to fetch fraud data');

            const data = await response.json();
            setAlerts(data.alerts || []);
            setStats(processStats(data.todayStats || []));
            setPagination(prev => ({
                ...prev,
                page,
                total: data.pagination?.total || 0
            }));
        } catch (error) {
            console.error('Error fetching fraud data:', error);
            setError('Failed to load fraud dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchFraudData(1);
    }, [fetchFraudData]);

    const runDetection = async () => {
        try {
            setIsLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/run-detection`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to run detection');

            setInfoModal({ isOpen: true, message: 'Fraud detection scan completed successfully.' });
            await fetchFraudData(pagination.page);
        } catch (error) {
            console.error('Error running detection:', error);
            setError('Failed to run fraud detection');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'listing': return <Building className="w-4 h-4" />;
            case 'review': return <MessageSquare className="w-4 h-4" />;
            case 'account': return <User className="w-4 h-4" />;
            case 'enquiry': return <Search className="w-4 h-4" />;
            default: return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const columns = [
        {
            label: "Type",
            key: "type",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    {getTypeIcon(row.type)}
                    <span className="text-sm font-medium text-slate-900 capitalize">
                        {row.type}
                    </span>
                </div>
            )
        },
        {
            label: "Reason",
            key: "reason",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{row.reason}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{row.description}</span>
                </div>
            )
        },
        {
            label: "Target",
            key: "targetId",
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm text-slate-700">
                        {row.targetId?.name || row.targetId?.title || row.targetId?.email || 'Unknown'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                        {row.targetModel || 'Unassigned'}
                    </span>
                </div>
            )
        },
        {
            label: "Severity",
            key: "severity",
            render: (value, row) => (
                <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSeverityColor(row.severity)}`}>
                    {row.severity?.toUpperCase()}
                </span>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (value, row) => <StatusBadge status={row.status} />
        },
        {
            label: "Created",
            key: "createdAt",
            render: (value, row) => (
                <span className="text-xs text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
            )
        }
    ];

    const showWorkflowInfo = (alert, workflowLabel) => {
        setInfoModal({
            isOpen: true,
            message: `${workflowLabel} is not enabled from the fraud dashboard yet for ${alert.type || 'this'} alerts.`
        });
    };

    const handleModeration = async (alertId, action, reason) => {
        try {
            setActionLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/alerts/${alertId}/moderate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to moderate alert');
            }

            await fetchFraudData(pagination.page);
            setConfirmModal({ isOpen: false });
            setInfoModal({ isOpen: true, message: `Decision: ${action.replace('_', ' ')} has been applied successfully.` });
        } catch (error) {
            console.error('Moderation error:', error);
            setError(error.message || 'Failed to apply moderation action');
            setConfirmModal({ isOpen: false });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setActionLoading(false);
        }
    };

    const promptModeration = (alert, actionLabel, actionValue, modalType, needsReason = true) => {
        setConfirmModal({
            isOpen: true,
            title: actionLabel,
            message: `Please confirm your decision to ${actionValue.replace('_', ' ')} this alert.`,
            type: modalType,
            actionLabel: "Confirm",
            needsReason: needsReason,
            reason: alert.reason || "",
            onConfirm: (reason) => handleModeration(alert._id, actionValue, reason)
        });
    };

    const tableActions = [
        {
            label: "Investigate",
            icon: Eye,
            onClick: async (alert) => {
                try {
                    const response = await fetchWithAuth(`${API_BASE_URL}/fraud/alerts/${alert._id}/assign`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moderatorId: 'current' })
                    });
                    if (response.ok) await fetchFraudData(pagination.page);
                } catch (err) {
                    console.error('Assign error:', err);
                }
            },
            condition: alert => alert.status === 'pending'
        },
        {
            label: "Dismiss (Safe)",
            icon: CheckCircle,
            onClick: (alert) => promptModeration(alert, "Dismiss Alert", "dismiss", "info", true),
            condition: alert => alert.status === 'investigating' || alert.status === 'pending'
        },
        {
            label: "Suspend Listing",
            icon: XCircle,
            onClick: (alert) => promptModeration(alert, "Suspend Listing", "suspend_listing", "danger", true),
            isDangerous: true,
            condition: alert => alert.targetModel === 'Company' && alert.status !== 'confirmed'
        },
        {
            label: "Suspend Account",
            icon: Shield,
            onClick: (alert) => promptModeration(alert, "Suspend Account", "suspend_account", "danger", true),
            isDangerous: true,
            condition: alert => alert.targetModel === 'User' && alert.status !== 'confirmed'
        },
        {
            label: "Reject / Quarantine",
            icon: AlertOctagon,
            onClick: (alert) => promptModeration(alert, "Quarantine Content", "quarantine", "danger", true),
            isDangerous: true,
            condition: alert => alert.targetModel === 'Review' && alert.status !== 'confirmed'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <AdminHeader 
                title="Fraud Monitoring"
                subtitle="Real-time fraud detection and alert management system"
                actions={
                    <Button
                        variant="primary"
                        onClick={runDetection}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <AlertOctagon className="w-4 h-4" />
                        Run Detection Scan
                    </Button>
                }
            />

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Today's Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Alerts Today</p>
                    <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black text-slate-800 leading-none">{stats.total || 0}</h4>
                        <AlertTriangle className="w-8 h-8 text-rose-500 stroke-[3]" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Critical Alerts Today</p>
                    <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black text-rose-600 leading-none">{stats.bySeverity?.critical || 0}</h4>
                        <XCircle className="w-8 h-8 text-rose-500 stroke-[3]" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Listing Alerts Today</p>
                    <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black text-indigo-600 leading-none">{stats.byType?.listing || 0}</h4>
                        <Building className="w-8 h-8 text-indigo-500 stroke-[3]" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account Alerts Today</p>
                    <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black text-emerald-600 leading-none">{stats.byType?.account || 0}</h4>
                        <User className="w-8 h-8 text-emerald-500 stroke-[3]" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormSelect
                        options={[
                            { label: "All Types", value: "" },
                            { label: "Listings", value: "listing" },
                            { label: "Reviews", value: "review" },
                            { label: "Accounts", value: "account" },
                            { label: "Enquiries", value: "enquiry" }
                        ]}
                        value={filters.type}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, type: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    />
                    <FormSelect
                        options={[
                            { label: "All Status", value: "" },
                            { label: "Pending", value: "pending" },
                            { label: "Investigating", value: "investigating" },
                            { label: "Confirmed", value: "confirmed" },
                            { label: "Dismissed", value: "dismissed" }
                        ]}
                        value={filters.status}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, status: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    />
                    <FormSelect
                        options={[
                            { label: "All Severity", value: "" },
                            { label: "Low", value: "low" },
                            { label: "Medium", value: "medium" },
                            { label: "High", value: "high" },
                            { label: "Critical", value: "critical" }
                        ]}
                        value={filters.severity}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, severity: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    />
                </div>
                
                <div className="flex items-center justify-end pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset</Button>
                        <Button variant="primary" size="sm" onClick={() => fetchFraudData(1)}>Apply Filters</Button>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Moderator workflows are view-only on this dashboard. Use this screen to monitor alerts and queue follow-up work.
            </div>

            {/* DataTable */}
            <DataTable
                data={alerts}
                columns={columns}
                actions={tableActions}
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={(page) => fetchFraudData(page)}
                emptyMessage="No fraud alerts found for the selected filters."
                actionMode="dropdown"
            />

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

            {/* Info Modal */}
            <Modal
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal({ isOpen: false, message: "" })}
                title="System Information"
                icon={ShieldCheck}
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="primary" onClick={() => setInfoModal({ isOpen: false, message: "" })}>Acknowledge</Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-medium leading-relaxed">{infoModal.message}</p>
            </Modal>
        </div>
    );
};

export default FraudDashboard;
