import { Star, MapPin, Phone, MessageSquare, ChevronLeft, ChevronRight, ShieldCheck, Wifi, Search, Bookmark, Tag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';

export default function BusinessCard({ business }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = business.images || [business.image];

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
                            onClick={(e) => {
                                e.preventDefault();
                                const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                                if (bookmarks.includes(business._id)) {
                                    localStorage.setItem('bookmarks', JSON.stringify(bookmarks.filter(id => id !== business._id)));
                                } else {
                                    localStorage.setItem('bookmarks', JSON.stringify([...bookmarks, business._id]));
                                }
                                window.dispatchEvent(new Event('bookmarksUpdated'));
                            }}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <Bookmark className={`w-5 h-5 ${JSON.parse(localStorage.getItem('bookmarks') || '[]').includes(business._id) ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
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
                    <button className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors whitespace-nowrap">
                        <Phone className="w-4 h-4" />
                        {business.phone || '09972219375'}
                    </button>
                    <button className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-semibold hover:border-slate-300 transition-colors whitespace-nowrap">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        WhatsApp
                    </button>
                    <button className="sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors whitespace-nowrap">
                        Get Best Deal
                    </button>
                </div>
            </div>
        </div>
    );
}
