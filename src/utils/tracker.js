import { API_BASE_URL } from '../config/api';

/**
 * Log an analytics event to the backend
 * @param {string} event - 'view', 'call', 'whatsapp', 'enquiry'
 * @param {string} businessId - MongoDB ID of the business
 * @param {object} metadata - Optional additional data
 */
export const logAnalyticsEvent = async (event, businessId, metadata = {}) => {
    try {
        const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
        const token = localStorage.getItem('token');
        
        const body = {
            event,
            businessId,
            device,
            source: metadata.source || 'direct',
            city: metadata.city || localStorage.getItem('userCity') || 'unknown'
        };

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${API_BASE_URL}/analytics/log`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        }).catch(err => console.error('Silent analytics error:', err));
        
    } catch (err) {
        // Fail silently to not disrupt UX
        console.error('Analytics failed:', err);
    }
};
