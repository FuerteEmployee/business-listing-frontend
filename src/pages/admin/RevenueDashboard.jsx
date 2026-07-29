import { useState, useEffect, useCallback } from "react";
import {
    TrendingUp, TrendingDown, DollarSign, Users,
    BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
    Activity, Calendar, Loader2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function KPICard({ icon: Icon, label, value, sub, color, trend, trendUp }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend !== undefined && (
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                        trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h2>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function SimpleBarChart({ data }) {
    if (!data || data.length === 0) return (
        <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
    );
    const max = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="flex items-end gap-1 h-40 mt-4">
            {data.map((d, i) => {
                const height = Math.max((d.revenue / max) * 100, 2);
                const label = d._id ? `${MONTHS[(d._id.month || 1) - 1]} ${String(d._id.year || '').slice(-2)}` : i;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div title={`₹${d.revenue?.toLocaleString()}`}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all cursor-pointer relative"
                            style={{ height: `${height}%` }}>
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-700 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                ₹{(d.revenue/1000).toFixed(1)}k
                            </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

const fmt = (n) => n >= 100000
    ? `₹${(n / 100000).toFixed(2)}L`
    : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n || 0}`;

export default function RevenueDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/dashboard`);
            if (!res.ok) throw new Error("Failed to load dashboard");
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    if (error) return (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-sm">
            {error} — <button onClick={fetchDashboard} className="underline font-bold">Retry</button>
        </div>
    );

    const subStatusMap = {};
    (data?.subStatusCounts || []).forEach(s => { subStatusMap[s._id] = s.count; });
    const totalSubs = Object.values(subStatusMap).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8">
            <AdminHeader 
                title="Revenue Dashboard"
                subtitle="MRR · ARR · Churn · Growth"
                actions={
                    <button onClick={fetchDashboard}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPICard icon={DollarSign} label="Monthly Recurring Revenue" value={fmt(data?.mrr)} sub="Active monthly subs" color="bg-indigo-500" />
                <KPICard icon={BarChart3} label="Annual Recurring Revenue" value={fmt(data?.arr)} sub="MRR × 12 + annual subs" color="bg-violet-500" />
                <KPICard icon={TrendingDown} label="Churn Rate" value={`${data?.churnRate || 0}%`} sub="Cancelled in last 30 days" color="bg-rose-500" trendUp={false} />
                <KPICard icon={Activity} label="Total Revenue" value={fmt(data?.totalRevenue)} sub={`₹${(data?.revenueThisMonth||0).toLocaleString()} this month`} color="bg-emerald-500" />
            </div>

            {/* Subscription Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { key: 'active', label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { key: 'expired', label: 'Expired', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                    { key: 'grace_period', label: 'Grace Period', color: 'bg-sky-50 text-sky-700 border-sky-100' },
                    { key: 'cancelled', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-100' },
                ].map(s => (
                    <div key={s.key} className={`rounded-2xl border p-5 ${s.color}`}>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                        <p className="text-3xl font-black mt-1">{subStatusMap[s.key] || 0}</p>
                        <p className="text-xs font-semibold opacity-60 mt-1">
                            {totalSubs > 0 ? ((subStatusMap[s.key] || 0) / totalSubs * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Revenue — Last 12 Months</h2>
                </div>
                <SimpleBarChart data={data?.revenueByMonth} />
            </div>

            {/* New Subscribers Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-violet-500" />
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">New Subscriptions — Last 12 Months</h2>
                </div>
                <div className="flex items-end gap-1 h-32 mt-4">
                    {(data?.newSubsByMonth || []).map((d, i) => {
                        const maxCount = Math.max(...(data?.newSubsByMonth || []).map(x => x.count), 1);
                        const height = Math.max((d.count / maxCount) * 100, 2);
                        const label = d._id ? `${MONTHS[(d._id.month || 1) - 1]}` : i;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                <div title={`${d.count} subs`}
                                    className="w-full bg-violet-400 hover:bg-violet-600 rounded-t transition-all cursor-pointer relative"
                                    style={{ height: `${height}%` }}>
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-violet-700 opacity-0 group-hover:opacity-100">
                                        {d.count}
                                    </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold">{label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
