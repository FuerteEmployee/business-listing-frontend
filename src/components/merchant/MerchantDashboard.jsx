import React from 'react';
import { 
    Package, Wrench, Clock, IndianRupee, 
    ChevronRight, ShoppingBag, AlertTriangle, 
    Plus, BarChart3, ArrowUpRight, CheckCircle2,
    Truck, Inbox
} from 'lucide-react';

const MerchantDashboard = ({ data, refreshData }) => {
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Operations...</p>
            </div>
        );
    }

    const stats = [
        {
            title: 'Inventory Assets',
            value: data.totalProducts || 0,
            icon: Package,
            color: 'indigo',
            label: 'Total SKU count'
        },
        {
            title: 'Active Services',
            value: data.totalServices || 0,
            icon: Wrench,
            color: 'emerald',
            label: 'Operational offerings'
        },
        {
            title: 'Pending Flow',
            value: data.pendingOrders || 0,
            icon: Clock,
            color: 'amber',
            label: 'Orders awaiting action'
        },
        {
            title: 'Gross Revenue',
            value: `₹${data.totalRevenue || 0}`,
            icon: IndianRupee,
            color: 'rose',
            label: 'Cumulative earnings'
        }
    ];

    const recentOrders = data.recentOrders || [];
    const lowStockAlerts = data.lowStockAlerts || [];

    const getStatusStyles = (status) => {
        switch(status?.toLowerCase()) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* High-Impact Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden">
                        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>
                        
                        <div className="relative z-10">
                            <div className={`w-14 h-14 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-600 mb-8`}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</h4>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 italic">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Intelligence (Orders) */}
                <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Order Stream</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recent activity feed</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Ledger</button>
                    </div>

                    <div className="flex-1 space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-12 gap-4 border border-dashed border-slate-100 rounded-[32px]">
                                <Inbox className="w-12 h-12 text-slate-200" />
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No recent transactions</p>
                            </div>
                        ) : (
                            recentOrders.slice(0, 4).map((order) => (
                                <div key={order._id} className="group flex items-center justify-between p-5 border border-slate-50 rounded-[28px] hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm italic tracking-tight uppercase line-one-truncate">#{order.orderNumber}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{order.customerName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 text-sm">₹{order.totalAmount}</p>
                                        <span className={`inline-flex px-2 py-0.5 mt-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Tactical Overlays (Stock & Actions) */}
                <div className="space-y-8">
                    {/* Critical Alerts */}
                    <div className="bg-rose-600 text-white rounded-[48px] p-10 shadow-xl shadow-rose-200 relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Critical Replenishment</h3>
                        </div>

                        <div className="space-y-4">
                            {lowStockAlerts.length === 0 ? (
                                <div className="flex items-center gap-4 p-6 bg-white/10 border border-white/20 rounded-[32px]">
                                    <CheckCircle2 className="w-6 h-6 text-white/60" />
                                    <p className="text-xs font-black uppercase tracking-widest">Inventory Health Nominal • No Alerts</p>
                                </div>
                            ) : (
                                lowStockAlerts.slice(0, 2).map((alert) => (
                                    <div key={alert._id} className="flex items-center justify-between p-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-[32px] transition-all border border-white/10">
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight line-clamp-1">{alert.name}</p>
                                            <p className="text-[10px] text-white/70 font-bold tracking-widest">SKU: {alert.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black">{alert.stock}</p>
                                            <p className="text-[9px] font-black uppercase tracking-tighter opacity-60">Units Remaining</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Command Matrix */}
                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Quick Command Matrix</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="group relative bg-indigo-50 border border-indigo-100 p-6 rounded-[32px] text-left hover:bg-indigo-600 hover:text-white transition-all duration-300">
                                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <p className="font-black text-xs uppercase tracking-widest">New Product</p>
                                <p className="text-[9px] opacity-70 mt-1 font-bold group-hover:text-white/80 transition-colors">Deploy to Catalogue</p>
                            </button>

                            <button className="group relative bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] text-left hover:bg-emerald-600 hover:text-white transition-all duration-300">
                                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <p className="font-black text-xs uppercase tracking-widest">New Service</p>
                                <p className="text-[9px] opacity-70 mt-1 font-bold group-hover:text-white/80 transition-colors">Expand Offerings</p>
                            </button>

                            <button className="col-span-2 group flex items-center justify-between bg-slate-900 p-6 rounded-[32px] text-white hover:bg-slate-800 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-widest italic">Intelligence Hub</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.22em]">Detailed Analytics</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MerchantDashboard;