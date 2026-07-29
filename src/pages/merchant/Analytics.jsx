import { useState, useEffect, useMemo } from 'react';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
    Users, Phone, MessageSquare, ArrowUpRight, 
    Download, Smartphone, Monitor, Zap, Globe, 
    Search, Award, TrendingUp, Info, MoreHorizontal,
    Table as TableIcon, Star
} from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

export default function Analytics() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('all');
    const [overviewData, setOverviewData] = useState(null);
    const [detailedData, setDetailedData] = useState(null);

    useEffect(() => {
        const init = async () => {
            await fetchBusinesses();
            await fetchOverview();
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedBusiness !== 'all') {
            fetchDetailedAnalytics(selectedBusiness);
        } else {
            setDetailedData(null);
        }
    }, [selectedBusiness]);

    const fetchBusinesses = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/my-companies`);
            const data = await res.json();
            if (data.success) {
                setBusinesses(data.data);
            }
        } catch (err) {
            console.error('Error fetching businesses:', err);
        }
    };

    const fetchOverview = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/analytics/merchant/overview`);
            const data = await res.json();
            if (data.success) {
                setOverviewData(data);
            }
        } catch (err) {
            console.error('Error fetching overview:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDetailedAnalytics = async (businessId) => {
        try {
            setIsLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/analytics/merchant/business/${businessId}`);
            const data = await res.json();
            if (data.success) {
                setDetailedData(data);
            }
        } catch (err) {
            console.error('Error fetching detailed analytics:', err);
            toast.error("Failed to load detailed analytics");
        } finally {
            setIsLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!detailedData && !overviewData) return;
        
        const data = detailedData?.trends || overviewData?.trends || [];
        if (data.length === 0) return;

        const headers = ["Date", "Views", "Conversions"];
        const csvRows = [
            headers.join(","),
            ...data.map(row => `${row._id},${row.views},${row.conversions}`)
        ];
        
        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedBusiness === 'all' ? 'overview' : selectedBusiness}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
    };

    const kpiData = useMemo(() => {
        const source = detailedData || (overviewData ? { 
            metrics: overviewData.kpis,
            business: { name: 'All Locations' }
        } : null);

        if (!source) return [];

        return [
            { label: 'Total Views', value: source.metrics?.views || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Voice Calls', value: source.metrics?.calls || 0, icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'WhatsApp', value: source.metrics?.whatsapp || source.metrics?.clicks || 0, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Enquiries', value: source.metrics?.enquiries || 0, icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50' },
        ];
    }, [overviewData, detailedData]);

    const funnelData = useMemo(() => {
        if (!detailedData) return [];
        const views = detailedData.metrics?.views || 1;
        const conversions = (detailedData.metrics?.calls || 0) + (detailedData.metrics?.enquiries || 0) + (detailedData.metrics?.whatsapp || 0);
        
        return [
            { name: 'Profile Visits', value: views, fill: '#6366f1' },
            { name: 'Conversions', value: conversions || 0, fill: '#10b981' },
        ];
    }, [detailedData]);

    if (isLoading && !overviewData) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 pb-20">
            {/* Header section with sophisticated controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-50">
                        <TrendingUp className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                            Intelligence <span className="text-indigo-600">Hub</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Listing:</span>
                            <select 
                                value={selectedBusiness}
                                onChange={(e) => setSelectedBusiness(e.target.value)}
                                className="bg-transparent border-none text-indigo-600 font-extrabold text-xs p-0 focus:ring-0 cursor-pointer hover:underline uppercase p-0 h-auto leading-none"
                            >
                                <option value="all">Global Overview</option>
                                {businesses.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={exportToCSV}
                        className="group flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        <Download className="w-4 h-4 group-hover:bounce" />
                        Export Dataset
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {kpiData.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}></div>
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-lg shadow-current/10 group-hover:rotate-12 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                                <ArrowUpRight className="w-3 h-3" />
                                Growth
                            </div>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{stat.label}</h4>
                        <div className="text-4xl font-black text-slate-900 relative z-10">
                            {stat.value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Main Performance Chart */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visibility & Engagement</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Timeline analysis for the last 30 days</p>
                        </div>
                        <div className="hidden sm:flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-md"></div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Views</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={detailedData?.trends || overviewData?.trends || []}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="_id" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                                    dy={15}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                                    labelClassName="text-[10px] font-black uppercase mb-2 text-slate-400"
                                />
                                <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={5} fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px] -mr-24 -mt-24"></div>
                    <h3 className="text-xl font-black uppercase mb-1 relative z-10 tracking-tight">Conversion <span className="text-emerald-400">Funnel</span></h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-10 relative z-10">User journey drop-off analysis</p>

                    <div className="flex-1 space-y-8 relative z-10">
                        {funnelData.length > 0 ? funnelData.map((step, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400">{step.name}</span>
                                    <span className="text-lg font-black">{step.value.toLocaleString()}</span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000" 
                                        style={{ 
                                            width: `${(step.value / funnelData[0].value) * 100}%`,
                                            backgroundColor: step.fill,
                                            boxShadow: `0 0 15px ${step.fill}40`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex items-center justify-center text-slate-600 italic text-xs">
                                Select a specific business to view funnel
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <Info className="w-5 h-5 text-emerald-400" />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                                Tip: Enhance your description and logo to improve conversions from Profile Visits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Insights Section */}
            {selectedBusiness !== 'all' && detailedData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Search Keywords */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
                        <h3 className="text-lg font-black text-slate-900 uppercase mb-8 flex items-center gap-3">
                            <Search className="w-5 h-5 text-indigo-600" />
                            Keyword Intelligence
                        </h3>
                        <div className="space-y-4">
                            {detailedData.topKeywords?.length > 0 ? detailedData.topKeywords.map((kw, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
                                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">{kw._id}</span>
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-400 shadow-sm">{kw.count} hits</span>
                                </div>
                            )) : (
                                <p className="text-slate-400 italic text-center text-xs py-10">No keyword data captured yet</p>
                            )}
                        </div>
                    </div>

                    {/* Device Breakdown */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 uppercase mb-4 flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-indigo-600" />
                            Device Distribution
                        </h3>
                        <div className="flex-1 flex flex-col items-center justify-center py-6">
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={detailedData.deviceBreakdown || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="count"
                                            nameKey="_id"
                                        >
                                            {(detailedData.deviceBreakdown || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip labelClassName="text-xs font-black uppercase p-0" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-6 mt-6">
                                {(detailedData.deviceBreakdown || []).map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-[10px] font-black uppercase text-slate-500">{d._id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Competitor Analysis */}
                    <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <h3 className="text-lg font-black text-white uppercase mb-8 flex items-center gap-3 relative z-10">
                            <Award className="w-5 h-5 text-amber-500" />
                            Market Position
                        </h3>
                        <div className="space-y-10 py-4 relative z-10">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] font-black uppercase text-slate-500">Views Index</span>
                                    <span className="text-xs font-black">
                                        {detailedData.trends?.reduce((a,b) => a + b.views, 0) || 0} vs {Math.round(detailedData.marketBenchmark?.avgViews || 0)}
                                    </span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden flex">
                                    <div 
                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                        style={{ width: `${Math.min(100, (detailedData.trends?.reduce((a,b) => a + b.views, 0) / (detailedData.marketBenchmark?.avgViews || 1)) * 50)}%` }}
                                    ></div>
                                    <div className="w-1 bg-amber-500 h-full relative z-10 shadow-[0_0_10px_#f59e0b]"></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] font-black uppercase text-slate-500">Action Index</span>
                                    <span className="text-xs font-black">
                                        {detailedData.trends?.reduce((a,b) => a + b.conversions, 0) || 0} vs {Math.round(detailedData.marketBenchmark?.avgConversions || 1)}
                                    </span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden flex">
                                    <div 
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                        style={{ width: `${Math.min(100, (detailedData.trends?.reduce((a,b) => a + b.conversions, 0) / (detailedData.marketBenchmark?.avgConversions || 1)) * 50)}%` }}
                                    ></div>
                                    <div className="w-1 bg-amber-500 h-full relative z-10"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reputation Trend */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h3 className="text-lg font-black text-slate-900 uppercase mb-6 flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-xl">
                                <Star className="w-5 h-5 text-amber-500" />
                            </div>
                            Reputation
                        </h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={detailedData.ratingTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" hide />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        labelClassName="text-[10px] font-bold text-slate-400 mb-1"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="avgRating" 
                                        stroke="#f59e0b" 
                                        strokeWidth={4} 
                                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} 
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">Rating Progression</p>
                    </div>
                </div>
            ) : (
                <div className="bg-indigo-50 p-12 rounded-[48px] text-center border border-indigo-100">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center mb-6">
                        <Monitor className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select a specific location</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">To unlock keywords, device breakdown and market benchmarks</p>
                </div>
            )}
        </div>
    );
}
