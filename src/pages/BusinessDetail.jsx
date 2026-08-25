import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, MapPin, Phone, Globe, Mail, Clock, ShieldCheck, Share2, Heart, Bookmark, MessageSquare, ChevronRight, Info, Image as ImageIcon, Loader2, CheckCircle2, ArrowRight, ThumbsUp, ThumbsDown, Flag, Filter, Upload, X, Camera, Maximize2, Search, Settings, Menu, MessageCircle, Map, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, fetchWithAuth, getApiUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';
import { logAnalyticsEvent } from '../utils/tracker';
import { isBusinessOpen, formatDayHours } from '../utils/businessHours';
import EnquiryModal from '../components/ui/EnquiryModal';

export default function BusinessDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(false);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewSort, setReviewSort] = useState('recent');
    const [reviewFilter, setReviewFilter] = useState('all');
    const [reviewCounts, setReviewCounts] = useState({ all: 0, photos: 0, quality: 0, service: 0, value: 0 });
    const [reviewsTrigger, setReviewsTrigger] = useState(0);
    const [userReview, setUserReview] = useState(null);
    const [isEditingReview, setIsEditingReview] = useState(false);
    
    // Form States
    const [newReview, setNewReview] = useState({ 
        rating: 5, 
        comment: '',
        aspects: { quality: 5, service: 5, value: 5 }
    });
    const [selectedReviewImages, setSelectedReviewImages] = useState([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [claimFormData, setClaimFormData] = useState({
        fullName: "",
        businessEmail: "",
        phoneNumber: "",
        position: ""
    });
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [isReportReviewModalOpen, setIsReportReviewModalOpen] = useState(false);
    const [reviewToReport, setReviewToReport] = useState(null);
    const [reportForm, setReportForm] = useState({ reason: 'Spam', description: '' });
    const [listingReportForm, setListingReportForm] = useState({ reason: 'Spam or Fake profile', description: '' });
    const [isReportingListing, setIsReportingListing] = useState(false);
    const [showFullHours, setShowFullHours] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    const [questions, setQuestions] = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
    const [similarBusinesses, setSimilarBusinesses] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Lightbox Keydown Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') setIsLightboxOpen(false);
            if (e.key === 'ArrowRight' && business?.photos?.length > 1) {
                setActivePhotoIndex(prev => (prev === business.photos.length - 1 ? 0 : prev + 1));
            }
            if (e.key === 'ArrowLeft' && business?.photos?.length > 1) {
                setActivePhotoIndex(prev => (prev === 0 ? business.photos.length - 1 : prev - 1));
            }
        };

        if (isLightboxOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isLightboxOpen, business?.photos]);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!business?._id) return;
            try {
                setQuestionsLoading(true);
                const res = await fetch(`${getApiUrl('companies')}/${business._id}/questions`);
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data);
                }
            } catch (err) {
                console.error('Error fetching questions:', err);
            } finally {
                setQuestionsLoading(false);
            }
        };
        const fetchSimilar = async () => {
            if (!business?._id) return;
            try {
                const res = await fetch(`${getApiUrl('companies')}/${business._id}/similar`);
                if (res.ok) {
                    const data = await res.json();
                    setSimilarBusinesses(data);
                }
            } catch (err) {
                console.error('Error fetching similar businesses:', err);
            }
        };
        fetchQuestions();
        fetchSimilar();
    }, [business?._id]);

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/business/${slug}` } });
            return;
        }
        try {
            setIsSubmittingQuestion(true);
            const res = await fetchWithAuth(`${getApiUrl('companies')}/${business._id}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionText: newQuestionText })
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(prev => [{ ...data, userId: { _id: user._id, name: user.name } }, ...prev]);
                setNewQuestionText('');
            }
        } catch (err) {
            console.error('Question post error:', err);
        } finally {
            setIsSubmittingQuestion(false);
        }
    };

    const handleShare = (type = 'native') => {
        const url = window.location.href;
        const text = `Check out ${business.name} on Fuerte Developers!`;

        if (type === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        } else if (type === 'copy') {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        } else {
            if (navigator.share) {
                navigator.share({ title: business.name, text, url }).catch(console.error);
            } else {
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            }
        }
    };

    useEffect(() => {
        const checkBookmarkStatus = async () => {
            if (isAuthenticated && business?._id) {
                try {
                    const res = await fetchWithAuth(getApiUrl('me/saved'));
                    if (res.ok) {
                        const data = await res.json();
                        const savedListings = data.data || [];
                        setIsBookmarked(savedListings.some(item => item._id === business._id));
                    }
                } catch (err) {
                    console.error('Error checking bookmark status:', err);
                }
            } else if (business?._id) {
                try {
                    const localBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                    setIsBookmarked(localBookmarks.includes(business._id));
                } catch (err) {
                    console.error('Error checking local bookmarks:', err);
                }
            }
        };
        checkBookmarkStatus();
    }, [business?._id, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && location.state?.openEnquiry) {
            setIsEnquiryModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [isAuthenticated, location.state]);

    const handleBookmarkToggle = async () => {
        if (!business?._id) return;

        if (isAuthenticated) {
            try {
                const res = await fetchWithAuth(getApiUrl('me/saved/toggle'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ businessId: business._id })
                });
                if (res.ok) {
                    setIsBookmarked(prev => !prev);
                    toast.success(!isBookmarked ? 'Added to saved businesses!' : 'Removed from saved businesses!');
                    window.dispatchEvent(new Event('bookmarksUpdated'));
                } else {
                    toast.error('Failed to update saved businesses');
                }
            } catch (err) {
                console.error('Error toggling bookmark:', err);
                toast.error('An error occurred');
            }
        } else {
            try {
                const localBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                const bookmarksData = JSON.parse(localStorage.getItem('bookmarks_data') || '[]');
                let updated;
                let updatedData;
                if (localBookmarks.includes(business._id)) {
                    updated = localBookmarks.filter(id => id !== business._id);
                    updatedData = bookmarksData.filter(item => item._id !== business._id);
                    toast.success('Removed from saved businesses!');
                } else {
                    updated = [...localBookmarks, business._id];
                    updatedData = [...bookmarksData, {
                        _id: business._id,
                        name: business.name,
                        slug: business.slug,
                        image: business.image || business.photos?.[0],
                        category: typeof business.category === 'object' ? business.category.name : business.category,
                        rating: business.rating,
                        city: business.city_id?.name || business.city?.name || 'Location'
                    }];
                    toast.success('Added to saved businesses!');
                }
                localStorage.setItem('bookmarks', JSON.stringify(updated));
                localStorage.setItem('bookmarks_data', JSON.stringify(updatedData));
                setIsBookmarked(!localBookmarks.includes(business._id));
                window.dispatchEvent(new Event('bookmarksUpdated'));
            } catch (err) {
                console.error('Error toggling local bookmark:', err);
            }
        }
    };

    const [savedProductIds, setSavedProductIds] = useState([]);

    useEffect(() => {
        const fetchSavedProductIds = async () => {
            if (isAuthenticated) {
                try {
                    const res = await fetchWithAuth(getApiUrl('me/saved-products'));
                    if (res.ok) {
                        const data = await res.json();
                        const list = data.data || [];
                        setSavedProductIds(list.map(item => item._id));
                    }
                } catch (err) {
                    console.error('Error fetching saved products:', err);
                }
            } else {
                try {
                    const localProductBookmarks = JSON.parse(localStorage.getItem('product_bookmarks') || '[]');
                    setSavedProductIds(localProductBookmarks);
                } catch (e) {
                    setSavedProductIds([]);
                }
            }
        };
        fetchSavedProductIds();
        
        const handleBookmarksUpdated = () => {
            fetchSavedProductIds();
        };
        window.addEventListener('bookmarksUpdated', handleBookmarksUpdated);
        return () => window.removeEventListener('bookmarksUpdated', handleBookmarksUpdated);
    }, [isAuthenticated]);

    const handleProductSaveToggle = async (prod) => {
        if (!prod?._id) return;

        if (isAuthenticated) {
            try {
                const res = await fetchWithAuth(getApiUrl('me/saved-products/toggle'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: prod._id })
                });
                if (res.ok) {
                    const isAlreadySaved = savedProductIds.includes(prod._id);
                    if (isAlreadySaved) {
                        setSavedProductIds(prev => prev.filter(id => id !== prod._id));
                        toast.success('Product removed from favorites!');
                    } else {
                        setSavedProductIds(prev => [...prev, prod._id]);
                        toast.success('Product added to favorites!');
                    }
                    window.dispatchEvent(new Event('bookmarksUpdated'));
                } else {
                    toast.error('Failed to update favorites');
                }
            } catch (err) {
                console.error('Error toggling product save:', err);
                toast.error('An error occurred');
            }
        } else {
            try {
                const localProductBookmarks = JSON.parse(localStorage.getItem('product_bookmarks') || '[]');
                const localProductBookmarksData = JSON.parse(localStorage.getItem('product_bookmarks_data') || '[]');
                let updated;
                let updatedData;
                if (localProductBookmarks.includes(prod._id)) {
                    updated = localProductBookmarks.filter(id => id !== prod._id);
                    updatedData = localProductBookmarksData.filter(item => item._id !== prod._id);
                    toast.success('Removed from favorites!');
                } else {
                    updated = [...localProductBookmarks, prod._id];
                    updatedData = [...localProductBookmarksData, {
                        _id: prod._id,
                        name: prod.name,
                        slug: prod.slug,
                        image: prod.images?.[0] || null,
                        price: prod.price,
                        brand: prod.brandId?.name || 'Generic',
                        listing: business?.name || 'Seller'
                    }];
                    toast.success('Added to favorites!');
                }
                localStorage.setItem('product_bookmarks', JSON.stringify(updated));
                localStorage.setItem('product_bookmarks_data', JSON.stringify(updatedData));
                setSavedProductIds(updated);
                window.dispatchEvent(new Event('bookmarksUpdated'));
            } catch (err) {
                console.error('Error toggling local product bookmark:', err);
            }
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            if (!business?._id) return;
            try {
                setReviewsLoading(true);
                const params = new URLSearchParams({
                    sort: reviewSort,
                    filter: reviewFilter
                });
                const res = await fetch(`${getApiUrl('reviews')}/${business._id}?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.reviews) {
                        setReviews(data.reviews);
                        setReviewCounts(data.counts || { all: 0, photos: 0, quality: 0, service: 0, value: 0 });
                    } else {
                        setReviews(data || []);
                    }
                }
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };
        fetchReviews();

        const fetchUserReview = async () => {
            if (!isAuthenticated || !business?._id) return;
            try {
                const res = await fetchWithAuth(`${getApiUrl('reviews')}/my-review/${business._id}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserReview(data);
                }
            } catch (err) {
                console.error('Error fetching user review:', err);
            }
        };
        fetchUserReview();
    }, [business?._id, reviewSort, reviewFilter, isAuthenticated, reviewsTrigger]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/register', { state: { from: `/business/${slug}` } });
            return;
        }

        if (isUploadingImages) {
            toast.error('Please wait for images to finish uploading');
            return;
        }

        if (!newReview.comment || newReview.comment.trim().length < 20) {
            toast.error('Your review comment must be at least 20 characters long.');
            return;
        }

        try {
            setIsSubmittingReview(true);
            const url = isEditingReview 
                ? `${getApiUrl('reviews')}/${userReview._id}` 
                : `${getApiUrl('reviews')}`;
            
            const method = isEditingReview ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessId: business._id,
                    ...newReview,
                    images: selectedReviewImages
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'Approved') {
                    // Update local reviews list
                    if (isEditingReview) {
                        setReviews(prev => prev.map(r => r._id === data._id ? { ...data, userId: { _id: user._id, name: user.name } } : r));
                    } else {
                        setReviews(prev => [
                            { ...data, userId: { _id: user._id, name: user.name } },
                            ...prev
                        ]);
                    }
                    
                    setBusiness(prev => {
                        if (isEditingReview) return prev; // Rating recalculation on backend will be reflected on refresh
                        return {
                            ...prev,
                            reviewCount: (prev.reviewCount || 0) + 1,
                            rating: parseFloat((( (prev.rating || 0) * (prev.reviewCount || 0) + newReview.rating ) / ((prev.reviewCount || 0) + 1)).toFixed(1))
                        };
                    });
                }
                
                setReviewsTrigger(prev => prev + 1);

                if (isEditingReview) {
                    toast.success('Review updated successfully! It may need re-moderation.');
                } else {
                    toast.success(data.status === 'Approved' ? 'Review posted!' : 'Review submitted for moderation.');
                }

                setUserReview(data);
                setIsEditingReview(false);
                setNewReview({ 
                    rating: 5, 
                    comment: '', 
                    aspects: { quality: 5, service: 5, value: 5 }
                });
                setSelectedReviewImages([]);
            } else {
                const err = await res.json();
                toast.error(err.msg || 'Action failed');
            }
        } catch (err) {
            console.error('Review submission error:', err);
            toast.error('An error occurred');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        setIsUploadingImages(true);
        const uploadedUrls = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('image', file);
                
                const res = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (res.ok) {
                    const data = await res.json();
                    uploadedUrls.push(data.url);
                }
            }
            setSelectedReviewImages(prev => [...prev, ...uploadedUrls]);
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Some images failed to upload');
        } finally {
            setIsUploadingImages(false);
        }
    };

    const handleEditReview = () => {
        setNewReview({
            rating: userReview.rating,
            comment: userReview.comment,
            aspects: userReview.aspects || { quality: 5, service: 5, value: 5 }
        });
        setSelectedReviewImages(userReview.images || []);
        setIsEditingReview(true);
        // Scroll to form
        document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleVote = async (reviewId, type) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/business/${slug}` } });
            return;
        }

        try {
            const res = await fetchWithAuth(`${getApiUrl('reviews')}/${reviewId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (res.ok) {
                const updatedReview = await res.json();
                setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, ...updatedReview } : r));
            }
        } catch (err) {
            console.error('Vote error:', err);
        }
    };

    const handleReportReview = async (e) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${getApiUrl('reviews')}/${reviewToReport._id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportForm)
            });

            if (res.ok) {
                alert('Review reported. Thank you for helping keep our platform safe.');
                setIsReportReviewModalOpen(false);
                setReviewToReport(null);
                setReportForm({ reason: 'Spam', description: '' });
            } else {
                const data = await res.json();
                alert(data.msg || 'Failed to report review');
            }
        } catch (err) {
            console.error('Report error:', err);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
        { id: 'products', label: 'Products & Services', icon: <ImageIcon className="w-4 h-4" /> },
        { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
        { id: 'questions', label: 'Q&A', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'photos', label: 'Business Photos', icon: <ImageIcon className="w-4 h-4" /> },
        { id: 'review-photos', label: 'Review Photos', icon: <ImageIcon className="w-4 h-4" /> },
    ];

    useEffect(() => {
        if (user) {
            setClaimFormData(prev => ({
                ...prev,
                fullName: user.name,
                businessEmail: user.email
            }));
        }
    }, [user]);

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${getApiUrl('companies')}/slug/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setBusiness(data);
                } else {
                    setError('Business not found');
                }
            } catch (err) {
                console.error('Error fetching business:', err);
                setError('Failed to load business details');
            } finally {
                setLoading(false);
            }
        };
        fetchBusiness();
        window.scrollTo(0, 0);
    }, [slug]);

    useEffect(() => {
        if (business?._id) {
            logAnalyticsEvent('view', business._id, { city: business.city_id?.name });

            // Add to recently viewed
            try {
                const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const newItem = {
                    _id: business._id,
                    name: business.name,
                    slug: business.slug,
                    image: business.image,
                    logo: business.logo,
                    category: typeof business.category === 'object' ? business.category.name : business.category,
                    rating: business.rating,
                    city: business.city_id?.name || business.city?.name
                };
                
                // Remove if already exists and add to front
                const filtered = recent.filter(item => item._id !== business._id);
                const updated = [newItem, ...filtered].slice(0, 10); // Keep last 10
                localStorage.setItem('recentlyViewed', JSON.stringify(updated));
            } catch (err) {
                console.error('Error updating recently viewed:', err);
            }
        }
    }, [business?._id]);

    const handleClaimClick = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/business/${slug}` } });
            return;
        }
        setIsClaimModalOpen(true);
    };

    const handleClaimSubmit = async (e) => {
        e.preventDefault();
        try {
            setClaimLoading(true);
            const res = await fetchWithAuth(`${getApiUrl('claims')}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companyId: business._id,
                    ...claimFormData
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setClaimSuccess(true);
                setIsClaimModalOpen(false);
                setBusiness(prev => ({ ...prev, isClaimPending: true }));
                setTimeout(() => setClaimSuccess(false), 5000);
            } else {
                alert(data.msg || 'Failed to submit claim request');
            }
        } catch (err) {
            console.error('Claim error:', err);
            alert('An error occurred while submitting the claim request');
        } finally {
            setClaimLoading(false);
        }
    };

    const handleDirections = () => {
        let url;
        if (business.location?.coordinates) {
            const [lng, lat] = business.location.coordinates;
            url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        } else {
            const query = encodeURIComponent(`${business.name}, ${business.address}`);
            url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }
        window.open(url, '_blank');
    };


    const handleReportListing = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/business/${slug}` } });
            return;
        }

        try {
            setIsReportingListing(true);
            const res = await fetchWithAuth(`${getApiUrl('companies')}/${business._id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(listingReportForm)
            });

            if (res.ok) {
                alert('Thank you for reporting. Our team will investigate.');
                setIsReportModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.msg || 'Failed to submit report');
            }
        } catch (err) {
            console.error('Report error:', err);
        } finally {
            setIsReportingListing(false);
        }
    };

    const phoneNumbers = (business?.phone || '')
        .split(/[\/,]/)
        .map(num => num.trim())
        .filter(Boolean);

    const handleCall = () => {
        if (business?.phone) {
            logAnalyticsEvent('call', business._id);
            if (phoneNumbers.length > 1) {
                setShowPhoneModal(true);
            } else {
                window.location.href = `tel:${phoneNumbers[0] || business.phone}`;
            }
        }
    };

    const handleEnquire = () => {
        logAnalyticsEvent('enquiry', business._id);
        toast.success(`Enquiry sent for ${business?.name}! We will get back to you soon.`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium italic">Loading business profile...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !business || !business.name) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
                        <Info className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Oops! Profile Not Found</h1>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        The business profile you're looking for might have been removed or the link is incorrect.
                    </p>
                    <Link to="/" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                        Back to Home
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const rating = business.rating || 0;
    const reviewCount = business.reviewCount || 0;
    const offerings = [...(business.products || []), ...(business.services || [])];
    const displayImg = business.image || business.logo || business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null);

    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:flex min-h-screen bg-slate-50 flex-col w-full">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Business Image/Gallery */}
                            <div className="w-full lg:w-[36%] aspect-[16/9] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner group">
                                {(() => {
                                    const displayImg = business.image || business.logo || business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null);
                                    const isLogoOnly = !business.image && business.logo;
                                    return displayImg ? (
                                        <img 
                                            src={displayImg} 
                                            alt={business.name} 
                                            className={`w-full h-full ${isLogoOnly ? 'object-contain p-6 bg-white' : 'object-cover'}`} 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-orange-50">
                                            <ImageIcon className="w-20 h-20 text-orange-200" />
                                        </div>
                                    );
                                })()}
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    <button 
                                        onClick={handleBookmarkToggle}
                                        className={`p-2.5 rounded-full shadow-sm transition-colors ${
                                            isBookmarked 
                                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                            : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:text-orange-500'
                                        }`}
                                        title={isBookmarked ? "Remove from Saved Businesses" : "Save Business"}
                                    >
                                        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                                    </button>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsShareOpen(prev => !prev)}
                                            className={`p-2.5 rounded-full shadow-sm transition-all ${
                                                isShareOpen 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:text-indigo-600'
                                            }`}
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        {isShareOpen && (
                                            <>
                                                {/* Overlay to catch clicks outside dropdown and close it */}
                                                <div 
                                                    className="fixed inset-0 z-40 bg-transparent" 
                                                    onClick={() => setIsShareOpen(false)}
                                                />
                                                <div className="absolute top-full right-0 mt-2 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col gap-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button 
                                                        onClick={() => { handleShare('whatsapp'); setIsShareOpen(false); }}
                                                        className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 text-[10px] font-bold text-slate-600 hover:text-emerald-700 rounded-lg transition-colors text-left w-full"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                                                    </button>
                                                    <button 
                                                        onClick={() => { handleShare('copy'); setIsShareOpen(false); }}
                                                        className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-[10px] font-bold text-slate-600 hover:text-blue-700 rounded-lg transition-colors text-left w-full"
                                                    >
                                                        <Share2 className="w-3.5 h-3.5 text-blue-500" /> Copy Link
                                                    </button>
                                                    <button 
                                                        onClick={() => { handleShare('native'); setIsShareOpen(false); }}
                                                        className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-[10px] font-bold text-slate-600 hover:text-indigo-700 rounded-lg transition-colors text-left w-full"
                                                    >
                                                        <Share2 className="w-3.5 h-3.5 text-indigo-500" /> System Share
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <button 
                                        onClick={() => {
                                            if (business.photos?.length > 0) {
                                                setIsLightboxOpen(true);
                                            }
                                        }}
                                        className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-colors"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        See {business.photos?.length || 0} Photos
                                    </button>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-100">
                                            {typeof business.category === 'object' && business.category !== null ? business.category.name : (business.category || 'Business')}
                                        </span>
                                        {business.verified && (
                                            <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-100">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                            </span>
                                        )}
                                        {business.isFeatured && (
                                            <span className="px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-orange-100">
                                                Sponsored
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-2 flex items-center gap-3 flex-wrap">
                                        {business.logo && (
                                            <img 
                                                src={business.logo} 
                                                alt={`${business.name} logo`} 
                                                className="w-12 h-12 rounded-xl object-contain border border-slate-200 p-1 shrink-0 bg-white" 
                                            />
                                        )}
                                        <span>{business.name}</span>
                                        {business.claimed && <CheckCircle2 className="w-6 h-6 text-blue-500" title="Verified Owner" />}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-1 bg-green-600 px-2 py-0.5 rounded text-white text-sm font-bold">
                                            {rating} <Star className="w-4 h-4 fill-white" />
                                        </div>
                                        <span className="text-slate-500 font-medium text-sm">{reviewCount} Ratings</span>
                                        <span className="text-slate-300">|</span>
                                        {(() => {
                                            const status = isBusinessOpen(business?.businessHours);
                                            return (
                                                <div className="flex items-center gap-2 cursor-pointer group/hours relative" onClick={() => setActiveTab('overview')}>
                                                    <span className={`text-sm font-bold ${status.color}`}>{status.status}</span>
                                                    <Clock className="w-4 h-4 text-slate-400 group-hover/hours:text-slate-600" />
                                                    <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 opacity-0 group-hover/hours:opacity-100 transition-all pointer-events-none w-64 text-xs">
                                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
                                                            <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Weekly Hours</span>
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${status.tone === 'open' ? 'bg-emerald-50 text-emerald-600' : status.tone === 'closed' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {status.status}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                                                const dayHours = business?.businessHours?.[day];
                                                                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                                                                return (
                                                                    <div key={day} className={`flex justify-between items-center ${isToday ? 'bg-orange-50 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
                                                                        <span className={`capitalize ${isToday ? 'font-bold text-orange-700' : 'text-slate-500'}`}>{day}</span>
                                                                        <span className={`${isToday ? 'font-bold text-orange-600' : 'text-slate-700'}`}>
                                                                            {formatDayHours(dayHours)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {business.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {business.tags.map(tag => (
                                                <span key={tag} className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-tighter">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                            <MapPin className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <div className="text-slate-600">
                                            <p className="font-semibold text-slate-900 text-sm">{business.address}</p>
                                            <p className="text-xs mt-0.5">
                                                {business.area_id?.name && `${business.area_id.name}, `}
                                                {business.city_id?.name && `${business.city_id.name}, `}
                                                {business.state_id?.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                                        <button 
                                            onClick={handleCall}
                                            className="bg-green-600 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                                        >
                                            <Phone className="w-5 h-5 text-green-200" />
                                            Call
                                        </button>
                                        <button 
                                            onClick={() => {
                                                logAnalyticsEvent('whatsapp', business._id);
                                                const msg = encodeURIComponent(`Hi ${business.name}, I found your listing on Fuerte Developers and would like to inquire about your services.`);
                                                window.open(`https://wa.me/${business.phone || '919972219375'}?text=${msg}`, '_blank');
                                            }}
                                            className="bg-emerald-500 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                        >
                                            <MessageSquare className="w-5 h-5 text-emerald-100" />
                                            WhatsApp
                                        </button>
                                        <button 
                                            onClick={handleDirections}
                                            className="bg-blue-600 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                        >
                                            <MapPin className="w-5 h-5 text-blue-200" />
                                            Directions
                                        </button>
                                        <button 
                                            onClick={() => setIsEnquiryModalOpen(true)}
                                            className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-3.5 rounded-xl font-bold hover:border-orange-500 hover:text-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            Enquiry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex gap-8">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                                        activeTab === tab.id 
                                        ? 'border-orange-600 text-orange-600' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Tab Content */}
                        {/* min-w-0: a flex item's intrinsic min-width defaults to its content's
                            width, which overrides child break-words for a long unbroken string -
                            without this the About text pushes the column wide instead of wrapping */}
                        <div className="lg:col-span-2 flex-1 min-w-0 space-y-8">
                            
                            {activeTab === 'overview' && (
                                <>
                                    <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6">About {business.name}</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base">
                                            {business.description || `${business.name} is a leading provider in ${typeof business.category === 'object' ? business.category.name : (business.category || 'their industry')}, known for quality and excellence in ${business.city_id?.name || 'their region'}.`}
                                        </p>
                                    </section>

                                    <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                            {[
                                                { label: 'Year of Establishment', value: business.yearEstablished || 'N/A' },
                                                { label: 'Payment Methods', value: business.paymentMethods ? business.paymentMethods.join(', ') : 'N/A' },
                                                { label: 'GST Number', value: business.gstNumber || 'N/A' },
                                                { label: 'Business Type', value: business.businessType ? business.businessType.join(', ') : 'N/A' },
                                                { 
                                                    label: 'Timings', 
                                                    value: (
                                                        <div className="flex flex-col gap-1 w-full">
                                                            <div className="flex items-center justify-between">
                                                                {(() => {
                                                                    const status = isBusinessOpen(business?.businessHours);
                                                                    return <span className={`font-bold ${status.color}`}>{status.status}</span>;
                                                                })()}
                                                                <button
                                                                    onClick={() => setShowFullHours(!showFullHours)}
                                                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                                                >
                                                                    {showFullHours ? 'Show Less' : 'Full Week'}
                                                                </button>
                                                            </div>
                                                            {showFullHours && (
                                                                <div className="mt-3 space-y-2 pt-3 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                                                        const h = business?.businessHours?.[day];
                                                                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                                                                        return (
                                                                            <div key={day} className={`flex justify-between text-xs ${isToday ? 'bg-indigo-50 -mx-3 px-3 py-1.5 rounded-lg border border-indigo-100' : ''}`}>
                                                                                <span className={`capitalize ${isToday ? 'font-black text-indigo-700' : 'text-slate-500'}`}>{day}</span>
                                                                                <span className={`${isToday ? 'font-black text-indigo-600' : 'text-slate-700'}`}>
                                                                                    {formatDayHours(h)}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {!showFullHours && (
                                                                <span className="text-sm font-semibold text-slate-700">
                                                                    {(() => {
                                                                        const d = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                                        const h = business?.businessHours?.[d];
                                                                        return h && h.closed ? 'Closed Today' : formatDayHours(h);
                                                                    })()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                },
                                                { label: 'Website', value: `www.${business.slug}.com` },
                                            ].map((info, idx) => (
                                                <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-3">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{info.label}</span>
                                                    <span className="text-sm font-semibold text-slate-700">{info.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}

                            {activeTab === 'products' && (
                                <section className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-slate-900">
                                            Products in {business.name} in {business.area_id?.name || business.city_id?.name || 'your area'}
                                        </h3>
                                        
                                        {/* Category Filter Bar */}
                                        {offerings.length > 0 && (
                                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                                                <button
                                                    onClick={() => setSelectedCategory('all')}
                                                    className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                                                        selectedCategory === 'all'
                                                        ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    All
                                                </button>
                                                {Array.from(new Set(offerings.map(item => 
                                                    item.subCategoryId?.name || item.categoryId?.name
                                                ).filter(Boolean))).map((catName, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedCategory(catName)}
                                                        className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                                                            selectedCategory === catName
                                                            ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {catName}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {offerings.filter(item => 
                                        selectedCategory === 'all' || 
                                        (item.subCategoryId?.name || item.categoryId?.name) === selectedCategory
                                    ).length > 0 ? (
                                        <div className="flex md:grid overflow-x-auto md:overflow-visible flex-nowrap md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 md:pb-0 no-scrollbar">
                                            {offerings
                                                .filter(item => 
                                                    selectedCategory === 'all' || 
                                                    (item.subCategoryId?.name || item.categoryId?.name) === selectedCategory
                                                )
                                                .map((item, idx) => {
                                                    const isProduct = item.sku !== undefined;
                                                    
                                                    return (
                                                        <div 
                                                            key={idx} 
                                                            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group flex-shrink-0 w-[165px] sm:w-[220px] md:w-auto"
                                                        >
                                                            {/* Image Container */}
                                                            <Link to={isProduct ? `/product/${item.slug}` : '#'} className="block relative aspect-[4/3] bg-slate-50 overflow-hidden">
                                                                {item.images?.[0] ? (
                                                                    <img 
                                                                        src={item.images[0]} 
                                                                        alt={item.name} 
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-250">
                                                                        <ImageIcon className="w-8 h-8 md:w-12 md:h-12" />
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Labels */}
                                                                <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2">
                                                                    {isProduct ? (
                                                                        <span className="px-1 py-0.2 bg-white/90 backdrop-blur-sm rounded text-[8px] md:text-[9px] font-black text-rose-600 uppercase tracking-tighter border border-rose-100 italic">
                                                                            Trending
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1 py-0.2 bg-white/90 backdrop-blur-sm rounded text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-tighter border border-blue-100 italic">
                                                                            Service
                                                                        </span>
                                                                    )}
                                                                </div>
 
                                                                {/* Save Product Heart Button */}
                                                                {isProduct && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleProductSaveToggle(item);
                                                                        }}
                                                                        className={`absolute top-2 right-2 md:top-3 md:right-3 p-1 md:p-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 z-10 ${
                                                                            savedProductIds.includes(item._id)
                                                                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                                                                            : 'bg-white/90 text-slate-600 hover:text-rose-500'
                                                                        }`}
                                                                        title={savedProductIds.includes(item._id) ? "Remove from Favorites" : "Add to Favorites"}
                                                                    >
                                                                        <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${savedProductIds.includes(item._id) ? 'fill-current' : ''}`} />
                                                                    </button>
                                                                )}
                                                            </Link>
 
                                                            {/* Content */}
                                                            <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                                                                <div className="mb-2 md:mb-3">
                                                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                                                        {item.brandId?.name || (isProduct ? 'HAVELLS' : 'Professional')}
                                                                    </span>
                                                                    <Link to={isProduct ? `/product/${item.slug}` : '#'}>
                                                                        <h4 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                                                            {item.name}
                                                                        </h4>
                                                                    </Link>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap items-center gap-1.5 md:gap-4 mb-2 md:mb-4">
                                                                    <div className="flex items-center gap-0.5 bg-green-600 px-1 py-0.2 rounded text-white text-[10px] md:text-xs font-bold">
                                                                        {business.rating || 0} <Star className="w-2.5 h-2.5 fill-white" />
                                                                    </div>
                                                                    <span className="text-[10px] md:text-xs text-slate-500 font-medium leading-none">{business.reviewCount || 0} Ratings</span>
                                                                </div>
 
                                                                <div className="mt-auto">
                                                                    {item.price && (
                                                                        <div className="mb-2 md:mb-4">
                                                                            <span className="text-sm md:text-lg font-black text-slate-900 italic">₹ {item.price.toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <button 
                                                                        onClick={handleEnquire}
                                                                        className="w-full py-1.5 md:py-2.5 text-blue-600 border border-blue-200 rounded-lg text-[11px] md:text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                                                                    >
                                                                        Get Best Deal
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                            <p className="text-slate-400 font-medium italic">No items found in this category.</p>
                                        </div>
                                    )}
                                </section>
                            )}

                            {activeTab === 'reviews' && (
                                <section className="space-y-8">
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-8">User Reviews & Ratings</h3>
                                        <div className="flex flex-col md:flex-row gap-12 items-center border-b border-slate-100 pb-12 mb-10">
                                            <div className="text-center px-8 border-r border-slate-100">
                                                <div className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{business.rating || 0}</div>
                                                <div className="flex justify-center my-3">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <Star key={i} className={`w-5 h-5 ${i <= Math.floor(business.rating || 0) ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{business.reviewCount || 0} verified reviews</div>
                                            </div>
                                            <div className="flex-1 w-full space-y-3 max-w-sm">
                                                {[5, 4, 3, 2, 1].map(stars => {
                                                    let count = 0;
                                                    let total = reviews.length;
                                                    
                                                    if (business.ratingDistribution && business.ratingDistribution[stars] !== undefined) {
                                                        count = business.ratingDistribution[stars];
                                                        total = business.reviewCount || reviews.length;
                                                    } else {
                                                        count = reviews.filter(r => r.rating === stars).length;
                                                    }

                                                    const percentage = total > 0 ? (count / total) * 100 : 0;
                                                    return (
                                                        <div key={stars} className="flex items-center gap-4 group cursor-default">
                                                            <div className="flex items-center gap-1 w-8">
                                                                <span className="text-xs font-black text-slate-600">{stars}</span>
                                                                <Star className="w-3 h-3 fill-slate-300 text-slate-300 group-hover:fill-orange-400 group-hover:text-orange-400 transition-colors" />
                                                            </div>
                                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 w-10 text-right">{Math.round(percentage)}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Single Review Enforcement / Edit Form */}
                                        <div id="review-form" className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 lg:p-8 mb-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 mb-1">
                                                        {isEditingReview ? 'Edit Your Review' : (userReview ? 'Your Review' : 'Write a Review')}
                                                    </h3>
                                                    <p className="text-sm font-bold text-slate-500">
                                                        {isEditingReview ? 'Update your feedback for this business' : (userReview ? 'Thank you for your feedback!' : 'Share your experience with others')}
                                                    </p>
                                                </div>
                                                {userReview && !isEditingReview && (
                                                    <button 
                                                        onClick={handleEditReview}
                                                        className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-black text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        Edit Review
                                                    </button>
                                                )}
                                            </div>

                                            {userReview && !isEditingReview ? (
                                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    className={`w-4 h-4 ${i < userReview.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            userReview.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                                            userReview.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                        }`}>
                                                            {userReview.status}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 mb-4 leading-relaxed line-clamp-3">
                                                        {userReview.comment}
                                                    </p>
                                                    {userReview.images && userReview.images.length > 0 && (
                                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                                            {userReview.images.map((img, i) => (
                                                                <img key={i} src={img} alt="Review" className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Posted on {new Date(userReview.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                                    <div className="space-y-4">
                                                        {/* Aspects Rating */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {Object.keys(newReview.aspects).map((aspect) => (
                                                                <div key={aspect} className="bg-white border border-slate-200 rounded-2xl p-4">
                                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{aspect}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                onClick={() => setNewReview({
                                                                                    ...newReview,
                                                                                    aspects: { ...newReview.aspects, [aspect]: i + 1 },
                                                                                    rating: Math.ceil(Object.values({ ...newReview.aspects, [aspect]: i + 1 }).reduce((a,b)=>a+b, 0) / 3)
                                                                                })}
                                                                                className="focus:outline-none transition-transform hover:scale-110"
                                                                            >
                                                                                <Star 
                                                                                    className={`w-5 h-5 ${i < newReview.aspects[aspect] ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} 
                                                                                />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="relative">
                                                            <textarea
                                                                required
                                                                placeholder="Share your experience with this business..."
                                                                value={newReview.comment}
                                                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                                className={`w-full px-4 py-3 bg-white border rounded-xl h-24 text-sm font-bold text-slate-700 focus:ring-2 outline-none resize-none transition-all ${
                                                                    newReview.comment.length > 0 && newReview.comment.length < 20 
                                                                    ? 'border-rose-300 focus:ring-rose-500' 
                                                                    : 'border-slate-200 focus:ring-orange-500'
                                                                }`}
                                                            />
                                                            <div className={`absolute bottom-2 right-3 text-[10px] font-bold ${
                                                                newReview.comment.length >= 20 ? 'text-emerald-500' : 'text-slate-400'
                                                            }`}>
                                                                {newReview.comment.length}/20 min
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                            <Camera className="w-5 h-5 text-orange-500" />
                                                            Add Photos
                                                        </div>
                                                        <div className="flex flex-wrap gap-3">
                                                            {selectedReviewImages.map((url, idx) => (
                                                                <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                                                                    <img src={url} className="w-full h-full object-cover" />
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setSelectedReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-rose-50 hover:text-rose-600"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {selectedReviewImages.length < 5 && (
                                                                <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all text-slate-400 hover:text-orange-500 bg-white">
                                                                    {isUploadingImages ? (
                                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <Upload className="w-6 h-6 mb-1.5" />
                                                                            <span className="text-[10px] font-black uppercase tracking-wider">Add Photo</span>
                                                                        </>
                                                                    )}
                                                                    <input 
                                                                        type="file" 
                                                                        multiple 
                                                                        accept="image/*" 
                                                                        className="hidden" 
                                                                        onChange={handleImageUpload} 
                                                                        disabled={isUploadingImages}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold italic">You can upload up to 5 photos to showcase your experience.</p>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            disabled={isSubmittingReview || isUploadingImages}
                                                            type="submit"
                                                            className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                                                        >
                                                            {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditingReview ? 'Update Review' : 'Post My Review')}
                                                        </button>
                                                        {isEditingReview && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsEditingReview(false);
                                                                    setNewReview({ rating: 5, comment: '', aspects: { quality: 5, service: 5, value: 5 } });
                                                                    setSelectedReviewImages([]);
                                                                }}
                                                                className="px-6 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </form>
                                            )}
                                        </div>

                                        {/* Review Toolbar: Sort & Filter */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                                            <div className="flex flex-col gap-4 w-full md:w-auto">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Filter className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Filter Reviews</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { id: 'all', label: `All Reviews (${reviewCounts.all || 0})` },
                                                        { id: 'photos', label: `With Photos (${reviewCounts.photos || 0})` },
                                                        { id: 'quality', label: `Quality (${reviewCounts.quality || 0})` },
                                                        { id: 'service', label: `Service (${reviewCounts.service || 0})` },
                                                        { id: 'value', label: `Value (${reviewCounts.value || 0})` }
                                                    ].map(f => (
                                                        <button
                                                            key={f.id}
                                                            onClick={() => setReviewFilter(f.id)}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                                                reviewFilter === f.id
                                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {f.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Star className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Sort By</span>
                                                </div>
                                                <select 
                                                    value={reviewSort}
                                                    onChange={(e) => setReviewSort(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all flex-1 md:flex-none min-w-[160px] shadow-sm cursor-pointer"
                                                >
                                                    <option value="recent">Most Recent</option>
                                                    <option value="helpful">Most Helpful</option>
                                                    <option value="ratingHigh">Highest Rating</option>
                                                    <option value="ratingLow">Lowest Rating</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Dynamic Review List */}
                                        <div className="space-y-6">
                                            {reviewsLoading ? (
                                                <div className="py-10 text-center">
                                                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                                                </div>
                                            ) : reviews.length > 0 ? (
                                                reviews.map((rev) => (
                                                    <div key={rev._id} className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-orange-100 hover:shadow-md transition-all group">
                                                        <div className="flex gap-4 mb-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shrink-0 text-xl shadow-sm border border-indigo-100/50">
                                                                {rev.userId?.name?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h5 className="font-black text-slate-900 text-sm tracking-tight">{rev.userId?.name || 'Anonymous User'}</h5>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <div className="flex">
                                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                                    <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} />
                                                                                ))}
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded">
                                                                                {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {rev.verified_purchase && (
                                                                            <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">
                                                                                <ShieldCheck className="w-3 h-3" /> Verified Purchase
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Review Body */}
                                                        <div className="space-y-4">
                                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                                {rev.comment}
                                                            </p>

                                                            {/* Review Photos */}
                                                            {rev.images && rev.images.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-2">
                                                                    {rev.images.map((img, idx) => (
                                                                        <div 
                                                                            key={idx} 
                                                                            className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer border border-slate-100 hover:border-orange-300 transition-colors shadow-sm"
                                                                        >
                                                                            <img src={img} className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Aspect Breakdown (Micro) */}
                                                            {rev.aspects && (
                                                                <div className="flex flex-wrap gap-4 pt-2">
                                                                    {Object.entries(rev.aspects).map(([key, val]) => val > 0 && (
                                                                        <div key={key} className="flex items-center gap-1.5">
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{key}:</span>
                                                                            <div className="flex">
                                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                                    <div key={s} className={`w-1.5 h-1.5 rounded-full mx-0.5 ${s <= val ? 'bg-orange-400' : 'bg-slate-200'}`} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Merchant Response */}
                                                            {rev.ownerReply?.text && (
                                                                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 relative">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Business Response</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                                                        "{rev.ownerReply.text}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Footer: Helpful Vote & Report */}
                                                            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-50">
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-[10px] font-bold text-slate-400">Was this review helpful?</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <button 
                                                                            onClick={() => handleVote(rev._id, 'helpful')}
                                                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                                                                                rev.helpfulVotes?.voters?.includes(user?._id)
                                                                                ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200'
                                                                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            <ThumbsUp className={`w-3 h-3 ${rev.helpfulVotes?.voters?.includes(user?._id) ? 'fill-orange-600' : ''}`} />
                                                                            {rev.helpfulVotes?.count || 0}
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleVote(rev._id, 'notHelpful')}
                                                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                                                                                rev.notHelpfulVotes?.voters?.includes(user?._id)
                                                                                ? 'bg-slate-100 text-slate-800 ring-1 ring-slate-200'
                                                                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            <ThumbsDown className={`w-3 h-3 ${rev.notHelpfulVotes?.voters?.includes(user?._id) ? 'fill-slate-800' : ''}`} />
                                                                            {rev.notHelpfulVotes?.count || 0}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewToReport(rev);
                                                                        setIsReportReviewModalOpen(true);
                                                                    }}
                                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors py-1 px-2 hover:bg-rose-50 rounded-lg"
                                                                >
                                                                    <Flag className="w-3.5 h-3.5" />
                                                                    Report Concern
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                                    <p className="text-slate-400 font-medium italic">No reviews yet. Be the first to rate this business!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'questions' && (
                                <section className="space-y-8">
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-8">Questions & Answers</h3>
                                        
                                        <div className="mb-10 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                                            <h4 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                                Ask a Question
                                            </h4>
                                            <p className="text-xs text-slate-500 mb-6 font-medium italic">Have a specific doubt? Get direct answers from the business owner.</p>
                                            <form onSubmit={handleQuestionSubmit} className="space-y-4 relative z-10">
                                                <textarea
                                                    required
                                                    placeholder="Example: Do you offer home delivery in the evening?"
                                                    value={newQuestionText}
                                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                                    className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-white rounded-2xl h-28 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none resize-none shadow-inner transition-all hover:bg-white"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmittingQuestion}
                                                    className="bg-blue-600 text-white px-10 py-3.5 rounded-xl text-sm font-black hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-200 uppercase tracking-widest"
                                                >
                                                    {isSubmittingQuestion ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ask Business Now <ArrowRight className="w-4 h-4" /></>}
                                                </button>
                                            </form>
                                        </div>

                                        <div className="space-y-6">
                                            {questionsLoading ? (
                                                <div className="py-10 text-center">
                                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                                </div>
                                            ) : questions.length > 0 ? (
                                                questions.map((q) => (
                                                    <div key={q._id} className="p-5 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                                                                Q
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-slate-900 text-sm leading-snug">{q.questionText}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{q.userId?.name}</span>
                                                                    <span className="text-[10px] text-slate-300">•</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(q.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {q.isAnswered ? (
                                                            <div className="flex items-start gap-3 pl-11 mt-4">
                                                                <div className="flex-1 bg-green-50/50 p-4 rounded-xl border border-green-100 relative">
                                                                    <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-green-600 uppercase tracking-widest border border-green-100 rounded">Answer</div>
                                                                    <p className="text-sm text-slate-700 leading-relaxed italic">"{q.answerText}"</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Replied by {business.name}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="pl-11 mt-4">
                                                                <p className="text-xs text-slate-400 font-medium italic">Pending answer from business...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                                    <p className="text-slate-400 font-medium italic">No questions found. Be the first to ask!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'photos' && (
                                <section className="space-y-8">
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-8">Photos & Videos</h3>
                                        {business.photos?.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {business.photos.map((photo, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => {
                                                            setActivePhotoIndex(idx);
                                                            setIsLightboxOpen(true);
                                                        }}
                                                        className="aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer group relative"
                                                    >
                                                        <img src={photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                                <p className="text-slate-400 font-medium italic">No photos uploaded yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {activeTab === 'review-photos' && (
                                <section className="space-y-8">
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-8 italic">Experience Gallery <span className="text-slate-400 font-medium not-italic">({reviews.filter(r => r.images?.length > 0).reduce((acc, r) => acc + r.images.length, 0)} Photos)</span></h3>
                                        
                                        {reviews.some(r => r.images?.length > 0) ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {reviews.flatMap(r => r.images.map((img, idx) => ({ img, user: r.userId?.name, date: r.createdAt }))).map((item, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => {
                                                            setSelectedImage(item.img);
                                                            setIsLightboxOpen(true);
                                                        }}
                                                        className="aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm hover:ring-2 hover:ring-orange-500 transition-all font-sans"
                                                    >
                                                        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <div className="w-5 h-5 rounded-lg bg-orange-400 flex items-center justify-center font-black text-white text-[10px] shadow-sm">
                                                                    {item.user?.charAt(0).toUpperCase() || '?'}
                                                                </div>
                                                                <span className="text-[10px] text-white font-bold truncate tracking-tight">{item.user || 'User'}</span>
                                                            </div>
                                                            <p className="text-[7px] text-slate-300 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                                                                <Maximize2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 shadow-sm">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                                <h4 className="text-slate-800 font-bold mb-1">No Review Photos Yet</h4>
                                                <p className="text-slate-400 text-xs font-medium italic">Be the first to share your experience with photos!</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column: Sidebar */}
                        <div className="lg:w-96 space-y-6 flex-shrink-0">
                            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-5">Contact Information</h3>
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Phone</span>
                                            <span className="text-sm font-bold text-slate-700">{business.phone || '09972219375'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Website</span>
                                            <span className="text-sm font-bold text-slate-700 truncate block">www.{business.slug}.com</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email</span>
                                            <span className="text-sm font-bold text-slate-700 truncate block">{business.email || `info@${business.slug}.com`}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            
                            {business.claimed && (
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                            <ShieldCheck className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900">Verified Profile</h4>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Premium Listing</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed italic mb-4">
                                        This business is verified and managed by the owner. information provided is accurate and up-to-date.
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Trustworthy & Reliable</span>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            )}

                            {!business.claimed && (
                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h4 className="text-xl font-bold mb-2">Claim Business</h4>
                                        <p className="text-indigo-100 text-xs mb-6 opacity-80 leading-relaxed italic">Is this your business? Claim it now to update information and respond to customer reviews.</p>
                                        
                                        {claimSuccess || business.isClaimPending ? (
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-3">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-xs">Request Pending</span>
                                                    <span className="text-indigo-100 text-[10px]">Being reviewed by admin...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handleClaimClick}
                                                disabled={claimLoading}
                                                className="w-full bg-white text-indigo-700 py-3 rounded-xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                {claimLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim Now"}
                                            </button>
                                        )}
                                    </div>
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                                </div>
                            )}                             {business.claimed && business.owner?._id === user?._id && (
                                <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl group border border-slate-800">
                                     <div className="relative z-10">
                                        <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                            Business Owner
                                        </h4>
                                        <p className="text-slate-400 text-xs mb-6 font-medium italic">You are managing this premium profile.</p>
                                        <Link 
                                            to="/brand/listings"
                                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-900/50"
                                        >
                                            Go to Dashboard
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => setIsReportModalOpen(true)}
                                className="w-full py-4 text-rose-500 font-bold text-sm bg-white border border-rose-100 rounded-2xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Info className="w-4 h-4" />
                                Report Listing
                            </button>
                        </div>
                    </div>
                </div>

                {/* Similar Businesses Section */}
                {similarBusinesses.length > 0 && (
                    <div className="bg-slate-50 border-t border-slate-200 py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2 italic">Similar Discoveries</h3>
                                    <p className="text-slate-500 text-sm font-medium">Explore other popular {business.category_id?.name || 'businesses'} in {business.city_id?.name || 'this area'}.</p>
                                </div>
                                <Link to={`/search?category=${business.category_id?.name || ''}`} className="text-orange-600 font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRight className="w-4 h-4" /></Link>
                            </div>
                            <div className="flex md:grid overflow-x-auto md:overflow-visible flex-nowrap md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4 md:pb-0 no-scrollbar">
                                {similarBusinesses.map(item => (
                                    <Link key={item._id} to={`/business/${item.slug}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group flex-shrink-0 w-[165px] sm:w-[220px] md:w-auto">
                                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                            <img src={item.image || item.photos?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-black text-green-600 flex items-center gap-0.5 md:gap-1">
                                                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" /> {item.rating}
                                            </div>
                                        </div>
                                        <div className="p-2.5 md:p-5">
                                            <h4 className="font-bold text-slate-800 text-xs md:text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">{item.name}</h4>
                                            <div className="flex items-center gap-1 text-slate-400 mb-3 md:mb-4">
                                                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tight line-clamp-1">{item.address}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-50">
                                                <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.reviewCount} Ratings</span>
                                                <span className="text-orange-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5">Details <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" /></span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>

        {/* Mobile View */}
        <div className="block md:hidden min-h-screen bg-[#0e0e10] text-[#ffffff] font-sans antialiased pb-10">
            {/* Top search bar */}
            <div className="flex items-center gap-2 px-3 py-3.5 border-b border-[#232326] bg-[#0e0e10] sticky top-0 z-30">
                <Link to="/" className="w-8 h-8 rounded-lg bg-[#1c2a3d] flex items-center justify-center text-[#4a90e2] flex-shrink-0">
                    <Settings className="w-4 h-4" />
                </Link>
                <Link to="/search" className="flex-1 h-9 rounded-lg border border-[#2c2c30] bg-transparent flex items-center gap-2 px-3 text-[#8a8a90] text-sm">
                    <Search className="w-4 h-4" />
                    Find local industries
                </Link>
                <button onClick={() => navigate('/')} className="text-[#d5d5d8] flex-shrink-0">
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Cover image */}
            <div className="relative h-[220px] bg-gradient-to-r from-[#5b1a2b] via-[#3a2350] to-[#1b2a4d] flex items-center justify-center">
                {displayImg ? (
                    <img src={displayImg} className="w-full h-full object-cover" alt={business.name} />
                ) : (
                    <ImageIcon className="w-8 h-8 text-white/50" />
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                        onClick={handleBookmarkToggle}
                        className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center text-sm shadow-sm"
                    >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-orange-500 text-orange-500' : ''}`} />
                    </button>
                    <button 
                        onClick={() => handleShare('native')}
                        className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center text-sm shadow-sm"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
                <button 
                    onClick={() => {
                        if (business.photos?.length > 0) {
                            setActivePhotoIndex(0);
                            setIsLightboxOpen(true);
                        }
                    }}
                    className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm"
                >
                    <ImageIcon className="w-3.5 h-3.5" /> See {business.photos?.length || 0} photos
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <span className="inline-block text-xs text-[#6fb1ff] bg-[#16233a] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider">
                    {business.category_id?.name || 'Technology and software'}
                </span>

                <div className="flex items-center gap-2.5 mt-3">
                    <div className="w-[42px] h-[42px] rounded-lg bg-[#3a1414] text-[#e06868] flex items-center justify-center text-xl font-bold flex-shrink-0 border border-red-950">
                        {business.logo ? (
                            <img src={business.logo} className="w-full h-full object-contain rounded-lg" alt="logo" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-[#e06868]" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                        {business.name}
                        {business.verified && <CheckCircle className="w-5 h-5 text-[#4a90e2] fill-[#0e0e10]" />}
                    </h1>
                </div>

                <div className="flex items-center gap-2.5 mt-2.5 text-xs text-slate-400">
                    <span className="bg-[#163b1e] text-[#4ecb6a] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        {rating.toFixed(1)} <Star className="w-3 h-3 fill-current" />
                    </span>
                    <span className="text-[#9a9a9e]">{reviewCount} ratings</span>
                    <span className="text-[#4ecb6a] font-semibold">Open Now</span>
                </div>

                <div className="flex items-start gap-2 mt-3.5">
                    <MapPin className="w-4 h-4 text-[#8a8a90] mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="font-semibold text-[15px] text-white">{business.area_id?.name || business.address || 'Aji industrial area'}</div>
                        <div className="text-[13px] text-[#9a9a9e] mt-0.5">{(business.city_id?.name || 'Rajkot')}, {(business.state_id?.name || 'Gujarat')}</div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2.5 mt-4.5">
                    <button onClick={handleCall} className="h-11 rounded-lg border-0 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer bg-[#1f9d3d] text-white hover:bg-[#1b8534] active:scale-98 transition-all">
                        <Phone className="w-4 h-4" /> Call
                    </button>
                    <button onClick={handleWhatsApp} className="h-11 rounded-lg border-0 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer bg-[#1f9d3d] text-white hover:bg-[#1b8534] active:scale-98 transition-all">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button onClick={handleDirections} className="h-11 rounded-lg border-0 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer bg-[#3573e0] text-white hover:bg-[#2b61c2] active:scale-98 transition-all">
                        <Map className="w-4 h-4" /> Directions
                    </button>
                    <button onClick={handleEnquire} className="h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer bg-transparent border border-[#3a3a3e] text-white hover:bg-white/5 transition-all">
                        Enquiry
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-6 overflow-x-auto pb-2.5 border-b border-[#232326] no-scrollbar">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'products', label: 'Products' },
                        { id: 'reviews', label: 'Reviews' },
                        { id: 'questions', label: 'Q and A' },
                        { id: 'photos', label: 'Photos' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id === 'questions' ? 'questions' : t.id)}
                            className={`text-sm flex-shrink-0 pb-2 border-b-2 -mb-[12px] transition-all font-bold ${
                                (activeTab === 'questions' ? 'questions' : activeTab) === (t.id === 'questions' ? 'questions' : t.id)
                                ? 'text-[#4a90e2] border-[#4a90e2]' 
                                : 'text-[#9a9a9e] border-transparent'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab contents */}
                <div className="mt-4">
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <div className="bg-[#1a1a1d] rounded-2xl p-4 border border-[#232326]">
                                <div className="text-base font-semibold text-white mb-2">About {business.name}</div>
                                <div className="text-sm text-[#b0b0b4] leading-relaxed whitespace-pre-wrap break-words">
                                    {business.description || `${business.name} is a leading provider in technology and software, known for quality and excellence in Rajkot.`}
                                </div>
                            </div>

                            <div className="bg-[#1a1a1d] rounded-2xl p-4 border border-[#232326]">
                                <div className="text-base font-semibold text-white mb-3">Contact information</div>
                                <div className="flex items-center gap-2.5 text-sm py-2 border-b border-[#232326] text-[#b0b0b4]">
                                    <Phone className="w-4 h-4 text-[#8a8a90]" /> {business.phone || '1234567890'}
                                </div>
                                <div className="flex items-center gap-2.5 text-sm py-2 border-b border-[#232326] text-[#6fb1ff]">
                                    <Globe className="w-4 h-4 text-[#8a8a90]" /> 
                                    <a href={business.website ? (business.website.startsWith('http') ? business.website : `https://${business.website}`) : '#'} target="_blank" rel="noreferrer" className="text-[#6fb1ff] no-underline">
                                        {business.website || `www.${business.slug}.com`}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm py-2 text-[#b0b0b4]">
                                    <Mail className="w-4 h-4 text-[#8a8a90]" /> {business.email || `${business.slug}@gmail.com`}
                                </div>
                            </div>

                            <div className="bg-[#1a1a1d] rounded-2xl p-4 border border-[#232326]">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-[#8a8a90] uppercase tracking-wider mb-1">Established</div>
                                        <div className="text-sm font-semibold text-white">{business.yearEstablished || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#8a8a90] uppercase tracking-wider mb-1">Payment</div>
                                        <div className="text-sm font-semibold text-white">{business.paymentMethods?.join(', ') || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white mb-2">Products & Services</h3>
                            {offerings.length > 0 ? (
                                <div className="flex overflow-x-auto flex-nowrap gap-4 pb-4 no-scrollbar">
                                    {offerings.map((item, idx) => {
                                        const isProduct = item.sku !== undefined;
                                        return (
                                            <div 
                                                key={idx} 
                                                className="bg-[#1a1a1d] rounded-xl border border-[#232326] overflow-hidden flex flex-col flex-shrink-0 w-[165px]"
                                            >
                                                <Link to={isProduct ? `/product/${item.slug}` : '#'} className="block relative aspect-[4/3] bg-slate-900 overflow-hidden">
                                                    {item.images?.[0] ? (
                                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-650">
                                                            <ImageIcon className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                        <span className="px-1 py-0.2 bg-black/60 rounded text-[8px] font-black text-rose-400 uppercase border border-rose-950">
                                                            {isProduct ? 'Trending' : 'Service'}
                                                        </span>
                                                    </div>
                                                </Link>
                                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-[#8a8a90] uppercase tracking-widest block mb-1">
                                                            {item.brandId?.name || (isProduct ? 'HAVELLS' : 'Professional')}
                                                        </span>
                                                        <Link to={isProduct ? `/product/${item.slug}` : '#'}>
                                                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                                                                {item.name}
                                                            </h4>
                                                        </Link>
                                                    </div>
                                                    <div className="mt-3">
                                                        {item.price && (
                                                            <div className="mb-2">
                                                                <span className="text-sm font-black text-white italic">₹ {item.price.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <button 
                                                            onClick={handleEnquire}
                                                            className="w-full py-1.5 text-[#6fb1ff] border border-blue-900 bg-[#16233a] rounded-lg text-[11px] font-bold transition-all flex items-center justify-center"
                                                        >
                                                            Get Best Deal
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-10 text-center border-2 border-dashed border-[#232326] rounded-2xl">
                                    <p className="text-[#8a8a90] font-medium italic">No items found in this category.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">User Reviews</h3>
                            <div className="bg-[#1a1a1d] p-4 rounded-2xl border border-[#232326]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-4xl font-black text-white">{rating.toFixed(1)}</div>
                                    <div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[#3a3a3e]'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-[#9a9a9e] mt-1 block">{reviewCount} total ratings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Questions & Answers</h3>
                            <div className="py-10 text-center border border-[#232326] bg-[#1a1a1d] rounded-2xl">
                                <p className="text-[#9a9a9e] text-sm">Ask a question about this business</p>
                                <button onClick={handleEnquire} className="mt-3 px-4 py-2 bg-[#4a90e2] text-white rounded-lg text-xs font-bold">Ask Question</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'photos' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white">Photos</h3>
                            {business.photos?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {business.photos.map((p, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setActivePhotoIndex(idx);
                                                setIsLightboxOpen(true);
                                            }}
                                            className="aspect-video rounded-xl bg-slate-900 overflow-hidden cursor-pointer border border-[#232326]"
                                        >
                                            <img src={p} className="w-full h-full object-cover" alt="gallery item" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center border border-[#232326] bg-[#1a1a1d] rounded-2xl">
                                    <p className="text-[#8a8a90] text-sm font-medium italic">No photos available.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Claim Modal - Ported from old version with improved UI */}
        {isClaimModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <button 
                                onClick={() => setIsClaimModalOpen(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Info className="w-5 h-5 rotate-45" />
                            </button>
                            <h3 className="text-2xl font-black mb-1">Verify Ownership</h3>
                            <p className="text-indigo-100 text-xs opacity-80 italic tracking-wide">Enter details to claim <span className="text-white font-bold not-italic">{business.name}</span></p>
                        </div>

                        <form onSubmit={handleClaimSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={claimFormData.fullName}
                                        onChange={(e) => setClaimFormData({...claimFormData, fullName: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={claimFormData.position}
                                        onChange={(e) => setClaimFormData({...claimFormData, position: e.target.value})}
                                        placeholder="Owner / CEO"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                                <input 
                                    type="email" 
                                    required
                                    value={claimFormData.businessEmail}
                                    onChange={(e) => setClaimFormData({...claimFormData, businessEmail: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input 
                                    type="tel" 
                                    required
                                    value={claimFormData.phoneNumber}
                                    onChange={(e) => setClaimFormData({...claimFormData, phoneNumber: e.target.value})}
                                    placeholder="+91"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsClaimModalOpen(false)}
                                    className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={claimLoading}
                                    className="flex-[2] bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm"
                                >
                                    {claimLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Claim"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-rose-600 p-8 text-white relative">
                            <button onClick={() => setIsReportModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><Info className="w-5 h-5 rotate-45" /></button>
                            <h3 className="text-2xl font-black mb-1">Report Listing</h3>
                            <p className="text-rose-100 text-xs opacity-80 italic tracking-wide">Tell us what's wrong with this listing</p>
                        </div>
                         <form onSubmit={handleReportListing} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Issue Category</label>
                                <select 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500"
                                    value={listingReportForm.reason}
                                    onChange={(e) => setListingReportForm({ ...listingReportForm, reason: e.target.value })}
                                >
                                    <option>Business no longer exists</option>
                                    <option>Incorrect contact info</option>
                                    <option>Spam or Fake profile</option>
                                    <option>Inappropriate content</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Details</label>
                                <textarea 
                                    required 
                                    placeholder="Briefly describe the issue..." 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32 outline-none focus:ring-2 focus:ring-rose-500 resize-none" 
                                    value={listingReportForm.description}
                                    onChange={(e) => setListingReportForm({ ...listingReportForm, description: e.target.value })}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isReportingListing}
                                className="w-full bg-rose-600 text-white py-4 rounded-xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {isReportingListing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Review Modal */}
            {isReportReviewModalOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-rose-600 p-8 text-white relative">
                            <button onClick={() => setIsReportReviewModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            <h3 className="text-2xl font-black mb-1 flex items-center gap-3"><Flag className="w-6 h-6 fill-white" /> Report Review</h3>
                            <p className="text-rose-100 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Help us keep our community safe</p>
                        </div>
                        <form onSubmit={handleReportReview} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 italic font-medium">You are reporting the review by <span className="text-slate-900 font-bold not-italic">{reviewToReport?.userId?.name}</span>. Please select a reason:</p>
                                <div className="space-y-3">
                                    {['Spam', 'Inappropriate Language', 'Fake Review', 'Privacy Violation', 'Other'].map(reason => (
                                        <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${reportForm.reason === reason ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                            <input 
                                                type="radio" 
                                                name="reportReason" 
                                                value={reason} 
                                                checked={reportForm.reason === reason} 
                                                onChange={() => setReportForm({ ...reportForm, reason })}
                                                className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700">{reason}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Additional Details</label>
                                <textarea 
                                    value={reportForm.description}
                                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                    placeholder="Tell us more about why you are reporting this review..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                                />
                            </div>
                            <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 uppercase tracking-wider">Submit Report</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Lightbox / Photo Viewer */}
            {isLightboxOpen && business.photos?.length > 0 && (
                <div className="fixed inset-0 z-[120] bg-slate-900/95 backdrop-blur-xl flex flex-col p-4 md:p-10">
                    <button 
                        onClick={() => setIsLightboxOpen(false)} 
                        className="absolute top-4 right-4 md:top-10 md:right-10 text-white/60 hover:text-white p-3 transition-colors z-50 bg-black/20 hover:bg-black/50 rounded-full"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                    
                    <div className="flex-1 flex items-center justify-center relative select-none w-full max-w-6xl mx-auto">
                        <img 
                            src={business.photos[activePhotoIndex]} 
                            alt="Gallery" 
                            className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300" 
                        />
                        {business.photos.length > 1 && (
                            <>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePhotoIndex(prev => (prev === 0 ? business.photos.length - 1 : prev - 1));
                                    }} 
                                    className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 p-3 md:p-4 text-white/60 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-md"
                                >
                                    <ChevronRight className="w-8 h-8 md:w-10 md:h-10 rotate-180" />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePhotoIndex(prev => (prev === business.photos.length - 1 ? 0 : prev + 1));
                                    }} 
                                    className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 p-3 md:p-4 text-white/60 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-md"
                                >
                                    <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div className="w-full max-w-5xl mx-auto mt-6 pb-2">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-4 sm:justify-center">
                            {business.photos.map((p, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setActivePhotoIndex(idx)} 
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 focus:outline-none ${
                                        idx === activePhotoIndex 
                                        ? 'border-orange-500 scale-110 shadow-xl opacity-100 z-10 relative ring-4 ring-orange-500/20' 
                                        : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                                    }`}
                                >
                                    <img src={p} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <EnquiryModal 
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
                business={business}
            />

            {/* Phone Selection Modal */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-slate-900">Select Phone Number</h3>
                            <button 
                                onClick={() => setShowPhoneModal(false)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Choose a phone number to call {business?.name}:</p>
                        <div className="space-y-3">
                            {phoneNumbers.map((num, idx) => (
                                <a
                                    key={idx}
                                    href={`tel:${num}`}
                                    onClick={() => setShowPhoneModal(false)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-green-600 hover:bg-green-50/50 transition-all font-bold text-slate-700 hover:text-green-700 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span>{num}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-transform group-hover:translate-x-1" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
