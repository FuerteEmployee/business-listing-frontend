import { ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';

export default function ListingFilters({ activeFilters, onFilterChange, onReset }) {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

                <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors ml-auto group"
                >
                    <Filter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Filters
                </button>
            </div>

            {/* Active Filter Badges */}
            {Object.entries(activeFilters).some(([k, v]) => v !== '' && k !== 'q' && k !== 'category' && k !== 'categoryId' && k !== 'city' && (k !== 'sort' || v !== 'rank')) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2 w-full animate-in fade-in slide-in-from-top-1 duration-200">
                    {Object.entries(activeFilters).map(([key, value]) => {
                        if (!value || key === 'q' || key === 'category' || key === 'categoryId' || key === 'city' || (key === 'sort' && value === 'rank')) return null;
                        
                        let label = '';
                        if (key === 'sort') label = `Sort: ${value === 'rating' ? 'Top Rated' : value === 'reviews' ? 'Most Reviews' : value === 'latest' ? 'Latest' : 'Nearest'}`;
                        else if (key === 'rating') label = `Rating: ${value}+ Stars`;
                        else if (key === 'priceRange') label = `Price: ${value}`;
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

            {/* Slide-over Filter Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    
                    {/* Drawer Content */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                            {/* Drawer Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Advanced Filters</h2>
                                    <p className="text-slate-400 text-xs font-semibold">Refine listings to match your requirements</p>
                                </div>
                                <button 
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Sort Section */}
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Sort Results</h3>
                                    <select 
                                        value={activeFilters.sort || 'rank'}
                                        onChange={(e) => onFilterChange('sort', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                                    >
                                        <option value="rank">Featured</option>
                                        <option value="price_asc">Price: Low to High</option>
                                        <option value="price_desc">Price: High to Low</option>
                                        <option value="rating">Avg. Customer Review</option>
                                        <option value="latest">Newest Arrivals</option>
                                        <option value="reviews">Best Sellers</option>
                                    </select>
                                </div>

                                {/* Ratings Section */}
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Minimum Rating</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'Any', value: '' },
                                            { label: '3.5+ ★', value: '3.5' },
                                            { label: '4.0+ ★', value: '4' },
                                            { label: '4.5+ ★', value: '4.5' }
                                        ].map((opt) => {
                                            const isSelected = activeFilters.rating === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => onFilterChange('rating', opt.value)}
                                                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                                                        isSelected
                                                            ? 'bg-blue-50/70 border-blue-500 text-blue-700 font-bold shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Price Range Section */}
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Price Level</h3>
                                    <div className="flex gap-2">
                                        {[
                                            { label: '$', value: '$', title: 'Budget' },
                                            { label: '$$', value: '$$', title: 'Mid' },
                                            { label: '$$$', value: '$$$', title: 'Luxury' },
                                            { label: '$$$$', value: '$$$$', title: 'Ultra' }
                                        ].map((opt) => {
                                            const isSelected = activeFilters.priceRange === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => onFilterChange('priceRange', activeFilters.priceRange === opt.value ? '' : opt.value)}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                                        isSelected
                                                            ? 'bg-blue-50/70 border-blue-500 text-blue-700 shadow-sm font-bold'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                    title={opt.title}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Availability Section */}
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
                            </div>

                            {/* Drawer Footer */}
                            <div className="px-6 py-5 border-t border-slate-100 flex items-center gap-4 bg-slate-50">
                                <button 
                                    onClick={() => {
                                        onReset();
                                        setIsDrawerOpen(false);
                                    }}
                                    className="flex-1 py-3 border border-slate-200 bg-white rounded-xl text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                >
                                    Reset All
                                </button>
                                <button 
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
