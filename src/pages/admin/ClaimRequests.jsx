import { useState, useEffect } from 'react';
import { fetchWithAuth, getApiUrl } from '../../config/api';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, Info, Loader2, Search, Building2, User, Mail, Phone, Briefcase, MessageSquare } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { FormTextarea } from '../../components/ui/FormTextarea';
import AdminHeader from '../../components/admin/AdminHeader';

export default function ClaimRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [commentModal, setCommentModal] = useState({ isOpen: false, id: null, status: null, comment: '' });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(getApiUrl('claims'));
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
            }
        } catch (err) {
            console.error('Error fetching claim requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        const { id, status, comment } = commentModal;
        if (!id || !status) return;

        try {
            setProcessingId(id);
            const res = await fetchWithAuth(`${getApiUrl('claims')}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminComment: comment })
            });

            if (res.ok) {
                setRequests(requests.map(req => req._id === id ? { ...req, status, adminComment: comment } : req));
                setCommentModal({ isOpen: false, id: null, status: null, comment: '' });
            } else {
                const data = await res.json();
                console.error(data.msg || 'Update failed');
            }
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(req => 
        req.companyId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.businessEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium italic">Loading claim requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Claim Requests"
                subtitle="Review and manage business ownership claims"
                actions={
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by business or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6">
                {filteredRequests.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No claim requests found.</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={request._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                                {/* Left side: Business & User info */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                                            <Building2 className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{request.companyId?.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span>ID: {request.companyId?._id?.substring(0, 8)}...</span>
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider">Business</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requester</p>
                                                <p className="text-sm font-semibold text-slate-700">{request.fullName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</p>
                                                <p className="text-sm font-semibold text-slate-700">{request.position}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Email</p>
                                                <p className="text-sm font-semibold text-slate-700">{request.businessEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                                <p className="text-sm font-semibold text-slate-700">{request.phoneNumber}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {request.message && (
                                        <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-400">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Requester Message</p>
                                            <p className="text-sm text-slate-600 italic">"{request.message}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right side: Status & Actions */}
                                <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Status</p>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight italic ${
                                                request.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                request.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                                {request.status === 'Pending' ? <Clock className="w-3.5 h-3.5" /> :
                                                 request.status === 'Accepted' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                 <XCircle className="w-3.5 h-3.5" />}
                                                {request.status}
                                            </span>
                                        </div>

                                        {request.adminComment && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Comment</p>
                                                <p className="text-xs text-slate-500 italic">"{request.adminComment}"</p>
                                            </div>
                                        )}

                                        <div className="text-[10px] text-slate-400">
                                            Submitted on: {new Date(request.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    {request.status === 'Pending' && (
                                        <div className="flex gap-2 mt-8">
                                            <button 
                                                onClick={() => setCommentModal({ isOpen: true, id: request._id, status: 'Rejected', comment: '' })}
                                                disabled={!!processingId}
                                                className="flex-1 px-4 py-2.5 bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-100 transition-colors border border-rose-100 flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                            <button 
                                                onClick={() => setCommentModal({ isOpen: true, id: request._id, status: 'Accepted', comment: '' })}
                                                disabled={!!processingId}
                                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                            >
                                                {processingId === request._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                Accept
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Status Update Modal */}
            <Modal
                isOpen={commentModal.isOpen}
                onClose={() => setCommentModal({ isOpen: false, id: null, status: null, comment: '' })}
                title="Protocol Verification"
                subtitle={`Finalizing ${commentModal.status} procedure`}
                icon={commentModal.status === 'Accepted' ? ShieldCheck : ShieldAlert}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setCommentModal({ isOpen: false, id: null, status: null, comment: '' })}>Abort</Button>
                        <Button 
                            variant={commentModal.status === 'Accepted' ? 'primary' : 'danger'} 
                            onClick={handleStatusUpdate}
                            disabled={!!processingId}
                        >
                            {processingId ? 'Processing...' : `Confirm ${commentModal.status}`}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 font-medium">
                        Please provide any administrative notes or reasoning for this decision. This will be visible to the business owner.
                    </p>
                    <FormTextarea
                        label="Internal Strategy & Comments"
                        placeholder="Why is this claim being processed?"
                        value={commentModal.comment}
                        onChange={(e) => setCommentModal({ ...commentModal, comment: e.target.value })}
                        rows={4}
                    />
                </div>
            </Modal>
        </div>
    );
}
