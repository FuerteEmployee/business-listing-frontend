import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, ChevronDown, LogOut, Bell, User, Heart, Settings, MessageSquare, ShieldCheck, Globe, Volume2, TrendingUp, Bookmark } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import SearchInputGroup from '../ui/SearchInputGroup';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function Header({ selectedCity, cities = [], onCityChange }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    // One panel open at a time. Previously each dropdown had its own boolean, so
    // the bookmark, heart and profile panels could all be on screen at once,
    // overlapping each other.
    const [openPanel, setOpenPanel] = useState(null);
    const closePanels = useCallback(() => setOpenPanel(null), []);

    const isNotificationOpen = openPanel === 'notifications';
    const isProfileOpen = openPanel === 'profile';
    const isFavoritesOpen = openPanel === 'favorites';
    const isProductsOpen = openPanel === 'products';
    const isLangOpen = openPanel === 'lang';

    // Shims keeping the existing setIsXOpen(bool) / setIsXOpen(prev => !prev)
    // call sites intact while routing them through the single state.
    const panelSetter = (name) => (next) => setOpenPanel(prev => {
        const currentlyOpen = prev === name;
        const shouldOpen = typeof next === 'function' ? next(currentlyOpen) : next;
        if (shouldOpen) return name;
        return currentlyOpen ? null : prev;
    });
    const setIsNotificationOpen = panelSetter('notifications');
    const setIsProfileOpen = panelSetter('profile');
    const setIsFavoritesOpen = panelSetter('favorites');
    const setIsProductsOpen = panelSetter('products');
    const setIsLangOpen = panelSetter('lang');

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

    // Profile Dropdown state
    const profileRef = useRef(null);

    // Favorites (Businesses) Dropdown state
    const [favoriteItems, setFavoriteItems] = useState([]);
    const favoritesRef = useRef(null);
    const favoritesGuestRef = useRef(null);

    // Saved Products Dropdown state
    const [savedProducts, setSavedProducts] = useState([]);
    const productsRef = useRef(null);
    const productsGuestRef = useRef(null);

    // Language Dropdown state
    const [selectedLang, setSelectedLang] = useState('EN');
    const langRef = useRef(null);
    const languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'Hindi' },
        { code: 'GU', name: 'Gujarati' },
        { code: 'MR', name: 'Marathi' }
    ];

    const navigate = useNavigate();
    const { settings } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();

    const loadFavorites = async () => {
        if (isAuthenticated) {
            try {
                const [res, prodRes] = await Promise.all([
                    fetchWithAuth(getApiUrl('me/saved')),
                    fetchWithAuth(getApiUrl('me/saved-products'))
                ]);
                if (res.ok) {
                    const data = await res.json();
                    const list = data.data || [];
                    setFavoriteItems(list.map(item => ({
                        _id: item._id,
                        name: item.name,
                        slug: item.slug,
                        image: item.image || item.photos?.[0],
                        category: typeof item.category === 'object' ? item.category.name : item.category,
                        city: item.city_id?.name || item.city?.name || 'Location'
                    })));
                }
                if (prodRes.ok) {
                    const data = await prodRes.json();
                    setSavedProducts(data.data || []);
                }
            } catch (err) {
                console.error('Error loading API favorites in header:', err);
            }
        } else {
            const stored = localStorage.getItem('bookmarks_data');
            if (stored) {
                try {
                    setFavoriteItems(JSON.parse(stored) || []);
                } catch (e) {
                    setFavoriteItems([]);
                }
            } else {
                setFavoriteItems([]);
            }
            const storedProds = localStorage.getItem('product_bookmarks_data');
            if (storedProds) {
                try {
                    setSavedProducts(JSON.parse(storedProds) || []);
                } catch (e) {
                    setSavedProducts([]);
                }
            } else {
                setSavedProducts([]);
            }
        }
    };

    useEffect(() => {
        loadFavorites();

        const handleBookmarksUpdated = () => {
            loadFavorites();
        };

        window.addEventListener('bookmarksUpdated', handleBookmarksUpdated);

        return () => {
            window.removeEventListener('bookmarksUpdated', handleBookmarksUpdated);
        };
    }, [isAuthenticated]);

    const [languageReady, setLanguageReady] = useState(false);
    const pendingLanguageRef = useRef(null);

    const dispatchTranslateChange = (select, code) => {
        if (!select) return;
        select.value = code;
        const event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        select.dispatchEvent(event);
    };

    const translatePage = (langCode) => {
        const code = langCode.toLowerCase();
        const select = document.querySelector('#google_translate_element select');
        if (select) {
            dispatchTranslateChange(select, code);
        } else {
            pendingLanguageRef.current = code;
        }
    };

    const googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
            new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,ar,fr,gu,hi,es',
                autoDisplay: false
            }, 'google_translate_element');
            setLanguageReady(true);

            const pendingCode = pendingLanguageRef.current;
            if (pendingCode) {
                const select = document.querySelector('#google_translate_element select');
                if (select) {
                    dispatchTranslateChange(select, pendingCode);
                    pendingLanguageRef.current = null;
                }
            }
        }
    };

    const hideGoogleTranslateUI = () => {
        const selectors = [
            'iframe.goog-te-banner-frame',
            'iframe.goog-te-menu-frame',
            '.goog-te-banner-frame',
            '.goog-te-balloon-frame',
            '#goog-gt-tt',
            '.goog-tooltip',
            '.goog-te-gadget-icon',
            '.goog-te-combo',
            '.skiptranslate'
        ];
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                if (el instanceof HTMLElement || el instanceof HTMLIFrameElement) {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                    el.style.height = '0px';
                    el.style.width = '0px';
                    el.style.position = 'absolute';
                    el.style.top = '0';
                    el.style.left = '0';
                }
            });
        });
        document.body.style.top = '0';
        document.body.style.marginTop = '0';
        document.body.style.setProperty('top', '0', 'important');
        document.body.style.setProperty('margin-top', '0', 'important');
    };

    useEffect(() => {
        window.googleTranslateElementInit = googleTranslateElementInit;

        if (!document.getElementById('google_translate_script')) {
            const googleScript = document.createElement('script');
            googleScript.id = 'google_translate_script';
            googleScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            googleScript.async = true;
            document.body.appendChild(googleScript);
        } else if (window.google && window.google.translate) {
            googleTranslateElementInit();
        }

        const interval = setInterval(hideGoogleTranslateUI, 400);
        const timeout = setTimeout(() => {
            hideGoogleTranslateUI();
            clearInterval(interval);
        }, 4000);

        return () => {
            delete window.googleTranslateElementInit;
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    // Close the open dropdown on outside click or Escape.
    useEffect(() => {
        if (!openPanel) return undefined;

        // Only one of the authed/guest ref pairs is mounted at a time, so a null
        // ref must count as "not containing the click". The previous version
        // required both refs to be non-null, which made the condition never
        // true and left the panels permanently open.
        const clickedInsideAnyPanel = (target) => [
            notificationRef, profileRef, langRef,
            favoritesRef, favoritesGuestRef,
            productsRef, productsGuestRef
        ].some(ref => ref.current && ref.current.contains(target));

        const handleClickOutside = (event) => {
            if (!clickedInsideAnyPanel(event.target)) closePanels();
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closePanels();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [openPanel, closePanels]);

    const location = useLocation();
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 200);
        };
        
        // If not on homepage, maybe always show the search bar
        // But for now we just rely on scroll
        if (isHomePage) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        } else {
            setScrolled(true); // Always show minimized search on other pages
        }
    }, [isHomePage]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[68px]">
                    {/* Logo */}
                    <Link to="/" className="flex items-center flex-shrink-0">
                        <Logo 
                            settings={settings} 
                            className="h-12" 
                            imgClassName="max-w-[160px] object-contain"
                            fallbackClassName="hidden sm:inline font-black text-2xl text-slate-900 tracking-tight"
                        />
                    </Link>

                    {scrolled && (
                        <div className="hidden lg:block flex-1 max-w-3xl mx-6 translate-y-0 opacity-100 transition-all duration-300">
                            <SearchInputGroup selectedCity={selectedCity} cities={cities} variant="header" onCityChange={onCityChange} />
                        </div>
                    )}

                    {/* Desktop Navigation Links */}
                    <div className={`hidden md:flex items-center gap-6 justify-end ${scrolled ? 'flex-none' : 'flex-1'}`}>
                        {/* Language Dropdown */}
                        <div className="relative" ref={langRef}>
                            <button 
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <Globe className="w-4 h-4 text-blue-500" />
                                {selectedLang} <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isLangOpen && (
                                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setSelectedLang(lang.code);
                                                setIsLangOpen(false);
                                                translatePage(lang.code);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${selectedLang === lang.code ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <span className="flex items-center justify-between">
                                                {lang.code} <span className="text-xs text-slate-400 font-normal">{lang.name}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>




                        <Link to="/advertise" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                            Advertise
                        </Link>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 mx-2" />

                        {isAuthenticated ? (
                            <div className="flex items-center gap-5">
                                {/* Notifications Box */}
                                <div className="relative" ref={notificationRef}>
                                    <button 
                                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                        className={`text-slate-600 transition-colors relative p-1 rounded-full ${isNotificationOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                                    >
                                        <Bell className="w-6 h-6" strokeWidth={1.5} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                        )}
                                    </button>

                                    {isNotificationOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                                {unreadCount > 0 && <span className="text-xs font-semibold text-blue-600 cursor-pointer">Mark all read</span>}
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notif, idx) => (
                                                        <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                                                            {notif.message}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                                        <Bell className="w-10 h-10 text-slate-200 mb-2" strokeWidth={1} />
                                                        <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                                                        <p className="text-xs text-slate-400 mt-1">We'll alert you when something happens.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Link to="/profile/notifications" onClick={() => setIsNotificationOpen(false)} className="block mt-3 pt-3 text-center text-sm font-semibold text-blue-600 border-t border-slate-100 cursor-pointer hover:text-blue-700">
                                                View All Notifications
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Saved Businesses Dropdown (Authenticated) */}
                                <div className="relative animate-fade-in" ref={productsRef}>
                                    <button
                                        onClick={() => setIsProductsOpen(prev => !prev)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${isProductsOpen ? 'bg-slate-100 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-orange-500'}`}
                                        title="Saved Businesses"
                                    >
                                        <Bookmark className={`w-5 h-5 ${favoriteItems.length > 0 ? 'fill-orange-500 text-orange-500' : ''}`} />
                                        {favoriteItems.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                                                {favoriteItems.length}
                                            </span>
                                        )}
                                    </button>

                                    {isProductsOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                                                    <Bookmark className="w-4 h-4 text-orange-500 fill-orange-500" /> Saved Businesses
                                                </h3>
                                                <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">
                                                    {favoriteItems.length} Saved
                                                </span>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                                {favoriteItems.length > 0 ? (
                                                    favoriteItems.map((item) => (
                                                         <Link 
                                                             key={item._id}
                                                             to={`/business/${item.slug}`}
                                                             onClick={() => setIsProductsOpen(false)}
                                                             className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group text-left w-full block"
                                                         >
                                                             <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                                                 {item.image ? (
                                                                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                                 ) : (
                                                                     <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-600 font-bold text-sm">
                                                                         {item.name?.charAt(0)}
                                                                     </div>
                                                                 )}
                                                             </div>
                                                             <div className="flex-1 min-w-0">
                                                                 <h4 className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                                     {item.name}
                                                                 </h4>
                                                                 <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                                                     {item.category || 'Business'} • {item.city || 'Location'}
                                                                 </p>
                                                             </div>
                                                         </Link>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                         <Bookmark className="w-10 h-10 text-slate-200 mb-2" strokeWidth={1} />
                                                         <p className="text-xs text-slate-500 font-bold">No saved businesses yet</p>
                                                         <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Save businesses to see them here for quick access.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Link 
                                                to="/profile/saved" 
                                                onClick={() => setIsProductsOpen(false)} 
                                                className="block mt-3 pt-3 text-center text-xs font-black text-orange-600 border-t border-slate-100 hover:text-orange-700 uppercase tracking-wider"
                                            >
                                                View All Saved Items
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Saved Products Dropdown (Authenticated) */}
                                <div className="relative animate-fade-in" ref={favoritesRef}>
                                    <button
                                        onClick={() => setIsFavoritesOpen(prev => !prev)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${isFavoritesOpen ? 'bg-slate-100 text-rose-600' : 'text-slate-600 hover:bg-slate-50 hover:text-rose-500'}`}
                                        title="Saved Products"
                                    >
                                        <Heart className={`w-5 h-5 ${savedProducts.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                        {savedProducts.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                                {savedProducts.length}
                                            </span>
                                        )}
                                    </button>

                                    {isFavoritesOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Saved Products
                                                </h3>
                                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                                                    {savedProducts.length} Saved
                                                </span>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                                {savedProducts.length > 0 ? (
                                                    savedProducts.map((item) => (
                                                         <Link 
                                                             key={item._id}
                                                             to={`/product/${item.slug}`}
                                                             onClick={() => setIsFavoritesOpen(false)}
                                                             className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group text-left w-full block"
                                                         >
                                                             <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                                                 {item.images?.[0] || item.image ? (
                                                                     <img src={item.images?.[0] || item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                                                 ) : (
                                                                     <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-600 font-bold text-sm">
                                                                         {item.name?.charAt(0)}
                                                                     </div>
                                                                 )}
                                                             </div>
                                                             <div className="flex-1 min-w-0">
                                                                 <h4 className="font-bold text-xs text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                                                                     {item.name}
                                                                 </h4>
                                                                 <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                                                     {item.brandId?.name || item.brand || 'Generic'} • ₹{item.price?.toLocaleString()}
                                                                 </p>
                                                             </div>
                                                         </Link>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                         <Heart className="w-10 h-10 text-slate-200 mb-2" strokeWidth={1} />
                                                         <p className="text-xs text-slate-500 font-bold">No saved products yet</p>
                                                         <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Save products to see them here for quick access.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Link 
                                                to="/profile/saved" 
                                                onClick={() => setIsFavoritesOpen(false)} 
                                                className="block mt-3 pt-3 text-center text-xs font-black text-rose-600 border-t border-slate-100 hover:text-rose-700 uppercase tracking-wider"
                                            >
                                                View All Saved Items
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* User Profile */}
                                <div className="relative flex items-center gap-2" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(prev => !prev)}
                                        className={`w-9 h-9 rounded-full bg-slate-100 overflow-hidden border-2 flex items-center justify-center transition-all duration-200 ${isProfileOpen ? 'border-blue-400 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {user?.profilePhoto ? (
                                            <img src={user.profilePhoto} className="w-full h-full object-cover" alt="User" />
                                        ) : (
                                            <User className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>

                                    {/* Animated Dropdown */}
                                    <div className={`absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 transition-all duration-200 origin-top-right ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                                        <div className="p-2 space-y-1">
                                            <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-2.5 rounded-lg font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                <User className="w-4 h-4" /> My Profile
                                            </Link>
                                            <Link to="/profile/saved" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-2.5 rounded-lg font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                <Heart className="w-4 h-4" /> Saved Items
                                            </Link>

                                            <div className="h-px bg-slate-100 my-1 mx-2" />
                                            <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         ) : (
                            <div className="flex items-center gap-3">
                                {/* Saved Businesses Dropdown (Guest) */}
                                <div className="relative animate-fade-in" ref={productsGuestRef}>
                                    <button
                                        onClick={() => setIsProductsOpen(prev => !prev)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${isProductsOpen ? 'bg-slate-100 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-orange-500'}`}
                                        title="Saved Businesses"
                                    >
                                        <Bookmark className={`w-5 h-5 ${favoriteItems.length > 0 ? 'fill-orange-500 text-orange-500' : ''}`} />
                                        {favoriteItems.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                                {favoriteItems.length}
                                            </span>
                                        )}
                                    </button>

                                    {isProductsOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                                                    <Bookmark className="w-4 h-4 text-orange-500 fill-orange-500" /> Saved Businesses
                                                </h3>
                                                <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">
                                                    {favoriteItems.length} Saved
                                                </span>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                                {favoriteItems.length > 0 ? (
                                                    favoriteItems.map((item) => (
                                                         <Link 
                                                             key={item._id}
                                                             to={`/business/${item.slug}`}
                                                             onClick={() => setIsProductsOpen(false)}
                                                             className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group text-left w-full block"
                                                         >
                                                             <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                                                 {item.image ? (
                                                                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                                 ) : (
                                                                     <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-600 font-bold text-sm">
                                                                         {item.name?.charAt(0)}
                                                                     </div>
                                                                 )}
                                                             </div>
                                                             <div className="flex-1 min-w-0">
                                                                 <h4 className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                                                     {item.name}
                                                                 </h4>
                                                                 <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                                                     {item.category || 'Business'} • {item.city || 'Location'}
                                                                 </p>
                                                             </div>
                                                         </Link>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                         <Bookmark className="w-10 h-10 text-slate-200 mb-2" strokeWidth={1} />
                                                         <p className="text-xs text-slate-500 font-bold">No saved businesses yet</p>
                                                         <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Save businesses to see them here for quick access.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Saved Products Dropdown (Guest) */}
                                <div className="relative animate-fade-in" ref={favoritesGuestRef}>
                                    <button
                                        onClick={() => setIsFavoritesOpen(prev => !prev)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${isFavoritesOpen ? 'bg-slate-100 text-rose-600' : 'text-slate-600 hover:bg-slate-50 hover:text-rose-500'}`}
                                        title="Saved Products"
                                    >
                                        <Heart className={`w-5 h-5 ${savedProducts.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                        {savedProducts.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                                {savedProducts.length}
                                            </span>
                                        )}
                                    </button>

                                    {isFavoritesOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Saved Products
                                                </h3>
                                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                                                    {savedProducts.length} Saved
                                                </span>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                                {savedProducts.length > 0 ? (
                                                    savedProducts.map((item) => (
                                                         <Link 
                                                             key={item._id}
                                                             to={`/product/${item.slug}`}
                                                             onClick={() => setIsFavoritesOpen(false)}
                                                             className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group text-left w-full block"
                                                         >
                                                             <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                                                 {item.images?.[0] || item.image ? (
                                                                     <img src={item.images?.[0] || item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                                                 ) : (
                                                                     <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-600 font-bold text-sm">
                                                                         {item.name?.charAt(0)}
                                                                     </div>
                                                                 )}
                                                             </div>
                                                             <div className="flex-1 min-w-0">
                                                                 <h4 className="font-bold text-xs text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                                                                     {item.name}
                                                                 </h4>
                                                                 <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                                                     {item.brandId?.name || item.brand || 'Generic'} • ₹{item.price?.toLocaleString()}
                                                                 </p>
                                                             </div>
                                                         </Link>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                         <Heart className="w-10 h-10 text-slate-200 mb-2" strokeWidth={1} />
                                                         <p className="text-xs text-slate-500 font-bold">No saved products yet</p>
                                                         <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Save products to see them here for quick access.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 py-4 space-y-3">
                        <Link to="/advertise" className="block px-4 py-2 font-bold text-slate-800 hover:bg-slate-50 rounded-lg">Advertise</Link>

                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" className="block px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">My Profile</Link>
                                <button onClick={handleLogout} className="w-full text-left block px-4 py-2 font-bold text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="block px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Login</Link>
                                <Link to="/register" className="block px-4 py-2 font-bold text-slate-900 hover:bg-slate-50 rounded-lg">Sign Up</Link>
                            </>
                        )}
                    </div>
                )}

                <div id="google_translate_element" className="sr-only" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true" />
            </div>
        </header>
    );
}
