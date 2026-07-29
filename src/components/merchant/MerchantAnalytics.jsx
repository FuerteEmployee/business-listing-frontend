import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
    IndianRupee, ShoppingBag, Users, Star, TrendingUp, 
    BarChart3, Activity, Calendar, ArrowUpRight, ArrowDownRight,
    Sparkles, Info, Filter, ArrowRight
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MerchantAnalytics = ({ listingId }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange, listingId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/merchant/analytics?range=${timeRange}&listingId=${listingId}`);
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    if (loading && !analytics) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-8 text-slate-400 font-black tracking-[0.2em] uppercase text-[10px]">Processing Intelligence...</p>
            </div>
        );
    }

    const salesTrendData = analytics?.salesTrend || [];

    const orderStatusData = analytics?.orderStatusBreakdown ? 
        Object.entries(analytics.orderStatusBreakdown).map(([name, value]) => ({ name, value })) : [];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Intelligence Hub</h2>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            <Calendar className="w-3 h-3" /> Real-time Performance Audit
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-[24px] border border-slate-200 shadow-inner w-full md:w-auto overflow-x-auto">
                    {['7d', '30d', '90d', '1y'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                                timeRange === range 
                                ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {range === '7d' ? 'Week' : range === '30d' ? 'Month' : range === '90d' ? 'Quarter' : 'Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Revenue', val: formatCurrency(analytics?.totalRevenue || 0), icon: IndianRupee, color: 'indigo', trend: '+12.5%' },
                    { label: 'Total Orders', val: formatNumber(analytics?.totalOrders || 0), icon: ShoppingBag, color: 'emerald', trend: '+8.2%' },
                    { label: 'Active Reach', val: formatNumber(analytics?.totalCustomers || 0), icon: Users, color: 'amber', trend: '+5.4%' },
                    { label: 'Market Rating', val: (analytics?.averageRating?.toFixed(1) || '0.0'), icon: Star, color: 'rose', trend: 'Stable' }
                ].map((item, i) => (
                    <div key={i} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 relative overflow-hidden">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${item.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-0 scale-50 group-hover:scale-100`} />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 bg-${item.color}-50 rounded-2xl flex items-center justify-center text-${item.color}-600`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                {item.trend !== 'Stable' && (
                                    <span className={`flex items-center gap-1 text-[10px] font-black ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {item.trend} {item.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    </span>
                                )}
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{item.val}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Visualization Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Volume Index */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute left-10 top-10 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Sales Growth Index</h3>
                    </div>
                    
                    <div className="h-[400px] mt-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px 24px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#6366f1' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="sales" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorSales)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Logic Breakdown */}
                <div className="bg-slate-900 p-10 rounded-[48px] text-white relative flex flex-col justify-between overflow-hidden shadow-2xl">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-1.5 h-6 bg-indigo-400 rounded-full" />
                            <h3 className="text-lg font-black uppercase tracking-tight italic">Operations Mix</h3>
                        </div>

                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={orderStatusData.length > 0 ? orderStatusData : [{ name: 'Empty', value: 1 }]}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                        animationDuration={1500}
                                    >
                                        {(orderStatusData.length > 0 ? orderStatusData : [{ name: 'Empty', value: 1 }]).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {orderStatusData.map((status, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{status.name}</div>
                                        <div className="text-sm font-black">{status.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="relative z-10 mt-10 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Full Log Analytics</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Top Inventory Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Revenue Leaders</h3>
                        </div>
                        <Sparkles className="w-6 h-6 text-indigo-200" />
                    </div>

                    <div className="space-y-6">
                        {analytics?.topProducts?.length > 0 ? (
                            analytics.topProducts.map((product, index) => (
                                <div key={product._id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-all cursor-default">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-sm font-black text-slate-400 shadow-sm relative overflow-hidden">
                                           {index + 1}
                                           <div className={`absolute bottom-0 left-0 h-1 bg-emerald-500 w-full opacity-0 group-hover:opacity-100 transition-all`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic">{product.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{product.sales} Unit Sales Matrix</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(product.revenue)}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-[70%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center gap-4 text-slate-300">
                                <Activity className="w-12 h-12 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Leaderboard Data</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-10 rounded-[48px] relative overflow-hidden flex flex-col justify-between">
                    <Sparkles className="absolute -right-10 -top-10 w-40 h-40 text-indigo-200/30" />
                    
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight">Growth Path Intel</h3>
                        </div>

                        <div className="space-y-6">
                           {[
                               { text: 'AOV is currently 15% above market benchmark. Your high-ticket bundling is working.', icon: Info },
                               { text: 'Conversion rates peak at 9 PM. Consider boosting ad spend during this window.', icon: TrendingUp },
                               { text: 'Repeat customer rate has increased by 4% since your last service update.', icon: Sparkles }
                           ].map((item, i) => (
                               <div key={i} className="flex gap-5 bg-white/50 p-6 rounded-[32px] border border-white shadow-sm">
                                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
                                       <item.icon className="w-5 h-5" />
                                   </div>
                                   <p className="text-sm font-semibold text-indigo-900 leading-relaxed italic">"{item.text}"</p>
                               </div>
                           ))}
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-indigo-600 rounded-[32px] text-white flex items-center justify-between shadow-lg shadow-indigo-200">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total reach Projection</div>
                            <div className="text-2xl font-black">+1,420 <span className="text-xs font-medium text-indigo-200 ml-1">Next 30 Days</span></div>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MerchantAnalytics;
