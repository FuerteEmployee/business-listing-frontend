import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Trash2, History, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function RecentlyViewed() {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('recent');
    const [recentListings, setRecentListings] = useState([]);
    const [favoriteListings, setFavoriteListings] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    const loadRecent = () => {
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
        } else {
            setRecentListings([]);
        }
    };

    const loadFavorites = async () => {
        if (isAuthenticated) {
            try {
                setLoadingFavorites(true);
                const res = await fetchWithAuth(getApiUrl('me/saved'));
                if (res.ok) {
                    const data = await res.json();
                    setFavoriteListings(data.data || []);
                }
            } catch (err) {
                console.error('Error loading API favorites:', err);
            } finally {
                setLoadingFavorites(false);
            }
        } else {
            // Guest fallback
            const stored = localStorage.getItem('bookmarks_data');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setFavoriteListings(parsed);
                    }
                } catch (err) {
                    console.error('Error parsing guest favorites:', err);
                }
            } else {
                setFavoriteListings([]);
            }
        }
    };

    useEffect(() => {
        loadRecent();
        loadFavorites();

        // Listen for bookmarks updates
        const handleBookmarksUpdated = () => {
            loadFavorites();
        };

        window.addEventListener('bookmarksUpdated', handleBookmarksUpdated);
        return () => window.removeEventListener('bookmarksUpdated', handleBookmarksUpdated);
    }, [isAuthenticated]);

    // Automatically switch activeTab if one is empty but the other has data
    useEffect(() => {
        if (recentListings.length === 0 && favoriteListings.length > 0 && activeTab === 'recent') {
            setActiveTab('favorites');
        } else if (favoriteListings.length === 0 && recentListings.length > 0 && activeTab === 'favorites') {
            setActiveTab('recent');
        }
    }, [recentListings, favoriteListings]);

    const clearHistory = () => {
        if (window.confirm('Clear your browsing history on this device?')) {
            localStorage.removeItem('recentlyViewed');
            setRecentListings([]);
        }
    };

    // If both sections are empty, hide the component
    if (recentListings.length === 0 && favoriteListings.length === 0) return null;

    const displayedListings = activeTab === 'recent' ? recentListings : favoriteListings;

    return (
        <div className="w-full bg-slate-50 py-12 border-y border-slate-100 mb-6">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-200/60 pb-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-8">
                        {/* Recent Tab */}
                        {recentListings.length > 0 && (
                            <button
                                onClick={() => setActiveTab('recent')}
                                className={`flex items-center gap-3 pb-4 border-b-2 transition-all relative ${
                                    activeTab === 'recent'
                                        ? 'border-indigo-600 text-slate-900 font-extrabold'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'
                                }`}
                            >
                                <History className={`w-5 h-5 ${activeTab === 'recent' ? 'text-indigo-600 animate-pulse' : ''}`} />
                                <div className="text-left">
                                    <h2 className="text-lg tracking-tight">Pick Up Where You Left Off</h2>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-75">Recently Viewed</p>
                                </div>
                            </button>
                        )}

                        {/* Favorites Tab */}
                        {favoriteListings.length > 0 && (
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`flex items-center gap-3 pb-4 border-b-2 transition-all relative ${
                                    activeTab === 'favorites'
                                        ? 'border-indigo-600 text-slate-900 font-extrabold'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'
                                }`}
                            >
                                <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-rose-500 fill-rose-500 animate-bounce-subtle' : ''}`} />
                                <div className="text-left">
                                    <h2 className="text-lg tracking-tight">My Favorites</h2>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-75">Liked Companies</p>
                                </div>
                                <span className="absolute -top-1 -right-4 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                    {favoriteListings.length}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Right side controls */}
                    {activeTab === 'recent' && recentListings.length > 0 && (
                        <button 
                            onClick={clearHistory}
                            className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors py-2 px-3 rounded-lg hover:bg-rose-50 text-xs font-black uppercase tracking-widest self-start md:self-center"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    )}
                </div>

                {/* Content */}
                {loadingFavorites && activeTab === 'favorites' ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4">Loading your favorites...</p>
                    </div>
                ) : displayedListings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-slate-400 font-bold">No listings found in this tab.</p>
                    </div>
                ) : (
                    <div className="flex items-stretch gap-6 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory">
                        {displayedListings.map((business) => (
                            <Link
                                key={business._id}
                                to={`/business/${business.slug}`}
                                className="flex-none w-[280px] bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-[0px_10px_30px_rgba(79,70,229,0.08)] group snap-start"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
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
                                            {business.category || 'Business'}
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
                                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="line-clamp-1">{business.city || 'Location'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
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
