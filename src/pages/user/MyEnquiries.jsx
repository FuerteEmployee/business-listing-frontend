import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import Header from '../../components/homepage/Header';
import Footer from '../../components/homepage/Footer';
import { MessageSquare, Clock, Phone, CheckCircle, CheckCircle2, AlertCircle, ChevronRight, Loader2, Send, MoreVertical, Trash2, XCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyEnquiries() {
    const { user } = useAuth();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);

    const fetchMyEnquiries = async () => {
        try {
            setLoading(true);
            const [enquiriesRes, leadsRes] = await Promise.all([
                fetchWithAuth(getApiUrl('enquiries/my-enquiries')),
                fetchWithAuth(getApiUrl('leads/my-leads'))
            ]);

            let combined = [];
            
            if (enquiriesRes.ok) {
                const data = await enquiriesRes.json();
                if (data.enquiries) combined = [...combined, ...data.enquiries];
            }
            
            if (leadsRes.ok) {
                const data = await leadsRes.json();
                if (data.leads) {
                    const mappedLeads = data.leads.map(lead => ({
                        _id: lead._id,
                        isLead: true, // internal flag
                        message: lead.message || `Looking for ${lead.type || ''} ${lead.category || 'Service'}.`,
                        status: lead.status === 'New' ? 'Sent' : lead.status, // Map 'New' to 'Sent' so it matches
                        businessIds: lead.business ? [lead.business] : [],
                        assignedToName: lead.assignedToName,
                        createdAt: lead.createdAt,
                        responses: lead.merchantReply ? [{
                            businessId: lead.business,
                            message: lead.merchantReply.text,
                            respondedAt: lead.merchantReply.date
                        }] : []
                    }));
                    combined = [...combined, ...mappedLeads];
                }
            }
            
            // Sort combined by descending createdAt
            combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            setEnquiries(combined);
            setError(null);
        } catch (err) {
            console.error('Error fetching enquiries/leads:', err);
            setError("Error loading requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchMyEnquiries();
    }, [user?._id]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = () => setOpenMenu(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const handleDelete = async (enquiryId) => {
        if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
        try {
            setActionLoading(enquiryId);
            const res = await fetchWithAuth(getApiUrl(`enquiries/${enquiryId}`), { method: 'DELETE' });
            if (res.ok) await fetchMyEnquiries();
        } catch (err) {
            console.error("Error deleting enquiry:", err);
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const handleResolve = async (enquiryId) => {
        try {
            setActionLoading(enquiryId);
            const res = await fetchWithAuth(getApiUrl(`enquiries/${enquiryId}/resolve`), { method: 'PUT' });
            if (res.ok) {
                setEnquiries(prev =>
                    prev.map(e => e._id === enquiryId ? { ...e, status: 'Resolved', resolvedAt: new Date().toISOString() } : e)
                );
            }
        } catch (err) {
            console.error("Error resolving enquiry:", err);
        } finally {
            setActionLoading(null);
            setOpenMenu(null);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Responded':
                return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Responded' };
            case 'Resolved':
                return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Resolved' };
            case 'Viewed':
                return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Eye className="w-3 h-3" />, label: 'Viewed' };
            case 'Closed':
            case 'Lost':
                return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <XCircle className="w-3 h-3" />, label: status };
            case 'Contacted':
                return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Phone className="w-3 h-3" />, label: 'Contacted' };
            case 'Interested':
                return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Interested' };
            case 'Quotation Sent':
                return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <MessageSquare className="w-3 h-3" />, label: 'Quoted' };
            case 'Converted':
                return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Converted' };
            case 'Sent':
            default:
                return { color: 'bg-orange-50 text-orange-600 border-orange-200', icon: <Send className="w-3 h-3" />, label: status || 'Sent' };
        }
    };

    const canResolve = (status) => !['Resolved', 'Closed'].includes(status);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Enquiries</h1>
                        <p className="text-slate-500 font-medium">Track your requests and merchant responses</p>
                    </div>
                    <Link to="/search" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                        Send New Enquiry
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : enquiries.length > 0 ? (
                    <div className="grid gap-6">
                        {enquiries.map((enquiry) => {
                            const statusCfg = getStatusConfig(enquiry.status);
                            return (
                                <div key={enquiry._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4 flex-1">
                                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    <Send className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{enquiry.message}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            {new Date(enquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        {enquiry.responses?.length > 0 && (
                                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                                                • {enquiry.responses.length} Response{enquiry.responses.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Status Badge */}
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusCfg.color}`}>
                                                    {statusCfg.icon}
                                                    {statusCfg.label}
                                                </span>

                                                {/* Actions Menu */}
                                                {!enquiry.isLead && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === enquiry._id ? null : enquiry._id); }}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                                        </button>
                                                        {openMenu === enquiry._id && (
                                                            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                                {canResolve(enquiry.status) && (
                                                                    <button
                                                                        onClick={() => handleResolve(enquiry._id)}
                                                                        disabled={actionLoading === enquiry._id}
                                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-slate-100 disabled:opacity-50"
                                                                    >
                                                                        {actionLoading === enquiry._id
                                                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                            : <CheckCircle className="w-3 h-3" />
                                                                        }
                                                                        Mark as Resolved
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(enquiry._id)}
                                                                    disabled={actionLoading === enquiry._id}
                                                                    className="w-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    Delete Enquiry
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Message Preview */}
                                        <div className="bg-slate-50 p-4 rounded-xl mb-4">
                                            <p className="text-slate-700 text-sm leading-relaxed">{enquiry.message}</p>
                                        </div>

                                        {/* Businesses Sent To */}
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sent to</p>
                                            <div className="flex flex-wrap gap-2">
                                                {enquiry.businessIds?.map(bus => (
                                                    <Link
                                                        key={bus._id}
                                                        to={`/business/${bus.slug}`}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                                    >
                                                        <span className="text-sm font-medium text-slate-700 hover:text-indigo-600">{bus.name}</span>
                                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Merchant Responses */}
                                        {enquiry.responses && enquiry.responses.length > 0 && (
                                            <div className="border-t border-slate-100 pt-4">
                                                <button
                                                    onClick={() => setExpandedId(expandedId === enquiry._id ? null : enquiry._id)}
                                                    className="w-full text-left"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                            <span className="text-sm font-semibold text-emerald-700">
                                                                {enquiry.responses.length} Response{enquiry.responses.length !== 1 ? 's' : ''} from Merchants
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-500">{expandedId === enquiry._id ? 'Collapse ▲' : 'View replies ▼'}</span>
                                                    </div>
                                                </button>

                                                {expandedId === enquiry._id && (
                                                    <div className="space-y-3 mt-2">
                                                        {enquiry.responses.map((response, idx) => (
                                                            <div key={idx} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 border-l-4 border-l-emerald-500">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-emerald-900">
                                                                            {/* Fix: use populated businessId.name, not businessName */}
                                                                            {response.businessId?.name || 'Business'}
                                                                        </p>
                                                                        <p className="text-xs text-emerald-700 mt-0.5">
                                                                            Replied: {new Date(response.respondedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-emerald-900 text-sm leading-relaxed">{response.message}</p>
                                                                {response.contact && (
                                                                    <div className="mt-3 pt-3 border-t border-emerald-100 flex gap-4">
                                                                        {response.contact.phone && (
                                                                            <a href={`tel:${response.contact.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-tighter">
                                                                                <Phone className="w-3.5 h-3.5" /> Call Now
                                                                            </a>
                                                                        )}
                                                                        {response.contact.email && (
                                                                            <a href={`mailto:${response.contact.email}`} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-tighter">
                                                                                <MessageSquare className="w-3.5 h-3.5" /> Email
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Resolved info */}
                                        {enquiry.status === 'Resolved' && enquiry.resolvedAt && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 font-medium">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Marked resolved on {new Date(enquiry.resolvedAt).toLocaleDateString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">No Enquiries Yet</h2>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Get the best deals by sending enquiries to local businesses!</p>
                        <Link to="/search" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                            Find Businesses
                        </Link>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
