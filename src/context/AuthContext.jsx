import { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

                const data = await res.json();

                if (res.ok && data.success) {
                    setUser(data.data);
                    setIsAuthenticated(true);
                } else {
                    // Token invalid or expired
                    setToken(null);
                    setUser(null);
                    setIsAuthenticated(false);
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error("Auth check failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoggedIn();
    }, [token]);

    const login = (userData, jwtToken) => {
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
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
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
