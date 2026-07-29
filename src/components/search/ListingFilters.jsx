import { ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';

export default function ListingFilters({ activeFilters, onFilterChange, onReset }) {
    const [openDropdown, setOpenDropdown] = useState(null);

    const filterGroups = [
        { 
            key: 'sort', 
            label: 'Sort by', 
            options: [
                { label: 'Relevance', value: 'rank' },
                { label: 'Top Rated', value: 'rating' },
                { label: 'Most Reviews', value: 'reviews' },
                { label: 'Latest', value: 'latest' },
                { label: 'Nearest', value: 'distance' }
            ] 
        },
        { 
            key: 'rating', 
            label: 'Rating', 
            options: [
                { label: '4.5+ Stars', value: '4.5' },
                { label: '4.0+ Stars', value: '4' },
                { label: '3.5+ Stars', value: '3.5' },
                { label: 'Any Rating', value: '' }
            ] 
        },
        { 
            key: 'priceRange', 
            label: 'Price', 
            options: [
                { label: 'Budget ($)', value: '$' },
                { label: 'Mid-range ($$)', value: '$$' },
                { label: 'Luxury ($$$)', value: '$$$' },
                { label: 'Ultra ($$$$)', value: '$$$$' }
            ] 
        },
        {
            key: 'openNow',
            label: 'Availability',
            options: [
                { label: 'Open Now', value: 'true' },
                { label: 'All', value: '' }
            ]
        }
    ];

    return (
        <div className="bg-white border-b border-slate-200 sticky top-[72px] z-30 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 overflow-x-auto no-scrollbar">
                {filterGroups.map((group) => (
                    <div key={group.key} className="relative flex-shrink-0">
                        <button
                            onClick={() => setOpenDropdown(openDropdown === group.key ? null : group.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                                activeFilters[group.key] && activeFilters[group.key] !== '' && group.key !== 'sort'
                                    ? 'bg-orange-50 border-orange-200 text-orange-700' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {group.label}
                            {activeFilters[group.key] && group.key !== 'sort' && activeFilters[group.key] !== '' && (
                                <span className="ml-1 px-1 bg-orange-200 rounded text-[10px]">1</span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openDropdown === group.key ? 'rotate-180' : ''}`} />
                        </button>

                        {openDropdown === group.key && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                    {group.options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                onFilterChange(group.key, opt.value);
                                                setOpenDropdown(null);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                activeFilters[group.key] === opt.value
                                                    ? 'bg-orange-50 text-orange-700'
                                                    : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
                
                {Object.values(activeFilters).some(v => v !== '' && v !== 'rank') && (
                    <button 
                        onClick={onReset}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-rose-500 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                )}

                <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors ml-auto group">
                    <Filter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Filters
                </button>
            </div>
        </div>
    );
}
