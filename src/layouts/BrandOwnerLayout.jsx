import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, FolderTree, Building2, LogOut, MapPin,
    Package, Wrench, Megaphone, BarChart3, CreditCard, LifeBuoy, Star,
    AlertTriangle, X, Bell, UserCircle, Settings, History
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/ui/Logo";
import NotificationBell from "../components/merchant/NotificationBell";
import { API_BASE_URL } from "../config/api";

export default function BrandOwnerLayout() {
    const { user, logout } = useAuth();
    const { hiddenFeatures = [] } = useConfig();
    const { settings } = useTheme();
    const navigate = useNavigate();
    const [subWarning, setSubWarning] = useState(null);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/companies/my-companies`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    const businessId = data.data[0]._id;
                    const subRes = await fetch(`${API_BASE_URL}/subscriptions/business/${businessId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const subData = await subRes.json();
                    const sub = subData?.subscription;
                    if (subRes.ok && sub) {
                        const daysLeft = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                        if (daysLeft > 0 && daysLeft <= 7) {
                            setSubWarning({ days: daysLeft, plan: sub.planId?.name });
                        }
                    }
                }
            } catch (err) {
                console.error('Sub check fail', err);
            }
        };
        checkSubscription();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: "Dashboard", path: "/brand/dashboard", icon: LayoutDashboard },
        { label: "Analytics", path: "/brand/analytics", icon: BarChart3 },
        { label: "Leads", path: "/brand/leads", icon: Megaphone },
        { label: "Reviews", path: "/brand/reviews", icon: Star },
        { label: "My Brands", path: "/brand/listings", icon: Building2 },
        { label: "Categories", path: "/brand/categories", icon: FolderTree },
        { label: "Products", path: "/brand/products", icon: Package },
        { label: "Service Catalogue", path: "/brand/catalogue", icon: Package },
        { label: "Locations", path: "/brand/locations", icon: MapPin },
        { label: "Promotions & Ads", path: "/brand/promotions", icon: Megaphone },
        { label: "Offers & Deals", path: "/brand/offers", icon: Star },
        { label: "Plans & Billing", path: "/brand/billing", icon: CreditCard },
        { label: "Notification Center", path: "/brand/notifications/settings", icon: Bell },
        { label: "Help & Support", path: "/brand/support", icon: LifeBuoy },
        { label: "Audit Logs", path: "/brand/audit-logs", icon: History },
        { label: "Profile & Settings", path: "/brand/settings", icon: Settings },
    ].filter(item => {
        // Check if feature is hidden by Master Control
        const featureKey = item.label.toLowerCase().replace(/\s+/g, '').replace(/&/g, '');
        // Special mapping for some keys
        if (featureKey === 'promotionsads') return !hiddenFeatures.includes('ads');
        if (featureKey === 'plansbilling') return !hiddenFeatures.includes('billing');
        return !hiddenFeatures.includes(featureKey);
    });

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <Logo 
                        settings={settings} 
                        className="h-8" 
                        imgClassName="max-w-[180px] object-contain"
                    />
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Brand Owner Panel
                    </div>
                    <nav className="flex-1 px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-colors ${isActive
                                        ? "bg-slate-100 text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-200">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
                    <h1 className="text-xl font-semibold text-slate-800 hidden md:block">Brand Management</h1>
                    <div className="flex items-center gap-4 ml-auto">
                        <NotificationBell />
                        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
                        <NavLink to="/brand/settings" className="flex items-center gap-3 group">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{user?.name || 'Brand Owner'}</span>
                                <span className="text-xs text-slate-500">{user?.email}</span>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase group-hover:ring-2 group-hover:ring-indigo-300 transition-all">
                                {user?.name?.substring(0, 2) || 'BO'}
                            </div>
                        </NavLink>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-0 relative">
                    {subWarning && (
                        <div className="bg-indigo-600 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg shadow-indigo-600/20 animate-in slide-in-from-top duration-500">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-tight">
                                    Your <span className="underline decoration-indigo-400 decoration-2 underline-offset-4">{subWarning.plan}</span> plan expires in <span className="bg-white/20 px-2 py-0.5 rounded-md">{subWarning.days} days</span>. 
                                    Renew now to keep your premium ranking.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <NavLink to="/brand/pricing" className="text-[10px] font-black uppercase bg-white text-indigo-600 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shadow-xl shadow-white/10">
                                    Renew Now
                                </NavLink>
                                <button onClick={() => setSubWarning(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
