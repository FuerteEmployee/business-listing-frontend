import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, LogOut, Bell, User, Heart, Settings, MessageSquare, ShieldCheck, Globe, Volume2, TrendingUp } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import SearchInputGroup from '../ui/SearchInputGroup';

export default function Header({ selectedCity, cities = [], onCityChange }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);

    // Profile Dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Language Dropdown state
    const [isLangOpen, setIsLangOpen] = useState(false);
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

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            if (langRef.current && !langRef.current.contains(event.target)) {
                setIsLangOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                            <SearchInputGroup selectedCity={selectedCity} cities={cities} variant="header" />
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
                                            {user?.role && (user.role === 'Admin' || user.role === 'Super Admin') && (
                                                <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-2.5 rounded-lg font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                                                </Link>
                                            )}
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
