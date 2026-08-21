// Centralized API configuration

// Default to local backend during development, but allow overrides via Vite env.
// Example: VITE_API_BASE_URL=https://test-mq6y.onrender.com/api
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://engitech-s6jn.onrender.com/api';

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
};

// --- Session expiry handling -------------------------------------------------
// The auth check in AuthContext only runs on boot, so a session that dies
// mid-visit (token expiry, backend restart) would leave the app rendering a
// signed-in header while every request 401s. Any 401 on a request that carried
// a token now clears the session once and notifies listeners, so the UI can
// drop to the signed-out state and tell the user what happened.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

let sessionExpiryNotified = false;

const handleSessionExpired = () => {
    if (sessionExpiryNotified) return;
    sessionExpiryNotified = true;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

// Called by AuthContext after a successful login so a later expiry notifies again.
export const resetSessionExpiryNotice = () => {
    sessionExpiryNotified = false;
};

// Helper function to fetch with auth token
export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to JSON content type if not sending FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const res = await fetch(url, {
        ...options,
        headers
    });

    // Only meaningful if we actually presented a token — a 401 on an anonymous
    // request just means the endpoint requires login, which is not an expiry.
    if (res.status === 401 && token) {
        handleSessionExpired();
    }

    return res;
};

// --- Safe JSON reads --------------------------------------------------------
// Callers used to run res.json() unconditionally, so a 500, a 429, an empty
// body or an HTML error page surfaced as "Unexpected end of JSON input" and
// sections silently rendered nothing. apiGet returns a typed result instead.

const parseJsonSafely = async (res) => {
    const body = await res.text();
    if (!body) return null;
    try {
        return JSON.parse(body);
    } catch {
        return null;
    }
};

/**
 * GET a URL and never throw. Returns { ok, status, data, error }.
 * `data` is the parsed body (unwrapped from a { data } envelope when present),
 * `error` is a human-readable message suitable for an inline error state.
 */
export const apiGet = async (url, options = {}) => {
    try {
        const res = await fetchWithAuth(url, { ...options, method: 'GET' });
        const payload = await parseJsonSafely(res);

        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                data: null,
                error: payload?.msg || payload?.message || payload?.error
                    || `Request failed (${res.status})`
            };
        }

        if (payload === null) {
            return { ok: false, status: res.status, data: null, error: 'Empty response from server' };
        }

        // Endpoints disagree on envelope shape: some return { success, data },
        // some a bare array, some a plain object. Normalise to the payload.
        const data = (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload)
            ? payload.data
            : payload;

        return { ok: true, status: res.status, data, error: null };
    } catch (err) {
        // Network failure, DNS, CORS, offline.
        return { ok: false, status: 0, data: null, error: err?.message || 'Network error' };
    }
};
