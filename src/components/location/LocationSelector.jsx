import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import CountryDropdown, { StateDropdown, CityDropdown, AreaDropdown } from './LocationDropdowns';
import FormInput from '../ui/FormInput';
import { getApiUrl } from '../../config/api';

export default function LocationSelector({ 
    value = {}, 
    onChange = () => {},
    showLabel = true,
    required = false,
    className = "",
    error = ""
}) {
    const [detecting, setDetecting] = useState(false);
    
    // Manual/Detected names for when IDs are missing
    const [manualLocation, setManualLocation] = useState({
        country: value?.manualCountry || '',
        countryCode: value?.manualCountryCode || '',
        state: value?.manualState || '',
        city: value?.manualCity || '',
        area: value?.manualArea || ''
    });

    // Ensure value is always an object to avoid crashes
    const safeValue = value || {};
    const country_id = safeValue.country_id || '';
    const state_id = safeValue.state_id || '';
    const city_id = safeValue.city_id || '';
    const area_id = safeValue.area_id || '';

    // Update internal state if props value changes
    useEffect(() => {
        setManualLocation({
            country: value?.manualCountry || '',
            countryCode: value?.manualCountryCode || '',
            state: value?.manualState || '',
            city: value?.manualCity || '',
            area: value?.manualArea || ''
        });
    }, [value?.manualCountry, value?.manualCountryCode, value?.manualState, value?.manualCity, value?.manualArea]);

    const handleCountryChange = (e) => {
        onChange({
            country_id: e.target.value,
            state_id: '',
            city_id: '',
            area_id: '',
            manualCountry: '',
            manualCountryCode: '',
            manualState: '',
            manualCity: '',
            manualArea: ''
        });
    };

    const handleStateChange = (e) => {
        onChange({
            country_id,
            state_id: e.target.value,
            city_id: '',
            area_id: '',
            manualState: '',
            manualCity: '',
            manualArea: ''
        });
    };

    const handleCityChange = (e) => {
        onChange({
            country_id,
            state_id,
            city_id: e.target.value,
            area_id: '',
            manualCity: '',
            manualArea: ''
        });
    };

    const handleAreaChange = (e) => {
        const val = e.target.value;
        onChange({
            country_id,
            state_id,
            city_id,
            area_id: val,
            manualArea: val === 'manual' ? manualLocation.area : ''
        });
    };

    const handleManualAreaChange = (e) => {
        const val = e.target.value;
        setManualLocation(prev => ({ ...prev, area: val }));
        onChange({
            country_id,
            state_id,
            city_id,
            area_id: 'manual',
            manualArea: val
        });
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Reverse geocode using Nominatim (OSM)
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
                const data = await res.json();
                
                if (data && data.address) {
                    const addr = data.address;
                    const countryName = addr.country;
                    const countryCode = addr.country_code;
                    const stateName = addr.state || addr.region;
                    const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality;
                    const areaName = addr.suburb || addr.neighbourhood || addr.road;

                    // Fetch IDs from our API matching these names
                    const countriesRes = await fetch(getApiUrl('/locations/countries'));
                    const countriesData = await countriesRes.json();
                    const country = countriesData.data.find(c => c.name.toLowerCase() === countryName.toLowerCase());

                    let countryId = country?._id || '';
                    let stateId = '';
                    let cityId = '';

                    if (countryId) {
                        const statesRes = await fetch(getApiUrl(`/locations/states?country_id=${countryId}`));
                        const statesData = await statesRes.json();
                        const state = statesData.data.find(s => s.name.toLowerCase() === stateName.toLowerCase());

                        if (state) {
                            stateId = state._id;
                            const citiesRes = await fetch(getApiUrl(`/locations/cities?state_id=${stateId}`));
                            const citiesData = await citiesRes.json();
                            const city = citiesData.data.find(c => c.name.toLowerCase() === cityName.toLowerCase());

                            if (city) {
                                cityId = city._id;
                            }
                        }
                    }

                    // If IDs are missing, set the manual names so backend can create them
                    onChange({
                        country_id: countryId,
                        state_id: stateId,
                        city_id: cityId,
                        area_id: cityId ? '' : 'manual', // If city is missing, area must be manual
                        manualCountry: countryId ? '' : countryName,
                        manualCountryCode: countryId ? '' : countryCode,
                        manualState: stateId ? '' : stateName,
                        manualCity: cityId ? '' : cityName,
                        manualArea: cityId ? '' : areaName
                    });
                }
            } catch (err) {
                console.error("Error detecting location:", err);
            } finally {
                setDetecting(false);
            }
        }, (err) => {
            console.error("Geolocation error:", err);
            setDetecting(false);
        });
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                {showLabel && (
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                        Location Details
                    </p>
                )}
                <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                >
                    {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    {detecting ? 'Detecting...' : 'Detect My Location'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CountryDropdown 
                    value={country_id}
                    onChange={handleCountryChange}
                    label="Country"
                    required={required}
                />
                
                <StateDropdown
                    countryId={country_id}
                    value={state_id}
                    onChange={handleStateChange}
                    label="State"
                    required={required}
                    disabled={!country_id}
                />
                
                <CityDropdown
                    stateId={state_id}
                    value={city_id}
                    onChange={handleCityChange}
                    label="City"
                    required={required}
                    disabled={!state_id}
                />
                
                <AreaDropdown
                    cityId={city_id}
                    value={area_id}
                    onChange={handleAreaChange}
                    label="Area"
                    disabled={!city_id}
                />
            </div>

            {(area_id === 'manual' || (!city_id && manualLocation.city)) && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormInput
                        label="Enter Area Name Manually"
                        placeholder="e.g. Downtown Area"
                        value={manualLocation.area}
                        onChange={handleManualAreaChange}
                        required={required}
                    />
                    {!city_id && manualLocation.city && (
                        <p className="mt-1 text-[10px] text-indigo-500 font-medium italic">
                            Detected City: {manualLocation.city} ({manualLocation.state}, {manualLocation.country})
                        </p>
                    )}
                </div>
            )}
            {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>
    );
}
