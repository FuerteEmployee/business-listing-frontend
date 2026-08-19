import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    ChevronRight,
    Download,
    Layers,
    MapPin,
    Users,
    Zap,
    TrendingUp,
    ShoppingBag,
    Wrench,
    Clock,
    CheckCircle2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";
import Loading, { FullPageLoader } from "../../components/ui/Loading";
import Alert from "../../components/ui/Alert";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from "recharts";

const KPI_CONFIG = [
    {
        key: "totalCompanies",
        label: "Managed Brands",
        sub: "Active Listings",
        icon: Building2,
        glowClass: "bg-indigo-50",
        iconClass: "bg-indigo-50 text-indigo-600",
        path: "/brand/listings"
    },
    {
        key: "totalProducts",
        label: "Product Inventory",
        sub: "Live Catalogue",
        icon: ShoppingBag,
        glowClass: "bg-emerald-50",
        iconClass: "bg-emerald-50 text-emerald-600",
        path: "/brand/products"
    },
    {
        key: "totalServices",
        label: "Service Assets",
        sub: "Registered Services",
        icon: Wrench,
        glowClass: "bg-amber-50",
        iconClass: "bg-amber-50 text-amber-600",
        path: "/brand/catalogue"
    },
    {
        key: "totalBrandLocations",
        label: "Global Locations",
        sub: "Active Hubs",
        icon: MapPin,
        glowClass: "bg-rose-50",
        iconClass: "bg-rose-50 text-rose-600",
        path: "/brand/locations"
    }
];

const formatTrend = (value) => {
    if (value == null) {
        return {
            icon: Activity,
            label: "N/A",
            className: "bg-slate-100 text-slate-500"
        };
    }

    if (value > 0) {
        return {
            icon: ArrowUpRight,
            label: `+${value}%`,
            className: "bg-emerald-50 text-emerald-600"
        };
    }

    if (value < 0) {
        return {
            icon: ArrowDownRight,
            label: `${value}%`,
            className: "bg-rose-50 text-rose-600"
        };
    }

    return {
        icon: Activity,
        label: "0.0%",
        className: "bg-slate-100 text-slate-500"
    };
};

const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
};

const getActivityConfig = (type) => {
    switch (type) {
        case "lead":
            return { icon: TrendingUp, className: "bg-emerald-50 text-emerald-600" };
        case "company":
            return { icon: Building2, className: "bg-indigo-50 text-indigo-600" };
        case "product":
            return { icon: ShoppingBag, className: "bg-amber-50 text-amber-600" };
        case "service":
            return { icon: Wrench, className: "bg-rose-50 text-rose-600" };
        default:
            return { icon: Activity, className: "bg-slate-50 text-slate-500" };
    }
};

