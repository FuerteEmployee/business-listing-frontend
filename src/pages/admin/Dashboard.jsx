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
    ShieldAlert,
    Target,
    Users,
    Zap,
    TrendingUp,
    Server,
    Database,
    Clock
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import AdminHeader from "../../components/admin/AdminHeader";
import Loading, { FullPageLoader } from "../../components/ui/Loading";
import Alert from "../../components/ui/Alert";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart as RePieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const KPI_CONFIG = [
    {
        key: "totalRevenue",
        label: "Market Revenue",
        sub: "Total Earnings",
        icon: TrendingUp,
        glowClass: "bg-indigo-50",
        iconClass: "bg-indigo-50 text-indigo-600",
        isCurrency: true
    },
    {
        key: "leadsToday",
        label: "Leads Today",
        sub: "Active Enquiries",
        compare: "vs yesterday",
        icon: Zap,
        glowClass: "bg-amber-50",
        iconClass: "bg-amber-50 text-amber-600"
    },
    {
        key: "totalCompanies",
        label: "Market Growth",
        sub: "Registered Brands",
        icon: Building2,
        glowClass: "bg-blue-50",
        iconClass: "bg-blue-50 text-blue-600"
    },
    {
        key: "totalUsers",
        label: "User Base",
        sub: "Registered Accounts",
        icon: Users,
        glowClass: "bg-emerald-50",
        iconClass: "bg-emerald-50 text-emerald-600"
    }
];

