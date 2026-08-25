import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getApiUrl } from '../../config/api';

const DEFAULT_BANNERS = [
    {
        _id: 'default-1',
        title: 'CCTV & Security',
        subtitle: 'Solutions',
        imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273e26ebf1?auto=format&fit=crop&q=80&w=800',
        buttonText: 'GET BEST DEALS',
        link: '/search?q=CCTV',
        type: 'homepage',
        order: 1
    },
    {
        _id: 'default-2',
        title: 'B2B',
        subtitle: 'Quick Quotes',
        imageUrl: 'https://images.unsplash.com/photo-1566367576585-051277d52997?auto=format&fit=crop&q=80&w=400',
        link: '/search?q=B2B',
        type: 'homepage',
        order: 2,
        bgClass: 'bg-[#0a84d0]'
    },
    {
        _id: 'default-3',
        title: 'REPAIRS & SERVICES',
        subtitle: 'Get Nearest Vendor',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
        link: '/search?q=Repairs',
        type: 'homepage',
        order: 3,
        bgClass: 'bg-[#24458f]'
    },
    {
        _id: 'default-4',
        title: 'REAL ESTATE',
        subtitle: 'Finest Agents',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400',
        link: '/search?q=Real Estate',
        type: 'homepage',
        order: 4,
        bgClass: 'bg-[#6a5ad6]'
    },
    {
        _id: 'default-5',
        title: 'DOCTORS',
        subtitle: 'Book Now',
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
        link: '/search?q=Doctors',
        type: 'homepage',
        order: 5,
        bgClass: 'bg-[#03884e]'
    }
];

export default function HeroBanners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch(`${getApiUrl('cms/banners/public')}?type=homepage&status=active`);
                if (res.ok) {
                    const data = await res.json();
                    let fetchedBanners = data.banners || data.data || [];
                    
                    // Filter and sort active homepage banners
                    fetchedBanners = fetchedBanners
                        .filter(b => b.status === 'active' && b.type === 'homepage')
                        .sort((a, b) => a.order - b.order);

                    if (fetchedBanners.length > 0) {
                        setBanners(fetchedBanners);
                    } else {
                        setBanners(DEFAULT_BANNERS);
                    }
                } else {
                    setBanners(DEFAULT_BANNERS);
                }
            } catch (error) {
                console.error('Error fetching banners:', error);
                setBanners(DEFAULT_BANNERS);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    // A predefined set of background colors to cycle through for small banners 
    // to keep the UI looking premium even if admins only upload images with transparent bg.
    const FALLBACK_COLORS = ['#0a84d0', '#24458f', '#6a5ad6', '#03884e', '#ef4444', '#f59e0b'];

    if (loading) {
        return (
            <div className="w-full bg-white pb-10">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 min-h-[220px]">
                        <div className="lg:col-span-2 bg-slate-100 rounded-xl animate-pulse"></div>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-slate-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const mainBanner = banners[0];
    const subBanners = banners.slice(1, 5);

    return (
        <div className="w-full bg-white pb-10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex md:grid overflow-x-auto md:overflow-visible flex-nowrap md:grid-cols-2 lg:grid-cols-6 gap-4 pb-4 md:pb-0 min-h-[220px] no-scrollbar">
                    
                    {/* Large Banner (Spans 2 columns) */}
                    {mainBanner && (
                        <div className="lg:col-span-2 relative rounded-xl overflow-hidden bg-slate-100 group min-h-[240px] shadow-sm transform transition-all duration-300 hover:shadow-md flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto">
                            <img 
                                src={mainBanner.imageUrl} 
                                alt={mainBanner.title || 'Main Banner'} 
                                className="absolute inset-0 w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Gradient to ensure text is always completely readable on the left */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent z-[5]"></div>
                            
                            <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col justify-center max-w-[80%] lg:max-w-[65%]">
                                {mainBanner.title && (
                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-2 drop-shadow-sm">
                                        {mainBanner.title}
                                    </h2>
                                )}
                                {mainBanner.subtitle && (
                                    <p className="text-slate-700 font-semibold text-base sm:text-lg lg:text-xl mb-6 drop-shadow-sm line-clamp-2">
                                        {mainBanner.subtitle}
                                    </p>
                                )}
                                {mainBanner.link && (
                                    <Link to={mainBanner.link} className="inline-block px-6 py-2.5 bg-[#ef4444] text-white font-bold text-sm lg:text-base rounded-md shadow-sm hover:bg-red-600 hover:shadow transition-all self-start whitespace-nowrap uppercase tracking-wider">
                                        {mainBanner.buttonText || 'EXPLORE NOW'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Small Banners */}
                    {subBanners.map((banner, index) => {
                        const bgColor = banner.bgClass || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                        
                        return (
                            <Link key={banner._id || index} to={banner.link || '#'} className="relative rounded-xl overflow-hidden group min-h-[220px] shadow-sm transition-all duration-300 hover:shadow-md flex-shrink-0 w-[220px] sm:w-[240px] md:w-auto" style={{ backgroundColor: bgColor.replace('bg-[', '').replace(']', '') || bgColor }}>
                                <img 
                                    src={banner.imageUrl} 
                                    alt={banner.title || 'Sub Banner'} 
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                {/* Bottom-to-top and top-to-bottom dark gradient overlay for perfect text visibility */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 z-[5]"></div>
                                
                                <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                                    <div>
                                        {banner.title && (
                                            <h3 className="text-lg font-black text-white leading-tight uppercase line-clamp-2 drop-shadow-md tracking-wide">
                                                {banner.title}
                                            </h3>
                                        )}
                                        {banner.subtitle && (
                                            <p className="text-white/90 text-sm font-medium mt-1 line-clamp-2 drop-shadow">
                                                {banner.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-colors shrink-0 shadow-sm self-end">
                                        <ChevronRight className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
