import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        paginationLimit: 10,
        hiddenFeatures: [],
        dbName: 'justdial',
        loading: true
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Determine panel based on URL
                const path = window.location.pathname;
                let panel = 'frontend';
                if (path.startsWith('/admin')) panel = 'admin';
                else if (path.startsWith('/merchant')) panel = 'merchant';

                // Use the standardized API_BASE_URL
                const response = await axios.get(`${API_BASE_URL}/settings/panel-config?panel=${panel}`);
                
                if (response.data && response.data.config) {
                    setConfig({
                        ...response.data.config,
                        loading: false
                    });
                } else {
                    setConfig(prev => ({ ...prev, loading: false }));
                }
            } catch (err) {
                console.error('Failed to fetch system config:', err);
                setConfig(prev => ({ ...prev, loading: false }));
            }
        };

        fetchConfig();
    }, []);

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};
