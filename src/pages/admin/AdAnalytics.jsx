import { useState, useEffect, useCallback } from "react";
import { 
    BarChart3, MousePointer2, Eye, DollarSign, TrendingUp, Calendar, 
    ChevronRight, ExternalLink, RefreshCw, Loader2, AlertCircle, TrendingDown
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const STAT_CARDS = [
    { title: "Total Impressions", key: "totalImpressions", icon: Eye, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { title: "Total Clicks", key: "totalClicks", icon: MousePointer2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { title: "Total Ad Spend", key: "totalSpend", icon: DollarSign, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { title: "Active Campaigns", key: "activeAds", icon: TrendingUp, color: "text-purple-600 bg-purple-50 border-purple-100" }
];

export default function AdAnalytics() {
    const [summary, setSummary] = useState({ totalImpressions: 0, totalClicks: 0, totalSpend: 0, activeAds: 0 });
    const [topAds, setTopAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(dateRange);
            const res = await fetchWithAuth(`${API_BASE_URL}/ads/analytics?${params}`);
            if (res.ok) {
                const data = await res.json();
                setSummary(data.summary);
                setTopAds(data.topAds);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const ctr = summary.totalImpressions ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2) : 0;

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Ad Performance Analytics"
                subtitle="Track impressions, clicks, CTR and campaign spend"
                badge={
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 w-fit mb-4">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm shadow-slate-100">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input type="date" className="border-none bg-transparent text-xs font-bold text-slate-700 focus:ring-0 p-0"
                                value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} />
                            <span className="text-slate-300 font-bold px-1">→</span>
                            <input type="date" className="border-none bg-transparent text-xs font-bold text-slate-700 focus:ring-0 p-0"
                                value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} />
                        </div>
                        <button onClick={fetchData} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-500">
                            <RefreshCw className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                </div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STAT_CARDS.map(card => (
                            <div key={card.key} className={`rounded-3xl border p-6 space-y-3 ${card.color} shadow-sm shadow-slate-200/50`}>
                                <div className="flex items-center justify-between">
                                    <card.icon className="w-5 h-5 opacity-70" />
                                    <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/50 rounded-lg">Performance</div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 m-0">{card.title}</p>
                                    <h3 className="text-3xl font-black mt-1">
                                        {card.key === 'totalSpend' ? '₹' : ''}
                                        {summary[card.key]?.toLocaleString() || 0}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTR & ROAS Simulation Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 flex flex-col justify-center gap-6 shadow-sm shadow-slate-200/50 relative overflow-hidden">
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-50"></div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Global Click-Through Rate</h3>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-7xl font-black text-slate-900 tracking-tighter">{ctr}%</span>
                                    {ctr > 2 ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                                            <TrendingUp className="w-3.5 h-3.5" /> High Engagement
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
                                            <AlertCircle className="w-3.5 h-3.5" /> Room for Optimization
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-4 max-w-md">
                                    CTR (Click-Through Rate) indicates how effectively your ads capture user interest. A rate above 2.5% is considered excellent for directory sites.
                                </p>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black">Ad Revenue Info</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-indigo-400/30">
                                    <span className="text-sm font-bold opacity-70 italic">Avg. CPM</span>
                                    <span className="text-xl font-black">₹{summary.totalImpressions ? ((summary.totalSpend / summary.totalImpressions) * 1000).toFixed(1) : 0}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-indigo-400/30">
                                    <span className="text-sm font-bold opacity-70 italic">Avg. CPC</span>
                                    <span className="text-xl font-black">₹{summary.totalClicks ? (summary.totalSpend / summary.totalClicks).toFixed(1) : 0}</span>
                                </div>
                                <div className="pt-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Campaign Yield</h4>
                                    <div className="h-2 bg-indigo-900/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                    <p className="text-[10px] font-bold mt-2 opacity-70 italic">Est. Yield: 4.5% conversion potential</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Ads Table */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Top Performing Campaigns</h3>
                            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Ads</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        {["Campaign", "Business", "Impressions", "Clicks", "CTR", "Engagement"].map(h => (
                                            <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {topAds.map(ad => (
                                        <tr key={ad._id} className="hover:bg-slate-50/50 group transition-all duration-200">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-6 bg-slate-100 rounded border border-slate-200 overflow-hidden">
                                                        <img src={ad.creativeUrl} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm">{ad.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-slate-500">{ad.businessId?.name || "Global"}</td>
                                            <td className="px-8 py-4 text-xs font-black text-slate-700">{ad.performance.impressions.toLocaleString()}</td>
                                            <td className="px-8 py-4 text-xs font-black text-slate-700">{ad.performance.clicks.toLocaleString()}</td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-black text-indigo-600">{ad.ctr}%</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[80px]">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(ad.ctr * 10, 100)}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 italic">
                                                        {ad.ctr > 5 ? 'High' : ad.ctr > 2 ? 'Mid' : 'Low'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
