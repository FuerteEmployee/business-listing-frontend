import { API_BASE_URL, fetchWithAuth } from "../config/api";

const api = {
    get: async (url, options = {}) => {
        const queryParams = options.params 
            ? '?' + new URLSearchParams(options.params).toString()
            : '';
        
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}${queryParams}`;
        
        const response = await fetchWithAuth(fullUrl, {
            method: 'GET',
            headers: options.headers || {}
        });

        if (!response.ok) {
            const error = new Error('API Error');
            error.response = {
                status: response.status,
                data: await response.json().catch(() => ({}))
            };
            throw error;
        }

        return {
            data: await response.json(),
            status: response.status,
            ok: response.ok
        };
    },

    post: async (url, data, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        const response = await fetchWithAuth(fullUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: options.headers || {}
        });

        if (!response.ok) {
            const error = new Error('API Error');
            error.response = {
                status: response.status,
                data: await response.json().catch(() => ({}))
            };
            throw error;
        }

        return {
            data: await response.json(),
            status: response.status,
            ok: response.ok
        };
    },

    // Add other methods if needed (put, delete, patch)
    put: async (url, data, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        const response = await fetchWithAuth(fullUrl, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: options.headers || {}
        });

        if (!response.ok) {
            const error = new Error('API Error');
            error.response = {
                status: response.status,
                data: await response.json().catch(() => ({}))
            };
            throw error;
        }

        return {
            data: await response.json(),
            status: response.status,
            ok: response.ok
        };
    },

    delete: async (url, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        const response = await fetchWithAuth(fullUrl, {
            method: 'DELETE',
            headers: options.headers || {}
        });

        if (!response.ok) {
            const error = new Error('API Error');
            error.response = {
                status: response.status,
                data: await response.json().catch(() => ({}))
            };
            throw error;
        }

        return {
            data: await response.json(),
            status: response.status,
            ok: response.ok
        };
    }
};

export { api };
