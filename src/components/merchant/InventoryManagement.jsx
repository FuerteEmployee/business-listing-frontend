import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
    AlertTriangle, Layers, Plus, Minus, RefreshCw, 
    Search, FileText, LayoutGrid, TrendingDown, 
    Info, CheckCircle, Box, ArrowUpRight, ArrowDownRight,
    SearchX, TrendingUp
} from 'lucide-react';

const InventoryManagement = ({ listingId }) => {
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStock, setUpdatingStock] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchInventoryData();
    }, [listingId]);

    const fetchInventoryData = async () => {
        setLoading(true);
        try {
            const [alertsResponse, productsResponse] = await Promise.all([
                api.get(`/merchant/inventory/alerts?listingId=${listingId}`),
                api.get(`/merchant/products?listingId=${listingId}`)
            ]);
            setLowStockAlerts(alertsResponse.data);
            setProducts(productsResponse.data);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStock = async (productId, newStock) => {
        setUpdatingStock(productId);
        try {
            await api.put(`/merchant/inventory/products/${productId}/stock`, { stock: newStock });
            
            // Optimistic update
            setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock } : p));
            setLowStockAlerts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock } : p).filter(p => (p.stock || 0) <= (p.minStock || 5)));
            
        } catch (error) {
            console.error('Error updating stock:', error);
            fetchInventoryData(); // Rollback
        } finally {
            setUpdatingStock(null);
        }
    };

    const getStockStatus = (stock, minStock) => {
        if (stock <= 0) return { status: 'Out of Stock', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle };
        if (stock <= minStock) return { status: 'Low Stock', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: TrendingDown };
        return { status: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-6 text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Inventory...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                        <Layers className="w-6 h-6 text-indigo-600" />
                        Inventory Intelligence
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Real-time stock monitoring and distribution</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Box className="w-5 h-5" /></div>
                        <div>
                            <div className="text-lg font-black text-slate-900">{products.length}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total SKUS</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${lowStockAlerts.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {lowStockAlerts.length > 0 ? <TrendingDown className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="text-lg font-black text-slate-900">{lowStockAlerts.length}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Alerts</div>
                        </div>
                    </div>
                    <button 
                        onClick={fetchInventoryData}
                        className="bg-slate-900 text-white p-4 rounded-3xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Sync Data</span>
                    </button>
                </div>
            </div>

            {/* Low Stock Feature Banner */}
            {lowStockAlerts.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] relative overflow-hidden group">
                    <AlertTriangle className="absolute -right-6 -bottom-6 w-40 h-40 text-rose-500/10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-rose-600 shadow-sm ring-4 ring-rose-500/5">
                                <TrendingDown className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">Critical Stock Alerts</h3>
                                <p className="text-rose-700/70 font-medium text-sm">There are {lowStockAlerts.length} items that require immediate replenishment.</p>
                            </div>
                        </div>
                        <div className="flex -space-x-3">
                           {lowStockAlerts.slice(0, 5).map((item, i) => (
                               <div key={i} className="w-12 h-12 rounded-2xl border-2 border-rose-50 bg-white flex items-center justify-center shadow-sm overflow-hidden">
                                   {item.images?.[0] ? (
                                       <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                                   ) : (
                                       <Box className="w-5 h-5 text-rose-200" />
                                   )}
                               </div>
                           ))}
                           {lowStockAlerts.length > 5 && (
                               <div className="w-12 h-12 rounded-2xl border-2 border-rose-50 bg-rose-600 text-white flex items-center justify-center text-[10px] font-black">
                                   +{lowStockAlerts.length - 5}
                               </div>
                           )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Inventory Grid */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Local Filters */}
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Find inventory by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="h-14 px-6 rounded-3xl border border-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center gap-3">
                            <LayoutGrid className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Table View</span>
                        </button>
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                        <SearchX className="w-16 h-16 text-slate-100 mb-6" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Items found</h3>
                        <p className="text-slate-500 max-w-xs mt-2 text-sm font-medium leading-relaxed">We couldn't find any inventory items matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Details</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock level</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Min threshold</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.map((product) => {
                                    const { status, color, icon: StatusIcon } = getStockStatus(product.stock, product.minStock || 5);
                                    return (
                                        <tr key={product._id} className="group hover:bg-slate-50/20 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                                                        {product.images?.[0] ? (
                                                            <img src={product.images[0]} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-200"><Box className="w-6 h-6" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 break-words max-w-[200px]">{product.name}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.sku || 'NO-SKU'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{product.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-black ${product.stock <= (product.minStock || 5) ? 'text-rose-600 italic' : 'text-slate-900'}`}>{product.stock}</span>
                                                    <span className="text-xs font-bold text-slate-400 uppercase mt-1">Units</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-slate-500">{product.minStock || 5}</div>
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Threshold</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="inline-flex items-center gap-2 p-1.5 bg-slate-50 rounded-[20px] border border-slate-100 group-hover:bg-white transition-all group-hover:shadow-lg group-hover:shadow-indigo-50/50">
                                                    <button 
                                                        onClick={() => updateStock(product._id, Math.max(0, product.stock - 1))}
                                                        disabled={updatingStock === product._id || product.stock <= 0}
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-30 active:scale-90"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-slate-200" />
                                                    <div className="px-2 min-w-[40px] text-center font-black text-slate-900 text-sm">
                                                        {updatingStock === product._id ? (
                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto text-indigo-600" />
                                                        ) : (
                                                            product.stock
                                                        )}
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-200" />
                                                    <button 
                                                        onClick={() => updateStock(product._id, (product.stock || 0) + 1)}
                                                        disabled={updatingStock === product._id}
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-30 active:scale-90"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Premium Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                    <TrendingUp className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <Info className="w-5 h-5 text-indigo-200" />
                            Optimization Tip
                        </h3>
                        <div className="space-y-4">
                            <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                                High demand items are moving 20% faster this week. Consider increasing your minimum threshold to avoid stockouts.
                            </p>
                            <div className="pt-4 flex gap-3">
                                <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">View Analytics</button>
                                <button className="px-6 py-3 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-800/20">Set Smart Alerts</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] p-8 text-slate-100 relative overflow-hidden shadow-xl">
                    <Box className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-6">Inventory Health</h3>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                                    <span>Stock Availability</span>
                                    <span>84%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[84%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                                    <span>Fulfillment Speed</span>
                                    <span>92%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryManagement;