import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, SESSION_EXPIRED_EVENT, resetSessionExpiryNotice } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    // fetchWithAuth fires this when any authenticated request comes back 401,
    // so a session that dies mid-visit drops the UI out of its signed-in state
    // instead of leaving a header that lies about being logged in.
    useEffect(() => {
        const onSessionExpired = () => {
            clearSession();
            toast.error('Your session expired — please sign in again.');
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    }, [clearSession]);

    useEffect(() => {
        const checkLoggedIn = async () => {
            if (!token) {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Not res.json() — an empty body or an HTML error page from the
                // proxy would throw here and land in the catch below, leaving a
                // stale signed-in shell behind.
                const raw = await res.text();
                let data = null;
                try {
                    data = raw ? JSON.parse(raw) : null;
                } catch {
                    data = null;
                }

                if (res.ok && data?.success) {
                    setUser(data.data);
                    setIsAuthenticated(true);
                } else if (res.status === 401 || res.status === 403) {
                    // Token genuinely rejected — clear it.
                    clearSession();
                } else {
                    // Server trouble (5xx, empty body). The token may still be
                    // good, so keep it but don't claim to be signed in.
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (err) {
                // Network failure — same reasoning as above: don't discard a
                // possibly-valid token, but don't render a signed-in UI either.
                console.error("Auth check failed", err);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoggedIn();
    }, [token, clearSession]);

    const login = (userData, jwtToken) => {
        // Re-arm the expiry notice so a later expiry toasts again.
        resetSessionExpiryNotice();
        setToken(jwtToken);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('token', jwtToken);
    };

    const logout = () => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            // Log logout event in backend in background
            fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            }).catch(err => console.error("Logout log fail", err));
        }
        clearSession();
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            token,
            isAuthenticated,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
