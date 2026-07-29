import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';
import { getApiUrl, fetchWithAuth } from '../config/api';
import { Loader2, ShoppingCart } from 'lucide-react';
import { findNearestCity } from '../utils/geolocation';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Header Location State
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);

    // Initial load for cities and location (Mirroring HomePage/SearchPage logic for Header)
    useEffect(() => {
        fetchCities();
        fetchCategories();
        
        // Listen for location detection events from Header
        const handleLocationDetected = (event) => {
            const { latitude, longitude } = event.detail;
            const nearest = findNearestCity(latitude, longitude, cities);
            if (nearest) {
                setSelectedCity(nearest);
            }
        };

        window.addEventListener('locationdetected', handleLocationDetected);
        return () => window.removeEventListener('locationdetected', handleLocationDetected);
    }, []);

    const fetchCities = async () => {
        try {
            const url = getApiUrl('locations/cities?limit=50');
            const response = await fetchWithAuth(url);
            const data = await response.json();

            if (response.ok && data.data && data.data.length > 0) {
                setCities(data.data);
                setSelectedCity(data.data[0]);
            } else {
                setCities([]);
                setSelectedCity(null);
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
            setCities([]);
            setSelectedCity(null);
        }
    };

    const handleCityChange = (cityId) => {
        const city = cities.find(c => c._id === cityId);
        if (city) setSelectedCity(city);
    };

    const fetchCategories = async () => {
        try {
            // Fetch all top-level categories
            const url = getApiUrl('categories?parentId=null');
            const response = await fetchWithAuth(url);
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                setCategories(data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header 
                selectedCity={selectedCity || {}}
                cities={cities}
                onCityChange={handleCityChange}
            />
            
            <main className="flex-1 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">All Categories</h1>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                            Browse out comprehensive list of services and businesses to find exactly what you are looking for.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Loading categories...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {categories.map((category) => (
                                <Link
                                    key={category._id}
                                    to={`/search?category=${category.slug}`}
                                    className="group flex flex-col items-center gap-4 text-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-orange-100 shadow-sm group-hover:shadow-md transition-all duration-300 relative">
                                        {category.image && (
                                            <img 
                                                src={category.image} 
                                                alt={category.name} 
                                                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300 z-10 bg-white"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                                                }}
                                            />
                                        )}
                                        <div className={`fallback-icon ${category.image ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-orange-500`}>
                                            <ShoppingCart className="w-10 h-10" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">{category.subCount || 0} subcategories</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    
                    {!loading && categories.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No categories found</h3>
                            <p className="text-slate-500 mt-1">Check back later for updates to our directory.</p>
                        </div>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
