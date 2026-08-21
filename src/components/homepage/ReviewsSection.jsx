import { useEffect, useState } from 'react';
import { getApiUrl, apiGet } from '../../config/api';
import { Star, User } from 'lucide-react';
import SectionError from '../ui/SectionError';

export default function ReviewsSection() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLatestReviews();
    }, []);

    const fetchLatestReviews = async () => {
        setLoading(true);
        setError(null);

        // This endpoint returns a bare array, not a { data } envelope. The old
        // code checked Array.isArray(data.data), which was never true, so the
        // section rendered nothing even on a perfectly good response.
        // apiGet normalises both shapes.
        const result = await apiGet(getApiUrl('reviews/latest?limit=3'));

        if (result.ok) {
            setReviews(Array.isArray(result.data) ? result.data : []);
        } else {
            setReviews([]);
            setError(result.error);
        }
        setLoading(false);
    };

    if (error) {
        return (
            <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionError
                        title="Couldn't load reviews"
                        message={error}
                        onRetry={fetchLatestReviews}
                    />
                </div>
            </div>
        );
    }

    if (!loading && reviews.length === 0) {
        return null;
    }

    return (
        <div className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900">What Users Say</h2>
                    <p className="text-slate-600 mt-2">Real reviews from real customers</p>
                </div>

                {/* Reviews Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, idx) => (
                            <div key={idx} className="bg-slate-100 rounded-lg h-56 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <div
                                key={review._id}
                                className="bg-slate-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Reviewer Info */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {review.user?.name?.charAt(0) || <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {review.user?.name || 'Anonymous'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Reviewed {review.business?.name || 'a business'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${
                                                    i < review.rating
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-slate-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {review.rating}.0
                                    </span>
                                </div>

                                {/* Review Text */}
                                <p className="text-slate-700 text-sm line-clamp-4">
                                    {review.reviewText || review.comment || 'Great experience!'}
                                </p>

                                {/* Date */}
                                <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-200">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
