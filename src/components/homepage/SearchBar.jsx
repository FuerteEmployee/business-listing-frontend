import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInputGroup from '../ui/SearchInputGroup';
import { getApiUrl } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

export default function SearchBar({ selectedCity, cities = [] }) {
    const { settings } = useTheme();
    const hp = settings?.homepage || {};
    const [displayCount, setDisplayCount] = useState(hp.fixedCount || "");

    useEffect(() => {
        if (hp.countSource === 'fixed') {
            setDisplayCount(hp.fixedCount || "");
            return;
        }

        const fetchStats = async () => {
            try {
                const response = await fetch(getApiUrl('mc/public-stats'));
                const data = await response.json();
                if (data && data.total) {
                    const count = data.total;
                    if (count >= 10000000) {
                        setDisplayCount(`${(count / 10000000).toFixed(1)} Crore+`);
                    } else if (count >= 100000) {
                        setDisplayCount(`${(count / 100000).toFixed(1)} Lakh+`);
                    } else {
                        setDisplayCount(count.toLocaleString() + "+");
                    }
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, [hp.countSource, hp.fixedCount]);

    return (
        <div className="w-full bg-white pt-8 pb-6">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Hero Title */}
                <div className="mb-6">
                    <h1 className="text-[32px] md:text-[40px] font-bold text-slate-800 tracking-tight leading-tight">
                        {(!hp.heroTaglinePrefix && !hp.heroTaglineSuffix && !displayCount) ? (
                            "Search across multiple products and services"
                        ) : (
                            <>
                                {hp.heroTaglinePrefix}
                                {displayCount && <span className="text-blue-600 px-2">{displayCount}</span>}
                                {hp.heroTaglineSuffix}
                            </>
                        )}
                    </h1>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4">
                    {/* Search Wrapper */}
                    <div className="w-full lg:flex-1">
                        <SearchInputGroup selectedCity={selectedCity} cities={cities} variant="header" />
                    </div>
                </div>
            </div>
        </div>
    );
}

