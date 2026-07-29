import { useState, useEffect } from "react";
import { 
    Megaphone, TrendingUp, MousePointer2, Eye, 
    Calendar, Pause, Play, Plus, ChevronRight,
    ArrowUpRight, AlertCircle, Clock, CheckCircle2,
    BarChart3, Settings2, Trash2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { Button } from "../../components/ui/button";
import PromoteListingModal from "../../components/merchant/PromoteListingModal";

export default function Promotions() {
    const [ads, setAds] = useState([]);
    const [stats, setStats] = useState({
        totalImpressions: 0,
        totalClicks: 0,
        totalSpend: 0,
        activeCampaigns: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [myCompanies, setMyCompanies] = useState([]);

    const fetchPromotionsData = async () => {
        setIsLoading(true);
        try {
            const [adsRes, statsRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/merchant-ads`),
                fetchWithAuth(`${API_BASE_URL}/merchant-ads/stats`)
            ]);

            const adsData = await adsRes.json();
            const statsData = await statsRes.json();

            if (adsData.success) setAds(adsData.ads);
            if (statsData.success) setStats(statsData.summary);

            // Fetch companies for campaign creation
            const compRes = await fetchWithAuth(`${API_BASE_URL}/companies/my-companies`);
            const compData = await compRes.json();
            if (compData.success) setMyCompanies(compData.data);
        } catch (err) {
            console.error("Failed to fetch promos", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotionsData();
    }, []);

    const handleToggleStatus = async (adId) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/merchant-ads/${adId}/toggle`, {
                method: 'PATCH'
            });
            if (res.ok) {
                fetchPromotionsData();
            }
        } catch (err) {
            console.error("Failed to toggle promo", err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'pending_review': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'expired': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Content */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Listing Promotions</h1>
                    <p className="text-slate-500 font-medium mt-1">Boost your visibility and drive more leads to your business.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl px-6 py-6 font-black uppercase text-xs tracking-widest">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Full Report
                    </Button>
                    <button 
                        onClick={() => setIsPromoteModalOpen(true)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </button>
                </div>
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Active Campaigns", value: stats.activeCampaigns, icon: Megaphone, color: "indigo" },
                    { label: "Total Impressions", value: stats.totalImpressions.toLocaleString(), icon: Eye, color: "blue" },
                    { label: "Total Clicks", value: stats.totalClicks.toLocaleString(), icon: MousePointer2, color: "emerald" },
                    { label: "Total Spend", value: `₹${stats.totalSpend.toLocaleString()}`, icon: TrendingUp, color: "amber" }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest group-hover:bg-slate-100">Live</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-1">{kpi.value}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Campaigns Table */}
                <div className="xl:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Campaign Management</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pause, resume or analyze performance</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Business / Campaign</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center font-bold text-slate-400 uppercase tracking-widest">Loading Campaigns...</td>
                                    </tr>
                                ) : ads.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center flex flex-col items-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mb-6">
                                                <Megaphone className="w-10 h-10" />
                                            </div>
                                            <p className="font-black text-slate-900 uppercase tracking-tighter text-xl">No active campaigns</p>
                                            <p className="text-slate-500 font-medium max-w-sm mt-2">Boost your business listing today to start seeing results here.</p>
                                        </td>
                                    </tr>
                                ) : ads.map(ad => (
                                    <tr key={ad._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {ad.businessId?.image ? (
                                                        <img src={ad.businessId.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-indigo-600 font-black text-xl">{ad.businessId?.name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-lg uppercase tracking-tighter">{ad.businessId?.name}</div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Ends {new Date(ad.schedule?.endDate).toLocaleDateString()}
                                                        </span>
                                                        {ad.targetCategories?.length > 0 && (
                                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                                                                {ad.targetCategories.length} Categories
                                                            </span>
                                                        )}
                                                        {ad.targetLocations?.length > 0 && (
                                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                                                                {ad.targetLocations.length} Cities
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex gap-8">
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 tracking-tight">{ad.performance?.impressions || 0}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Views</div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 tracking-tight">{ad.performance?.clicks || 0}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Clicks</div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-indigo-600 tracking-tight">{ad.ctr || 0}%</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">CTR</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-dashed ${getStatusColor(ad.status)}`}>
                                                {ad.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleToggleStatus(ad._id)}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                                                    title={ad.status === 'active' ? 'Pause' : 'Resume'}
                                                >
                                                    {ad.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </button>
                                                <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Widget: Tips & Alerts */}
                <div className="space-y-8">
                    {/* Sponsored Badge Preview */}
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Badge Preview</h4>
                            <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-white/40 rounded-full"></div>
                                        <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                                    </div>
                                    <div className="bg-indigo-600 px-3 py-1 rounded-lg">
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Sponsored</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/5 rounded-full"></div>
                                    <div className="h-2 w-3/4 bg-white/5 rounded-full"></div>
                                </div>
                            </div>
                            <p className="text-xs text-white/60 mt-8 leading-relaxed">
                                Listings with <span className="text-white font-bold tracking-tight px-1.5 py-0.5 bg-indigo-600 rounded">Sponsored</span> badges receive up to <span className="text-white font-black">2.5x more enquiries</span> compared to standard listings.
                            </p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/20 blur-[60px] rounded-full group-hover:scale-150 transition-transform"></div>
                    </div>

                    {/* Spend Guide */}
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-6">Promotion Tips</h4>
                        <div className="space-y-6">
                            {[
                                { title: "Target the right Keywords", desc: "Select keywords that match intent like 'Best Pizza' or 'Pizza Near Me'.", icon: MousePointer2 },
                                { title: "Premium Photos Matter", desc: "Boosted listings with high-quality logos get 40% higher click rates.", icon: Eye },
                                { title: "Stay Active", desc: "Consistency is key. Long-term campaigns build organic trust.", icon: TrendingUp }
                            ].map((tip, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                        <tip.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-800 text-sm uppercase tracking-tighter">{tip.title}</h5>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{tip.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {myCompanies.length > 0 && (
                <PromoteListingModal 
                    isOpen={isPromoteModalOpen}
                    onClose={() => setIsPromoteModalOpen(false)}
                    company={myCompanies[0]} // Simplification: pick first for now or we could add a selector in the modal
                    onPromoted={() => {
                        fetchPromotionsData();
                        setIsPromoteModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
