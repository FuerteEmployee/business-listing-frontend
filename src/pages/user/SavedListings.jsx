import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, ArrowRight, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function SavedListings() {
    const [listings, setListings] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('businesses');

    const fetchSaved = async () => {
        try {
            setLoading(true);
            const [listingsRes, productsRes] = await Promise.all([
                fetchWithAuth(getApiUrl('me/saved')),
                fetchWithAuth(getApiUrl('me/saved-products'))
            ]);
            
            if (listingsRes.ok) {
                const data = await listingsRes.json();
                setListings(data.data || []);
            }
            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching saved items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSaved();
    }, []);

    const handleRemove = async (id) => {
        try {
            const res = await fetchWithAuth(getApiUrl('me/saved/toggle'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: id })
            });
            if (res.ok) {
                setListings(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) {
            console.error('Error removing listing:', err);
        }
    };

    const handleRemoveProduct = async (id) => {
        try {
            const res = await fetchWithAuth(getApiUrl('me/saved-products/toggle'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: id })
            });
            if (res.ok) {
                setProducts(prev => prev.filter(item => item._id !== id));
            }
        } catch (err) {
            console.error('Error removing product:', err);
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Saved Items</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Things you've bookmarked for later.</p>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-6 border-b border-slate-200 mb-8 pb-3">
                <button
                    onClick={() => setActiveTab('businesses')}
                    className={`pb-1 text-sm font-black uppercase tracking-wider transition-colors border-b-2 ${
                        activeTab === 'businesses'
                            ? 'text-orange-600 border-orange-600'
                            : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                >
                    Saved Businesses ({listings.length})
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`pb-1 text-sm font-black uppercase tracking-wider transition-colors border-b-2 ${
                        activeTab === 'products'
                            ? 'text-orange-600 border-orange-600'
                            : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                >
                    Saved Products ({products.length})
                </button>
            </div>

            {activeTab === 'businesses' ? (
                listings.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                            <Heart className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No bookmarks yet</h3>
                        <p className="text-slate-400 text-sm font-bold mt-2 max-w-xs mx-auto">Start exploring and save your favorite businesses for quick access.</p>
                        <Link to="/search" className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-orange-100">
                            Browse Listings <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {listings.map((item) => (
                            <div key={item._id} className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                                <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                                    <img src={item.image || item.photos?.[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <button 
                                        onClick={() => handleRemove(item._id)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-green-600 flex items-center gap-1 shadow-sm">
                                            <Star className="w-3 h-3 fill-current" /> {item.rating}
                                        </div>
                                        {item.isVerified && (
                                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                                                Verified
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-black text-xl text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">{item.name}</h4>
                                    <div className="flex items-center gap-1.5 text-slate-400 mt-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight line-clamp-1">{item.address}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Reviews</span>
                                                <span className="text-sm font-black text-slate-700">{item.reviewCount || 0}</span>
                                            </div>
                                            <div className="w-px h-6 bg-slate-100" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Category</span>
                                                <span className="text-[10px] font-black text-orange-600 uppercase mt-1">{item.category_id?.name || 'Local Service'}</span>
                                            </div>
                                        </div>
                                        <Link to={`/business/${item.slug}`} className="w-10 h-10 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                products.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                            <Heart className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No saved products yet</h3>
                        <p className="text-slate-400 text-sm font-bold mt-2 max-w-xs mx-auto">Browse products and save them here for quick access.</p>
                        <Link to="/search" className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-orange-100">
                            Browse Products <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {products.map((item) => (
                            <div key={item._id} className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col">
                                <div className="aspect-square bg-white relative overflow-hidden p-4 flex items-center justify-center border-b border-slate-100">
                                    {item.images?.[0] || item.image ? (
                                        <img src={item.images?.[0] || item.image} alt={item.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                            <Heart className="w-12 h-12 text-slate-200" />
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => handleRemoveProduct(item._id)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-2">{item.brandId?.name || 'Generic'}</span>
                                        <h4 className="font-black text-lg text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">{item.name}</h4>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Price</span>
                                            <span className="text-base font-black text-slate-700">₹ {item.price?.toLocaleString()}</span>
                                        </div>
                                        <Link to={`/product/${item.slug}`} className="w-10 h-10 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
