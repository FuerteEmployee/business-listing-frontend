import BusinessCard from './BusinessCard';
import LeadFormSidebar from './LeadFormSidebar';
import ListingFilters from './ListingFilters';
import { Button } from '../ui/button';
import { Loader2, Mail, CheckSquare, Square, X, Wrench, Cpu, Wind, Droplet, Hammer } from 'lucide-react';
import EnquiryModal from '../ui/EnquiryModal';
import { useState, useEffect, useRef } from 'react';

export default function BusinessListing({ 
    title, 
    businesses, 
    pagination, 
    onLoadMore, 
    activeFilters, 
    onFilterChange, 
    onReset,
    isLoadingMore
}) {
    const [isBulkEnquiryOpen, setIsBulkEnquiryOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [modalBusinessIds, setModalBusinessIds] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);

    const observer = useRef();
    useEffect(() => {
        if (isLoadingMore) return;
        const options = { root: null, rootMargin: '200px', threshold: 1.0 };
        const callback = (entries) => {
            if (entries[0].isIntersecting && pagination && pagination.page < pagination.pages) {
                onLoadMore();
            }
        };
        observer.current = new IntersectionObserver(callback, options);
        const target = document.querySelector('#infinite-scroll-sentinel');
        if (target) observer.current.observe(target);
        return () => { if (observer.current) observer.current.disconnect(); };
    }, [isLoadingMore, pagination, onLoadMore]);

    const allBusinessIds = businesses.map(b => b._id);

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const openEnquiryModal = (ids) => {
        setModalBusinessIds(ids);
        setIsBulkEnquiryOpen(true);
    };

    const handleSendToAll = () => openEnquiryModal(allBusinessIds);

    const handleSendSelected = () => {
        if (selectedIds.length === 0) return;
        openEnquiryModal(selectedIds);
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds([]);
    };

    // Build a name map for the modal
    const businessNameMap = Object.fromEntries(businesses.map(b => [b._id, b.name]));

    return (
        <div className="flex flex-col">
            {/* Top Toolbar / Breadcrumbs */}
            <div className="bg-white border-b border-slate-200 py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="hover:text-orange-600 cursor-pointer transition-colors">Fuerte Developers</span>
                    <span className="text-slate-300">/</span>
                    <span className="truncate">{title}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900 font-bold tracking-tight">
                        {pagination?.total || businesses.length}+ Listings
                    </span>
                </div>
            </div>

            {/* Listing Header */}
            <div className="bg-white px-4 py-8 border-b border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Verified Collective</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Best Deals - Top <span className="text-orange-600">{title}</span>
                    </h1>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                        <p className="text-sm text-slate-500 font-medium max-w-2xl">
                            Discover the highest-rated {title.toLowerCase()} verified for quality, response time, and customer satisfaction.
                        </p>
                        {businesses.length > 0 && (
                            <div className="flex items-center gap-2 shrink-0">
                                {!isSelectMode ? (
                                    <>
                                        <button
                                            onClick={() => setIsSelectMode(true)}
                                            className="flex items-center gap-2 border border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-600 font-semibold rounded-full px-4 py-2 text-sm transition-colors"
                                        >
                                            <CheckSquare className="w-4 h-4" />
                                            Select & Enquire
                                        </button>
                                        <Button
                                            onClick={handleSendToAll}
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full px-6 flex items-center gap-2 shadow-lg shadow-orange-100"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Send to All
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500 font-medium">
                                            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Click cards to select'}
                                        </span>
                                        <button
                                            onClick={exitSelectMode}
                                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                            title="Cancel selection"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Filters */}
            <ListingFilters 
                activeFilters={activeFilters} 
                onFilterChange={onFilterChange} 
                onReset={onReset} 
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Listings Col */}
                    <div className="flex-1 space-y-6">
                        {businesses.length > 0 ? (
                            <>
                                {businesses.map((biz) => (
                                    <div key={biz._id} className="relative">
                                        {/* Checkbox overlay in select mode */}
                                        {isSelectMode && (
                                            <button
                                                onClick={() => toggleSelect(biz._id)}
                                                className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                                                    ${selectedIds.includes(biz._id)
                                                        ? 'bg-orange-600 text-white border border-orange-600'
                                                        : 'bg-white text-slate-600 border border-slate-300 hover:border-orange-400'
                                                    }`}
                                            >
                                                {selectedIds.includes(biz._id)
                                                    ? <><CheckSquare className="w-3.5 h-3.5" /> Selected</>
                                                    : <><Square className="w-3.5 h-3.5" /> Select</>
                                                }
                                            </button>
                                        )}
                                        <div className={isSelectMode ? 'transition-all' : ''}>
                                            <BusinessCard 
                                                business={biz} 
                                                onEnquiryClick={() => openEnquiryModal([biz._id])}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {pagination && pagination.page < pagination.pages && (
                                    <div className="flex justify-center pt-8 pb-12" id="infinite-scroll-sentinel">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading more amazing deals...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-20 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Loader2 className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">No results found</h3>
                                <p className="text-slate-500 mt-3 font-medium max-w-xs mx-auto">We couldn't find any listings matching your current filter configuration.</p>
                                <div className="mt-12">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Trending Discoveries</p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {['Restaurants', 'Hospitals', 'Hotels', 'Real Estate', 'Education'].map(cat => (
                                            <button 
                                                key={cat}
                                                onClick={() => onFilterChange('q', cat)}
                                                className="px-4 py-2 bg-slate-50 hover:bg-orange-500 hover:text-white rounded-full text-xs font-bold text-slate-600 transition-all border border-slate-100 hover:border-orange-500"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={onReset}
                                    className="mt-12 text-orange-600 font-black text-xs uppercase tracking-widest hover:text-orange-700 transition-colors"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Col */}
                    <div className="hidden lg:block w-[400px] flex-shrink-0">
                        <div className="sticky top-40">
                            <LeadFormSidebar title={title} />
                            <div className="mt-8 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                                <button 
                                    onClick={handleSendToAll}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm text-center shadow-lg shadow-blue-100 transition-colors block"
                                >
                                    Get Quotes
                                </button>
                                
                                <div className="mt-8 border-t border-slate-100 pt-6">
                                    <h4 className="text-slate-900 text-base font-black tracking-tight mb-5">Trending Searches</h4>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Pneumatic Hand Tools', icon: Wrench },
                                            { name: 'Industrial Automation', icon: Cpu },
                                            { name: 'Air Compressors', icon: Wind },
                                            { name: 'Fluid Power Systems', icon: Droplet },
                                            { name: 'Impact Wrenches', icon: Hammer }
                                        ].map((item) => (
                                            <button
                                                key={item.name}
                                                onClick={() => onFilterChange('q', item.name)}
                                                className="w-full flex items-center gap-3.5 text-left text-slate-700 hover:text-blue-600 group transition-all"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-semibold tracking-tight underline decoration-slate-200 group-hover:decoration-blue-600 underline-offset-4">
                                                    {item.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar — appears when businesses are selected */}
            {isSelectMode && selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 border border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-black text-sm">
                                {selectedIds.length}
                            </div>
                            <span className="font-semibold text-sm">
                                {selectedIds.length} business{selectedIds.length !== 1 ? 'es' : ''} selected
                            </span>
                        </div>
                        <div className="h-6 w-px bg-slate-700" />
                        <button
                            onClick={handleSendSelected}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Send Enquiry
                        </button>
                        <button
                            onClick={exitSelectMode}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <EnquiryModal 
                isOpen={isBulkEnquiryOpen}
                onClose={() => { setIsBulkEnquiryOpen(false); exitSelectMode(); }}
                businessIds={modalBusinessIds}
                businessNameMap={businessNameMap}
                title={modalBusinessIds.length === allBusinessIds.length
                    ? `Enquiry for All ${title}`
                    : `Enquiry for ${modalBusinessIds.length} Selected ${title}`
                }
            />
        </div>
    );
}
