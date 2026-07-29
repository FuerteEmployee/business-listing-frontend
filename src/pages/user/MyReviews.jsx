import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import Header from '../../components/homepage/Header';
import Footer from '../../components/homepage/Footer';
import { Star, MessageSquare, ThumbsUp, Trash2, Edit2, X, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyReviews() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionloading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchMyReviews = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews/my-reviews`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchMyReviews();
    }, [user?._id]);

    // Delete review
    const handleDelete = async (reviewId) => {
        try {
            setActionLoading(reviewId);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setReviews(prevReviews => prevReviews.filter(r => r._id !== reviewId));
                setDeleteConfirm(null);
            } else {
                setError("Failed to delete review");
            }
        } catch (err) {
            console.error("Error deleting review:", err);
            setError("Error deleting review");
        } finally {
            setActionLoading(null);
        }
    };

    // Update review
    const handleUpdateReview = async (reviewId) => {
        if (!editText.trim()) return;
        try {
            setActionLoading(reviewId);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'PUT',
                body: JSON.stringify({ reviewText: editText })
            });
            if (res.ok) {
                const updatedReview = await res.json();
                setReviews(prevReviews =>
                    prevReviews.map(r => r._id === reviewId ? updatedReview : r)
                );
                setEditingId(null);
                setEditText("");
            }
        } catch (err) {
            console.error("Error updating review:", err);
            setError("Failed to update review");
        } finally {
            setActionLoading(null);
        }
    };

    // Vote review helpful
    const handleVoteHelpful = async (reviewId, voteType) => {
        try {
            setActionLoading(reviewId);
            const res = await fetchWithAuth(`${API_BASE_URL}/reviews/${reviewId}/vote`, {
                method: 'POST',
                body: JSON.stringify({ voteType })
            });
            if (res.ok) {
                await fetchMyReviews();
            }
        } catch (err) {
            console.error("Error voting:", err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Reviews</h1>
                        <p className="text-slate-500 font-medium">Manage your feedback and ratings</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="grid gap-6">
                        {reviews.map((review) => (
                            <div key={review._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4 flex-1">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                                            {review.businessId?.image ? (
                                                <img src={review.businessId.image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <Link to={`/business/${review.businessId?.slug}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                                {review.businessId?.name}
                                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                            review.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            review.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}>
                                            {review.status}
                                        </span>
                                        {editingId === review._id ? null : (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(review._id);
                                                        setEditText(review.reviewText);
                                                    }}
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(review._id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {editingId === review._id ? (
                                    <div className="mb-4 space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditText("");
                                                }}
                                                className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdateReview(review._id)}
                                                disabled={actionloading === review._id}
                                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {actionloading === review._id ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{review.reviewText}</p>
                                )}

                                {review.helpfulCount !== undefined && !editingId === review._id && (
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => handleVoteHelpful(review._id, 'helpful')}
                                            disabled={actionloading === review._id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                                        >
                                            <ThumbsUp className={`w-4 h-4 ${review.userVote === 'helpful' ? 'fill-blue-600 text-blue-600' : ''}`} />
                                            {review.helpfulCount || 0} Helpful
                                        </button>
                                    </div>
                                )}

                                {review.ownerReply?.text && (
                                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 relative">
                                        <div className="absolute -top-2 left-6 px-2 bg-indigo-600 text-[8px] font-black text-white uppercase tracking-widest rounded">Response</div>
                                        <p className="text-indigo-900 text-xs font-medium leading-relaxed italic">
                                            {review.ownerReply.text}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Star className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">No Reviews Yet</h2>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Share your experiences and help others choose the best businesses!</p>
                        <Link to="/search" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                            Explore Businesses
                        </Link>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Review?</h3>
                            <p className="text-slate-600 mb-6">Are you sure you want to delete this review? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={actionloading === deleteConfirm}
                                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionloading === deleteConfirm ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
