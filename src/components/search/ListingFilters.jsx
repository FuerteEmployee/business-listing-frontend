import { ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';

export default function ListingFilters({ activeFilters, onFilterChange, onReset }) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isFiltersDropdownOpen, setIsFiltersDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    const filterGroups = [
        { 
            key: 'sort', 
            label: 'Sort by', 
            options: [
                { label: 'Featured', value: 'rank' },
                { label: 'Price: Low to High', value: 'price_asc' },
                { label: 'Price: High to Low', value: 'price_desc' },
                { label: 'Avg. Customer Review', value: 'rating' },
                { label: 'Newest Arrivals', value: 'latest' },
                { label: 'Best Sellers', value: 'reviews' }
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
                { label: 'Budget (₹)', value: '$' },
                { label: 'Mid-range (₹₹)', value: '$$' },
                { label: 'Luxury (₹₹₹)', value: '$$$' },
                { label: 'Ultra (₹₹₹₹)', value: '$$$$' }
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
        <div className="bg-white border-b border-slate-200 sticky top-[72px] z-30 py-3 flex flex-col gap-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 overflow-x-auto no-scrollbar w-full">
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
                                <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                    {group.options.map((opt) => {
                                        const isSelected = activeFilters[group.key] === opt.value || 
                                                           (group.key === 'sort' && !activeFilters.sort && opt.value === 'rank');
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    onFilterChange(group.key, opt.value);
                                                    setOpenDropdown(null);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-all border-l-4 ${
                                                    isSelected
                                                        ? 'bg-blue-50/70 border-blue-600 text-blue-700 font-bold'
                                                        : 'border-transparent hover:bg-slate-50 text-slate-700 font-medium'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
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

                <div className="relative ml-auto">
                    <button 
                        onClick={() => setIsFiltersDropdownOpen(prev => !prev)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                            isFiltersDropdownOpen 
                                ? 'bg-slate-900 border-slate-900 text-white' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <Filter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Filters
                    </button>
                    
                    {isFiltersDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsFiltersDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-4">
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Sort Results</h3>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setIsSortDropdownOpen(prev => !prev)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none flex items-center justify-between transition-all cursor-pointer hover:bg-slate-100/50"
                                        >
                                            <span>
                                                {
                                                    {
                                                        rank: 'Featured',
                                                        price_asc: 'Price: Low to High',
                                                        price_desc: 'Price: High to Low',
                                                        rating: 'Avg. Customer Review',
                                                        latest: 'Newest Arrivals',
                                                        reviews: 'Best Sellers'
                                                    }[activeFilters.sort || 'rank']
                                                }
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isSortDropdownOpen && (
                                            <div className="absolute left-0 right-0 mt-1 bg-[#2c2c2e] border border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5">
                                                {[
                                                    { label: 'Featured', value: 'rank' },
                                                    { label: 'Price: Low to High', value: 'price_asc' },
                                                    { label: 'Price: High to Low', value: 'price_desc' },
                                                    { label: 'Avg. Customer Review', value: 'rating' },
                                                    { label: 'Newest Arrivals', value: 'latest' },
                                                    { label: 'Best Sellers', value: 'reviews' }
                                                ].map((opt) => {
                                                    const isSelected = activeFilters.sort === opt.value || (!activeFilters.sort && opt.value === 'rank');
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                onFilterChange('sort', opt.value);
                                                                setIsSortDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-all flex items-center gap-2 ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white font-semibold'
                                                                    : 'text-slate-200 hover:bg-white/10 font-medium'
                                                            }`}
                                                        >
                                                            <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">
                                                                {isSelected ? '✓' : ''}
                                                            </span>
                                                            <span>{opt.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Availability</h3>
                                    <button
                                        onClick={() => onFilterChange('openNow', activeFilters.openNow === 'true' ? '' : 'true')}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-between ${
                                            activeFilters.openNow === 'true'
                                                ? 'bg-blue-50/70 border-blue-500 text-blue-700 font-bold'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>Open Now Only</span>
                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${activeFilters.openNow === 'true' ? 'bg-blue-600 flex justify-end' : 'bg-slate-200 flex justify-start'}`}>
                                            <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </button>
                                </div>

                                <div className="flex gap-2 border-t border-slate-100 pt-3">
                                    <button 
                                        onClick={() => {
                                            onReset();
                                            setIsFiltersDropdownOpen(false);
                                        }}
                                        className="flex-1 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        onClick={() => setIsFiltersDropdownOpen(false)}
                                        className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Active Filter Badges */}
            {Object.entries(activeFilters).some(([k, v]) => v !== '' && k !== 'q' && k !== 'category' && k !== 'categoryId' && k !== 'city' && (k !== 'sort' || v !== 'rank')) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2 w-full animate-in fade-in slide-in-from-top-1 duration-200">
                    {Object.entries(activeFilters).map(([key, value]) => {
                        if (!value || key === 'q' || key === 'category' || key === 'categoryId' || key === 'city' || (key === 'sort' && value === 'rank')) return null;
                        
                        let label = '';
                        if (key === 'sort') {
                            const sortNames = {
                                rank: 'Featured',
                                price_asc: 'Price: Low to High',
                                price_desc: 'Price: High to Low',
                                rating: 'Avg. Customer Review',
                                latest: 'Newest Arrivals',
                                reviews: 'Best Sellers'
                            };
                            label = `Sort: ${sortNames[value] || value}`;
                        }
                        else if (key === 'rating') label = `Rating: ${value}+ Stars`;
                        else if (key === 'priceRange') label = `Price: ${value.replace(/\$/g, '₹')}`;
                        else if (key === 'openNow' && value === 'true') label = 'Availability: Open Now';
                        else return null;

                        return (
                            <div key={key} className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-xs font-semibold text-orange-700 shadow-sm animate-scale-in">
                                <span>{label}</span>
                                <button 
                                    onClick={() => onFilterChange(key, key === 'sort' ? 'rank' : '')}
                                    className="p-0.5 hover:bg-orange-200 rounded-full transition-colors text-orange-600"
                                    title={`Remove filter ${key}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}


        </div>
    );
}