const getInitials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "NA";

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

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [chartRange, setChartRange] = useState("7D");

    // Stable latest ref pattern for the fetch function
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
        if (!stats) {
            return;
        }

        const payload = {
            exportedAt: new Date().toISOString(),
            source: "admin-dashboard",
            data: stats
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json"
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `admin-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    if (isLoading && !stats) {
        return <FullPageLoader label="Analyzing Platform Momentum..." />;
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
                    <Button variant="danger" size="sm" onClick={fetchStats}>
                        Retry Sync
                    </Button>
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
    const visibleAdminTeam = stats?.adminTeam?.slice(0, 3) || [];
    const extraAdminCount = Math.max((stats?.adminTeamCount || 0) - visibleAdminTeam.length, 0);

    const mainKpis = KPI_CONFIG.map((item) => {
        let value = stats?.[item.key] ?? 0;

        return {
            ...item,
            value,
            trend: formatTrend(stats?.kpiTrends?.[item.key])
        };
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3 text-sm font-medium">
                    {error}
                </div>
            )}

            <AdminHeader 
                title="Strategic Overview"
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
                        <div className="flex -space-x-2">
                            {visibleAdminTeam.map((admin) => (
                                <div
                                    key={`${admin.name}-${admin.role}`}
                                    title={`${admin.name} - ${admin.role}`}
                                    className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600"
                                >
                                    {getInitials(admin.name)}
                                </div>
                            ))}

                            {extraAdminCount > 0 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">
                                    +{extraAdminCount}
                                </div>
                            )}
                        </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {mainKpis.map((kpi) => (
                    <div
                        key={kpi.key}
                        className="group relative bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden cursor-default"
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
                        <div className="relative">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                                {kpi.isCurrency 
                                    ? formatCurrency(kpi.value) 
                                    : Number(kpi.value || 0).toLocaleString()}
                            </h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                            <p className="text-[10px] font-bold text-slate-300 mt-2 italic">{kpi.sub} / {kpi.compare || "vs previous 30 days"}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Platform Momentum</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    Growth & Revenue Trends
                                </p>
                                <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg">
                                    {['7D', '30D', '90D'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setChartRange(range)}
                                            className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                                                chartRange === range 
                                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                                    : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                Listings
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Users
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Revenue
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <AreaChart data={stats?.timeline || []}>
                                <defs>
                                    <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 800 }}
                                    dy={15}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "24px",
                                        border: "none",
                                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                                        padding: "16px"
                                    }}
                                    itemStyle={{ fontSize: "12px", fontWeight: 900 }}
                                    labelStyle={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="listings"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorListings)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] text-slate-800 border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-black">Lead Pipeline</h3>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {(stats?.leadPipeline || []).map((stage) => (
                            <div key={stage._id}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stage._id}</span>
                                    <span className="text-sm font-black text-slate-800">
                                        {stage.count} <span className="text-[10px] text-slate-400 font-bold">Units</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(stage.count / maxPipelineCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pipeline Resolution</span>
                            <span className="text-xs font-black text-indigo-600">LIVE</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800">{stats?.pipelineSummary?.resolutionRate || 0}%</div>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold italic">
                            {stats?.pipelineSummary?.resolvedLeads || 0} of {stats?.pipelineSummary?.totalTrackedLeads || 0} tracked leads are closed or converted.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Operational Log</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                Live platform activity (Last 20 actions)
                            </p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(stats?.recentActivity || []).length > 0 ? (
                            stats.recentActivity.map((activity, index) => (
                                <div
                                    key={`${activity.type}-${activity.time}-${index}`}
                                    className="group flex items-center gap-6 p-5 hover:bg-slate-50 rounded-[30px] transition-all duration-300 border border-transparent hover:border-slate-100"
                                >
                                    <div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110 ${
                                            activity.type === "lead"
                                                ? "bg-indigo-50 text-indigo-600"
                                                : activity.type === "claim"
                                                    ? "bg-amber-50 text-amber-600"
                                                    : activity.type === "company"
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "bg-emerald-50 text-emerald-600"
                                        }`}
                                    >
                                        {activity.type === "lead" ? (
                                            <Target className="w-6 h-6" />
                                        ) : activity.type === "claim" ? (
                                            <ShieldAlert className="w-6 h-6" />
                                        ) : activity.type === "company" ? (
                                            <Building2 className="w-6 h-6" />
                                        ) : (
                                            <Users className="w-6 h-6" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-slate-800 truncate" title={activity.title}>{activity.title}</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5 truncate" title={activity.detail}>{activity.detail}</p>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {new Date(activity.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 rounded-[30px] border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm font-medium">
                                No recent activity is available yet.
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/admin/audit-logs")}
                        className="w-full mt-8 py-5 border-2 border-slate-100 rounded-[28px] text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:border-indigo-100 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all"
                    >
                        Access Complete Audit Trail
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800">Listing Status</h3>
                        <ShieldAlert className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="h-[200px] w-full mb-8 min-w-0">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <RePieChart>
                                    <Pie
                                        data={stats?.listingsStatus?.map((status) => ({
                                            name: status._id,
                                            value: status.count
                                        })) || []}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(stats?.listingsStatus || []).map((entry, index) => {
                                            const statusColors = {
                                                'Active': '#10b981',
                                                'Inactive': '#f59e0b',
                                                'Pending': '#ef4444',
                                                'Approved': '#6366f1'
                                            };
                                            return <Cell key={`status-${entry._id}`} fill={statusColors[entry._id] || COLORS[index % COLORS.length]} />;
                                        })}
                                    </Pie>
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                            {(stats?.listingsStatus || []).length > 0 ? (
                                stats.listingsStatus.map((status, index) => {
                                    const statusColors = {
                                        'Active': '#10b981',
                                        'Inactive': '#f59e0b',
                                        'Pending': '#ef4444',
                                        'Approved': '#6366f1'
                                    };
                                    return (
                                        <div key={status._id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: statusColors[status._id] || COLORS[index % COLORS.length] }}
                                                ></div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {status._id}
                                                </span>
                                            </div>
                                            <span className="text-xs font-black text-slate-700">
                                                {status.count} brands
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-slate-400 text-center">No status data available.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800">Top Sectors</h3>
                        <Layers className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="h-[200px] w-full mb-8 min-w-0">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <RePieChart>
                                    <Pie
                                        data={stats?.topCategories?.map((category) => ({
                                            name: category._id,
                                            value: category.count
                                        })) || []}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(stats?.topCategories || []).map((entry, index) => (
                                            <Cell key={`cell-${entry._id}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                            {(stats?.topCategories || []).length > 0 ? (
                                stats.topCategories.map((category, index) => (
                                    <div key={category._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            ></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                {category._id}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-slate-700">
                                            {category.count} listings
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 text-center">No sector data available yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Geographic Spread</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                Top performing cities
                            </p>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <MapPin className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(stats?.topCities || []).length > 0 ? (
                            stats.topCities.map((city, idx) => (
                                <div key={city._id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-300 w-4">{idx + 1}</span>
                                        <span className="text-sm font-bold text-slate-700">{city.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                        {city.count}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-8">No city data available.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-12">
                <div className="xl:col-span-4 bg-white p-10 rounded-[50px] text-slate-800 border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                        <div className="lg:w-1/3">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-emerald-50 rounded-2xl shadow-inner text-emerald-600">
                                    <Server className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-slate-800">System Core Health</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed">
                                Real-time monitoring of infrastructure components, database connectivity, and moderation queue latency.
                            </p>
                            
                            <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Moderation Queue</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white ${
                                        (stats?.pendingModerationListings || 0) > 10 ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}>
                                        {stats?.pendingModerationListings || 0} PENDING
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            (stats?.pendingModerationListings || 0) > 10 ? 'bg-rose-500 w-2/3' : 'bg-emerald-500 w-1/4'
                                        }`}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Database', value: stats?.systemHealth?.database || 'Connected', icon: Database, color: 'text-indigo-600', bgColor: 'bg-indigo-50', status: true },
                                { label: 'API Gateway', value: stats?.systemHealth?.api || 'Healthy', icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-50', status: true },
                                { label: 'System Uptime', value: `${Math.floor((stats?.systemHealth?.uptime || 0) / 3600)}h ${Math.floor(((stats?.systemHealth?.uptime || 0) % 3600) / 60)}m`, icon: Clock, color: 'text-rose-600', bgColor: 'bg-rose-50', status: null }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`p-2 ${item.bgColor} rounded-xl group-hover:scale-110 transition-transform`}>
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                        </div>
                                        {item.status !== null && (
                                            <div className={`w-2 h-2 rounded-full ${item.status ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{item.label}</h4>
                                        <p className="text-lg font-black text-slate-800">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
