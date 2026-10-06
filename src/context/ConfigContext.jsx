import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

// Which SystemConfig panel a path belongs to (mirrors the backend 'admin' | 'brand' | 'frontend')
const panelForPath = (path) => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/brand')) return 'brand';
    return 'frontend';
};

export const ConfigProvider = ({ children }) => {
    const [panel, setPanel] = useState(() => panelForPath(window.location.pathname));
    const [config, setConfig] = useState({
        paginationLimit: 10,
        hiddenFeatures: [],
        dbName: 'justdial',
        loading: true
    });
    const cache = useRef({});

    // Re-fetch whenever the active panel changes. Reading the URL only once at start-up meant
    // that after logging in and being sent to /brand the public site's config stayed in force.
    useEffect(() => {
        let cancelled = false;
        const fetchConfig = async () => {
            if (cache.current[panel]) {
                setConfig({ ...cache.current[panel], loading: false });
                return;
            }
            setConfig(prev => ({ ...prev, loading: true }));
            try {
                const response = await axios.get(`${API_BASE_URL}/settings/panel-config?panel=${panel}`);
                if (cancelled) return;
                if (response.data && response.data.config) {
                    cache.current[panel] = response.data.config;
                    setConfig({ ...response.data.config, loading: false });
                } else {
                    setConfig(prev => ({ ...prev, hiddenFeatures: [], loading: false }));
                }
            } catch (err) {
                console.error('Failed to fetch system config:', err);
                if (!cancelled) setConfig(prev => ({ ...prev, hiddenFeatures: [], loading: false }));
            }
        };

        fetchConfig();
        return () => { cancelled = true; };
    }, [panel]);

    return (
        <ConfigContext.Provider value={{ ...config, panel, setPanel }}>
            {children}
        </ConfigContext.Provider>
    );
};

/** Keeps the config panel in step with client-side navigation. Render inside the Router. */
export const PanelConfigSync = () => {
    const { pathname } = useLocation();
    const { setPanel } = useConfig();
    useEffect(() => {
        setPanel(panelForPath(pathname));
    }, [pathname, setPanel]);
    return null;
};
