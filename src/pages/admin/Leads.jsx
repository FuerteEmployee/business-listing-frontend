import { useEffect, useState } from 'react';
import { 
    Search, Building2, User, Phone, Megaphone, 
    Clock, CheckCircle2, AlertCircle, ChevronRight, 
    Filter, MoreHorizontal, Mail, Calendar, BarChart3,
    StickyNote, Send, X, Plus, Info, MessageSquare,
    ExternalLink, UserPlus, Users, PieChart, TrendingUp,
    Download, Zap, Brain, Sparkles, Target, Activity, AlertTriangle
} from 'lucide-react';
import FormSelect from '../../components/ui/FormSelect';
import Modal from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { getApiUrl, fetchWithAuth, API_BASE_URL } from '../../config/api';
import DataTable from '../../components/admin/DataTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { Spinner } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';

// ============================================================
// --- AI INTELLIGENCE HELPERS (Frontend Mirror) ---
// ============================================================

/** Mirror of backend scoring — gives instant score in the UI without waiting for API. */
const computeLeadScore = (lead) => {
    if (!lead) return 0;
    if (lead.score !== undefined) return lead.score; // Use backend score if available
    if (lead.status === 'Converted') return 100;
    if (lead.status === 'Lost' || lead.status === 'Closed') return 0;
    let score = 0;
    if (lead.priority === 'Hot') score += 30;
    else if (lead.priority === 'Warm') score += 15;
    if (lead.type === 'Luxury' || lead.type === 'Requirement') score += 20;
    if (lead.status === 'Quotation Sent') score += 18;
    else if (lead.status === 'Interested') score += 14;
    else if (lead.status === 'Contacted') score += 7;
    if (lead.notes?.length > 0) score += 10;
    if (lead.assignedTo) score += 7;
    return Math.min(100, Math.max(0, score));
};

const getScoreColor = (score) => {
    if (score >= 70) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', ring: '#10b981' };
    if (score >= 40) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', ring: '#f59e0b' };
    return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', ring: '#f43f5e' };
};

/** AI-generated contextual follow-up suggestion based on lead status */
const getFollowUpSuggestion = (lead) => {
    if (!lead) return null;
    const ageHours = (Date.now() - new Date(lead.createdAt).getTime()) / 3600000;
    
    if (lead.status === 'New' && ageHours > 24) {
        return {
            level: 'urgent',
            icon: '⚠️',
            title: 'Immediate Action Required',
            text: `This lead has been sitting uncontacted for ${Math.round(ageHours)}h. Hot leads cool within 48 hours. A quick introductory call now can increase conversion probability by 60%.`
        };
    }
    if (lead.status === 'New') {
        return {
            level: 'info',
            icon: '📞',
            title: 'First Contact Recommended',
            text: 'Make your initial contact within 4 hours of lead creation for best results. Start with a friendly WhatsApp message introducing your services.'
        };
    }
    if (lead.status === 'Contacted') {
        return {
            level: 'info',
            icon: '🔁',
            title: 'Follow-Up Cadence',
            text: 'Schedule a follow-up call within 48h. Share a relevant portfolio or case study. The goal of this interaction is to qualify their specific requirements in depth.'
        };
    }
    if (lead.status === 'Interested') {
        return {
            level: 'success',
            icon: '💡',
            title: 'Momentum — Send Quotation',
            text: `Prospect has expressed interest in ${lead.category || 'your services'}. Prepare a detailed, personalized quotation with 2-3 package options. Include a validity date to create urgency.`
        };
    }
    if (lead.status === 'Quotation Sent') {
        return {
            level: 'warning',
            icon: '⏳',
            title: 'Awaiting Decision — Nudge',
            text: 'A polite nudge 3–5 business days after sending the quotation is best practice. Consider offering a small early-commitment incentive (e.g. free onboarding or a 5% discount).'
        };
    }
    if (lead.status === 'Converted') {
        return {
            level: 'success',
            icon: '🎉',
            title: 'Closed & Won!',
            text: 'This lead has been successfully converted. Consider asking for a testimonial or referral within 2 weeks of onboarding — delighted customers are your best source of future leads.'
        };
    }
    return null;
};


