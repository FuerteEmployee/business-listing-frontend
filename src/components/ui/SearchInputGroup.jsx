import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Mic, MicOff, LocateFixed, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../config/api';
import { getDeviceLocation, findNearestCity, getReverseGeocodeAddress } from '../../utils/geolocation';
import { useTheme } from '../../context/ThemeContext';

export default function SearchInputGroup({ selectedCity, cities = [], variant = 'hero' }) {
    const { settings } = useTheme();
    const hp = settings?.homepage || {};
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Custom Dropdown State
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [displayLocationString, setDisplayLocationString] = useState('Select City');
    const [activeCityId, setActiveCityId] = useState('');
    const dropdownRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (selectedCity && selectedCity._id) {
            setActiveCityId(selectedCity._id);
            setDisplayLocationString(selectedCity.name);
        }
    }, [selectedCity]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsLocationDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (overrideQuery) => {
        const queryToUse = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
        if (queryToUse.trim()) {
            navigate(`/search?q=${encodeURIComponent(queryToUse)}&city=${activeCityId}`);
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    const handleQuickSearch = (category) => {
        navigate(`/search?q=${encodeURIComponent(category)}&city=${activeCityId}`);
    };

    const handleDetectLocation = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDetectingLocation(true);
        try {
            const location = await getDeviceLocation();
            const addressInfo = await getReverseGeocodeAddress(location.latitude, location.longitude);

            if (addressInfo) {
                let displayStr = '';
                if (addressInfo.area && addressInfo.city && addressInfo.area !== addressInfo.city) {
                    displayStr = `${addressInfo.area}, ${addressInfo.city}`;
                } else if (addressInfo.city && addressInfo.state) {
                    displayStr = `${addressInfo.city}, ${addressInfo.state}`;
                } else {
                    displayStr = addressInfo.area || 'Location Detected';
                }

                setDisplayLocationString(displayStr);
                setIsLocationDropdownOpen(false);

                const nearest = findNearestCity(location.latitude, location.longitude, cities);
                if (nearest) {
                    setActiveCityId(nearest._id);
                }

                window.dispatchEvent(new CustomEvent('locationdetected', {
                    detail: { ...location, address: addressInfo }
                }));
            }
        } catch (err) {
            console.error('Location detection error:', err);
        } finally {
            setDetectingLocation(false);
        }
    };

    const handleSelectCity = (city) => {
        setActiveCityId(city._id);
        setDisplayLocationString(city.name);
        setIsLocationDropdownOpen(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 1) {
                try {
                    const res = await fetch(`${getApiUrl('companies')}/autocomplete?q=${encodeURIComponent(searchQuery)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    console.error('Autocomplete error:', err);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const recognitionRef = useRef(null);

    const startVoiceSearch = () => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice search is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
            handleSearch(transcript);
        };

        recognition.start();
    };

    const isHeader = variant === 'header';

    return (
        <div className={`w-full flex flex-col md:flex-row shadow-[0px_2px_15px_rgba(0,0,0,0.06)] border border-slate-300 rounded-lg bg-white focus-within:border-slate-400 focus-within:shadow-[0px_4px_20px_rgba(0,0,0,0.1)] transition-all ${isHeader ? 'h-[44px]' : 'h-[56px]'}`}>
            {/* Location Box */}
            <div className={`relative flex-none ${isHeader ? 'md:w-[220px]' : 'md:w-[280px]'} h-full bg-slate-50 border-b md:border-b-0 md:border-r border-slate-300 rounded-l-lg`} ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="w-full h-full flex items-center px-3 hover:bg-slate-100 transition-colors"
                >
                    {detectingLocation ? (
                        <Loader2 className={`text-slate-500 animate-spin mr-2 ${isHeader ? 'w-4 h-4' : 'w-[18px] h-[18px]'}`} />
                    ) : (
                        <LocateFixed className={`text-blue-500 mr-2 ${isHeader ? 'w-4 h-4' : 'w-[18px] h-[18px]'}`} />
                    )}
                    <span className={`text-slate-700 font-medium truncate flex-1 text-left ${isHeader ? 'text-[13px]' : 'text-[15px]'}`}>
                        {detectingLocation ? 'Detecting...' : displayLocationString}
                    </span>
                </button>

                {isLocationDropdownOpen && (
                    <div className="absolute top-full left-0 w-[340px] mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden">
                        {/* Detect Location */}
                        <div className="px-4 py-3 border-b border-slate-100">
                            <button
                                onClick={handleDetectLocation}
                                disabled={detectingLocation}
                                className="flex items-center gap-2 text-[15px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {detectingLocation ? (
                                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                ) : (
                                    <LocateFixed className="w-[18px] h-[18px]" />
                                )}
                                {detectingLocation ? 'Detecting...' : 'Detect Location'}
                            </button>
                        </div>

                        {/* Trending Areas */}
                        <div className="max-h-72 overflow-y-auto">
                            <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                Trending Areas
                            </div>
                            {cities.map(city => (
                                <button
                                    key={city._id}
                                    onClick={() => handleSelectCity(city)}
                                    className={`w-full text-left px-4 py-3 text-[15px] transition-colors border-b border-slate-50 last:border-0 ${
                                        activeCityId === city._id
                                            ? 'bg-slate-100 text-slate-900 font-semibold'
                                            : 'text-slate-800 hover:bg-slate-50 font-medium'
                                    }`}
                                >
                                    {city.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Search Box */}
            <div className="relative flex-1 h-full bg-white flex items-center rounded-r-lg">
                <input
                    type="text"
                    placeholder={isListening ? "Listening..." : (hp.searchPlaceholder || "Search for Spa & Salons")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                        setIsInputFocused(true);
                        setShowSuggestions(true);
                    }}
                    onBlur={() => {
                        // Delay to allow clicking suggestions
                        setTimeout(() => {
                            setIsInputFocused(false);
                            setShowSuggestions(false);
                        }, 200);
                    }}
                    className={`w-full h-full pl-4 ${isHeader ? 'pr-24 text-[13px]' : 'pr-32 text-[15px]'} text-slate-900 placeholder-slate-400 border-none focus:ring-0 outline-none bg-transparent font-medium`}
                />
                
                {isListening && (
                    <div className="absolute inset-y-0 left-0 bg-white/95 backdrop-blur-sm flex items-center pl-4 pr-4 gap-3 animate-in fade-in duration-300 right-20 z-10 border-r border-transparent">
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-4 bg-orange-500 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                            <span className="w-1.5 h-3 bg-orange-500 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                            <span className="w-1.5 h-5 bg-orange-500 rounded-full animate-[bounce_1s_infinite_600ms]"></span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 animate-pulse truncate hidden sm:block">Listening...</span>
                    </div>
                )}

                <div className="absolute right-1.5 flex items-center gap-1.5 z-20">
                    <button
                        onClick={startVoiceSearch}
                        className={`p-1.5 transition-all duration-300 rounded-full ${isListening ? 'bg-orange-100 text-orange-600 shadow-inner scale-110' : 'text-blue-500 hover:bg-slate-100 hover:text-blue-600'}`}
                        title={isListening ? "Stop Voice Search" : "Voice Search"}
                    >
                        {isListening ? (
                            <div className="relative flex items-center justify-center">
                                <Mic className={`${isHeader ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'}`} />
                                <span className="absolute w-[150%] h-[150%] rounded-full border-2 border-orange-500/50 animate-ping"></span>
                            </div>
                        ) : (
                            <Mic className={`${isHeader ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'}`} />
                        )}
                    </button>
                    <button
                        onClick={handleSearch}
                        className={`bg-[#ff5722] hover:bg-[#e64a19] text-white rounded shadow flex items-center justify-center transition-colors ${isHeader ? 'w-8 h-8' : 'w-10 h-10'}`}
                    >
                        <Search className={`${isHeader ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                        {searchQuery.length > 0 ? (
                            suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const text = typeof suggestion === 'string' ? suggestion : suggestion.text;
                                        setSearchQuery(text);
                                        handleQuickSearch(text);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-100 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                        <span className="text-[14px] font-medium text-slate-800">{typeof suggestion === 'string' ? suggestion : suggestion.text}</span>
                                    </div>
                                    {suggestion.type && (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                            {suggestion.type}
                                        </span>
                                    )}
                                </button>
                            ))
                        ) : (
                            /* Trending Searches */
                            <div>
                                <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-orange-500" />
                                    Trending Searches
                                </div>
                                {(hp.trendingSearches && hp.trendingSearches.length > 0 
                                    ? hp.trendingSearches 
                                    : []
                                ).map((term, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSearchQuery(term);
                                            handleQuickSearch(term);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group transition-colors"
                                    >
                                        <Search className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                        <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900">{term}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
