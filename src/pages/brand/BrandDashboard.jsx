import { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Building2, Package, Wrench, MapPin, 
    TrendingUp, Star, Calendar, ArrowUpRight, ArrowDownRight,
    Activity, Shield, Sparkles, Filter, ChevronRight, BarChart3,
    Layers, Users, ShoppingBag
} from "lucide-react";
import { fetchWithAuth, getApiUrl } from '../../config/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function BrandDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetchWithAuth(getApiUrl('dashboard/stats'));
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching brand stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { 
            label: "Managed Brands", 
            value: stats?.totalCompanies || 0, 
            icon: Building2, 
            color: "indigo", 
            trend: "+2 this month",
            trendType: "up"
        },
        { 
            label: "Product Inventory", 
            value: stats?.totalProducts || 0, 
            icon: ShoppingBag, 
            color: "emerald", 
            trend: "+12.5%",
            trendType: "up"
        },
        { 
            label: "Service Assets", 
            value: stats?.totalServices || 0, 
            icon: Wrench, 
            color: "amber", 
            trend: "+4.2%",
            trendType: "up"
        },
        { 
            label: "Global Locations", 
            value: stats?.totalBrandLocations || 0, 
            icon: MapPin, 
            color: "rose", 
            trend: "All active",
            trendType: "up"
        }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-8 text-slate-400 font-black tracking-[0.2em] uppercase text-[10px]">Assembling Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Executive Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 pb-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-slate-200">
                        <LayoutDashboard className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-indigo-500 decoration-8 underline-offset-8">Brand <span className="text-indigo-600">Overview</span></h1>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
                             <Activity className="w-3 h-3 text-indigo-400" /> Executive Pulse Audit • Live
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm overflow-hidden">
                                <img src={`https://i.pravatar.cc/40?img=${i+10}`} alt="team" />
                            </div>
                        ))}
                    </div>
                    <button className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
                         Invite Team
                    </button>
                    <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Global Actions
                    </button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 relative overflow-hidden">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${card.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-0 scale-50 group-hover:scale-100`} />
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-14 h-14 bg-${card.color}-50 rounded-2xl flex items-center justify-center text-${card.color}-600 shadow-inner`}>
                                    <card.icon className="w-7 h-7" />
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1 bg-opacity-10 rounded-full text-[10px] font-black uppercase tracking-tighter ${card.trendType === 'up' ? `bg-emerald-500 text-emerald-600` : `bg-rose-500 text-rose-600`}`}>
                                     {card.trendType === 'up' ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                     {card.trend}
                                </div>
                            </div>
                            
                            <div>
                                <span className="block text-4xl font-black text-slate-900 tracking-tighter mb-1">{card.value}</span>
                                <span className="text-[10px] font-black text-slate-400 p-1 bg-slate-50 rounded-md uppercase tracking-[0.2em]">{card.label}</span>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Explore Details</span>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Intelligence Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modern Performance Feed */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Global Performance Stream</h3>
                        </div>
                        <button className="text-[10px] font-black uppercase text-indigo-500 tracking-widest hover:underline">View All Intelligence</button>
                    </div>

                    <div className="space-y-6">
                        {[
                            { title: 'New Product Deployment', detail: 'Modern Office Chair added to "FURNITURE PRO" catalogue', time: '2 hours ago', icon: Package, color: 'indigo' },
                            { title: 'Market Share Expansion', detail: 'Services increased in "HYDRAULIC TOOLS" by 12%', time: '5 hours ago', icon: TrendingUp, color: 'emerald' },
                            { title: 'Inventory Synergy', detail: 'Low stock sync completed across 4 locations', time: 'Yesterday', icon: Layers, color: 'amber' },
                            { title: 'New Store Launch', detail: 'Brand "ECO SMART" launched in Pune West hub', time: '2 days ago', icon: MapPin, color: 'rose' }
                        ].map((activity, i) => (
                            <div key={i} className="group flex items-center justify-between p-6 hover:bg-slate-50 rounded-[32px] transition-all cursor-pointer border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 bg-${activity.color}-50 rounded-[20px] flex items-center justify-center text-${activity.color}-600 group-hover:scale-110 transition-transform shadow-sm`}>
                                        <activity.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-snug italic leading-none">{activity.title}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-1.5">{activity.detail}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activity.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Visual Mix Chart (Simplified for Dashboard) */}
                <div className="bg-slate-900 p-10 rounded-[48px] text-white relative shadow-2xl flex flex-col justify-between overflow-hidden group">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                    <div className="absolute top-10 right-10 flex gap-1">
                        {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/20" />)}
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-1.5 h-6 bg-indigo-400 rounded-full" />
                            <h3 className="text-xl font-black uppercase tracking-tight italic tracking-widest">Equity Mix</h3>
                        </div>

                        <div className="space-y-8">
                            {[
                                { name: 'Pneumatic Systems', share: '45%', color: 'bg-indigo-500' },
                                { name: 'Hydraulic Tools', share: '30%', color: 'bg-emerald-500' },
                                { name: 'Repair Services', share: '25%', color: 'bg-amber-500' }
                            ].map((cat, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat.name}</span>
                                        </div>
                                        <span className="text-sm font-black italic">{cat.share}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${cat.color} shadow-lg shadow-current/20`} style={{ width: cat.share }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-[32px] relative z-10 flex items-center justify-between group-hover:bg-white/10 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Full Visual</p>
                                <p className="text-sm font-black">Analytics Suite</p>
                            </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-indigo-400" />
                    </div>
                </div>
            </div>

            {/* Market Trust Matrix */}
            <div className="bg-slate-50 border border-slate-100 p-12 rounded-[56px] flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <div className="relative">
                        <Star className="w-20 h-20 text-amber-100 fill-amber-50" />
                        <Star className="w-10 h-10 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase italic leading-tight">Elite Performance <br/><span className="text-amber-500">Tier Recognition</span></h4>
                        <p className="text-xs font-semibold text-slate-500 mt-2 max-w-sm leading-relaxed">Your brands are consistently performing in the top 5% of their respective categories based on current metrics.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                    {['Performance', 'Support', 'Quality', 'Reach'].map(badge => (
                        <div key={badge} className="px-6 py-3 bg-white border border-slate-200 rounded-full flex items-center gap-2 shadow-sm">
                             <Shield className="w-4 h-4 text-emerald-500" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{badge} Checked</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
