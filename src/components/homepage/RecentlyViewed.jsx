import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, X, Trash2, History } from 'lucide-react';

export default function RecentlyViewed() {
    const [recentListings, setRecentListings] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('recentlyViewed');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setRecentListings(parsed);
                }
            } catch (err) {
                console.error('Error parsing recently viewed:', err);
            }
        }
    }, []);

    const clearHistory = () => {
        if (window.confirm('Clear your browsing history on this device?')) {
            localStorage.removeItem('recentlyViewed');
            setRecentListings([]);
        }
    };

    if (recentListings.length === 0) return null;

    return (
        <div className="w-full bg-slate-50 py-12 border-y border-slate-100 mb-6">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <History className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pick Up Where You Left Off</h2>
                            <p className="text-slate-500 text-sm font-medium">Listings you've recently viewed</p>
                        </div>
                    </div>
                    <button 
                        onClick={clearHistory}
                        className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors py-2 px-3 rounded-lg hover:bg-rose-50 text-xs font-black uppercase tracking-widest"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </button>
                </div>

                <div className="flex items-stretch gap-6 overflow-x-auto pb-6 no-scrollbar">
                    {recentListings.map((business) => (
                        <Link
                            key={business._id}
                            to={`/business/${business.slug}`}
                            className="flex-none w-[280px] bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-[0px_10px_30px_rgba(79,70,229,0.08)] group"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] bg-slate-100">
                                {business.image ? (
                                    <img
                                        src={business.image}
                                        alt={business.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                                        <span className="text-4xl font-black text-indigo-200">{business.name.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex gap-1">
                                    <span className="text-[10px] font-black bg-white/90 backdrop-blur px-2 py-1 rounded text-slate-900 uppercase tracking-widest shadow-sm">
                                        {business.category ? (typeof business.category === 'object' ? business.category.name : business.category) : 'Business'}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5">
                                <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors mb-2">
                                    {business.name}
                                </h3>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-black text-slate-700">{(business.rating || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                        <MapPin className="w-3 h-3" />
                                        <span className="line-clamp-1">{business.city || 'Location'}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
}
