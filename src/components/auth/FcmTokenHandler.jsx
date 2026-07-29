import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestFirebaseToken } from '../../config/firebase';
import { API_BASE_URL, fetchWithAuth } from '../../config/api';

export default function FcmTokenHandler() {
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        const setupNotifications = async () => {
            // Only attempt if authenticated and user doesn't already have a token locally marked
            // Or just always try to ensure it's up to date
            if (isAuthenticated && user) {
                try {
                    const token = await requestFirebaseToken();
                    if (token) {
                        console.log('[FCM] Token retrieved:', token);
                        
                        // Send to backend
                        const res = await fetchWithAuth(`${API_BASE_URL}/me/fcm-token`, {
                            method: 'PUT',
                            body: JSON.stringify({ fcmToken: token })
                        });

                        if (res.ok) {
                            console.log('[FCM] Token registered with backend');
                        }
                    }
                } catch (err) {
                    console.error('[FCM] Setup failed:', err);
                }
            }
        };

        setupNotifications();
    }, [isAuthenticated, user]);

    return null; // This component doesn't render anything UI-wise
}
