import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import { 
    ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, 
    MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2,
    Send, Plus, Trash2, Star, TrendingUp, User, Edit2, X
} from 'lucide-react';
import FormSelect from '../../components/ui/FormSelect';

export default function LeadDetail() {
    const { leadId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [noteText, setNoteText] = useState("");
    const [editingNote, setEditingNote] = useState(null);

    useEffect(() => {
        fetchLeadDetail();
    }, [leadId]);

    const fetchLeadDetail = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}`);
            if (res.ok) {
                const data = await res.json();
                setLead(data.lead);
            } else {
                setError("Failed to load lead details");
            }
        } catch (err) {
            console.error('Error fetching lead:', err);
            setError("Error loading lead");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setActionLoading('status');
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const data = await res.json();
                setLead(data.lead);
            }
        } catch (err) {
            console.error("Error updating status:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handlePriorityUpdate = async (newPriority) => {
        try {
            setActionLoading('priority');
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority })
            });
            if (res.ok) {
                const data = await res.json();
                setLead(data.lead);
            }
        } catch (err) {
            console.error("Error updating priority:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            setActionLoading('reply');
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merchantReply: replyText })
            });
            if (res.ok) {
                const data = await res.json();
                setLead(data.lead);
                setReplyText("");
            }
        } catch (err) {
            console.error("Error saving reply:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        try {
            setActionLoading('note');
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: noteText })
            });
            if (res.ok) {
                const data = await res.json();
                setLead(data.lead);
                setNoteText("");
            }
        } catch (err) {
            console.error("Error adding note:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Delete this note?")) return;
        try {
            setActionLoading(`note-${noteId}`);
            const res = await fetchWithAuth(`${API_BASE_URL}/leads/${leadId}/notes/${noteId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchLeadDetail();
            }
        } catch (err) {
            console.error("Error deleting note:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Interested': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Quotation Sent': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Converted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Closed': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'Lost': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
                <button onClick={() => navigate('/merchant/leads')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-8">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Leads
                </button>
                <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold">{error || "Lead not found"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate('/merchant/leads')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Leads
                </button>
                
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">{lead.name}</h1>
                            <div className="flex items-center gap-4 mt-3">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusColor(lead.status)}`}>
                                    {lead.status || 'New'}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                    lead.priority === 'Hot' ? 'bg-rose-500 text-white' :
                                    lead.priority === 'Warm' ? 'bg-amber-500 text-white' :
                                    'bg-slate-400 text-white'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${lead.priority === 'Hot' ? 'bg-white animate-pulse' : 'bg-current opacity-50'}`}></div>
                                    {lead.priority || 'Cold'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a href={`tel:${lead.phone}`} className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                                <Phone className="w-5 h-5" />
                            </a>
                            <a href={`mailto:${lead.email}`} className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Lead Info & Conversation */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Lead Information */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 mb-6">Lead Information</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone</p>
                                <p className="text-slate-900 font-bold mt-2">{lead.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Email</p>
                                <p className="text-slate-900 font-bold mt-2">{lead.email || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Building2 className="w-3 h-3" /> Category
                                </p>
                                <p className="text-slate-900 font-bold mt-2">{lead.category}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Date
                                </p>
                                <p className="text-slate-900 font-bold mt-2">{new Date(lead.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {lead.message && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Original Message</p>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <p className="text-slate-700 text-sm leading-relaxed italic">"{lead.message}"</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reply Section */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            Your Response
                        </h2>

                        {lead.merchantReply?.text ? (
                            <div className="bg-indigo-50 border border-indigo-200 border-l-4 border-l-indigo-600 rounded-2xl p-6 mb-6">
                                <p className="text-indigo-900 font-medium leading-relaxed">{lead.merchantReply.text}</p>
                                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-3">
                                    Replied: {new Date(lead.merchantReply.respondedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ) : null}

                        <form onSubmit={handleSaveReply} className="space-y-4">
                            <textarea
                                placeholder={lead.merchantReply?.text ? "Update your response..." : "Send a response to this lead..."}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows="4"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={actionLoading === 'reply' || !replyText.trim()}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading === 'reply' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Response
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            Internal Notes ({lead.notes?.length || 0})
                        </h2>

                        <form onSubmit={handleAddNote} className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex gap-3">
                                <textarea
                                    placeholder="Add a progress note..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    rows="2"
                                    className="flex-1 p-3 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'note' || !noteText.trim()}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </form>

                        {lead.notes && lead.notes.length > 0 ? (
                            <div className="space-y-3">
                                {lead.notes.map((note, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{note.addedBy}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(note.date).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed">{note.text}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteNote(note._id)}
                                                disabled={actionLoading === `note-${note._id}`}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 text-red-500 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-8 text-slate-400 text-sm font-medium italic">No notes yet. Add progress updates above.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Quick Actions */}
                <div className="space-y-6">
                    {/* Status Management */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Lead Status</h3>
                        <FormSelect
                            value={lead.status}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            options={['New', 'Contacted', 'Interested', 'Quotation Sent', 'Converted', 'Closed', 'Lost'].map(s => ({ value: s, label: s }))}
                            disabled={actionLoading === 'status'}
                            className="w-full"
                            triggerClassName={`!py-2.5 !rounded-xl !border-none !text-sm !font-bold !shadow-sm transition-opacity ${getStatusColor(lead.status)}`}
                        />
                    </div>

                    {/* Priority Management */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Priority Level</h3>
                        <div className="space-y-2">
                            {['Hot', 'Warm', 'Cold'].map((priority) => (
                                <button
                                    key={priority}
                                    onClick={() => handlePriorityUpdate(priority)}
                                    disabled={actionLoading === 'priority'}
                                    className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                                        lead.priority === priority
                                            ? priority === 'Hot' ? 'bg-rose-500 text-white' :
                                              priority === 'Warm' ? 'bg-amber-500 text-white' :
                                              'bg-slate-400 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {priority === 'Hot' && '🔥'} {priority}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Activity</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Received</span>
                                <span className="font-bold text-slate-900">{new Date(lead.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Auto-Follow Up</span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Set
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">Response Time</span>
                                <span className="font-bold text-slate-900">
                                    {lead.merchantReply ? '✓ Replied' : '⏱ Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
