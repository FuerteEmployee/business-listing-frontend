import { Star, MapPin, Phone, MessageSquare, ChevronLeft, ChevronRight, ShieldCheck, Wifi, Search, Bookmark, Tag, X, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { toast } from 'react-hot-toast';

export default function BusinessCard({ business, onEnquiryClick }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const { isAuthenticated } = useAuth();
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        const checkBookmark = async () => {
            if (isAuthenticated) {
                try {
                    const res = await fetchWithAuth(getApiUrl('me/saved'));
                    if (res.ok) {
                        const data = await res.json();
                        const list = data.data || [];
                        setIsBookmarked(list.some(item => item._id === business._id));
                    }
                } catch (e) {
                    console.error('Error checking saved business status:', e);
                }
            } else {
                const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                setIsBookmarked(bookmarks.includes(business._id));
            }
        };
        checkBookmark();
    }, [business._id, isAuthenticated]);

    const handleBookmarkToggle = async (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            try {
                const res = await fetchWithAuth(getApiUrl('me/saved/toggle'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ businessId: business._id })
                });
                if (res.ok) {
                    setIsBookmarked(!isBookmarked);
                    toast.success(!isBookmarked ? 'Business added to favorites!' : 'Business removed from favorites!');
                    window.dispatchEvent(new Event('bookmarksUpdated'));
                } else {
                    toast.error('Failed to update favorites');
                }
            } catch (err) {
                console.error('Error toggling business save status:', err);
                toast.error('An error occurred');
            }
        } else {
            try {
                const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                const bookmarksData = JSON.parse(localStorage.getItem('bookmarks_data') || '[]');
                let updatedBookmarks;
                let updatedBookmarksData;
                if (bookmarks.includes(business._id)) {
                    updatedBookmarks = bookmarks.filter(id => id !== business._id);
                    updatedBookmarksData = bookmarksData.filter(item => item._id !== business._id);
                    toast.success('Removed from favorites!');
                } else {
                    updatedBookmarks = [...bookmarks, business._id];
                    updatedBookmarksData = [...bookmarksData, {
                        _id: business._id,
                        name: business.name,
                        slug: business.slug,
                        image: business.image || business.images?.[0] || fallbackImage,
                        category: typeof business.category === 'object' ? business.category.name : business.category,
                        rating: business.rating,
                        city: business.city_id?.name || business.city?.name || 'Location'
                    }];
                    toast.success('Added to favorites!');
                }
                localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
                localStorage.setItem('bookmarks_data', JSON.stringify(updatedBookmarksData));
                setIsBookmarked(!bookmarks.includes(business._id));
                window.dispatchEvent(new Event('bookmarksUpdated'));
            } catch (err) {
                console.error('Error saving local business bookmark:', err);
            }
        }
    };
    const phoneNumbers = (business.phone || '09972219375')
        .split(/[\/,]/)
        .map(num => num.trim())
        .filter(Boolean);
    const fallbackImage = business.category_id?.image || (business.category && typeof business.category === 'object' ? business.category.image : null);
    const images = (business.images && business.images.length > 0)
        ? business.images.map(img => typeof img === 'object' ? img.url : img)
        : [business.image || fallbackImage];

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col md:flex-row min-h-fit md:min-h-[260px]">
            {/* Image Section */}
            <Link to={`/business/${business.slug}`} className="relative w-full md:w-80 aspect-[16/9] md:aspect-auto md:min-h-full bg-slate-100 overflow-hidden block">
                {images[currentImageIndex] ? (
                    <img 
                        src={images[currentImageIndex]} 
                        alt={business.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => {
                            e.target.style.display = 'none';
                            e.target.parentElement.querySelector('.fallback-initial')?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div className={`fallback-initial ${images[currentImageIndex] ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-orange-50`}>
                    <span className="text-4xl font-bold text-orange-200">{business.name?.charAt(0)}</span>
                </div>
                
                {/* Image Navigation Overlay */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
                    {images.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`} 
                        />
                    ))}
                </div>
            </Link>

            {/* Content Section */}
            <div className="flex-1 p-5 flex flex-col">
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                    <Star className="w-3 h-3 text-white fill-white" />
                                </div>
                                <Link to={`/business/${business.slug}`}>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                        {business.name}
                                    </h3>
                                </Link>
                                {business.isFeatured && (
                                    <Badge variant="warning" size="xs" className="ml-2 font-black uppercase tracking-tighter">Sponsored</Badge>
                                )}
                                {business.activeOffer && (
                                    <div className="flex items-center gap-1.5 bg-emerald-600 px-2 py-1 rounded-md text-white text-[10px] font-black uppercase tracking-tight ml-2 animate-bounce-subtle">
                                        <Tag className="w-3 h-3 fill-white" />
                                        {business.activeOffer.title}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 bg-green-600 px-1.5 py-0.5 rounded text-white text-xs font-bold">
                                    {business.rating || 0}
                                    <Star className="w-3 h-3 fill-white" />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">
                                    {business.reviewCount || 0} Ratings
                                </span>
                                <span className="text-xs font-black text-slate-400">
                                    {business.priceRange || '$$'}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 uppercase">
                                    <Search className="w-3 h-3 text-orange-500" />
                                    Top Search
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handleBookmarkToggle}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                            title="Save Business"
                        >
                            <Heart className={`w-5 h-5 ${isBookmarked ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                        </button>
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>{business.address}, {business.city_id?.name || 'Vashi'}, {business.state_id?.name || 'Navi Mumbai'}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-orange-500" />
                                <span className="font-medium text-xs">5 minutes walk to local station</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Wifi className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">WiFi</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Action Buttons - 3 Columns on larger desktop, stacking nicely on mobile */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phoneNumbers.length > 1 ? (
                        <button 
                            onClick={() => setShowPhoneModal(true)}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Phone className="w-4 h-4" />
                            Call
                        </button>
                    ) : (
                        <a 
                            href={`tel:${phoneNumbers[0] || '09972219375'}`}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                            <Phone className="w-4 h-4" />
                            Call
                        </a>
                    )}
                    <a 
                        href={`https://wa.me/${(business.whatsapp || business.phone || '9876512340').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-semibold hover:border-slate-300 transition-colors whitespace-nowrap"
                    >
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        WhatsApp
                    </a>
                    <button 
                        onClick={onEnquiryClick}
                        className="sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        Get Best Deal
                    </button>
                </div>
            </div>

            {/* Phone Selection Modal */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                        <p className="text-sm text-slate-500 mb-6 font-medium">Choose a phone number to call {business.name}:</p>
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
        </div>
    );
}
