import React, { useState } from 'react';
import { 
    Layout, Users, List, Star, Megaphone, Shield, 
    History, Volume2, Search, MapPin, Zap, 
    MessageSquare, FileBarChart2, DollarSign, Monitor,
    Layers, Settings as SettingsIcon, CheckCircle2, AlertOctagon,
    Package, Wrench, FileCheck, Ticket, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MODULE_CATEGORIES = [
    {
        id: 'core',
        label: 'Core Business Modules',
        icon: Layout,
        description: 'Primary modules for managing users, listings, and core content.',
        modules: [
            { id: 'dashboard', label: 'Dashboard', icon: Layout },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'listings', label: 'Business Listings', icon: List },
            { id: 'categories', label: 'Categories', icon: Layers },
            { id: 'products', label: 'Product Catalog', icon: Package },
            { id: 'services', label: 'Service Catalog', icon: Wrench },
        ]
    },
    {
        id: 'operations',
        label: 'Operation & Trust',
        icon: Shield,
        description: 'Tools for moderation, support, and administrative oversight.',
        modules: [
            { id: 'reviews', label: 'Review Moderation', icon: Star },
            { id: 'leads', label: 'Lead Management', icon: Megaphone },
            { id: 'adminteam', label: 'Admin Team', icon: Users },
            { id: 'roles', label: 'Role & RBAC', icon: Shield },
            { id: 'fraud', label: 'Fraud Detection', icon: AlertOctagon },
            { id: 'auditlogs', label: 'Audit Logs', icon: History },
            { id: 'claims', label: 'Claim Requests', icon: FileCheck },
            { id: 'discovery', label: 'OSM Discovery', icon: Search },
        ]
    },
    {
        id: 'finance',
        label: 'Revenue & Finance',
        icon: DollarSign,
        description: 'Financial reporting, billing, and subscription management.',
        modules: [
            { id: 'revenuedashboard', label: 'Finance Dashboard', icon: DollarSign },
            { id: 'plans', label: 'Pricing Plans', icon: Zap },
            { id: 'coupons', label: 'Coupon Manager', icon: Ticket },
            { id: 'overrides', label: 'Subscriptions', icon: ShieldAlert },
        ]
    },
    {
        id: 'content_marketing',
        label: 'CMS & Marketing',
        icon: Volume2,
        description: 'Promotional tools, ad management, and content control.',
        modules: [
            { id: 'broadcasting', label: 'Broadcaster', icon: Volume2 },
            { id: 'addashboard', label: 'Ad Manager', icon: Monitor },
            { id: 'faqs', label: 'FAQ Manager', icon: MessageSquare },
            { id: 'settings', label: 'System Settings', icon: SettingsIcon },
            { id: 'reports', label: 'Analytics Reports', icon: FileBarChart2 },
        ]
    }
];

export default function ModuleManager({ settings, onSave }) {
    // Current hidden features from settings or empty array
    const [hiddenFeatures, setHiddenFeatures] = useState(settings?.hiddenFeatures || []);
    const [isSaving, setIsSaving] = useState(false);

    const toggleModule = (moduleId) => {
        setHiddenFeatures(prev => {
            if (prev.includes(moduleId)) {
                return prev.filter(id => id !== moduleId);
            } else {
                return [...prev, moduleId];
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await onSave({ ...settings, hiddenFeatures });
            toast.success('System modules updated successfully. Refresh to see changes in sidebar.');
        } catch (err) {
            toast.error('Failed to update modules');
        } finally {
            setIsSaving(false);
        }
    };

    const isFiltered = (moduleId) => hiddenFeatures.includes(moduleId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Master Module Configuration</h2>
                    <p className="text-sm text-slate-500 mt-1">Control which features are visible in the administrative sidebar for this project instance.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    Deploy Configuration
                </button>
            </div>

            {/* Warning Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <AlertOctagon size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900">Administrative Impact Warning</h4>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Disabling a module here will remove it from the sidebar for all administrators. 
                        It does NOT delete the data or disable the API endpoints; it only controls navigation visibility.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {MODULE_CATEGORIES.map((category) => (
                    <div key={category.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                                <category.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{category.label}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{category.description}</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {category.modules.map((module) => {
                                    const isHidden = isFiltered(module.id);
                                    return (
                                        <div 
                                            key={module.id} 
                                            onClick={() => toggleModule(module.id)}
                                            className={`
                                                flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border
                                                ${isHidden 
                                                    ? 'bg-slate-50 border-slate-100 grayscale' 
                                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm shadow-none'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-8 h-8 rounded-lg flex items-center justify-center
                                                    ${isHidden ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-600'}
                                                `}>
                                                    <module.icon size={16} />
                                                </div>
                                                <span className={`text-sm font-bold ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                    {module.label}
                                                </span>
                                            </div>
                                            <div className={`
                                                w-10 h-5 rounded-full relative transition-colors duration-300
                                                ${isHidden ? 'bg-slate-200' : 'bg-indigo-600'}
                                            `}>
                                                <div className={`
                                                    absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300
                                                    ${isHidden ? 'left-1' : 'left-6'}
                                                `} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
