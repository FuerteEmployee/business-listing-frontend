import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../config/api';
import FormSelect from '../ui/FormSelect';
import AsyncSelect from '../ui/AsyncSelect';

const PAGE_SIZE = 50;

/**
 * The location endpoints are paginated and filtered server-side (see
 * controllers/locationController.js). Countries and States are small enough to load
 * in one bounded request; Cities (~7.9k, over 1,000 in a single state) and Areas are
 * fetched a page at a time through AsyncSelect, which queries as the user types.
 */
const fetchList = async (path, params, signal) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(getApiUrl(`${path}?${qs}`), { signal });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) {
        console.warn(`${path} returned no data or success=false`, data);
        return { options: [], hasMore: false, total: 0 };
    }
    return {
        options: data.data.map(d => ({ value: d._id, label: d.name })),
        hasMore: Boolean(data.hasMore),
        total: data.total ?? data.data.length
    };
};

// Resolves the display name of an already-selected row that may not be on page 1 -
// e.g. an edit form whose saved city sits 900 entries into its state.
const resolveNameById = async (path, id, signal) => {
    const { options } = await fetchList(path, { ids: id, limit: 1 }, signal);
    return options[0]?.label || '';
};

export default function CountryDropdown({ value, onChange, label = "Country", required = false, disabled = false }) {
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        const controller = new AbortController();
        fetchList('/locations/countries', { limit: 200 }, controller.signal)
            .then(({ options }) => setCountries(options))
            .catch(err => { if (err.name !== 'AbortError') console.error('Error fetching countries:', err); });
        return () => controller.abort();
    }, []);

    return (
        <FormSelect
            label={label}
            name="country_id"
            value={value}
            onChange={onChange}
            options={countries}
            required={required}
            disabled={disabled}
            placeholder={`Select ${label}`}
        />
    );
}

export function StateDropdown({ countryId, value, onChange, label = "State", required = false, disabled = false }) {
    // Keyed by the country it was loaded for, so a stale list is discarded by
    // derivation below instead of being cleared from inside the effect.
    const [loaded, setLoaded] = useState({ countryId: null, options: [] });

    useEffect(() => {
        if (!countryId) return;

        const controller = new AbortController();
        // India has 36 states/UTs, so one bounded request still covers a country
        // comfortably; FormSelect's own search box filters them locally.
        fetchList('/locations/states', { country_id: countryId, limit: 200 }, controller.signal)
            .then(({ options }) => setLoaded({ countryId, options }))
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching states:', err);
                    setLoaded({ countryId, options: [] });
                }
            });
        return () => controller.abort();
    }, [countryId]);

    const states = loaded.countryId === countryId ? loaded.options : [];

    return (
        <FormSelect
            label={label}
            name="state_id"
            value={value}
            onChange={onChange}
            options={states}
            required={required}
            disabled={disabled || !countryId}
            placeholder={countryId && !states.length ? "Loading..." : "Select State"}
        />
    );
}

export function CityDropdown({ stateId, value, onChange, label = "City", required = false, disabled = false }) {
    const fetchPage = useCallback((search, page, signal) => fetchList(
        '/locations/cities',
        { ...(stateId ? { state_id: stateId } : {}), ...(search ? { search } : {}), page, limit: PAGE_SIZE },
        signal
    ), [stateId]);

    const resolveLabel = useCallback(
        (id, signal) => resolveNameById('/locations/cities', id, signal),
        []
    );

    return (
        <AsyncSelect
            label={label}
            name="city_id"
            value={value}
            onChange={onChange}
            fetchPage={fetchPage}
            resolveLabel={resolveLabel}
            deps={[stateId]}
            required={required}
            disabled={disabled || !stateId}
            placeholder="Select City"
            searchPlaceholder="Type a city name..."
            emptyMessage="No cities found"
        />
    );
}

export function AreaDropdown({ cityId, value, onChange, label = "Area", required = false, disabled = false }) {
    const fetchPage = useCallback(async (search, page, signal) => {
        const res = await fetchList(
            '/locations/areas',
            { city_id: cityId, ...(search ? { search } : {}), page, limit: PAGE_SIZE },
            signal
        );
        // "Add Manually..." is the escape hatch for an area that is not on file yet,
        // so it belongs on the first page regardless of the search term.
        return page === 1
            ? { ...res, options: [...res.options, { value: 'manual', label: 'Add Manually...' }] }
            : res;
    }, [cityId]);

    const resolveLabel = useCallback(async (id, signal) => {
        if (id === 'manual') return 'Add Manually...';
        return resolveNameById('/locations/areas', id, signal);
    }, []);

    return (
        <AsyncSelect
            label={label}
            name="area_id"
            value={value}
            onChange={onChange}
            fetchPage={fetchPage}
            resolveLabel={resolveLabel}
            deps={[cityId]}
            required={required}
            disabled={disabled || !cityId}
            placeholder="Select Area"
            searchPlaceholder="Type an area name..."
            emptyMessage="No areas found"
        />
    );
}
