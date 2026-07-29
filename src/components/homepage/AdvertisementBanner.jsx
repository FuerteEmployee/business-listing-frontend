import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../config/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdvertisementBanner() {
    const [categoryBanners, setCategoryBanners] = useState([]);
    const [sidebarBanners, setSidebarBanners] = useState([]);
    const [currentCatBanner, setCurrentCatBanner] = useState(0);
    const [loading, setLoading] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);

    useEffect(() => {
        fetchPromoBanners();
    }, []);

    // Auto-rotate category banners
    useEffect(() => {
        if (!autoRotate || categoryBanners.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentCatBanner((prev) => (prev + 1) % categoryBanners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [autoRotate, categoryBanners.length]);

    const fetchPromoBanners = async () => {
        try {
            setLoading(true);
            // Fetch Category
            const catRes = await fetch(`${getApiUrl('cms/banners/public')}?type=category&status=active`);
            if (catRes.ok) {
                const data = await catRes.json();
                setCategoryBanners(data.banners || data.data || []);
            }
            
            // Fetch Sidebar
            const sbRes = await fetch(`${getApiUrl('cms/banners/public')}?type=sidebar&status=active`);
            if (sbRes.ok) {
                const data = await sbRes.json();
                setSidebarBanners(data.banners || data.data || []);
            }
        } catch (err) {
            console.error('Error fetching promo banners:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!loading && categoryBanners.length === 0 && sidebarBanners.length === 0) {
        return null; // Return nothing if no promo banners exist
    }

    const banner = categoryBanners[currentCatBanner];

    const handlePrev = () => {
        setAutoRotate(false);
        setCurrentCatBanner((prev) => (prev - 1 + categoryBanners.length) % categoryBanners.length);
    };

    const handleNext = () => {
        setAutoRotate(false);
        setCurrentCatBanner((prev) => (prev + 1) % categoryBanners.length);
    };

    return (
        <div className="bg-white py-8">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* Category Header Banners (Wide) */}
                {categoryBanners.length > 0 && (
                    <div className="w-full">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Category Header Demo</h2>
                        <div className="relative group">
                            <Link
                                to={banner?.link || '#'}
                                className="block relative rounded-2xl overflow-hidden aspect-[4/1] bg-slate-100 shadow-sm border border-slate-100"
                            >
                                <img
                                    src={banner?.imageUrl}
                                    alt={banner?.title}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                                {banner?.title && (
                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-10">
                                        <h3 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-md">{banner.title}</h3>
                                        {banner.subtitle && (
                                            <p className="text-lg md:text-xl text-slate-200 font-medium drop-shadow-sm max-w-2xl">{banner.subtitle}</p>
                                        )}
                                    </div>
                                )}
                            </Link>

                            {/* Arrow Navigation */}
                            {categoryBanners.length > 1 && (
                                <>
                                    <button onClick={handlePrev} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 hover:scale-110">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={handleNext} className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 hover:scale-110">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                        {categoryBanners.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setCurrentCatBanner(idx); setAutoRotate(false); }}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentCatBanner ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/40 w-3 hover:bg-white/60'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Sidebar Promo Banners (Grid for Demo) */}
                {sidebarBanners.length > 0 && (
                    <div className="w-full">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sidebar Promo Demo</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {sidebarBanners.map((sbBanner, index) => (
                                <Link 
                                    key={sbBanner._id || index}
                                    to={sbBanner.link || '#'}
                                    className="block relative rounded-xl overflow-hidden aspect-square bg-slate-100 shadow-sm border border-slate-100 group"
                                >
                                    <img 
                                        src={sbBanner.imageUrl} 
                                        alt={sbBanner.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                                    <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
                                        {sbBanner.title && (
                                            <h4 className="text-white font-black text-lg leading-tight drop-shadow-md mb-1">{sbBanner.title}</h4>
                                        )}
                                        {sbBanner.subtitle && (
                                            <p className="text-white/80 font-medium text-xs line-clamp-2 drop-shadow">{sbBanner.subtitle}</p>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white tracking-widest border border-white/20">
                                        Ad
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