export default function LeadsAdmin() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'analytics'
    const [users, setUsers] = useState([]);
    
    // Notes Modal State
    const [selectedLead, setSelectedLead] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);
    
    // Add Lead Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCreatingLead, setIsCreatingLead] = useState(false);
    const [newLeadData, setNewLeadData] = useState({
        name: '',
        phone: '',
        category: 'General',
        type: 'Requirement'
    });
    
    // Analytics State
    const [analytics, setAnalytics] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        fetchLeads();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/users?role=Merchant`);
            const data = await res.json();
            if (res.ok && data.success) {
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const handleExportCSV = () => {
        if (leads.length === 0) return;
        
        const headers = ["Date", "Name", "Phone", "Category", "Type", "Status", "Priority", "Assigned To"];
        const rows = leads.map(lead => [
            new Date(lead.createdAt).toLocaleDateString(),
            lead.name,
            lead.phone,
            lead.category,
            lead.type,
            lead.status,
            lead.priority,
            Object.is(lead.assignedToName, undefined) ? 'Unassigned' : lead.assignedToName
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Lead records exported successfully');
    };

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            const url = getApiUrl('leads');
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if (response.ok && data.success) {
                setLeads(data.leads);
            } else {
                setError(data.message || data.msg || 'Failed to fetch leads');
                toast.error(data.message || 'Failed to load leads');
            }
        } catch (err) {
            setError('Cannot connect to backend server.');
            toast.error('Network error while fetching leads');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e) => {
        if (e) e.preventDefault();
        if (!newLeadData.name || !newLeadData.phone) {
            toast.error('Please provide name and phone number');
            return;
        }

        try {
            setIsCreatingLead(true);
            const response = await fetchWithAuth(getApiUrl('leads'), {
                method: 'POST',
                body: JSON.stringify({
                    ...newLeadData,
                    source: 'Admin Dashboard'
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setIsAddModalOpen(false);
                setNewLeadData({ name: '', phone: '', category: 'General', type: 'Requirement' });
                toast.success('Lead record established successfully');
                fetchLeads(); // Refresh list
            } else {
                toast.error(data.message || 'Failed to create lead');
            }
        } catch (err) {
            console.error('Create Lead Error:', err);
            toast.error('Server error while creating lead');
        } finally {
            setIsCreatingLead(false);
        }
    };

    const [updateModal, setUpdateModal] = useState({
        isOpen: false,
        lead: null,
        field: '', // 'status', 'priority', 'assignedTo'
        value: ''
    });

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/leads/stats`);
            const data = await response.json();
            if (response.ok && data.success) {
                setAnalytics(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        if (view === 'analytics') {
            fetchStats();
        }
    }, [view]);

    const handleUpdate = async (id, field, value) => {
        try {
            setUpdatingId(id);
            const endpoint = (field === 'assignedTo' || field === 'assignedToName') ? 'assign' : 'status';
            
            // Prepare payload
            let payload = { [field]: value };
            
            // Special handling for assignment to sync name
            if (field === 'assignedTo') {
                const user = users.find(u => u._id === value);
                payload.assignedToName = user ? user.name : (value === 'Unassigned' ? 'Unassigned' : 'Unknown');
            }

            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${id}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLeads(leads.map(lead => lead._id === id ? { ...lead, ...payload } : lead));
                if (selectedLead && selectedLead._id === id) {
                    setSelectedLead({ ...selectedLead, ...payload });
                }
                toast.success(`Leads ${field} updated successfully`);
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (err) {
            console.error('Update failed:', err);
            toast.error('Network error during update');
        } finally {
            setUpdatingId(null);
            setUpdateModal({ isOpen: false, lead: null, field: '', value: '' });
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        try {
            setIsSavingNote(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${selectedLead._id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: noteText })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLeads(leads.map(lead => lead._id === selectedLead._id ? data.lead : lead));
                setSelectedLead(data.lead);
                setNoteText("");
                toast.success('Activity log entry added');
            }
        } catch (err) {
            console.error('Failed to save note:', err);
            toast.error('Error saving activity log');
        } finally {
            setIsSavingNote(false);
        }
    };

    const filteredLeads = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.category && lead.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'New').length,
        pipeline: leads.filter(l => ['Contacted', 'Interested', 'Quotation Sent'].includes(l.status)).length,
        conversions: leads.filter(l => ['Converted', 'Closed'].includes(l.status)).length
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Converted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Lost': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Hot': return 'bg-rose-600 text-white shadow-md shadow-rose-100';
            case 'Warm': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cold': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const openNotes = (lead) => {
        setSelectedLead(lead);
        setIsNotesOpen(true);
    };

    const columns = [
        {
            key: 'name',
            label: 'Prospect',
            sortable: true,
            render: (name, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-sm flex-shrink-0">
                        <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center text-indigo-700 font-black text-base">
                            {name.charAt(0)}
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 text-sm">{name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                                {row.phone}
                            </div>
                            <a 
                                href={`https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors"
                            >
                                <MessageSquare className="w-3.5 h-3.5 fill-emerald-50" />
                            </a>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'priority',
            label: 'Priority',
            sortable: true,
            render: (priority) => (
                <Badge 
                    className={`${getPriorityColor(priority || 'Warm')} font-black uppercase tracking-widest text-[9px] px-2.5 py-1 shadow-none`}
                >
                    {priority || 'Warm'}
                </Badge>
            )
        },
        {
            key: 'assignedToName',
            label: 'Assignment',
            sortable: true,
            render: (name) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {name ? name.charAt(0) : '?'}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{name || 'Unassigned'}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status) => (
                <Badge 
                    className={`${getStatusColor(status)} font-black uppercase tracking-widest text-[9px] px-2.5 py-1 border rounded-xl shadow-none`}
                >
                    {status}
                </Badge>
            )
        },
        {
            key: 'score',
            label: '🧠 AI Score',
            sortable: true,
            render: (_, row) => {
                const score = computeLeadScore(row);
                const { bg, text, border, ring } = getScoreColor(score);
                const circumference = 2 * Math.PI * 14;
                const offset = circumference - (score / 100) * circumference;
                return (
                    <div className="flex items-center gap-2.5">
                        <svg width="38" height="38" viewBox="0 0 38 38">
                            <circle cx="19" cy="19" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                            <circle
                                cx="19" cy="19" r="14" fill="none"
                                stroke={ring} strokeWidth="4"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform="rotate(-90 19 19)"
                            />
                        </svg>
                        <div>
                            <div className={`text-sm font-black ${text}`}>{score}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">/{100}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'followUpDate',
            label: 'Next Follow-up',
            sortable: true,
            render: (date) => (
                <div className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    {date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No reminder'}
                </div>
            )
        }
    ];

    const actions = [
        {
            label: 'View History',
            icon: StickyNote,
            onClick: (row) => openNotes(row)
        },
        {
            label: 'Update Status',
            icon: CheckCircle2,
            onClick: (row) => setUpdateModal({ isOpen: true, lead: row, field: 'status', value: row.status })
        },
        {
            label: 'Manage Priority',
            icon: AlertCircle,
            onClick: (row) => setUpdateModal({ isOpen: true, lead: row, field: 'priority', value: row.priority || 'Warm' })
        },
        {
            label: 'Assign Merchant',
            icon: UserPlus,
            onClick: (row) => setUpdateModal({ isOpen: true, lead: row, field: 'assignedTo', value: row.assignedTo || 'Unassigned' })
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <AdminHeader 
                title="Lead Intelligence"
                subtitle="Track prospects and optimize business conversion."
                actions={
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setView('list')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            List View
                        </button>
                        <button 
                            onClick={() => setView('analytics')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${view === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Analytics
                        </button>
                    </div>
                }
            />

            {view === 'list' ? (
                <>
                    {/* Filter Hub */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, category or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-400 transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-auto">
                            <button 
                                onClick={fetchLeads}
                                className={`p-3 rounded-2xl border border-slate-100 transition-all ${loading ? 'bg-slate-100 text-indigo-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                                title="Refresh"
                                disabled={loading}
                            >
                                <Zap className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                            </button>
                            <div className="h-10 w-px bg-slate-100 mx-2"></div>
                            <Button 
                                variant="primary" 
                                leftIcon={Plus} 
                                onClick={() => setIsAddModalOpen(true)}
                                className="shadow-lg shadow-indigo-100"
                            >
                                Add Lead
                            </Button>
                        </div>
                    </div>

                    {/* Main Data View */}
                    <DataTable 
                        data={filteredLeads}
                        columns={columns}
                        actions={actions}
                        isLoading={loading}
                        emptyMessage="Awaiting fresh incoming leads..."
                        actionMode="dropdown"
                        itemsPerPage={10}
                    />
                </>
            ) : (
                /* Analytics View */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

                    {/* --- AI INSIGHTS PANEL --- */}
                    {analytics && (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/20 pointer-events-none" />
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                    <Brain className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">AI Intelligence Digest</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Auto-generated insights from your pipeline data</p>
                                </div>
                                <div className="ml-auto px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                                {/* Stale Hot Leads Warning */}
                                {analytics.staleHotLeads > 0 && (
                                    <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                        <span className="text-xl shrink-0 mt-0.5">🔴</span>
                                        <div>
                                            <p className="text-sm font-bold text-rose-300">Stale Hot Leads</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{analytics.staleHotLeads} Hot lead{analytics.staleHotLeads > 1 ? 's have' : ' has'} not been contacted in over 48 hours. Immediate outreach needed to prevent churn.</p>
                                        </div>
                                    </div>
                                )}
                                {/* Follow-ups Today */}
                                {analytics.followUpsDueToday > 0 && (
                                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <span className="text-xl shrink-0 mt-0.5">⏰</span>
                                        <div>
                                            <p className="text-sm font-bold text-amber-300">{analytics.followUpsDueToday} Follow-up{analytics.followUpsDueToday > 1 ? 's' : ''} Today</p>
                                            <p className="text-xs text-slate-400 mt-0.5">You have scheduled reminders due today. Check the list view and make contact before end of day.</p>
                                        </div>
                                    </div>
                                )}
                                {/* Conversion Rate Insight */}
                                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <span className="text-xl shrink-0 mt-0.5">📈</span>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-300">Pipeline Conversion Rate</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Your overall conversion rate is <span className="font-bold text-white">{analytics.conversionRate}%</span>. {analytics.conversionRate < 20 ? 'Industry avg is ~25%. Focus on nurturing Interested leads.' : 'Great performance — keep up the follow-up cadence.'}</p>
                                    </div>
                                </div>
                                {/* Best Source */}
                                {analytics.sourcePerformance?.[0] && (
                                    <div className="flex items-start gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <span className="text-xl shrink-0 mt-0.5">⚡</span>
                                        <div>
                                            <p className="text-sm font-bold text-indigo-300">Best Performing Source</p>
                                            <p className="text-xs text-slate-400 mt-0.5"><span className="font-bold text-white">{analytics.sourcePerformance[0]._id}</span> has the highest conversion rate ({Math.round(analytics.sourcePerformance[0].conversionRate * 100)}%). Consider allocating more budget here.</p>
                                        </div>
                                    </div>
                                )}
                                {/* Response Time */}
                                {analytics.avgResponseTime && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl">
                                        <span className="text-xl shrink-0 mt-0.5">⏱️</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-300">Avg. Response Time</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Your team responds to leads in <span className="font-bold text-white">{analytics.avgResponseTime} minutes</span> on average. {analytics.avgResponseTime < 60 ? '✅ Excellent — under 1 hour is optimal.' : '⚠️ Try to get below 60 minutes for better conversion.'}</p>
                                        </div>
                                    </div>
                                )}
                                {/* No issues */}
                                {analytics.staleHotLeads === 0 && analytics.followUpsDueToday === 0 && (
                                    <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <span className="text-xl shrink-0 mt-0.5">✅</span>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-300">Pipeline is Healthy</p>
                                            <p className="text-xs text-slate-400 mt-0.5">No stale hot leads. No overdue follow-ups. Your team is on top of the pipeline!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Summary Cards */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-6">Pipeline Health Matrix</h4>
                                <div className="space-y-5">
                                    {analytics?.statusDistribution?.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center text-[10px] font-black mb-2 uppercase tracking-wider">
                                                <span className="text-slate-600">{item._id}</span>
                                                <span className="text-indigo-600">{item.count}</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-md"
                                                    style={{ width: `${Math.max(2, (item.count / (analytics?.total || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Conversion Gauge */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 self-start">Conversion Gauge</h4>
                                <div className="relative flex items-center justify-center">
                                    {(() => {
                                        const r = 52;
                                        const circumference = 2 * Math.PI * r;
                                        const rate = analytics?.conversionRate || 0;
                                        const offset = circumference - (rate / 100) * circumference;
                                        const color = rate >= 30 ? '#10b981' : rate >= 15 ? '#f59e0b' : '#f43f5e';
                                        return (
                                            <svg width="140" height="140" viewBox="0 0 140 140">
                                                <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                                                <circle
                                                    cx="70" cy="70" r={r} fill="none"
                                                    stroke={color} strokeWidth="14"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    transform="rotate(-90 70 70)"
                                                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 1, 0.5, 1)' }}
                                                />
                                                <text x="70" y="65" textAnchor="middle" className="text-slate-900" style={{ fill: color, fontSize: '22px', fontWeight: '900' }}>{rate}%</text>
                                                <text x="70" y="84" textAnchor="middle" style={{ fill: '#94a3b8', fontSize: '10px', fontWeight: '700' }}>CONVERSION</text>
                                            </svg>
                                        );
                                    })()}
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-slate-500 font-medium">
                                        {(analytics?.conversionRate || 0) >= 25 ? '✅ Above industry avg (25%)' : `📉 ${25 - (analytics?.conversionRate || 0)}% below industry avg`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Priority Distribution */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-6">Priority Distribution</h4>
                            <div className="flex-1 flex items-end justify-between px-2 pb-2">
                                {analytics?.priorityDistribution?.map((item, i) => {
                                    const isHot = item._id === 'Hot';
                                    const isWarm = item._id === 'Warm';
                                    const barColor = isHot ? 'bg-gradient-to-t from-rose-500 to-rose-400 shadow-rose-200' : isWarm ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-amber-200' : 'bg-gradient-to-t from-slate-400 to-slate-400 shadow-slate-200';
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-3 w-16 group h-full justify-end">
                                            <span className="text-sm font-black text-slate-700">{item.count}</span>
                                            <div className="w-full h-full min-h-[120px] flex items-end justify-center bg-slate-50 rounded-t-2xl border-t border-x border-slate-100 p-1 relative overflow-hidden">
                                                <div 
                                                    className={`w-full rounded-t-xl transition-all duration-1000 shadow-lg ${barColor}`}
                                                    style={{ height: `${Math.max(8, (item.count / (analytics?.total || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item._id}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Categories */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl text-white relative overflow-hidden flex flex-col lg:col-span-3">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap className="w-32 h-32" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-8 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-indigo-400" />
                                Top Demand Sectors
                            </h4>
                            <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-center">
                                {analytics?.topCategories?.map((cat, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="text-2xl font-black text-slate-700 group-hover:text-indigo-400 transition-colors">0{i+1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm font-bold tracking-tight text-slate-200">{cat._id || 'General'}</span>
                                                <span className="text-[10px] font-black text-indigo-400 uppercase">{cat.count} Units</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                    style={{ width: `${Math.max(2, (cat.count / (analytics?.total || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Merchant Leaderboard */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 border border-slate-100"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Merchant Champions</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Global Ranking by performance metric score</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm shadow-amber-100">
                                <TrendingUp className="w-7 h-7 text-amber-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                            {analytics?.topPerformers?.map((merchant, i) => (
                                <div key={i} className="relative p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-sm">Rank #{i+1}</div>
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 mb-4">
                                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-indigo-600 text-lg">
                                            {merchant.name.charAt(0)}
                                        </div>
                                    </div>
                                    <h4 className="font-semibold text-slate-800 text-sm truncate w-full tracking-tight">{merchant.name}</h4>
                                    <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Index</span>
                                        <span className="text-sm font-bold text-slate-900">{merchant.performanceScore}</span>
                                    </div>
                                    <div className="mt-4 w-full grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-white rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase">Leads</p>
                                            <p className="text-sm font-bold text-slate-800">{merchant.leadStats?.totalAssigned || 0}</p>
                                        </div>
                                        <div className="p-2 bg-white rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase">Latency</p>
                                            <p className="text-sm font-bold text-slate-800">{merchant.leadStats?.avgResponseTime || 0}m</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Side Drawer */}
            <Modal
                isOpen={isNotesOpen}
                onClose={() => setIsNotesOpen(false)}
                title="Intelligence Log"
                subtitle={`Operational activity history for prospect: ${selectedLead?.name}`}
                icon={StickyNote}
                size="lg"
                footer={
                    <div className="w-full">
                        <form onSubmit={handleAddNote} className="relative">
                            <textarea 
                                placeholder="Log precise interaction details for audit trail..."
                                rows="2"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-14 resize-none"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            ></textarea>
                            <button 
                                type="submit"
                                disabled={!noteText.trim() || isSavingNote}
                                className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all active:scale-95 shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                }
            >
                {/* AI Follow-Up Suggestion */}
                {selectedLead && (() => {
                    const suggestion = getFollowUpSuggestion(selectedLead);
                    if (!suggestion) return null;
                    const styles = {
                        urgent: { bg: 'bg-rose-50', border: 'border-rose-200', title: 'text-rose-700', text: 'text-rose-600', icon_bg: 'bg-rose-100' },
                        warning: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-700', text: 'text-amber-600', icon_bg: 'bg-amber-100' },
                        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-700', text: 'text-emerald-600', icon_bg: 'bg-emerald-100' },
                        info: { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-700', text: 'text-indigo-600', icon_bg: 'bg-indigo-100' },
                    };
                    const s = styles[suggestion.level] || styles.info;
                    return (
                        <div className={`mb-5 p-4 ${s.bg} border ${s.border} rounded-xl`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 ${s.icon_bg} rounded-lg shrink-0 mt-0.5`}>
                                    <Sparkles className={`w-3.5 h-3.5 ${s.title}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Suggestion</span>
                                    </div>
                                    <p className={`text-xs font-bold ${s.title} mb-1`}>{suggestion.icon} {suggestion.title}</p>
                                    <p className={`text-xs ${s.text} leading-relaxed`}>{suggestion.text}</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="space-y-8 max-h-[50vh] overflow-y-auto px-1 pr-4 custom-scrollbar">
                    {/* Lead Created Event */}
                    <div className="relative pl-12">
                        <div className="absolute left-0 top-0 w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm z-10">
                            <Plus className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute left-4 top-4 bottom-[-32px] w-[2px] bg-slate-100"></div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Initial Sync</span>
                                <span className="text-xs text-slate-400">
                                    {selectedLead && new Date(selectedLead.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">Requirement Assigned</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Prospect established interest for "{selectedLead?.category}" portfolio via {selectedLead?.source} interface.
                            </p>
                        </div>
                    </div>

                    {/* User Notes */}
                    {selectedLead?.notes?.map((note, i) => (
                        <div key={i} className="relative pl-12 mt-8">
                            <div className="absolute left-0 top-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm z-10 text-white font-bold text-sm uppercase">
                                {note.addedBy?.charAt(0) || 'A'}
                            </div>
                            <div className={`absolute left-4 top-4 bottom-[-32px] w-[2px] bg-slate-100 ${i === selectedLead.notes.length - 1 ? 'hidden' : ''}`}></div>
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-indigo-600">{note.addedBy || 'System User'}</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(note.date).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {note.text}
                                </p>
                            </div>
                        </div>
                    ))}

                    {!selectedLead?.notes?.length && (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-8">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                <MessageSquare className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">No activity logged yet</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add Lead Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => !isCreatingLead && setIsAddModalOpen(false)}
                title="Add New Lead"
                subtitle="Create a new prospect record in the system"
                icon={UserPlus}
                size="md"
                footer={
                    <div className="flex items-center gap-3 w-full justify-end">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAddModalOpen(false)}
                            disabled={isCreatingLead}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={handleCreateLead} 
                            isLoading={isCreatingLead}
                        >
                            Save Lead
                        </Button>
                    </div>
                }
            >
                <form id="add-lead-form" onSubmit={handleCreateLead} className="space-y-6">
                    <div className="grid grid-cols-1 gap-5">
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Lead Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text" 
                                    required
                                    value={newLeadData.name}
                                    onChange={(e) => setNewLeadData({...newLeadData, name: e.target.value})}
                                    placeholder="e.g. Alexander Pierce"
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="tel" 
                                        required
                                        value={newLeadData.phone}
                                        onChange={(e) => setNewLeadData({...newLeadData, phone: e.target.value})}
                                        placeholder="Mobile / VoIP Number"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Category (Optional)</label>
                                <div className="relative">
                                    <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={newLeadData.category}
                                        onChange={(e) => setNewLeadData({...newLeadData, category: e.target.value})}
                                        placeholder="e.g. Hotels"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Quick Update Modal */}
            <Modal
                isOpen={updateModal.isOpen}
                onClose={() => setUpdateModal({ ...updateModal, isOpen: false })}
                title={`Update ${updateModal.field === 'assignedTo' ? 'Assignment' : updateModal.field.charAt(0).toUpperCase() + updateModal.field.slice(1)}`}
                subtitle={`Modify record for ${updateModal.lead?.name}`}
                icon={Info}
                size="sm"
                footer={
                    <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setUpdateModal({ ...updateModal, isOpen: false })}>Cancel</Button>
                        <Button 
                            variant="primary" 
                            className="flex-1"
                            onClick={() => handleUpdate(updateModal.lead?._id, updateModal.field, updateModal.value)}
                            isLoading={updatingId === updateModal.lead?._id}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <div className="py-2">
                    {updateModal.field === 'status' && (
                        <FormSelect 
                            label="New Status"
                            value={updateModal.value}
                            onChange={(e) => setUpdateModal({ ...updateModal, value: e.target.value })}
                            options={['New', 'Contacted', 'Interested', 'Quotation Sent', 'Converted', 'Closed', 'Lost'].map(s => ({ value: s, label: s }))}
                        />
                    )}
                    {updateModal.field === 'priority' && (
                        <FormSelect 
                            label="Set Priority"
                            value={updateModal.value}
                            onChange={(e) => setUpdateModal({ ...updateModal, value: e.target.value })}
                            options={[
                                { value: 'Hot', label: '🔥 Hot' },
                                { value: 'Warm', label: '⚡ Warm' },
                                { value: 'Cold', label: '❄️ Cold' }
                            ]}
                        />
                    )}
                    {updateModal.field === 'assignedTo' && (
                        <FormSelect 
                            label="Assign Merchant"
                            value={updateModal.value}
                            onChange={(e) => setUpdateModal({ ...updateModal, value: e.target.value })}
                            options={[
                                { value: 'Unassigned', label: 'Unassigned' },
                                ...users.map(u => ({ value: u._id, label: u.name }))
                            ]}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
