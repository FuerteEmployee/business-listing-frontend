import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Header from "../../components/homepage/Header";
import Footer from "../../components/homepage/Footer";
import { Star, AlertCircle, Loader2 } from "lucide-react";

export default function WriteReview() {
    const { user } = useAuth();
    const { businessId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        rating: 5,
        title: "",
        reviewText: "",
        aspects: {
            quality: 5,
            service: 5,
            value: 5,
            cleanliness: 5
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleRatingChange = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleAspectChange = (aspect, value) => {
        setFormData(prev => ({
            ...prev,
            aspects: {
                ...prev.aspects,
                [aspect]: value
            }
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.title || !formData.reviewText) {
            setError("Please fill in all required fields");
            return;
        }

        if (formData.reviewText.length < 10) {
            setError("Review must be at least 10 characters");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                body: JSON.stringify({
                    businessId,
                    rating: formData.rating,
                    title: formData.title,
                    reviewText: formData.reviewText,
                    aspects: formData.aspects
                })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate(`/user/reviews`);
                }, 2000);
            } else {
                const errData = await res.json();
                setError(errData.msg || "Failed to submit review");
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            setError("Error submitting review");
        } finally {
            setIsLoading(false);
        }
    };

    const aspects = [
        { key: "quality", label: "Quality" },
        { key: "service", label: "Service" },
        { key: "value", label: "Value for Money" },
        { key: "cleanliness", label: "Cleanliness" }
    ];

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl border border-emerald-200 p-8 max-w-md text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Submitted!</h2>
                        <p className="text-slate-600 mb-4">Thank you for your feedback. Your review has been submitted for moderation.</p>
                        <p className="text-sm text-slate-500">Redirecting to your reviews...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Write a Review</h1>
                    <p className="text-slate-600 mt-2">Share your experience to help other customers</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
                    {/* Overall Rating */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-4">Overall Rating *</label>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                    key={rating}
                                    type="button"
                                    onClick={() => handleRatingChange(rating)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-10 h-10 ${
                                            rating <= formData.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-slate-300'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 mt-2">{formData.rating} out of 5 stars</p>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">
                            Review Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Summarize your experience..."
                            maxLength={100}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 mt-1">{formData.title.length}/100</p>
                    </div>

                    {/* Review Text */}
                    <div>
                        <label htmlFor="reviewText" className="block text-sm font-semibold text-slate-900 mb-2">
                            Your Review *
                        </label>
                        <textarea
                            id="reviewText"
                            name="reviewText"
                            value={formData.reviewText}
                            onChange={handleInputChange}
                            placeholder="Share more details about your experience..."
                            rows={6}
                            minLength={10}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Minimum 10 characters</p>
                    </div>

                    {/* Aspect Ratings */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-4">Rate Specific Aspects</label>
                        <div className="space-y-4">
                            {aspects.map(aspect => (
                                <div key={aspect.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-sm font-medium text-slate-700">{aspect.label}</span>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => handleAspectChange(aspect.key, rating)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-5 h-5 ${
                                                        rating <= formData.aspects[aspect.key]
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-slate-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-3 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Guidelines for Reviews</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>✓ Be honest and constructive with your feedback</li>
                        <li>✓ Share specific details about your experience</li>
                        <li>✓ Avoid offensive language and personal attacks</li>
                        <li>✗ Don't post promotional content or contact information</li>
                        <li>✗ Don't post reviews about other users</li>
                    </ul>
                </div>
            </main>
            <Footer />
        </div>
    );
}
