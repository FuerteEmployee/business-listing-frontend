import { useEffect, useState } from 'react';
import { 
    Search, Building2, User, Phone, Megaphone, 
    Clock, CheckCircle2, AlertCircle, ChevronRight, 
    Filter, MoreHorizontal, Mail, Calendar, BarChart3,
    StickyNote, Send, X, Plus, Info, MessageSquare,
    ExternalLink, UserPlus, Users, PieChart, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FormSelect from '../../components/ui/FormSelect';
import { getApiUrl, fetchWithAuth, API_BASE_URL } from '../../config/api';

export default function MerchantLeads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    
    // Notes Modal State
    const [selectedLead, setSelectedLead] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [merchantReplyText, setMerchantReplyText] = useState("");
    const [isSavingReply, setIsSavingReply] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            // Brand-scoped endpoint - filters by the merchant's own business server-side.
            const url = getApiUrl('merchant/leads');
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if (response.ok && data.success) {
                setLeads(data.leads);
            } else {
                setError(data.message || data.msg || 'Failed to fetch your leads');
            }
        } catch (err) {
            setError('Cannot connect to backend server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, field, value) => {
        try {
            setUpdatingId(id);
            const res = await fetchWithAuth(`${API_BASE_URL}/merchant/leads/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLeads(leads.map(lead => lead._id === id ? { ...lead, [field]: value } : lead));
                if (selectedLead && selectedLead._id === id) {
                    setSelectedLead({ ...selectedLead, [field]: value });
                }
            }
        } catch (err) {
            console.error('Update failed:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        try {
            setIsSavingNote(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/merchant/leads/${selectedLead._id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: noteText })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLeads(leads.map(lead => lead._id === selectedLead._id ? data.lead : lead));
                setSelectedLead(data.lead);
                setNoteText("");
            }
        } catch (err) {
            console.error('Failed to save note:', err);
        } finally {
            setIsSavingNote(false);
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Hot': return 'bg-rose-500 text-white shadow-sm shadow-rose-200';
            case 'Warm': return 'bg-amber-500 text-white shadow-sm shadow-amber-200';
            case 'Cold': return 'bg-slate-400 text-white';
            default: return 'bg-slate-400 text-white';
        }
    };

    const openNotes = (lead) => {
        setSelectedLead(lead);
        setMerchantReplyText(lead.merchantReply?.text || "");
        setIsNotesOpen(true);
    };

    const handleSaveMerchantReply = async (e) => {
        e.preventDefault();
        try {
            setIsSavingReply(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/merchant/leads/${selectedLead._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merchantReply: merchantReplyText })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLeads(leads.map(lead => lead._id === selectedLead._id ? data.lead : lead));
                setSelectedLead(data.lead);
                alert("Response sent to customer!");
            }
        } catch (err) {
            console.error('Reply failed:', err);
        } finally {
            setIsSavingReply(false);
        }
    };

    const filteredLeads = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.category && lead.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 relative min-h-screen pb-20 p-4 md:p-8 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        My Business Leads
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">
                        Respond quickly to increase your conversion score.
                    </p>
                </div>
            </div>

            {/* Merchant Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Pending Response', value: leads.filter(l => l.status === 'New').length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Pipeline', value: leads.filter(l => ['Contacted', 'Interested', 'Quotation Sent'].includes(l.status)).length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Won Deals', value: leads.filter(l => l.status === 'Converted').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Merchant Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter your leads..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Customer</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Interest</th>
                                <th className="px-8 py-6">Priority</th>
                                <th className="px-8 py-6 text-right">Connect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                                        Fetching secure leads...
                                    </td>
                                </tr>
                            ) : filteredLeads.map((lead) => (
                                <tr 
                                    key={lead._id} 
                                    onClick={() => {
                                        const selection = window.getSelection();
                                        if (selection && selection.toString().length > 0) {
                                            return;
                                        }
                                        window.location.href = `/brand/lead/${lead._id}`;
                                    }}
                                    className="transition-all group cursor-pointer hover:bg-indigo-50 border-b border-slate-50 relative focus-within:z-[60] hover:z-[60]"
                                >
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-slate-800">{lead.name}</div>
                                        <div className="text-xs text-slate-400 font-medium mt-1">{lead.phone}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <FormSelect 
                                            value={lead.status}
                                            onChange={(e) => handleUpdate(lead._id, 'status', e.target.value)}
                                            options={['New', 'Contacted', 'Interested', 'Quotation Sent', 'Converted', 'Closed', 'Lost'].map(s => ({ value: s, label: s }))}
                                            className="!w-40"
                                            triggerClassName={`!py-2 !rounded-xl !border-none !text-[10px] !font-black !shadow-sm !hover:opacity-90 transition-opacity ${getStatusColor(lead.status)}`}
                                        />
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="font-bold text-slate-600 text-xs">{lead.category}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-black">{lead.type}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`w-3 h-3 rounded-full ${lead.priority === 'Hot' ? 'bg-rose-500 shadow-lg shadow-rose-200' : lead.priority === 'Warm' ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3">
                                            <a 
                                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer" 
                                                className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-90"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </a>
                                            <button 
                                                onClick={() => openNotes(lead)}
                                                className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                                            >
                                                <StickyNote className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes Side Drawer (Reused from Admin for consistency) */}
            {isNotesOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsNotesOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Deal Notes</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Lead: {selectedLead?.name}</p>
                            </div>
                            <button onClick={() => setIsNotesOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Merchant Response Section */}
                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[32px]">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Send className="w-3 h-3" /> Response to Customer
                                </h4>
                                <form onSubmit={handleSaveMerchantReply} className="space-y-3">
                                    <textarea 
                                        placeholder="Type your response here..."
                                        rows="3"
                                        className="w-full p-4 bg-white border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                        value={merchantReplyText}
                                        onChange={(e) => setMerchantReplyText(e.target.value)}
                                    ></textarea>
                                    <button 
                                        type="submit" 
                                        disabled={isSavingReply}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                                    >
                                        {isSavingReply ? 'Sending...' : 'Update Response'}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <StickyNote className="w-3 h-3" /> Internal Notes
                                </h4>
                                {selectedLead?.notes?.length > 0 ? selectedLead.notes.map((note, i) => (
                                    <div key={i} className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase">{note.addedBy}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{new Date(note.date).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{note.text}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <p className="text-xs text-slate-400 font-medium italic">No internal notes yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-100 bg-white">
                            <form onSubmit={handleAddNote} className="relative">
                                <textarea 
                                    placeholder="Add progress note..."
                                    rows="3"
                                    className="w-full p-5 bg-slate-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                ></textarea>
                                <button type="submit" className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 active:scale-90"><Send className="w-5 h-5" /></button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
