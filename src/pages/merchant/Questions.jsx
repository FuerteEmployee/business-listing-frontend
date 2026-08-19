import { useState, useEffect } from "react";
import { MessageSquare, Search, Loader2, Send, X, Clock, HelpCircle, CheckCircle } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

export default function MerchantQuestions() {
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [error, setError] = useState(null);

    // Answer Modal State
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [answerText, setAnswerText] = useState("");
    const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/questions/merchant`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data || []);
            } else {
                setError("Failed to fetch questions.");
            }
        } catch (err) {
            setError("Error loading questions.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        if (!answerText.trim()) return;

        try {
            setIsSubmittingAnswer(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/questions/${selectedQuestion._id}/answer`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answerText })
            });

            if (res.ok) {
                const updated = await res.json();
                setQuestions(prev => prev.map(q => q._id === selectedQuestion._id ? { ...q, answerText: updated.answerText, isAnswered: true, answeredAt: updated.answeredAt } : q));
                setIsAnswerModalOpen(false);
                setAnswerText("");
                setSelectedQuestion(null);
            } else {
                alert("Failed to submit answer.");
            }
        } catch (err) {
            alert("Error submitting answer.");
        } finally {
            setIsSubmittingAnswer(false);
        }
    };

    const openAnswerModal = (q) => {
        setSelectedQuestion(q);
        setAnswerText(q.answerText || "");
        setIsAnswerModalOpen(true);
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             q.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || 
                             (filterStatus === "answered" && q.isAnswered) ||
                             (filterStatus === "unanswered" && !q.isAnswered);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 p-4 md:p-10 bg-slate-50/30 min-h-screen pb-32">
            {/* Header Banner */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-10 relative overflow-hidden shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-md shadow-indigo-100">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">Customer Care</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Customer Q&A Portal</h1>
                        <p className="text-slate-400 font-medium text-sm md:text-base max-w-2xl">
                            Answer user queries regarding home delivery, schedules, or specifications to assist potential customers on your business page.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button 
                        onClick={() => setFilterStatus("all")}
                        className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                            filterStatus === "all"
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 active:scale-95"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        All Questions ({questions.length})
                    </button>
                    <button 
                        onClick={() => setFilterStatus("unanswered")}
                        className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                            filterStatus === "unanswered"
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 active:scale-95"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        Pending Answer ({questions.filter(q => !q.isAnswered).length})
                    </button>
                    <button 
                        onClick={() => setFilterStatus("answered")}
                        className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                            filterStatus === "answered"
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 active:scale-95"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        Answered ({questions.filter(q => q.isAnswered).length})
                    </button>
                </div>

                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search questions or names..." 
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Questions Grid */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium text-sm">Querying customer portal databases...</p>
                </div>
            ) : error ? (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-200">
                    <HelpCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Portal</h3>
                    <p className="text-slate-400 font-medium italic max-w-sm mx-auto">{error}</p>
                </div>
            ) : filteredQuestions.length > 0 ? (
                <div className="grid grid-cols-1 gap-8">
                    {filteredQuestions.map((q) => (
                        <div key={q._id} className="bg-white overflow-hidden rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                            <div className="flex flex-col lg:flex-row">
                                <div className="flex-1 p-8 md:p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 border border-slate-100 font-black text-2xl shadow-inner uppercase">
                                                {q.userId?.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black text-slate-900">{q.userId?.name || "Anonymous"}</span>
                                                    {!q.isAnswered && (
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-full border border-rose-100 animate-pulse">Pending Answer</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                                    <Clock className="w-3.5 h-3.5" /> Asked on {new Date(q.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <p className="relative z-10 text-slate-700 text-base font-semibold leading-relaxed pl-4 border-l-4 border-indigo-100">
                                            "{q.questionText}"
                                        </p>
                                    </div>

                                    {/* Answer Section */}
                                    {q.isAnswered ? (
                                        <div className="mt-8 p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 relative group/reply">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Your Public Answer</span>
                                                </div>
                                                <button 
                                                    onClick={() => openAnswerModal(q)}
                                                    className="text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] transition-colors invisible group-hover/reply:visible"
                                                >
                                                    Edit Answer
                                                </button>
                                            </div>
                                            <p className="text-slate-700 text-sm font-bold leading-relaxed">
                                                {q.answerText}
                                            </p>
                                            <div className="text-[9px] text-slate-400 font-bold mt-4 uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="w-2.5 h-2.5" /> Answered on {new Date(q.answeredAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50">
                                            <button 
                                                onClick={() => openAnswerModal(q)}
                                                className="flex-1 flex items-center justify-center gap-3 py-4 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:shadow-xl hover:shadow-indigo-50 active:scale-95"
                                            >
                                                <Send className="w-4 h-4" /> Answer Customer Question
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full lg:w-72 bg-slate-50/50 border-l border-slate-100 p-8 flex flex-col justify-between border-t lg:border-t-0">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Q&A Status</label>
                                            <p className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-3">
                                                {q.isAnswered ? "Answered" : "Unanswered"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Business</label>
                                            <p className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-3">
                                                {q.businessId?.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-50">
                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                        <MessageSquare className="w-16 h-16" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-3">No Questions Found</h2>
                    <p className="text-slate-400 font-medium italic max-w-sm mx-auto">We couldn't find any questions matching your current criteria.</p>
                </div>
            )}

            {/* Answer Modal */}
            {isAnswerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsAnswerModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Answer Customer Question</h3>
                            </div>
                            <button onClick={() => setIsAnswerModalOpen(false)} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleAnswerSubmit} className="p-10 space-y-8">
                            <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 italic text-slate-600 text-[15px] font-medium leading-relaxed">
                                <div>"{selectedQuestion?.questionText}"</div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Your Answer</label>
                                <textarea 
                                    required
                                    placeholder="Type your response here..." 
                                    rows="6" 
                                    className="w-full p-6 bg-slate-50 border-none rounded-3xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all resize-none shadow-inner"
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAnswerModalOpen(false)}
                                    className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingAnswer}
                                    className="flex-1 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSubmittingAnswer ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Answer <Send className="w-3.5 h-3.5" /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
