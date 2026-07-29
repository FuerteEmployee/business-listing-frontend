import { useState, useEffect, useCallback } from "react";
import { 
    Send, Plus, Bell, Mail, MessageSquare, Smartphone, 
    Clock, CheckCircle2, AlertCircle, BarChart3, 
    Filter, Search, MoreVertical, Trash2, Play, 
    Calendar, User, Globe, Info, Copy, Shield, Volume2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import AdminFilters from "../../components/admin/AdminFilters";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader";

export default function BroadcastManager() {
    const [activeTab, setActiveTab] = useState("campaigns");
    const [broadcasts, setBroadcasts] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Segment Data
    const [segmentsData, setSegmentsData] = useState({ cities: [], roles: [] });

    // Modals
    const [broadcastModal, setBroadcastModal] = useState({
        isOpen: false,
        type: 'create',
        data: null,
        formData: {
            title: '',
            templateId: '',
            channel: 'Email',
            targetType: 'All',
            segmentFilters: { role: '', city: '' },
            scheduledAt: new Date().toISOString().slice(0, 16),
            manualTargets: ''
        }
    });

    const [templateModal, setTemplateModal] = useState({
        isOpen: false,
        type: 'create',
        data: null,
        formData: {
            name: '',
            description: '',
            channel: 'Email',
            subject: '',
            body: '',
            mediaUrl: ''
        }
    });

    const [reportModal, setReportModal] = useState({
        isOpen: false,
        data: null
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        actionLabel: "",
        type: "danger",
        onConfirm: null
    });

    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [bRes, tRes, sRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/admin/broadcasts`),
                fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/templates`),
                fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/segments`)
            ]);

            if (bRes.ok) {
                const bData = await bRes.json();
                setBroadcasts(bData.broadcasts || []);
            }
            if (tRes.ok) {
                const tData = await tRes.json();
                setTemplates(tData.templates || []);
            }
            if (sRes.ok) {
                const sData = await sRes.json();
                setSegmentsData({ cities: sData.cities || [], roles: sData.roles || [] });
            }
        } catch (err) {
            setError("Failed to sync with broadcast server");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTemplateSave = async () => {
        try {
            setActionLoading(true);
            const isEdit = templateModal.type === 'edit';
            const url = isEdit 
                ? `${API_BASE_URL}/admin/broadcasts/templates/${templateModal.data._id}`
                : `${API_BASE_URL}/admin/broadcasts/templates`;
            
            const res = await fetchWithAuth(url, {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(templateModal.formData)
            });
            if (res.ok) {
                toast.success(isEdit ? "Template synchronized" : "Template archived");
                setTemplateModal({ ...templateModal, isOpen: false });
                fetchData();
            }
        } catch (err) {
            toast.error("Process failed");
        } finally {
            setActionLoading(false);
        }
    };

    const promptConfirm = (title, message, actionLabel, onConfirm, type = "danger") => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            actionLabel,
            type,
            onConfirm: async () => {
                await onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteTemplate = async (id) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Payload removed from library");
                fetchData();
            }
        } catch (err) {
            toast.error("Deletion failed");
        }
    };

    const handleBroadcastSave = async () => {
        try {
            setActionLoading(true);
            const payload = {
                ...broadcastModal.formData,
                manualTargets: broadcastModal.formData.manualTargets 
                    ? broadcastModal.formData.manualTargets.split(',').map(t => t.trim()).filter(t => t !== '')
                    : []
            };
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast.success("Mission initialized");
                setBroadcastModal({ ...broadcastModal, isOpen: false });
                fetchData();
            }
        } catch (err) {
            toast.error("Initialization failure");
        } finally {
            setActionLoading(false);
        }
    };

    const handleExecuteBroadcast = async (id) => {
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}/execute`, { method: 'POST' });
            if (res.ok) {
                toast.success("Campaign sequence initiated");
                fetchData();
            }
        } catch (err) {
            toast.error("Launch failure");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBroadcast = async (id) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Campaign record purged");
                fetchData();
            }
        } catch (err) {
            toast.error("Purge failure");
        }
    };

    const handleCloneBroadcast = async (id) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/broadcasts/${id}/clone`, { method: 'POST' });
            if (res.ok) {
                toast.success("Campaign replicated");
                fetchData();
            }
        } catch (err) {
            toast.error("Cloning protocol failure");
        }
    };

    const campaignColumns = [
        {
            label: "Mission Identity",
            key: "title",
            render: (value, row) => (
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${
                        row.channel === 'Email' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        row.channel === 'SMS' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                        row.channel === 'WhatsApp' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                        'bg-purple-50 border-purple-100 text-purple-600'
                    }`}>
                        {row.channel === 'Email' && <Mail className="w-5 h-5" />}
                        {row.channel === 'SMS' && <MessageSquare className="w-5 h-5" />}
                        {row.channel === 'WhatsApp' && <Globe className="w-5 h-5" />}
                        {row.channel === 'Push' && <Smartphone className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-black text-slate-800 tracking-tight">{row.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                {row.templateId?.name || 'Manual Entry'}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(row.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Segment",
            key: "targetType",
            render: (value, row) => (
                <div className="space-y-1">
                    <Badge variant={value === 'All' ? 'indigo' : 'outline'} size="sm" className="font-black">
                        {value === 'Segment' ? `${row.segmentFilters?.role || 'All'} in ${row.segmentFilters?.city || 'Any City'}` : value}
                    </Badge>
                    <div className="text-[10px] font-bold text-slate-400 pl-1">
                        {row.stats?.totalTargeted || 0} Targets
                    </div>
                </div>
            )
        },
        {
            label: "Real-time Telemetry",
            key: "status",
            render: (value, row) => (
                <div className="space-y-2 max-w-[120px]">
                    <Badge 
                        variant={
                            value === 'Completed' ? 'success' : 
                            value === 'Processing' ? 'indigo' : 
                            value === 'Scheduled' ? 'warning' : 'outline'
                        } 
                        dot 
                        pulse={value === 'Processing'}
                        size="sm"
                    >
                        {value}
                    </Badge>
                    {value === 'Completed' && (
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ width: `${((row.stats?.sent || 0) / (row.stats?.totalTargeted || 1)) * 100}%` }} 
                            />
                            <div 
                                className="h-full bg-rose-500 transition-all duration-1000" 
                                style={{ width: `${((row.stats?.failed || 0) / (row.stats?.totalTargeted || 1)) * 100}%` }} 
                            />
                        </div>
                    )}
                </div>
            )
        }
    ];

    const campaignActions = [
        {
            label: "Initiate Launch",
            icon: Play,
            className: "text-emerald-600",
            onClick: (row) => promptConfirm(
                "Launch Campaign",
                "Launch this campaign immediately?",
                "Launch",
                () => handleExecuteBroadcast(row._id),
                "primary"
            ),
            condition: (row) => row.status === 'Draft' || row.status === 'Scheduled'
        },
        {
            label: "Analyze Report",
            icon: BarChart3,
            onClick: (row) => setReportModal({ isOpen: true, data: row }),
            condition: (row) => row.status === 'Completed' || row.status === 'Processing'
        },
        {
            label: "Replicate Protocol",
            icon: Copy,
            onClick: (row) => handleCloneBroadcast(row._id)
        },
        {
            label: "Terminate Record",
            icon: Trash2,
            className: "text-rose-600",
            onClick: (row) => promptConfirm(
                "Abort Campaign",
                "Abort and erase this campaign record? This cannot be undone.",
                "Erase Record",
                () => handleDeleteBroadcast(row._id),
                "danger"
            )
        }
    ];

    const templateColumns = [
        {
            label: "Payload Identity",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        <Bell className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{value}</p>
                        <p className="text-[10px] text-slate-400">{row.description || 'Generic message layout'}</p>
                    </div>
                </div>
            )
        },
        {
            label: "Carrier",
            key: "channel",
            render: (value) => (
                <Badge variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[9px]">{value}</Badge>
            )
        },
        {
            label: "Last Synced",
            key: "updatedAt",
            render: (value) => (
                <span className="text-xs font-bold text-slate-400">
                    {new Date(value).toLocaleDateString()}
                </span>
            )
        }
    ];

    const templateActions = [
        {
            label: "Update Template",
            icon: Bell,
            onClick: (row) => setTemplateModal({
                isOpen: true,
                type: 'edit',
                data: row,
                formData: { ...row }
            })
        },
        {
            label: "Delete Template",
            icon: Trash2,
            className: "text-rose-600",
            onClick: (row) => promptConfirm(
                "Delete Template",
                "Permanently delete this template?",
                "Delete",
                () => handleDeleteTemplate(row._id),
                "danger"
            )
        }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <AdminHeader 
                title="OmniStream Broadcaster"
                subtitle="Control center for platform-wide communications. Propagate mission-critical notifications across all digital carriers with real-time telemetry."
                badge={<Badge variant="premium">Administrative Hub</Badge>}
                actions={
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <Button 
                            variant="outline" 
                            leftIcon={Plus} 
                            onClick={() => setTemplateModal({ isOpen: true, type: 'create', formData: { name: '', description: '', channel: 'Email', subject: '', body: '', mediaUrl: '' } })}
                        >
                            Create Payload
                        </Button>
                        <Button 
                            variant="primary" 
                            leftIcon={Send} 
                            onClick={() => setBroadcastModal({ 
                                isOpen: true, 
                                type: 'create', 
                                formData: { 
                                    title: '', 
                                    templateId: '', 
                                    channel: 'Email', 
                                    targetType: 'All', 
                                    segmentFilters: { role: '', city: '' }, 
                                    scheduledAt: new Date().toISOString().slice(0, 16), 
                                    manualTargets: '' 
                                } 
                            })}
                        >
                            Launch Mission
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

            {/* Navigation Tabs */}
            <div className="flex gap-10 border-b border-slate-100 px-2 mt-4">
                <button 
                    onClick={() => setActiveTab("campaigns")}
                    className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === "campaigns" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    Mission Archive
                    {activeTab === "campaigns" && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-full shadow-lg shadow-indigo-600/50" />}
                </button>
                <button 
                    onClick={() => setActiveTab("templates")}
                    className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === "templates" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    Payload Library
                    {activeTab === "templates" && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-full shadow-lg shadow-indigo-600/50" />}
                </button>
            </div>

            {/* Content Section */}
            <div className="animate-in slide-in-from-bottom-2 duration-500">
                {activeTab === "campaigns" ? (
                    <DataTable 
                        data={broadcasts}
                        columns={campaignColumns}
                        actions={campaignActions}
                        actionMode="dropdown"
                        isLoading={isLoading}
                        emptyMessage="No active missions in the archive"
                    />
                ) : (
                    <DataTable 
                        data={templates}
                        columns={templateColumns}
                        actions={templateActions}
                        actionMode="dropdown"
                        isLoading={isLoading}
                        emptyMessage="Payload template library is empty"
                    />
                )}
            </div>

            {/* Template Design Modal */}
            <Modal
                isOpen={templateModal.isOpen}
                onClose={() => setTemplateModal({ ...templateModal, isOpen: false })}
                title={templateModal.type === 'edit' ? "Reconfigure Payload" : "Design New Payload"}
                icon={Bell}
                size="xl"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" onClick={() => setTemplateModal({ ...templateModal, isOpen: false })}>Abort</Button>
                        <Button variant="primary" onClick={handleTemplateSave} isLoading={actionLoading}>
                            {templateModal.type === 'edit' ? "Update Protocol" : "Archive Template"}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-2 gap-8 py-4">
                    <div className="space-y-6">
                        <FormInput 
                            label="Payload Identity"
                            placeholder="e.g. System Critical Alert v2"
                            value={templateModal.formData.name}
                            onChange={(e) => setTemplateModal(prev => ({ ...prev, formData: { ...prev.formData, name: e.target.value }}))}
                        />
                        <FormSelect 
                            label="Delivery Carrier"
                            value={templateModal.formData.channel}
                            onChange={(e) => setTemplateModal(prev => ({ ...prev, formData: { ...prev.formData, channel: e.target.value }}))}
                            options={[
                                { label: 'SMTP Email Service', value: 'Email' },
                                { label: 'SMS Gateway', value: 'SMS' },
                                { label: 'WhatsApp API', value: 'WhatsApp' },
                                { label: 'FCM Push Engine', value: 'Push' }
                            ]}
                        />
                        {templateModal.formData.channel === 'Email' && (
                            <FormInput 
                                label="Subject Vector"
                                value={templateModal.formData.subject}
                                onChange={(e) => setTemplateModal(prev => ({ ...prev, formData: { ...prev.formData, subject: e.target.value }}))}
                            />
                        )}
                        <FormInput 
                            label="Media URL (Optional)"
                            placeholder="https://..."
                            value={templateModal.formData.mediaUrl}
                            onChange={(e) => setTemplateModal(prev => ({ ...prev, formData: { ...prev.formData, mediaUrl: e.target.value }}))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Message Payload</label>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
                            <textarea 
                                className="relative w-full h-[18rem] p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white transition-all outline-none resize-none shadow-inner"
                                placeholder="Write your core message body... Use {{name}} for subscriber injection."
                                value={templateModal.formData.body}
                                onChange={(e) => setTemplateModal(prev => ({ ...prev, formData: { ...prev.formData, body: e.target.value }}))}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Mission Launch Modal */}
            <Modal
                isOpen={broadcastModal.isOpen}
                onClose={() => setBroadcastModal({ ...broadcastModal, isOpen: false })}
                title="Assemble Outreach Mission"
                icon={Send}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" onClick={() => setBroadcastModal({ ...broadcastModal, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" onClick={handleBroadcastSave} isLoading={actionLoading}>Initialize Mission</Button>
                    </div>
                }
            >
                <div className="space-y-6 py-4">
                    <FormInput 
                        label="Mission Callsign"
                        placeholder="Internal campaign identification..."
                        value={broadcastModal.formData.title}
                        onChange={(e) => setBroadcastModal(prev => ({ ...prev, formData: { ...prev.formData, title: e.target.value }}))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect 
                            label="Load Payload Template"
                            value={broadcastModal.formData.templateId}
                            onChange={(e) => {
                                const selected = templates.find(t => t._id === e.target.value);
                                setBroadcastModal(prev => ({ 
                                    ...prev, 
                                    formData: { 
                                        ...prev.formData, 
                                        templateId: e.target.value,
                                        channel: selected ? selected.channel : prev.formData.channel 
                                    } 
                                }));
                            }}
                            options={[
                                { label: 'Select protocol...', value: '' },
                                ...templates.map(t => ({ label: `[${t.channel}] ${t.name}`, value: t._id }))
                            ]}
                        />
                        <FormSelect 
                            label="Targeting Vector"
                            value={broadcastModal.formData.targetType}
                            onChange={(e) => setBroadcastModal(prev => ({ ...prev, formData: { ...prev.formData, targetType: e.target.value }}))}
                            options={[
                                { label: 'Universal Broadcast (All)', value: 'All' },
                                { label: 'Strategic Segment (Filters)', value: 'Segment' },
                                { label: 'Manual Extraction (List)', value: 'Manual' }
                            ]}
                        />
                    </div>

                    {broadcastModal.formData.targetType === 'Segment' && (
                        <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                             <FormSelect 
                                label="City Boundary"
                                value={broadcastModal.formData.segmentFilters.city}
                                onChange={(e) => setBroadcastModal(prev => ({ ...prev, formData: { ...prev.formData, segmentFilters: { ...prev.formData.segmentFilters, city: e.target.value } }}))}
                                options={[
                                    { label: 'Any Territory', value: '' },
                                    ...segmentsData.cities.map(c => ({ label: c, value: c }))
                                ]}
                            />
                            <FormSelect 
                                label="Security Clearance (Role)"
                                value={broadcastModal.formData.segmentFilters.role}
                                onChange={(e) => setBroadcastModal(prev => ({ ...prev, formData: { ...prev.formData, segmentFilters: { ...prev.formData.segmentFilters, role: e.target.value } }}))}
                                options={[
                                    { label: 'All Roles', value: '' },
                                    ...segmentsData.roles.map(r => ({ label: r, value: r }))
                                ]}
                            />
                        </div>
                    )}

                    {broadcastModal.formData.targetType === 'Manual' && (
                        <FormInput 
                            label="Target Registry (CSV)"
                            placeholder="emails or numbers separated by commas..."
                            value={broadcastModal.formData.manualTargets}
                            onChange={(e) => setBroadcastModal(prev => ({ ...prev, formData: { ...prev.formData, manualTargets: e.target.value }}))}
                        />
                    )}

                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Deployment window</p>
                                <p className="text-xs font-bold text-slate-700">Set future timestamp to schedule</p>
                            </div>
                        </div>
                        <input 
                            type="datetime-local"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold font-mono outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            value={broadcastModal.formData.scheduledAt}
                            onChange={(e) => setBroadcastModal(prev => ({ ...prev, formData: { ...prev.formData, scheduledAt: e.target.value }}))}
                        />
                    </div>
                </div>
            </Modal>

            {/* Detailed Analytics Modal */}
            <Modal
                isOpen={reportModal.isOpen}
                onClose={() => setReportModal({ ...reportModal, isOpen: false })}
                title="Mission Telemetry Report"
                icon={BarChart3}
                size="md"
            >
                {reportModal.data && (
                    <div className="space-y-8 py-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Targets</p>
                                <p className="text-2xl font-black text-slate-800">{reportModal.data.stats?.totalTargeted || 0}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Delivered</p>
                                <p className="text-2xl font-black text-emerald-600">{reportModal.data.stats?.sent || 0}</p>
                            </div>
                            <div className="bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">
                                <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Failed</p>
                                <p className="text-2xl font-black text-rose-600">{reportModal.data.stats?.failed || 0}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <p className="text-xs font-black text-slate-500 uppercase">Mission Success Rate</p>
                                <p className="text-xs font-black text-indigo-600">{(( (reportModal.data.stats?.sent || 0) / (reportModal.data.stats?.totalTargeted || 1)) * 100).toFixed(1)}%</p>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400 animate-in slide-in-from-left duration-1000 fill-mode-forwards"
                                    style={{ width: `${((reportModal.data.stats?.sent || 0) / (reportModal.data.stats?.totalTargeted || 1)) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-900 text-slate-400 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Info className="w-12 h-12" />
                            </div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Payload Summary</p>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 italic">Body Content:</p>
                                    <p className="text-xs leading-relaxed text-slate-300 mt-1 line-clamp-4">{reportModal.data.templateId?.body || 'Direct entry payload'}</p>
                                </div>
                                <div className="flex gap-8 pt-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Deployed</p>
                                        <p className="text-xs text-white font-bold mt-0.5">{reportModal.data.startedAt ? new Date(reportModal.data.startedAt).toLocaleTimeString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Duration</p>
                                        <p className="text-xs text-white font-bold mt-0.5">
                                            {reportModal.data.completedAt && reportModal.data.startedAt
                                                ? `${Math.round((new Date(reportModal.data.completedAt) - new Date(reportModal.data.startedAt)) / 1000)}s`
                                                : 'N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                subtitle="Confirmation Required"
                icon={Shield}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                        <Button 
                            variant={confirmModal.type === 'danger' ? 'danger' : 'primary'} 
                            onClick={confirmModal.onConfirm}
                        >
                            {confirmModal.actionLabel}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 font-bold leading-relaxed">{confirmModal.message}</p>
                </div>
            </Modal>
        </div>
    );
}
