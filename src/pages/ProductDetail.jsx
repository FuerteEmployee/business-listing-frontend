import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    Star, 
    MessageSquare, 
    Phone, 
    Share2, 
    Heart, 
    ShieldCheck, 
    Clock, 
    MapPin, 
    Globe, 
    Mail, 
    ImageIcon, 
    Loader2,
    Info,
    CheckCircle2,
    ArrowRight,
    ShoppingBag,
    Tag,
    Box,
    ChevronRight
} from 'lucide-react';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';
import { getApiUrl } from '../config/api';
import { logAnalyticsEvent } from '../utils/tracker';

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${getApiUrl('products')}/slug/${slug}`);
                const data = await res.json();
                
                if (res.ok && data.success) {
                    setProduct(data.data);
                    setSimilarProducts(data.similarProducts || []);
                    setActiveImage(0);
                } else {
                    setError(data.error || 'Product not found');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [slug]);

    useEffect(() => {
        if (product?.listingId?._id) {
            logAnalyticsEvent('view', product.listingId._id, { source: 'product_page' });
        }
    }, [product?.listingId?._id]);

    const handleCall = () => {
        if (product?.listingId?.phone) {
            logAnalyticsEvent('call', product.listingId._id);
            window.location.href = `tel:${product.listingId.phone}`;
        } else {
            alert('Contact number not available');
        }
    };

    const handleEnquire = () => {
        logAnalyticsEvent('enquiry', product.listingId?._id);
        alert(`Enquiry sent for ${product?.name}! The seller will contact you shortly.`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium italic">Discovering product details...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 font-bold text-2xl">
                        ?
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Product Not Available</h1>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        The product you are looking for might have been moved or is no longer active.
                    </p>
                    <Link to="/" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                        Continue Shopping
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const images = product.images?.length > 0 ? product.images : [null];

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Product Title and Basic Info */}
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                            {product.brandId?.name && `${product.brandId.name} `}{product.name}
                        </h1>
                        
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                        key={star} 
                                        className={`w-4 h-4 ${star <= Math.floor(product.listingId?.rating || 4) ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} 
                                    />
                                ))}
                                <span className="ml-2 text-sm text-slate-500">{product.listingId?.reviewCount || 2} Ratings</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-2xl font-bold text-slate-900">₹ {product.price?.toLocaleString()}</span>
                            <div className="group relative">
                                <Info className="w-4 h-4 text-slate-300 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Price might vary based on order quantity and location.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Column 1: Product Image */}
                        <div className="lg:col-span-4">
                            <div className="aspect-square bg-white rounded-xl overflow-hidden border border-slate-100 relative group">
                                {images[activeImage] ? (
                                    <img 
                                        src={images[activeImage]} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain p-4" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <ImageIcon className="w-20 h-20 text-slate-200" />
                                    </div>
                                )}
                                
                                {images.length > 1 && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                        {images.map((_, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setActiveImage(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-orange-600 w-4' : 'bg-slate-300'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Highlights and Description */}
                        <div className="lg:col-span-5 space-y-10">
                            {/* Highlights */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Highlights</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <span className="text-slate-500">Brand:</span>
                                        <span className="col-span-2 text-slate-800 font-medium">{product.brandId?.name || 'Generic'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <span className="text-slate-500">Material:</span>
                                        <span className="col-span-2 text-slate-800 font-medium">High Strength Steel</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <span className="text-slate-500">Type:</span>
                                        <span className="col-span-2 text-slate-800 font-medium">{product.categoryId?.name || 'Industrial'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <span className="text-slate-500">Power Source:</span>
                                        <span className="col-span-2 text-slate-800 font-medium">Hydraulic</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <span className="text-slate-500">Capacity:</span>
                                        <span className="col-span-2 text-slate-800 font-medium">100 Tons</span>
                                    </div>
                                </div>
                                <button className="mt-4 text-blue-600 text-sm font-bold hover:underline">View Full Specification</button>
                            </section>

                            {/* Warranty */}
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">6 Months Warranty</h4>
                                    <p className="text-xs text-slate-500 mt-1">Comes with brand warranty</p>
                                    <button className="text-[10px] font-bold text-blue-600 uppercase mt-1">Know More</button>
                                </div>
                            </div>

                            {/* Product Description */}
                            <section>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Product Description</h3>
                                <div className={`prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed ${!showFullDescription && 'line-clamp-4'}`}>
                                    {product.description || `The ${product.name} is designed to meet industrial standards, offering high performance and durability. Crafted with quality materials, it ensures long-term reliability for your operations. Perfect for heavy-duty applications...`}
                                </div>
                                <button 
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                    className="mt-3 text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"
                                >
                                    {showFullDescription ? 'View Less' : 'View More'}
                                </button>
                            </section>
                        </div>

                        {/* Column 3: Seller Sidebar */}
                        <div className="lg:col-span-3">
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-24">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Seller Information</h4>
                                
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                        {product.listingId?.image ? (
                                            <img src={product.listingId.image} alt={product.listingId.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-slate-900 leading-tight mb-1">{product.listingId?.name}</h5>
                                        <p className="text-xs text-slate-500 mb-2">{product.listingId?.city_id?.name || 'Mumbai'}</p>
                                        <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold w-fit">
                                            {product.listingId?.rating || 4.5} <Star className="w-3 h-3 fill-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button 
                                        onClick={handleCall}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Show Number
                                    </button>
                                    <button 
                                        onClick={handleEnquire}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                                    >
                                        Get Best Price
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Similar Products */}
                    {similarProducts.length > 0 && (
                        <div className="mt-20 relative px-4 md:px-0">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Similar Products</h3>
                            
                            <div className="relative group">
                                <div 
                                    className="flex gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth"
                                    id="similar-products-container"
                                >
                                    {similarProducts.map((p) => (
                                        <Link 
                                            key={p._id} 
                                            to={`/product/${p.slug}`}
                                            className="min-w-[200px] md:min-w-[240px] bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group/card"
                                        >
                                            <div className="aspect-square bg-white p-4 flex items-center justify-center">
                                                {p.images?.[0] ? (
                                                    <img 
                                                        src={p.images[0]} 
                                                        alt={p.name} 
                                                        className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-500" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                        <ImageIcon className="w-10 h-10" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="p-4 border-t border-slate-100 flex-1 flex flex-col">
                                                <h4 className="text-sm font-medium text-slate-700 mb-2 line-clamp-2 min-h-[40px] group-hover/card:text-blue-600 transition-colors">
                                                    {p.name}
                                                </h4>
                                                
                                                <div className="flex items-center gap-1 mb-3">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star 
                                                            key={star} 
                                                            className={`w-3.5 h-3.5 ${star <= 4 ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} 
                                                        />
                                                    ))}
                                                    <span className="text-[11px] text-slate-400 ml-1 font-medium">4 Ratings</span>
                                                </div>
                                                
                                                <p className="text-lg font-bold text-slate-900 mt-auto">₹ {p.price?.toLocaleString()}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Scroll Arrows (Right only as per image) */}
                                <button 
                                    onClick={() => {
                                        const container = document.getElementById('similar-products-container');
                                        container.scrollBy({ left: 300, behavior: 'smooth' });
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-orange-600 hover:border-orange-200 z-10 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