export default function BrandDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [chartRange, setChartRange] = useState("7D");

    const fetchStatsRef = useRef(null);
    useEffect(() => {
        fetchStatsRef.current = async () => {
            try {
                setIsLoading(true);
                setError("");

                const res = await fetchWithAuth(`${API_BASE_URL}/dashboard/stats?range=${chartRange}`);
                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    setError(data?.msg || "Failed to load dashboard statistics.");
                    return;
                }

                setStats(data);
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError("Error loading dashboard statistics.");
            } finally {
                setIsLoading(false);
            }
        };
    });

    const fetchStats = async () => {
        if (fetchStatsRef.current) {
            await fetchStatsRef.current();
        }
    };

    useEffect(() => {
        fetchStats();
    }, [chartRange]);

    const handleExportSnapshot = () => {
        if (!stats) return;

        const payload = {
            exportedAt: new Date().toISOString(),
            source: "brand-dashboard",
            data: stats
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json"
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `brand-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    if (isLoading && !stats) {
        return <FullPageLoader label="Assembling Brand Intelligence..." />;
    }

    if (error && !stats) {
        return (
            <div className="max-w-2xl mx-auto mt-20">
                <Alert 
                    type="error" 
                    title="Dashboard Unavailable"
                    className="shadow-xl"
                >
                    <p className="mb-4">{error}</p>
                    <button 
                        onClick={fetchStats}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                    >
                        Retry Sync
                    </button>
                </Alert>
            </div>
        );
    }

    const totalLeads = stats?.pipelineSummary?.totalTrackedLeads
        ?? stats?.leadPipeline?.reduce((sum, stage) => sum + stage.count, 0)
        ?? 0;
    const maxPipelineCount = Math.max(
        ...(stats?.leadPipeline?.map((stage) => stage.count) || [1])
    );
    const generatedAt = stats?.generatedAt ? new Date(stats.generatedAt) : null;

    const mainKpis = KPI_CONFIG.map((item) => {
        let value = stats?.[item.key] ?? 0;
        let trendValue = stats?.kpiTrends?.[item.key];
        
        // Custom trend defaults if timeline trend is not set for products/services
        if (item.key === "totalProducts" || item.key === "totalServices" || item.key === "totalBrandLocations") {
            trendValue = null;
        }

        return {
            ...item,
            value,
            trend: formatTrend(trendValue)
        };
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3 text-sm font-medium">
                    {error}
                </div>
            )}

            <AdminHeader 
                title="Brand Overview"
                subtitle={generatedAt
                    ? `Last synced ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Live operational snapshot"}
                badge={
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest w-fit">
                        Live Data
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportSnapshot}
                            disabled={!stats}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            Intelligence Export
                        </button>
                    </div>
                }
            />

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {mainKpis.map((kpi) => (
                    <div
                        key={kpi.key}
                        onClick={() => kpi.path && navigate(kpi.path)}
                        className="group relative bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden cursor-pointer hover:border-indigo-200"
                    >
                        <div className={`absolute -right-6 -top-6 w-24 h-24 ${kpi.glowClass} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ${kpi.iconClass}`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${kpi.trend.className}`}>
                                <kpi.trend.icon className="w-3 h-3" />
                                {kpi.trend.label}
                            </div>
                        </div>

                        <div>
                            <span className="block text-4xl font-black text-slate-900 tracking-tighter mb-1">{kpi.value}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Explore Details</span>
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance charts and pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Platform Momentum style line chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-950">Brand Momentum</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Brand growth and customer enquiry statistics.</p>
                        </div>

                        <div className="flex items-center gap-2 border border-slate-150 rounded-xl p-1 bg-slate-50">
                            {["7D", "30D", "90D"].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setChartRange(range)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        chartRange === range
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                                data={stats?.timeline || []} 
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorBrands" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis 
                                    dataKey="label" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    fontWeight={700}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    fontWeight={700}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={36} 
                                    iconType="circle" 
                                    iconSize={6}
                                    wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="leads" 
                                    name="Leads / Enquiries"
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorLeads)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="listings" 
                                    name="Owned Listings"
                                    stroke="#6366f1" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorBrands)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lead Pipeline style tracker card */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-950">Lead Pipeline</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Enquiry resolution efficiency.</p>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100 tracking-wider">
                                Live
                            </span>
                        </div>

                        <div className="space-y-4 my-6">
                            {stats?.leadPipeline && stats.leadPipeline.length > 0 ? (
                                stats.leadPipeline.map((stage) => {
                                    const percentage = totalLeads > 0 ? (stage.count / maxPipelineCount) * 100 : 0;
                                    return (
                                        <div key={stage._id} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                <span className="capitalize">{stage._id}</span>
                                                <span className="font-bold text-slate-900">{stage.count} Leads</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[2px]">
                                                <div 
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                                    No pipeline stages populated.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Resolution</div>
                        <div className="text-3xl font-black text-slate-950 mt-1">
                            {stats?.pipelineSummary?.resolutionRate || 0}%
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 mt-1">
                            {stats?.pipelineSummary?.resolvedLeads || 0} of {stats?.pipelineSummary?.totalTrackedLeads || 0} leads closed or converted.
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Log section */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                    <h3 className="text-lg font-bold text-slate-950">Operational Log</h3>
                </div>

                <div className="space-y-4">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.slice(0, 5).map((activity, idx) => {
                            const config = getActivityConfig(activity.type);
                            return (
                                <div 
                                    key={idx}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.className}`}>
                                            <config.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">{activity.title}</div>
                                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{activity.detail}</div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatTime(activity.time)}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center text-slate-400 font-medium text-xs">
                            No logs registered yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
