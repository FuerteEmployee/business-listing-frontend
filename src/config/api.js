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

    return fetch(url, {
        ...options,
        headers
    });
};
