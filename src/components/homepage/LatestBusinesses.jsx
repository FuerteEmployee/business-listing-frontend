import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, apiGet } from '../../config/api';
import SectionError from '../ui/SectionError';
import { Star, MapPin, ArrowRight, Clock } from 'lucide-react';

export default function LatestBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLatestBusinesses();
    }, []);

    const fetchLatestBusinesses = async () => {
        setLoading(true);
        setError(null);

        const result = await apiGet(`${getApiUrl('companies')}?limit=8&sort=latest`);

        if (result.ok) {
            const payload = result.data;
            setBusinesses(
                Array.isArray(payload) ? payload
                    : Array.isArray(payload?.companies) ? payload.companies
                        : []
            );
        } else {
            setBusinesses([]);
            setError(result.error);
        }
        setLoading(false);
    };

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SectionError
                    title="Couldn't load latest businesses"
                    message={error}
                    onRetry={fetchLatestBusinesses}
                />
            </div>
        );
    }

    if (!loading && businesses.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-b from-white to-slate-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Recently Added</h2>
                        </div>
                        <p className="text-slate-600 mt-2">New businesses just added to the platform</p>
                    </div>
                    <Link
                        to="/search?sort=newest"
                        className="hidden md:flex items-center gap-2 text-orange-600 font-medium hover:text-orange-700"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, idx) => (
                            <div key={idx} className="bg-white rounded-lg h-72 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    /* Business Cards */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {businesses.slice(0, 8).map((business) => (
                            <Link
                                key={business._id}
                                to={`/business/${business.slug}`}
                                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group"
                            >
                                {/* Image */}
                                <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                                    {(() => {
                                        const displayImg = business.image || business.logo || business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null);
                                        return displayImg ? (
                                            <img
                                                src={displayImg}
                                                alt={business.name}
                                                className={`w-full h-full group-hover:scale-105 transition-transform duration-200 ${!business.image && business.logo ? 'object-contain p-4 bg-white' : 'object-cover'}`}
                                                onError={e => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('.fallback-initial')?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null;
                                    })()}
                                    <div className={`fallback-initial ${(business.image || business.logo || business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null)) ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                        <span className="text-3xl font-bold text-slate-300">
                                            {business.name.charAt(0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-2">
                                    {/* Name */}
                                    <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                        {business.name}
                                    </h3>

                                    {/* Category */}
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {business.category && typeof business.category === 'object' ? business.category.name : (business.category || 'Business')}
                                    </p>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 pt-1">
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

                                     {/* Badges */}
                                     <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                                        {business.isFeatured && (
                                            <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-tight border border-orange-100">
                                                Featured
                                            </span>
                                        )}
                                        {business.verified && (
                                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tight border border-emerald-100">
                                                Verified
                                            </span>
                                        )}
                                        {business.claimed && (
                                            <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tight border border-blue-100">
                                                Claimed
                                            </span>
                                        )}
                                     </div>
                                     
                                     {/* Location */}
                                     <div className="flex items-start gap-1 text-[11px] text-slate-500 pt-1">
                                         <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />
                                         <span className="line-clamp-1">
                                             {(business.city_id?.name || business.city?.name || 'Location')}
                                         </span>
                                     </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Mobile View All */}
                <div className="md:hidden mt-6 text-center">
                    <Link
                        to="/search?sort=newest"
                        className="inline-flex items-center gap-2 text-orange-600 font-medium"
                    >
                        View All New Listings
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
