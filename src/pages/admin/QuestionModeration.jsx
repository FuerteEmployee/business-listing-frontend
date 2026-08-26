import { useState, useEffect } from "react";
import { MessageSquare, Search, Loader2, Send, Trash2, X, HelpCircle, CheckCircle, Clock } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

export default function QuestionModeration() {
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

    const fetchAllQuestions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/questions/admin`);
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
        fetchAllQuestions();
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question? This action is permanent.")) return;

        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/questions/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setQuestions(prev => prev.filter(q => q._id !== id));
            } else {
                alert("Failed to delete question.");
            }
        } catch (err) {
            alert("Error deleting question.");
        }
    };

    const openAnswerModal = (q) => {
        setSelectedQuestion(q);
        setAnswerText(q.answerText || "");
        setIsAnswerModalOpen(true);
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             q.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             q.businessId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || 
                             (filterStatus === "answered" && q.isAnswered) ||
                             (filterStatus === "unanswered" && !q.isAnswered);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-850">Q&A Moderation</h1>
                    <p className="text-slate-400 text-sm mt-1">Monitor, answer, and moderate all customer questions across listings.</p>
                </div>
            </div>

            {/* Dashboard stats overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase text-slate-400">Total Questions</span>
                        <h3 className="text-3xl font-black text-slate-900">{questions.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase text-slate-400">Pending Answer</span>
                        <h3 className="text-3xl font-black text-rose-600">{questions.filter(q => !q.isAnswered).length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase text-slate-400">Answered Questions</span>
                        <h3 className="text-3xl font-black text-emerald-600">{questions.filter(q => q.isAnswered).length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 w-full md:w-auto">
                    <button 
                        onClick={() => setFilterStatus("all")}
                        className={`flex-1 sm:flex-initial px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border text-center tab-button-compact ${
                            filterStatus === "all"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilterStatus("unanswered")}
                        className={`flex-1 sm:flex-initial px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border text-center tab-button-compact ${
                            filterStatus === "unanswered"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        Pending ({questions.filter(q => !q.isAnswered).length})
                    </button>
                    <button 
                        onClick={() => setFilterStatus("answered")}
                        className={`flex-1 sm:flex-initial px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border text-center tab-button-compact ${
                            filterStatus === "answered"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        Answered ({questions.filter(q => q.isAnswered).length})
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <input 
                        type="text" 
                        placeholder="Search target listings/users..." 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 transition-all shadow-inner outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Questions Table */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium text-sm">Querying customer portal databases...</p>
                </div>
            ) : error ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-slate-200">
                    <HelpCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Portal</h3>
                    <p className="text-slate-400 font-medium italic max-w-sm mx-auto">{error}</p>
                </div>
            ) : filteredQuestions.length > 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    <th className="py-5 px-6">User</th>
                                    <th className="py-5 px-6">Listing</th>
                                    <th className="py-5 px-6 w-96">Question</th>
                                    <th className="py-5 px-6">Status</th>
                                    <th className="py-5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredQuestions.map((q) => (
                                    <tr key={q._id} className="hover:bg-slate-50/50 transition-colors text-xs">
                                        <td className="py-5 px-6">
                                            <div className="font-bold text-slate-900">{q.userId?.name || "Anonymous"}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{q.userId?.email || "No Email"}</div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="font-bold text-slate-900">{q.businessId?.name || "Deleted Business"}</div>
                                            {q.businessId?.slug && (
                                                <a href={`/business/${q.businessId?.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">
                                                    View Page
                                                </a>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="text-slate-700 font-semibold leading-relaxed line-clamp-2">
                                                "{q.questionText}"
                                            </div>
                                            {q.isAnswered && (
                                                <div className="mt-2 text-[10px] bg-slate-100 text-slate-600 font-semibold p-2 rounded-lg line-clamp-1 border border-slate-200">
                                                    <strong>Ans:</strong> {q.answerText}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            {q.isAnswered ? (
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 font-bold rounded-lg border border-emerald-100 text-[10px] uppercase">
                                                    Answered
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg border border-rose-100 text-[10px] uppercase">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openAnswerModal(q)}
                                                    className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 font-bold uppercase rounded-lg text-[9px] tracking-wider transition-all"
                                                >
                                                    {q.isAnswered ? "Edit Ans" : "Answer"}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(q._id)}
                                                    className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <MessageSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Questions Found</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">We couldn't find any questions matching your filters.</p>
                </div>
            )}

            {/* Answer Modal */}
            {isAnswerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsAnswerModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Admin Q&A Override</h3>
                            <button onClick={() => setIsAnswerModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAnswerSubmit} className="p-8 space-y-6">
                            <div className="p-6 bg-slate-50 rounded-2xl italic text-slate-600 text-xs font-semibold leading-relaxed border border-slate-100">
                                <div>"{selectedQuestion?.questionText}"</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Write Response</label>
                                <textarea 
                                    required
                                    placeholder="Type answer representing this company..." 
                                    rows="5" 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all resize-none shadow-sm"
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAnswerModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingAnswer}
                                    className="flex-1 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmittingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Post Answer <Send className="w-3 h-3" /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
