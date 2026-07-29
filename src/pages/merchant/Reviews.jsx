import { useState, useEffect } from "react";
import { Star, MessageSquare, CheckCircle, Search, Filter, Loader2, User, Send, X, Clock, AlertTriangle } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function MerchantReviews() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        responseRate: 0,
        repliedCount: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [error, setError] = useState(null);
    
    // Reply Modal State
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // Flag Modal State
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
    const [flagReason, setFlagReason] = useState("Fake");
    const [flagDescription, setFlagDescription] = useState("");
    const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [reviewsRes, statsRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/reviews/merchant/all`),
                fetchWithAuth(`${API_BASE_URL}/reviews/merchant/stats`)
            ]);

            if (reviewsRes.ok) {
                setReviews(await reviewsRes.json());
            }
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            setIsSubmittingReply(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews/${selectedReview._id}/reply`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: replyText })
            });

            if (res.ok) {
                const updatedReview = await res.json();
                setReviews(prev => prev.map(r => r._id === selectedReview._id ? updatedReview : r));
                setIsReplyModalOpen(false);
                setReplyText("");
                setSelectedReview(null);
                // Refresh stats to update response rate
                const statsRes = await fetchWithAuth(`${API_BASE_URL}/reviews/merchant/stats`);
                if (statsRes.ok) setStats(await statsRes.json());
            } else {
                alert("Failed to submit reply");
            }
        } catch (err) {
            alert("Error submitting reply");
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleFlagSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmittingFlag(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews/${selectedReview._id}/flag`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: flagReason, description: flagDescription })
            });

            if (res.ok) {
                setIsFlagModalOpen(false);
                setFlagDescription("");
                alert("Review has been flagged for admin investigation.");
            } else {
                alert("Failed to flag review");
            }
        } catch (err) {
            alert("Error flagging review");
        } finally {
            setIsSubmittingFlag(false);
        }
    };

    const openReplyModal = (review) => {
        setSelectedReview(review);
        setReplyText(review.ownerReply?.text || "");
        setIsReplyModalOpen(true);
    };

    const openFlagModal = (review) => {
        setSelectedReview(review);
        setIsFlagModalOpen(true);
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = r.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || 
                             (filterStatus === "responded" && r.ownerReply?.text) ||
                             (filterStatus === "pending" && !r.ownerReply?.text);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 p-4 md:p-10 bg-slate-50/30 min-h-screen pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                            <Star className="w-8 h-8 text-white fill-white" />
                        </div>
                        Review Management
                    </h1>
                    <p className="text-slate-500 font-medium mt-3 max-w-xl">
                        Engage with your customers, monitor brand reputation, and escalate suspicious feedback to our moderation team.
                    </p>
                </div>
            </div>

            {/* Analytics Dashboard Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Overall Rating */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
                    <div className="relative z-10">
                        <span className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{stats.averageRating}</span>
                        <div className="flex items-center justify-center gap-1 mt-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`w-6 h-6 ${i <= Math.round(stats.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                            ))}
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-6">Based on {stats.totalReviews} total reviews</p>
                    </div>
                </div>

                {/* Middle: Star Breakdown */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Rating Distribution</h3>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.ratingDistribution[star] || 0;
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-700 w-4">{star}</span>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Response Rate */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mb-24 -mr-24"></div>
                    <div>
                        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Response Rate</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{stats.responseRate}%</span>
                            <span className="text-indigo-400 text-xs font-bold">Excellent</span>
                        </div>
                    </div>
                    <div className="space-y-4 mt-8">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200">
                            <span>{stats.repliedCount} Responded</span>
                            <span>{stats.totalReviews - stats.repliedCount} Pending</span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-400 rounded-full" 
                                style={{ width: `${stats.responseRate}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-indigo-300 font-medium italic">Responding to customers within 24h improves your listing visibility x2.</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center pr-8">
                <div className="relative w-full sm:w-96">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by customer name or comment..."
                        className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'pending', label: 'Unreplied' },
                            { id: 'responded', label: 'Responded' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 gap-8">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <span className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</span>
                    </div>
                ) : filteredReviews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8">
                        {filteredReviews.map((r) => (
                            <div key={r._id} className="bg-white overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Content Area */}
                                    <div className="flex-1 p-8 md:p-10 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 border border-slate-100 font-black text-2xl shadow-inner uppercase">
                                                    {r.userId?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-black text-slate-900">{r.userId?.name}</span>
                                                        {!r.ownerReply?.text && (
                                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-full border border-rose-100 animate-pulse">Pending Reply</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3" /> {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-amber-50/50 px-4 py-2 rounded-2xl border border-amber-100/50">
                                                <span className="text-sm font-black text-amber-600 mr-2">{r.rating}.0</span>
                                                {[1,2,3,4,5].map(i => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <MessageSquare className="w-24 h-24 text-indigo-50 absolute -top-10 -left-10 rotate-12 opacity-50" />
                                            <p className="relative z-10 text-slate-700 text-base font-semibold leading-relaxed pl-4 border-l-4 border-indigo-100">
                                                "{r.comment}"
                                            </p>
                                        </div>

                                        {/* Reply Section */}
                                        {r.ownerReply?.text ? (
                                            <div className="mt-8 p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 relative group/reply">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Your Public Response</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => openReplyModal(r)}
                                                        className="text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] transition-colors invisible group-hover/reply:visible"
                                                    >
                                                        Edit Reply
                                                    </button>
                                                </div>
                                                <p className="text-slate-700 text-sm font-bold leading-relaxed">
                                                    {r.ownerReply.text}
                                                </p>
                                                <div className="text-[9px] text-slate-400 font-bold mt-4 uppercase tracking-widest flex items-center gap-2">
                                                   <Clock className="w-2.5 h-2.5" /> Replied on {new Date(r.ownerReply.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50">
                                                <button 
                                                    onClick={() => openReplyModal(r)}
                                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:shadow-xl hover:shadow-indigo-100 active:scale-95"
                                                >
                                                    <Send className="w-4 h-4" /> Respond to Customer
                                                </button>
                                                <button 
                                                    onClick={() => openFlagModal(r)}
                                                    className="px-8 py-4 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                                >
                                                    Flag as Fake
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Sidebar Info (Optional metadata if needed) */}
                                    <div className="w-full lg:w-72 bg-slate-50/50 border-l border-slate-100 p-8 flex flex-col justify-between border-t lg:border-t-0">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Review Status</label>
                                                <p className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-3">{r.status}</p>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Business</label>
                                                <p className="text-xs font-black text-slate-900 border-l-2 border-slate-200 pl-3 truncate">{r.businessId?.name}</p>
                                            </div>
                                        </div>
                                        <div className="pt-8">
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Engagement</label>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${r.ownerReply ? 'bg-emerald-400' : 'bg-slate-200'} rounded-full`} style={{ width: r.ownerReply ? '100%' : '0%' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-50 group">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-200 transition-all duration-500 border-4 border-white shadow-inner">
                            <MessageSquare className="w-16 h-16" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">No Reviews Found</h2>
                        <p className="text-slate-400 font-medium italic max-w-sm mx-auto">We couldn't find any reviews matching your current filters. Try adjusting your search criteria.</p>
                        <button onClick={() => {setSearchTerm(""); setFilterStatus("all")}} className="mt-8 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Clear All Filters</button>
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            {isReplyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsReplyModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Respond to Customer</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Responding as Business Owner
                                </p>
                            </div>
                            <button onClick={() => setIsReplyModalOpen(false)} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleReplySubmit} className="p-10 space-y-8">
                            <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 italic text-slate-600 text-[15px] font-medium leading-relaxed">
                                "{selectedReview?.comment}"
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-2">
                                    Your Professional Message
                                    <span className={`px-2 py-0.5 rounded-md ${replyText.length > 450 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50'}`}>{replyText.length} / 500</span>
                                </label>
                                <textarea 
                                    required
                                    maxLength={500}
                                    placeholder="Thank the customer for their feedback and share any updates..."
                                    rows="6"
                                    className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] text-[15px] font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsReplyModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 transition-colors">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSubmittingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Publish Response</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Flag Modal */}
            {isFlagModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsFlagModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-10 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-rose-900 tracking-tight flex items-center gap-3">
                                    <AlertTriangle className="w-7 h-7" /> Flag Content
                                </h3>
                                <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-2">Escalate suspicious feedback to admin</p>
                            </div>
                            <button onClick={() => setIsFlagModalOpen(false)} className="p-4 hover:bg-rose-100 rounded-2xl text-rose-400 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleFlagSubmit} className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Reason for Reporting</label>
                                <select 
                                    className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-rose-500/10"
                                    value={flagReason}
                                    onChange={(e) => setFlagReason(e.target.value)}
                                >
                                    <option value="Fake">Fake Review</option>
                                    <option value="Spam">Spam / Advertising</option>
                                    <option value="Offensive">Offensive Language</option>
                                    <option value="Conflict">Conflict of Interest</option>
                                    <option value="Other">Other Issues</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Technical Description</label>
                                <textarea 
                                    required
                                    placeholder="Explain why this review should be removed (e.g. 'This user was never a customer...')"
                                    rows="4"
                                    className="w-full p-6 bg-slate-50 border-none rounded-3xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-rose-500/10 transition-all resize-none shadow-inner"
                                    value={flagDescription}
                                    onChange={(e) => setFlagDescription(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingFlag}
                                    className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-rose-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSubmittingFlag ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Escalation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

