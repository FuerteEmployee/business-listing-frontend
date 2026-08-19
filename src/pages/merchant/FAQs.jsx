import { useState, useEffect } from "react";
import { HelpCircle, Search, ChevronDown, ChevronUp, Loader2, BookOpen } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function MerchantFAQs() {
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("business");
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedFaqId, setExpandedFaqId] = useState(null);
    const [error, setError] = useState(null);

    const categories = [
        { key: "business", label: "Business Management" },
        { key: "billing", label: "Billing & Plans" },
        { key: "general", label: "General Help" },
        { key: "technical", label: "Technical Guides" }
    ];

    useEffect(() => {
        const fetchCategoryFaqs = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`${API_BASE_URL}/cms/faqs/public/${activeCategory}`);
                if (res.ok) {
                    const data = await res.json();
                    setFaqs(data.faqs || []);
                } else {
                    setError("Failed to fetch FAQs for this category.");
                }
            } catch (err) {
                setError("Error loading FAQs.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategoryFaqs();
    }, [activeCategory]);

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const toggleFaq = (id) => {
        setExpandedFaqId(prev => (prev === id ? null : id));
    };

    return (
        <div className="space-y-8 p-4 md:p-10 bg-slate-50/30 min-h-screen pb-32">
            {/* Header Banner */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-10 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-md shadow-indigo-100">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">Owner Help Center</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Frequently Asked Questions</h1>
                        <p className="text-slate-400 font-medium text-sm md:text-base max-w-2xl">
                            Search our repository of quick tutorials, billing protocols, and brand customization guides built to scale your business profile.
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Tabs & Search Bar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => { setActiveCategory(cat.key); setSearchTerm(""); setExpandedFaqId(null); }}
                            className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex-shrink-0 border ${
                                activeCategory === cat.key
                                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 active:scale-95"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search answers..." 
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* FAQ List */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium text-sm">Querying platform intelligence database...</p>
                </div>
            ) : error ? (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-200">
                    <HelpCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to load FAQs</h3>
                    <p className="text-slate-400 font-medium italic max-w-sm mx-auto">{error}</p>
                </div>
            ) : filteredFaqs.length > 0 ? (
                <div className="space-y-4">
                    {filteredFaqs.map((faq) => {
                        const isExpanded = expandedFaqId === faq._id;
                        return (
                            <div 
                                key={faq._id}
                                className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                                    isExpanded 
                                    ? "border-indigo-200 shadow-lg shadow-indigo-500/5" 
                                    : "border-slate-200 hover:border-indigo-100 hover:shadow-md"
                                }`}
                            >
                                <button 
                                    onClick={() => toggleFaq(faq._id)}
                                    className="w-full p-6 md:p-8 flex items-center justify-between text-left gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                            isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"
                                        }`}>
                                            <HelpCircle className="w-4.5 h-4.5" />
                                        </div>
                                        <span className="text-slate-900 font-bold text-sm md:text-base leading-snug">
                                            {faq.question}
                                        </span>
                                    </div>
                                    <div className="text-slate-400 flex-shrink-0">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </button>
                                
                                {isExpanded && (
                                    <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-slate-50 pt-4 animate-in fade-in duration-300">
                                        <div 
                                            className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed space-y-4"
                                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border-4 border-white shadow-inner">
                        <HelpCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Records Found</h3>
                    <p className="text-slate-400 font-medium italic max-w-sm mx-auto">
                        We couldn't find any FAQs matching your query. Try adjusting your search term or tab.
                    </p>
                </div>
            )}
        </div>
    );
}
