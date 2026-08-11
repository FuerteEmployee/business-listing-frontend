import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        siteName: 'Fuerte Developers',
        logoUrl: 'https://fuertedevelopers.in/logo.png',
        primaryColor: '#0057FC',
        secondaryColor: '#FFDD0F',
        contactEmail: 'info@fuertedevelopers.in',
        contactPhone: '+91 91062 55483',
        footerText: '',
        faviconUrl: 'https://fuertedevelopers.in/favicon.ico',
        homepage: {
            showHero: true,
            showRecentlyViewed: true,
            showBanners: true,
            showCategories: true,
            showDiscovery: true,
            showAds: true,
            showFeatured: true,
            showPopular: true,
            showLatest: true,
            showReviews: true,
            showCTA: true,
            showMobileApp: true,
            showFooter: true,
            footerText: '',
            footerSections: [],
            heroTaglinePrefix: "",
            heroTaglineSuffix: "",
            countSource: "dynamic",
            fixedCount: "",
            searchPlaceholder: "",
            trendingSearches: [],
            discoveryChips: [],
            socialLinks: [
                { platform: 'Instagram', url: '', icon: 'Instagram' },
                { platform: 'Facebook', url: '', icon: 'Facebook' },
                { platform: 'Linkedin', url: '', icon: 'Linkedin' },
                { platform: 'Youtube', url: '', icon: 'Youtube' }
            ]
        },
        hiddenFeatures: []
    });

    const [isLoadingTheme, setIsLoadingTheme] = useState(true);

    // Update title and favicon dynamically
    useEffect(() => {
        if (settings.siteName) {
            document.title = settings.siteName;
        }

        if (settings.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = settings.faviconUrl;
        }
    }, [settings.siteName, settings.faviconUrl]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    const normalized = {
                        ...data.data,
                        showFooter: data.data.showFooter ?? true,
                        homepage: {
                            showFooter: data.data?.homepage?.showFooter ?? true,
                            footerText: data.data?.homepage?.footerText ?? data.data?.footerText ?? '',
                            footerSections: data.data?.homepage?.footerSections || [],
                            socialLinks: data.data?.homepage?.socialLinks || [
                                { platform: 'Instagram', url: '', icon: 'Instagram' },
                                { platform: 'Facebook', url: '', icon: 'Facebook' },
                                { platform: 'Linkedin', url: '', icon: 'Linkedin' },
                                { platform: 'Youtube', url: '', icon: 'Youtube' }
                            ],
                            ...data.data?.homepage
                        }
                    };
                    setSettings(normalized);
                    applyThemeColors(data.data.primaryColor, data.data.secondaryColor);
                }
            }
        } catch (error) {
            console.error("Failed to load global settings:", error);
        } finally {
            setIsLoadingTheme(false);
        }
    };

    const hexToRgb = (hex) => {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
    };

    const applyThemeColors = (primary, secondary) => {
        if (primary) {
            document.documentElement.style.setProperty('--color-primary', primary);
            const rgb = hexToRgb(primary);
            if (rgb) document.documentElement.style.setProperty('--color-primary-rgb', rgb);
        }
        if (secondary) {
            document.documentElement.style.setProperty('--color-secondary', secondary);
            const rgb = hexToRgb(secondary);
            if (rgb) document.documentElement.style.setProperty('--color-secondary-rgb', rgb);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettingsState = (newSettings) => {
        setSettings(newSettings);
        applyThemeColors(newSettings.primaryColor, newSettings.secondaryColor);
    };

    return (
        <ThemeContext.Provider value={{ settings, updateSettingsState, isLoadingTheme, fetchSettings }}>
            {children}
        </ThemeContext.Provider>
    );
};
