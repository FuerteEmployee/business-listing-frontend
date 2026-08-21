import { useEffect, useState } from 'react';
import { getApiUrl } from '../../config/api';
import { ChevronLeft, ChevronRight, X, Send, CheckCircle2, User, Phone, Mail, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdvertisementBanner() {
    const [categoryBanners, setCategoryBanners] = useState([]);
    const [sidebarBanners, setSidebarBanners] = useState([]);
    const [currentCatBanner, setCurrentCatBanner] = useState(0);
    const [loading, setLoading] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchPromoBanners();
    }, []);

    // Auto-rotate category banners
    useEffect(() => {
        if (!autoRotate || categoryBanners.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentCatBanner((prev) => (prev + 1) % categoryBanners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [autoRotate, categoryBanners.length]);

    // Update message text when banner selection changes
    useEffect(() => {
        if (selectedBanner) {
            setFormData({
                name: '',
                phone: '',
                email: '',
                message: `Hi, I am interested in the advertisement: "${selectedBanner.title || 'General Ad'}". Please share more details.`
            });
            setSubmitted(false);
        }
    }, [selectedBanner]);

    const fetchPromoBanners = async () => {
        try {
            setLoading(true);
            // Fetch Category
            const catRes = await fetch(`${getApiUrl('cms/banners/public')}?type=category&status=active`);
            if (catRes.ok) {
                const data = await catRes.json();
                setCategoryBanners(data.banners || data.data || []);
            }
            
            // Fetch Sidebar
            const sbRes = await fetch(`${getApiUrl('cms/banners/public')}?type=sidebar&status=active`);
            if (sbRes.ok) {
                const data = await sbRes.json();
                setSidebarBanners(data.banners || data.data || []);
            }
        } catch (err) {
            console.error('Error fetching promo banners:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerClick = (banner) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const handleFormChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            toast.error('Name and Phone Number are required.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(getApiUrl('leads'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    category: selectedBanner?.title || 'Advertisement',
                    source: 'Advertising',
                    agreedToPrivacy: true
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Inquiry submitted successfully!');
                setSubmitted(true);
            } else {
                toast.error(data.message || 'Failed to submit inquiry.');
            }
        } catch (err) {
            console.error('Ad click inquiry submission error:', err);
            toast.error('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!loading && categoryBanners.length === 0 && sidebarBanners.length === 0) {
        return null; // Return nothing if no promo banners exist
    }

    const banner = categoryBanners[currentCatBanner];

    const handlePrev = () => {
        setAutoRotate(false);
        setCurrentCatBanner((prev) => (prev - 1 + categoryBanners.length) % categoryBanners.length);
    };

    const handleNext = () => {
        setAutoRotate(false);
        setCurrentCatBanner((prev) => (prev + 1) % categoryBanners.length);
    };

    return (
        <div className="bg-white py-8">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* Category Header Banners (Wide) */}
                {categoryBanners.length > 0 && (
                    <div className="w-full">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Category Header Demo</h2>
                        <div className="relative group">
                            <div
                                onClick={() => handleBannerClick(banner)}
                                className="block relative rounded-2xl overflow-hidden aspect-[4/1] bg-slate-100 shadow-sm border border-slate-100 cursor-pointer"
                            >
                                <img
                                    src={banner?.imageUrl}
                                    alt={banner?.title}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                                {banner?.title && (
                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-10">
                                        <h3 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-md">{banner.title}</h3>
                                        {banner.subtitle && (
                                            <p className="text-lg md:text-xl text-slate-200 font-medium drop-shadow-sm max-w-2xl">{banner.subtitle}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Arrow Navigation */}
                            {categoryBanners.length > 1 && (
                                <>
                                    <button onClick={handlePrev} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 hover:scale-110">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={handleNext} className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 hover:scale-110">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                        {categoryBanners.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setCurrentCatBanner(idx); setAutoRotate(false); }}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentCatBanner ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/40 w-3 hover:bg-white/60'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Sidebar Promo Banners (Grid for Demo) */}
                {sidebarBanners.length > 0 && (
                    <div className="w-full">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sidebar Promo Demo</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {sidebarBanners.map((sbBanner, index) => (
                                <div 
                                    key={sbBanner._id || index}
                                    onClick={() => handleBannerClick(sbBanner)}
                                    className="block relative rounded-xl overflow-hidden aspect-square bg-slate-100 shadow-sm border border-slate-100 group cursor-pointer"
                                >
                                    <img 
                                        src={sbBanner.imageUrl} 
                                        alt={sbBanner.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                                    <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
                                        {sbBanner.title && (
                                            <h4 className="text-white font-black text-lg leading-tight drop-shadow-md mb-1">{sbBanner.title}</h4>
                                        )}
                                        {sbBanner.subtitle && (
                                            <p className="text-white/80 font-medium text-xs line-clamp-2 drop-shadow">{sbBanner.subtitle}</p>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white tracking-widest border border-white/20">
                                        Ad
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Inquiry Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 relative animate-in fade-in zoom-in duration-300 border border-slate-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {submitted ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Inquiry Sent!</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Thank you for your interest. The administrator has been notified and will get back to you shortly.
                                </p>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
                                >
                                    Close Window
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-5">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Ad Inquiry</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                                        Interested in this advertiser? Fill out the form below to directly contact the site admin.
                                    </p>
                                </div>

                                {/* Name */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                            <User className="w-4 h-4" />
                                        </span>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </span>
                                        <input 
                                            type="tel" 
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            placeholder="e.g. +91 9876543210"
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </span>
                                        <input 
                                            type="email" 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="e.g. name@example.com"
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Message / Requirement *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-slate-400">
                                            <FileText className="w-4 h-4" />
                                        </span>
                                        <textarea 
                                            name="message"
                                            value={formData.message}
                                            onChange={handleFormChange}
                                            rows="3"
                                            placeholder="Your inquiry details..."
                                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors resize-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"
                                >
                                    {submitting ? 'Submitting...' : 'Send Inquiry'}
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
