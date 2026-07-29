import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';
import { getApiUrl, fetchWithAuth } from '../config/api';
import SubCategoryGrid from '../components/search/SubCategoryGrid';
import BusinessListing from '../components/search/BusinessListing';
import { Loader2, Map as MapIcon, Grid, List } from 'lucide-react';
import { findNearestCity } from '../utils/geolocation';
import Modal from '../components/ui/Modal';
import MapComponent from '../components/search/MapComponent';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Core Data State
    const [category, setCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [viewType, setViewType] = useState('listing'); // 'listing' or 'subcategory'
    
    // UI/Experience State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [showMap, setShowMap] = useState(false);

    // Filter Logic
    const activeFilters = {
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        categoryId: searchParams.get('categoryId') || '',
        city: searchParams.get('city') || '',
        sort: searchParams.get('sort') || 'rank',
        rating: searchParams.get('rating') || '',
        priceRange: searchParams.get('priceRange') || '',
        openNow: searchParams.get('openNow') || 'false'
    };

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(key, value);
        else newParams.delete(key);
        newParams.set('page', '1'); // Reset pagination on filter change
        setSearchParams(newParams);
    };

    const handleResetFilters = () => {
        const newParams = new URLSearchParams();
        if (activeFilters.q) newParams.set('q', activeFilters.q);
        if (activeFilters.category) newParams.set('category', activeFilters.category);
        if (activeFilters.categoryId) newParams.set('categoryId', activeFilters.categoryId);
        setSearchParams(newParams);
    };

    const fetchCities = useCallback(async () => {
        try {
            const url = getApiUrl('locations/cities?limit=50');
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if (response.ok && data.data) {
                setCities(data.data);
                const cityId = searchParams.get('city');
                if (cityId) {
                    const found = data.data.find(c => c._id === cityId);
                    if (found) setSelectedCity(found);
                } else {
                    setSelectedCity(data.data[0]);
                }
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
            setCities([]);
            setSelectedCity(null);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    const fetchData = useCallback(async (isLoadMore = false) => {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const page = isLoadMore ? pagination.page + 1 : 1;
            
            // Get coordinates if available
            let lat = '';
            let lng = '';
            
            if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
                lat = selectedCity.latitude;
                lng = selectedCity.longitude;
            }

            const params = new URLSearchParams({
                ...activeFilters,
                page: page.toString(),
                limit: '20',
                lat: lat.toString(),
                lng: lng.toString()
            });

            // 1. If it's a category slug search, we might need to get the category ID first
            let effectiveCategoryId = activeFilters.categoryId;
            if (activeFilters.category && !effectiveCategoryId) {
                const catRes = await fetchWithAuth(getApiUrl(`categories/slug/${activeFilters.category}`));
                if (catRes.ok) {
                    const catData = await catRes.json();
                    setCategory(catData);
                    effectiveCategoryId = catData._id;
                    params.set('categoryId', effectiveCategoryId);
                    
                    // Check for subcategories on first load
                    if (!isLoadMore && catData.subCount > 0) {
                        const subRes = await fetchWithAuth(getApiUrl(`categories?parentId=${catData._id}`));
                        if (subRes.ok) {
                            const subData = await subRes.json();
                            setSubCategories(subData);
                            setViewType('subcategory');
                            setLoading(false);
                            return;
                        }
                    }
                }
            }

            // 2. Fetch Businesses
            const bizRes = await fetchWithAuth(`${getApiUrl('companies')}?${params}`);
            if (bizRes.ok) {
                const result = await bizRes.json();
                if (isLoadMore) {
                    setBusinesses(prev => {
                        const existingIds = new Set(prev.map(b => b._id));
                        const newOnes = result.data.filter(b => !existingIds.has(b._id));
                        return [...prev, ...newOnes];
                    });
                } else {
                    setBusinesses(result.data);
                    setViewType('listing');
                }
                setPagination(result.pagination);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeFilters, pagination.page]);

    useEffect(() => {
        fetchData();
    }, [activeFilters.q, activeFilters.category, activeFilters.categoryId, activeFilters.city, activeFilters.sort, activeFilters.rating, activeFilters.priceRange, activeFilters.openNow]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header 
                selectedCity={selectedCity || {}}
                cities={cities}
                onCityChange={(id) => handleFilterChange('city', id)}
            />
            
            <main className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Syncing</span>
                            </div>
                        </div>
                        <p className="text-slate-500 font-bold mt-6 tracking-tight">Gathering the best options for you...</p>
                    </div>
                ) : (
                    <>
                        {viewType === 'subcategory' ? (
                            <SubCategoryGrid 
                                parentCategory={category} 
                                subCategories={subCategories} 
                            />
                        ) : (
                            <div className="relative">
                                <BusinessListing 
                                    title={category?.name || (activeFilters.q ? `Search: ${activeFilters.q}` : 'All Businesses')} 
                                    businesses={businesses}
                                    pagination={pagination}
                                    activeFilters={activeFilters}
                                    onFilterChange={handleFilterChange}
                                    onReset={handleResetFilters}
                                    onLoadMore={() => fetchData(true)}
                                    isLoadingMore={loadingMore}
                                />
                                
                                {/* Floating Map Toggle */}
                                <button 
                                    onClick={() => setShowMap(true)}
                                    className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all z-40 font-bold tracking-tight scale-100 hover:scale-105 active:scale-95"
                                >
                                    <MapIcon className="w-4 h-4 text-orange-400" />
                                    Show Map View
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Map View Modal */}
            <Modal
                isOpen={showMap}
                onClose={() => setShowMap(false)}
                title="Geographic Discovery"
                subtitle="Explore verified businesses in your vicinity"
                icon={MapIcon}
                size="xl"
            >
                <div className="aspect-video w-full bg-slate-100 rounded-[2rem] overflow-hidden relative group border border-slate-200 z-0 flex">
                    <MapComponent businesses={businesses} selectedCity={selectedCity} />
                </div>
            </Modal>
            
            <Footer />
        </div>
    );
}
