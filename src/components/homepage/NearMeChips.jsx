import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Utensils, Hotel, HeartPulse, Dumbbell, 
    BookOpen, CreditCard, Sparkles, ShoppingBag,
    ChevronRight, ShoppingCart
} from 'lucide-react';
import { getApiUrl, apiGet } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const ICON_MAP = {
    'Utensils': Utensils,
    'Hotel': Hotel,
    'HeartPulse': HeartPulse,
    'Dumbbell': Dumbbell,
    'BookOpen': BookOpen,
    'CreditCard': CreditCard,
    'Sparkles': Sparkles,
    'ShoppingBag': ShoppingBag,
    'ShoppingCart': ShoppingCart
};

export default function NearMeChips({ selectedCity }) {
    const { settings } = useTheme();
    const hp = settings?.homepage || {};
    const navigate = useNavigate();
    const [chips, setChips] = useState([]);

    useEffect(() => {
        if (hp.discoveryChips && hp.discoveryChips.length > 0) {
            setChips(hp.discoveryChips);
            return;
        }

        const fetchChips = async () => {
            // Decorative row — on failure just stay empty rather than throwing.
            const result = await apiGet(getApiUrl('mc/public-discovery'));
            if (result.ok && Array.isArray(result.data)) {
                setChips(result.data);
            }
        };
        fetchChips();
    }, [hp.discoveryChips]);

    const handleFilterClick = (slug) => {
        const cityQuery = selectedCity ? `&location=${selectedCity.name}` : '';
        navigate(`/search?category=${slug}${cityQuery}`);
    };

    if (!chips || chips.length === 0) return null;

    return (
        <div className="w-full bg-white pb-8 -mt-2">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-slate-200"></span>
                        Quick Discovery {selectedCity && `in ${selectedCity.name}`}
                    </h2>
                </div>
                
                <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {chips.map((chip) => {
                        const IconComponent = ICON_MAP[chip.icon] || ShoppingCart;
                        return (
                            <button
                                key={chip._id || chip.slug}
                                onClick={() => handleFilterClick(chip.slug)}
                                className={`flex-none flex items-center gap-2.5 px-5 py-2.5 rounded-full border ${chip.color} hover:shadow-md transition-all active:scale-95 group font-bold text-[13px]`}
                            >
                                <IconComponent className="w-4 h-4" />
                                <span>{chip.name} Near Me</span>
                            </button>
                        );
                    })}
                    
                    <button onClick={() => navigate('/categories')} className="flex-none flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-600 font-bold text-[13px] transition-colors">
                        View More <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
}

