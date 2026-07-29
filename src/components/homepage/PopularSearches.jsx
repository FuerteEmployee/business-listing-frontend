import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function PopularSearches({ selectedCity }) {
    const { settings } = useTheme();
    const [searches, setSearches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generatePopularSearches();
    }, [selectedCity, settings]);

    const generatePopularSearches = () => {
        try {
            // Get trending searches from theme settings
            const trendingSearches = settings?.homepage?.trendingSearches || [];
            const cityName = selectedCity?.name || 'Your City';

            if (trendingSearches.length > 0) {
                // Convert trending search names to search items
                const searches = trendingSearches.map(searchName => ({
                    title: `${searchName} in ${cityName}`,
                    query: searchName
                }));
                setSearches(searches);
            } else {
                // No fallback - wait for real data from API
                setSearches([]);
            }
        } catch (err) {
            console.error('Error generating popular searches:', err);
            setSearches([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Popular Searches</h2>
                        <p className="text-slate-600 text-sm mt-1">Most searched services in your area</p>
                    </div>
                </div>

                {/* Search Links Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, idx) => (
                            <div key={idx} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {searches.map((search, idx) => (
                            <Link
                                key={idx}
                                to={`/search?q=${encodeURIComponent(search.query)}&city=${selectedCity?._id || ''}`}
                                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors group"
                            >
                                <span className="font-medium text-slate-900 group-hover:text-orange-600">
                                    {search.title}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
