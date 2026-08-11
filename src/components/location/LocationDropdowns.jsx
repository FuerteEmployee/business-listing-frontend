import { useState, useEffect } from 'react';
import { getApiUrl } from '../../config/api';
import FormSelect from '../ui/FormSelect';

export default function CountryDropdown({ value, onChange, label = "Country", required = false, disabled = false }) {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            setLoading(true);
            const res = await fetch(getApiUrl('/locations/countries'));
            const data = await res.json();
            setCountries(data.data || []);
        } catch (err) {
            console.error('Error fetching countries:', err);
        } finally {
            setLoading(false);
        }
    };

    const options = countries.map(c => ({ value: c._id, label: c.name }));

    return (
        <FormSelect
            label={label}
            name="country_id"
            value={value}
            onChange={onChange}
            options={options}
            required={required}
            disabled={disabled || loading}
            placeholder={`Select ${label}`}
        />
    );
}

export function StateDropdown({ countryId, value, onChange, label = "State", required = false, disabled = false }) {
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!countryId) {
            setStates([]);
            return;
        }

        const fetchStates = async () => {
            try {
                setLoading(true);
                const url = getApiUrl(`locations/states?country_id=${countryId}`);
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.success && Array.isArray(data.data)) {
                    setStates(data.data);
                } else {
                    console.warn('States fetch returned no data or success=false', data);
                    setStates([]);
                }
            } catch (err) {
                console.error('Error fetching states:', err);
                setStates([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStates();
    }, [countryId]);

    const options = states.map(s => ({ value: s._id, label: s.name }));

    return (
        <FormSelect
            label={label}
            name="state_id"
            value={value}
            onChange={onChange}
            options={options}
            required={required}
            disabled={disabled || loading || !countryId}
            placeholder={loading ? "Loading..." : "Select State"}
        />
    );
}

export function CityDropdown({ stateId, value, onChange, label = "City", required = false, disabled = false }) {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!stateId) {
            setCities([]);
            return;
        }

        const fetchCities = async () => {
            try {
                setLoading(true);
                const url = getApiUrl(`locations/cities?state_id=${stateId}`);
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.success && Array.isArray(data.data)) {
                    setCities(data.data);
                } else {
                    console.warn('Cities fetch returned no data or success=false', data);
                    setCities([]);
                }
            } catch (err) {
                console.error('Error fetching cities:', err);
                setCities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, [stateId]);

    const options = cities.map(c => ({ value: c._id, label: c.name }));

    return (
        <FormSelect
            label={label}
            name="city_id"
            value={value}
            onChange={onChange}
            options={options}
            required={required}
            disabled={disabled || loading || !stateId}
            placeholder={loading ? "Loading..." : "Select City"}
        />
    );
}

export function AreaDropdown({ cityId, value, onChange, label = "Area", required = false, disabled = false }) {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!cityId) {
            setAreas([]);
            return;
        }

        const fetchAreas = async () => {
            try {
                setLoading(true);
                const url = getApiUrl(`locations/areas?city_id=${cityId}`);
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.success && Array.isArray(data.data)) {
                    setAreas(data.data);
                } else {
                    console.warn('Areas fetch returned no data or success=false', data);
                    setAreas([]);
                }
            } catch (err) {
                console.error('Error fetching areas:', err);
                setAreas([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAreas();
    }, [cityId]);

    const options = [
        ...areas.map(a => ({ 
            value: a._id, 
            label: a.name 
        })),
        { value: 'manual', label: 'Add Manually...' }
    ];

    return (
        <FormSelect
            label={label}
            name="area_id"
            value={value}
            onChange={onChange}
            options={options}
            required={required}
            disabled={disabled || loading || !cityId}
            placeholder={loading ? "Loading..." : "Select Area"}
        />
    );
}
