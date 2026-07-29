// Geolocation utility
export const getDeviceLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};

// Reverse geocoding to find nearest city using Nominatim API
export const getReverseGeocodeAddress = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FuerteDevelopers/1.0'
                }
            }
        );
        const data = await response.json();

        if (data && data.address) {
            const { city, town, village, county, state, postcode, neighbourhood, suburb } = data.address;
            const area = neighbourhood || suburb || village || town || city || county || '';

            return {
                fullAddress: data.display_name,
                area: area,
                city: city || town || county || '',
                state: state || '',
                pincode: postcode || '',
                raw: data.address
            };
        }
        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
};

// Find nearest city from coordinates
export const findNearestCity = (latitude, longitude, cities) => {
    if (!cities || cities.length === 0) return null;

    // Simple distance calculation using coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // City coordinates (approximate)
    const cityCoordinates = {
        'Mumbai': { lat: 19.0760, lon: 72.8777 },
        'Delhi': { lat: 28.7041, lon: 77.1025 },
        'Bangalore': { lat: 12.9716, lon: 77.5946 },
        'Hyderabad': { lat: 17.3850, lon: 78.4867 },
        'Chennai': { lat: 13.0827, lon: 80.2707 },
        'Kolkata': { lat: 22.5726, lon: 88.3639 },
        'Pune': { lat: 18.5204, lon: 73.8567 },
        'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
        'Goa': { lat: 15.2993, lon: 73.8243 },
        'Jaipur': { lat: 26.9124, lon: 75.7873 },
    };

    let nearestCity = null;
    let minDistance = Infinity;

    cities.forEach((city) => {
        const coords = cityCoordinates[city.name];
        if (coords) {
            const distance = calculateDistance(latitude, longitude, coords.lat, coords.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        }
    });

    return nearestCity;
};
