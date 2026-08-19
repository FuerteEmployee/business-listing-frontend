import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { Star, MapPin, ArrowRight } from 'lucide-react';

export default function FeaturedBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFeaturedBusinesses();
    }, []);

    const fetchFeaturedBusinesses = async () => {
        try {
            setLoading(true);
            const url = `${getApiUrl('companies')}?isFeatured=true&limit=4`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                // Handle different response formats
                if (Array.isArray(data)) {
                    setBusinesses(data);
                } else if (data.data && Array.isArray(data.data)) {
                    setBusinesses(data.data);
                } else if (data.companies && Array.isArray(data.companies)) {
                    setBusinesses(data.companies);
                } else {
                    setBusinesses([]);
                }
            } else {
                setBusinesses([]);
            }
        } catch (err) {
            console.error('Error fetching featured businesses:', err);
            setBusinesses([]);
            setError('Unable to load featured businesses at the moment.');
        } finally {
            setLoading(false);
        }
    };

    if (error || (!loading && businesses.length === 0)) {
        return null; // Don't show section if no data
    }

    return (
        <div className="bg-gradient-to-b from-slate-50 to-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Featured Businesses</h2>
                        <p className="text-slate-600 mt-2">Premium listings and verified businesses</p>
                    </div>
                    <Link
                        to="/search?featured=true"
                        className="hidden md:flex items-center gap-2 text-orange-600 font-medium hover:text-orange-700"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, idx) => (
                            <div key={idx} className="bg-white rounded-lg h-64 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    /* Business Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {businesses.slice(0, 4).map((business) => (
                            <Link
                                key={business._id}
                                to={`/business/${business.slug}`}
                                className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group"
                            >
                                {/* Business Image */}
                                <div className="relative aspect-[16/9] bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden">
                                    {(() => {
                                        const displayImg = business.image || business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null);
                                        return displayImg ? (
                                            <img
                                                src={displayImg}
                                                alt={business.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                onError={e => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('.fallback-initial')?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null;
                                    })()}
                                    <div className={`fallback-initial ${(business.image || business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null)) ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                        <span className="text-2xl font-bold text-orange-400">
                                            {business.name.charAt(0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Business Info */}
                                <div className="p-4 space-y-3">
                                    {/* Name */}
                                    <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                        {business.name}
                                    </h3>

                                    {/* Category */}
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {business.category && typeof business.category === 'object' ? business.category.name : (business.category || 'Business')}
                                    </p>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${
                                                    i < Math.round(business.rating || 0)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-slate-200'
                                                }`}
                                            />
                                        ))}
                                        <span className="text-[11px] font-bold text-slate-500 ml-1">
                                            {(business.rating || 0).toFixed(1)}
                                        </span>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                                        <div className="line-clamp-1">
                                            {(business.city_id?.name || business.city?.name || 'Local')}, {(business.state_id?.name || business.state?.name || 'City')}
                                        </div>
                                    </div>

                                     {/* Badges */}
                                     <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-tight border border-orange-100">
                                            Featured
                                        </span>
                                        {business.verified && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tight border border-emerald-100">
                                                Verified
                                            </span>
                                        )}
                                        {business.claimed && (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tight border border-blue-100">
                                                Claimed
                                            </span>
                                        )}
                                     </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Mobile View All Link */}
                <div className="md:hidden mt-6 text-center">
                    <Link
                        to="/search?featured=true"
                        className="inline-flex items-center gap-2 text-orange-600 font-medium"
                    >
                        View All Featured Businesses
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
