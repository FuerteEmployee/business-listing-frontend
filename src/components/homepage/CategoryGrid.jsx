import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../config/api';
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const url = `${getApiUrl('categories')}?parentId=null`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                setCategories(data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return null;
    }
    
    // We'll show a maximum of 22 categories in the grid, or just all of them if few
    const displayCategories = categories.slice(0, 22);

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
                ) : (
                    /* Category Grid */
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
