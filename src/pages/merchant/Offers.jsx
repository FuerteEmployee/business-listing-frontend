import { useState, useEffect } from "react";
import { 
    Star, Plus, Trash2, Tag, Calendar, 
    MousePointer2, Eye, MoreVertical, 
    CheckCircle2, Clock, AlertCircle, TrendingUp,
    Search, Filter, ChevronRight, BarChart3,
    ArrowUpRight, Info, CheckCircle, Building2, Percent
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { Button } from "../../components/ui/button";
import CreateOfferModal from "../../components/merchant/CreateOfferModal";

export default function Offers() {
    const [offers, setOffers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedOffers, setSelectedOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [stats, setStats] = useState({
        totalViews: 0,
        totalRedemptions: 0,
        activeOffers: 0
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [offersRes, companiesRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/offers/merchant`),
                fetchWithAuth(`${API_BASE_URL}/companies/my-companies`)
            ]);

            const offersData = await offersRes.json();
            const companiesData = await companiesRes.json();

            if (offersData.success) {
                setOffers(offersData.offers);
                // Simple stats aggregation
                const activeCount = offersData.offers.filter(o => o.status === 'active').length;
                const views = offersData.offers.reduce((sum, o) => sum + (o.performance?.views || 0), 0);
                const redemptions = offersData.offers.reduce((sum, o) => sum + (o.performance?.redemptions || 0), 0);
                setStats({ totalViews: views, totalRedemptions: redemptions, activeOffers: activeCount });
            }
            if (companiesData.success) {
                setCompanies(companiesData.data || []);
            }

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedOffers.length} offers?`)) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/offers`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedOffers })
            });
            if (res.ok) {
                fetchData();
                setSelectedOffers([]);
            }
        } catch (err) {
            console.error("Bulk delete failed", err);
        }
    };

    const toggleOfferSelection = (id) => {
        setSelectedOffers(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'expired': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 underline decoration-indigo-600 decoration-4 underline-offset-8">
                        Offers & Deals
                    </h1>
                    <p className="text-slate-500 font-medium mt-4">Manage exclusive discounts and time-bound promotions for your listings.</p>
                </div>
                <div className="flex gap-3">
                    {selectedOffers.length > 0 && (
                        <Button 
                            variant="danger" 
                            onClick={handleBulkDelete}
                            className="rounded-2xl px-6 py-6 font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ({selectedOffers.length})
                        </Button>
                    )}
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Deal
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Offers", value: stats.activeOffers, icon: Tag, color: "emerald", trend: "+12%" },
                    { label: "Offer Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "indigo", trend: "Hot" },
                    { label: "Redemptions", value: stats.totalRedemptions.toLocaleString(), icon: MousePointer2, color: "rose", trend: "Direct Leads" }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-black text-${kpi.color}-600 bg-${kpi.color}-50 px-3 py-1 rounded-full uppercase tracking-widest`}>{kpi.trend}</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{kpi.value}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-${kpi.color}-50/30 blur-3xl rounded-full group-hover:scale-150 transition-transform`}></div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Deals Inventory</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Track and manage your promotional offers</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search offers..." 
                                className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium w-full md:w-64 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                            />
                        </div>
                        <Button variant="outline" className="rounded-2xl aspect-square p-0 w-12 h-12">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-left w-10">
                                    <input 
                                        type="checkbox" 
                                        className="rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-600"
                                        checked={selectedOffers.length === offers.length && offers.length > 0}
                                        onChange={() => {
                                            if (selectedOffers.length === offers.length) setSelectedOffers([]);
                                            else setSelectedOffers(offers.map(o => o._id));
                                        }}
                                    />
                                </th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Offer / Listing</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            Loading Offers...
                                        </div>
                                    </td>
                                </tr>
                            ) : offers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300 mb-8 border-2 border-dashed border-slate-200">
                                                <Tag className="w-12 h-12" />
                                            </div>
                                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No active offers</h4>
                                            <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Boost your sales by launching a new deal starting today.</p>
                                            <Button onClick={() => setIsCreateModalOpen(true)} className="px-10 py-6 rounded-2xl">
                                                Create Your First Deal
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : offers.map(offer => (
                                <tr key={offer._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-8">
                                        <input 
                                            type="checkbox" 
                                            className="rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-600"
                                            checked={selectedOffers.includes(offer._id)}
                                            onChange={() => toggleOfferSelection(offer._id)}
                                        />
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-[20px] bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-white transition-colors">
                                                {offer.businessId?.image ? (
                                                    <img src={offer.businessId.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-slate-400 font-black text-xl">{offer.businessId?.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 uppercase tracking-tighter hover:text-indigo-600 cursor-pointer transition-colors leading-tight">
                                                    {offer.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{offer.businessId?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="inline-flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                            <Percent className="w-4 h-4 text-indigo-600 mr-2" />
                                            <span className="text-lg font-black text-indigo-700 tracking-tight">
                                                {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : 
                                                 offer.discountType === 'flat' ? `₹${offer.discountValue} OFF` :
                                                 offer.discountType === 'buy_one_get_one' ? 'BOGO' : offer.discountType.toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex gap-10">
                                            <div>
                                                <div className="text-2xl font-black text-slate-900 tracking-tight">{offer.performance?.views || 0}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Interactions</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-emerald-600 tracking-tight">{offer.performance?.redemptions || 0}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Redemptions</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-dashed ${getStatusColor(offer.status)}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${offer.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                                {offer.status}
                                            </div>
                                        </span>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateOfferModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                companies={companies}
                onCreated={fetchData}
            />
        </div>
    );
}
