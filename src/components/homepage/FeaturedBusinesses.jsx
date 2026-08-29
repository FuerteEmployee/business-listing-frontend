import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, apiGet } from '../../config/api';
import SectionError from '../ui/SectionError';
import { Star, MapPin, ArrowRight, Image as ImageIcon } from 'lucide-react';

export default function FeaturedBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFeaturedBusinesses();
    }, []);

    const fetchFeaturedBusinesses = async () => {
        setLoading(true);
        setError(null);

        const result = await apiGet(`${getApiUrl('companies')}?isFeatured=true&limit=4`);

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
                    title="Couldn't load featured businesses"
                    message={error}
                    onRetry={fetchFeaturedBusinesses}
                />
            </div>
        );
    }

    if (!loading && businesses.length === 0) {
        return null; // Genuinely nothing featured — stay quiet
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
                    <div className="flex md:grid overflow-x-auto md:overflow-visible flex-nowrap md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 md:pb-0 no-scrollbar">
                        {[...Array(4)].map((_, idx) => (
                            <div key={idx} className="bg-white rounded-lg h-64 animate-pulse flex-shrink-0 w-[260px] md:w-auto" />
                        ))}
                    </div>
                ) : (
                    /* Business Cards Grid */
                    <div className="flex md:grid overflow-x-auto md:overflow-visible flex-nowrap md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 md:pb-0 no-scrollbar">
                        {businesses.slice(0, 4).map((business) => (
                            <Link
                                key={business._id}
                                to={`/business/${business.slug}`}
                                className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group flex-shrink-0 w-[260px] md:w-auto"
                            >
                                {/* Business Image */}
                                <div className="relative aspect-[16/9] bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden">
                                    {(() => {
                                        const displayImg = business.coverPhotoUrl || business.photos?.[0] || business.galleryPhotos?.[0] || business.logo || null;
                                        const isLogoOnly = !business.coverPhotoUrl && !business.photos?.[0] && !business.galleryPhotos?.[0] && business.logo;
                                        return displayImg ? (
                                            <img
                                                src={displayImg}
                                                alt={business.name}
                                                className={`w-full h-full group-hover:scale-105 transition-transform duration-200 ${isLogoOnly ? 'object-contain p-4 bg-white' : 'object-cover'}`}
                                                onError={e => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('.fallback-initial')?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null;
                                    })()}
                                    <div className={`fallback-initial ${(business.coverPhotoUrl || business.photos?.[0] || business.galleryPhotos?.[0] || business.logo) ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-orange-50`}>
                                        <ImageIcon className="w-10 h-10 text-orange-200" />
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
