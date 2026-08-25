import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, apiGet } from '../../config/api';
import SectionError from '../ui/SectionError';
import {
    Utensils, Hotel, Stethoscope, BookOpen, Home,
    Wrench, Car, Sparkles, ShoppingCart, Clapperboard, Dumbbell, Briefcase, Pill, Laptop, Plane, HeartPulse, Palette
} from 'lucide-react';

// Expanded icon map for more diverse categories
const ICON_MAP = {
    restaurant: Utensils,
    restaurants: Utensils,
    hotel: Hotel,
    hotels: Hotel,
    doctor: Stethoscope,
    doctors: Stethoscope,
    education: BookOpen,
    realestate: Home,
    'real estate': Home,
    repair: Wrench,
    automobile: Car,
    beauty: Sparkles,
    'beauty spa': Sparkles,
    shopping: ShoppingCart,
    entertainment: Clapperboard,
    fitness: Dumbbell,
    gym: Dumbbell,
    business: Briefcase,
    hospitals: HeartPulse,
    contractors: Wrench,
    'pet shops': HeartPulse,
    'home decor': Palette
};

export default function CategoryGrid() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);

        // This endpoint returns a bare array.
        const result = await apiGet(`${getApiUrl('categories')}?parentId=null`);

        if (result.ok) {
            setCategories(Array.isArray(result.data) ? result.data : []);
        } else {
            setCategories([]);
            setError(result.error);
        }
        setLoading(false);
    };

    if (error) {
        return (
            <div className="w-full bg-white pt-6 pb-12">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionError
                        title="Couldn't load categories"
                        message={error}
                        onRetry={fetchCategories}
                    />
                </div>
            </div>
        );
    }
    
    // We'll show a maximum of 22 categories in the grid, or just all of them if few
    const displayCategories = categories.slice(0, 22);

    const PAGE_SIZE = 8;
    const pages = [];
    for (let i = 0; i < displayCategories.length; i += PAGE_SIZE) {
        pages.push(displayCategories.slice(i, i + PAGE_SIZE));
    }

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentIndex < pages.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else if (isRightSwipe && currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    return (
        <div className="w-full bg-white pt-6 pb-12">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-11 gap-x-4 gap-y-8">
                        {[...Array(22)].map((_, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3">
                                <div className="w-[84px] h-[84px] bg-slate-100 rounded-2xl animate-pulse" />
                                <div className="w-16 h-3 bg-slate-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : isMobile ? (
                    /* Category Swiper Slider (Mobile: 4 columns x 2 rows per page) */
                    <div className="relative w-full overflow-hidden pb-4">
                        {/* Slides Container */}
                        <div 
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {pages.map((page, pageIdx) => (
                                <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-4 gap-x-3 gap-y-5 px-1">
                                    {page.map((category) => {
                                        const normalizedSlug = category.slug?.toLowerCase().replace(/-/g, ' ') || '';
                                        const IconComponent = ICON_MAP[normalizedSlug] || ShoppingCart;
                                        
                                        return (
                                            <Link
                                                key={category._id}
                                                to={`/search?category=${category.slug}`}
                                                className="group flex flex-col items-center justify-start gap-2 transition-transform duration-200 cursor-pointer"
                                                title={category.name}
                                            >
                                                <div className="w-[68px] h-[68px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-blue-500 transition-all duration-300 relative overflow-hidden">
                                                    {category.image && (
                                                        <img
                                                            src={category.image}
                                                            alt={category.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                                            }}
                                                        />
                                                    )}
                                                    <div className={`fallback-icon ${category.image ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-slate-700`}>
                                                        <IconComponent className="w-6 h-6 stroke-[1.5]" />
                                                    </div>
                                                </div>
                                                <h3 className="text-[11px] font-medium text-slate-700 text-center leading-tight max-w-full line-clamp-2">
                                                    {category.name}
                                                </h3>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Pagination Dots */}
                        {pages.length > 1 && (
                            <div className="flex justify-center gap-1.5 mt-5">
                                {pages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-blue-600 scale-125' : 'bg-slate-300'}`}
                                        title={`Page ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Category Grid (Desktop) */
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-[repeat(11,minmax(0,1fr))] gap-x-4 gap-y-6">
                        {displayCategories.map((category) => {
                            const normalizedSlug = category.slug?.toLowerCase().replace(/-/g, ' ') || '';
                            const IconComponent = ICON_MAP[normalizedSlug] || ShoppingCart;
                            
                            return (
                                <Link
                                    key={category._id}
                                    to={`/search?category=${category.slug}`}
                                    className="group flex flex-col items-center justify-start gap-2.5 transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
                                    title={category.name}
                                >
                                    <div className="w-[84px] h-[84px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-blue-500 group-hover:shadow-[0px_4px_15px_rgba(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden">
                                        {category.image && (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                                }}
                                            />
                                        )}
                                        <div className={`fallback-icon ${category.image ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-slate-700 group-hover:text-blue-600 transition-colors`}>
                                            <IconComponent className="w-8 h-8 stroke-[1.5]" />
                                        </div>
                                    </div>
                                    <h3 className="text-[13px] font-medium text-slate-700 text-center leading-tight max-w-[90%] group-hover:text-slate-900 line-clamp-2">
                                        {category.name}
                                    </h3>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
