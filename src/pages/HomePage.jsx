import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/homepage/Header';
import SearchBar from '../components/homepage/SearchBar';
import HeroBanners from '../components/homepage/HeroBanners';
import CategoryGrid from '../components/homepage/CategoryGrid';
import FeaturedBusinesses from '../components/homepage/FeaturedBusinesses';
import AdvertisementBanner from '../components/homepage/AdvertisementBanner';
import PopularSearches from '../components/homepage/PopularSearches';
import LatestBusinesses from '../components/homepage/LatestBusinesses';
import FreeListingCTA from '../components/homepage/FreeListingCTA';
import ReviewsSection from '../components/homepage/ReviewsSection';
import Footer from '../components/homepage/Footer';
import NearMeChips from '../components/homepage/NearMeChips';
import RecentlyViewed from '../components/homepage/RecentlyViewed';
import { getApiUrl, apiGet } from '../config/api';
import { getDeviceLocation, findNearestCity } from '../utils/geolocation';
import { useTheme } from '../context/ThemeContext';

export default function HomePage() {
    const { settings } = useTheme();
    const hp = settings?.homepage || {};
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [loadingCities, setLoadingCities] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        fetchCities();
        detectUserLocation();

        // Listen for location detection events
        const handleLocationDetected = (event) => {
            const { latitude, longitude } = event.detail;
            setUserLocation({ latitude, longitude });
        };

        window.addEventListener('locationdetected', handleLocationDetected);
        return () => window.removeEventListener('locationdetected', handleLocationDetected);
    }, []);

    // Synchronize default city once both cities and userLocation are loaded
    useEffect(() => {
        if (cities.length > 0 && userLocation && !selectedCity?.isManuallySelected) {
            const nearest = findNearestCity(userLocation.latitude, userLocation.longitude, cities);
            if (nearest) {
                setSelectedCity(nearest);
            }
        }
    }, [cities, userLocation, selectedCity?.isManuallySelected]);

    const fetchCities = async () => {
        const result = await apiGet(getApiUrl('locations/cities?limit=50'));

        const citiesData = Array.isArray(result.data) ? result.data : [];
        if (result.ok && citiesData.length > 0) {
            setCities(citiesData);
            setSelectedCity(citiesData[0]);
        } else {
            if (!result.ok) console.error('Error fetching cities:', result.error);
            setCities([]);
            setSelectedCity(null);
        }
        setLoadingCities(false);
    };

    const detectUserLocation = async () => {
        try {
            const location = await getDeviceLocation();
            setUserLocation(location);
        } catch (err) {
            console.warn('Geolocation not available:', err.message);
            setLocationError(err.message);
        }
    };

    const handleCityChange = (cityId) => {
        const city = cities.find(c => c._id === cityId);
        if (city) {
            setSelectedCity({ ...city, isManuallySelected: true });
        }
    };

    const handleSearch = (query) => {
        console.log('Search query:', query, 'City:', selectedCity);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header - Sticky */}
            <Header
                selectedCity={selectedCity || {}}
                cities={cities}
                onCityChange={handleCityChange}
                onSearch={handleSearch}
            />

            {/* Hero Search Section */}
            {hp.showHero !== false && (
                <SearchBar
                    selectedCity={selectedCity}
                    cities={cities}
                />
            )}
            
            {/* Recently Viewed */}
            {hp.showRecentlyViewed !== false && <RecentlyViewed />}

            {/* Banners */}
            {hp.showBanners !== false && <HeroBanners />}

            {/* Category Grid */}
            {hp.showCategories !== false && <CategoryGrid />}

            {/* Quick Filters (Near Me) */}
            {hp.showDiscovery !== false && <NearMeChips selectedCity={selectedCity} />}

            {/* Advertisement Banner */}
            {hp.showAds !== false && <AdvertisementBanner />}

            {/* Featured Businesses */}
            {hp.showFeatured !== false && <FeaturedBusinesses />}

            {/* Popular Searches */}
            {hp.showPopular !== false && <PopularSearches selectedCity={selectedCity} />}

            {/* Latest Businesses */}
            {hp.showLatest !== false && <LatestBusinesses />}

            {/* Reviews Section */}
            {hp.showReviews !== false && <ReviewsSection />}

            {/* Free Listing CTA */}
            {hp.showCTA !== false && <FreeListingCTA />}

            {/* Footer */}
            <Footer />
        </div>
    );
}
