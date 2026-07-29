import { useState, useEffect } from 'react';
import { 
    Bell, Mail, MessageSquare, Smartphone, AlertTriangle, 
    Check, Loader2, Save, ArrowRight, TrendingUp, UserCheck, 
    Target, RefreshCcw, BellRing
} from 'lucide-react';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function NotificationSettings() {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(getApiUrl('me/profile'));
            const data = await res.json();
            if (data.success) {
                setPreferences(data.data.notificationPreferences);
            }
        } catch (err) {
            console.error('Error fetching preferences:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (category, channel) => {
        setPreferences(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [channel]: !prev[category][channel]
            }
        }));
        setSuccess(false);
    };

    const handleGlobalToggle = (channel) => {
        setPreferences(prev => ({
            ...prev,
            [channel]: !prev[channel]
        }));
        setSuccess(false);
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const res = await fetchWithAuth(getApiUrl('me/profile'), {
                method: 'PUT',
                body: JSON.stringify({ notificationPreferences: preferences })
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">Loading preferences...</p>
            </div>
        );
    }

    const sections = [
        {
            id: 'leads',
            title: 'New Lead Alerts',
            desc: 'Get notified instantly when someone enquires about your business.',
            icon: Target,
            color: 'indigo'
        },
        {
            id: 'reviews',
            title: 'New Review Alerts',
            desc: 'Stay on top of customer feedback and ratings.',
            icon: StarIcons,
            color: 'amber'
        },
        {
            id: 'renewals',
            title: 'Subscription Renewals',
            desc: 'Reminders about plan expiry and billing cycles.',
            icon: RefreshCcw,
            color: 'emerald'
        },
        {
            id: 'profileNudges',
            title: 'Profile Optimization',
            desc: 'Nudges to help you complete and optimize your business profile.',
            icon: UserCheck,
            color: 'blue'
        },
        {
            id: 'weeklySummary',
            title: 'Weekly Performance',
            desc: 'Summarized analytics of leads, views, and rankings.',
            icon: TrendingUp,
            color: 'purple'
        }
    ];

    function StarIcons(props) {
        return (
            <div className="flex -space-x-1">
                <Bell {...props} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <BellRing className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Notification Settings</h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-lg">
                        Control how and when you receive updates from Engitech Expo. Choose the channels that work best for you.
                    </p>
                </div>
                
                <button 
                    onClick={saveSettings}
                    disabled={saving}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black tracking-wide uppercase text-sm transition-all shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] ${
                        success 
                        ? 'bg-emerald-500 text-white shadow-emerald-200' 
                        : 'bg-indigo-600 text-white shadow-indigo-200 hover:shadow-indigo-300'
                    }`}
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Saving...' : success ? 'Settings Saved' : 'Save Preferences'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Global Channel Toggles */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-100/50">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-indigo-600" />
                            Global Channels
                        </h3>
                        <div className="space-y-4">
                            {[
                                { id: 'email', label: 'Email Notifications', icon: Mail, color: 'indigo' },
                                { id: 'push', label: 'Push Notifications', icon: Bell, color: 'blue' },
                                { id: 'sms', label: 'SMS / Text Alerts', icon: MessageSquare, color: 'emerald' },
                                { id: 'whatsapp', label: 'WhatsApp Updates', icon: MessageSquare, color: 'green' }
                            ].map(channel => (
                                <label key={channel.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 hover:bg-white transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl bg-${channel.color}-50 text-${channel.color}-600 group-hover:bg-${channel.color}-600 group-hover:text-white transition-all`}>
                                            <channel.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm">{channel.label}</span>
                                    </div>
                                    <div 
                                        onClick={() => handleGlobalToggle(channel.id)}
                                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${preferences[channel.id] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${preferences[channel.id] ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Granular Preferences */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {sections.map((section) => (
                            <div key={section.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:shadow-2xl hover:shadow-slate-100/50 transition-all duration-500">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl bg-${section.color}-50 text-${section.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <section.icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">{section.title}</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-sm">
                                        {section.desc}
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    {['email', 'push', 'sms'].map(channel => {
                                        if (section.id === 'weeklySummary' && channel !== 'email') return null;
                                        if (section.id === 'profileNudges' && channel === 'sms') return null;

                                        const isActive = preferences[section.id]?.[channel];
                                        return (
                                            <button
                                                key={channel}
                                                onClick={() => handleToggle(section.id, channel)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all min-w-[80px] ${
                                                    isActive 
                                                    ? `border-${section.color}-600 bg-${section.color}-50 text-${section.color}-700 shadow-lg shadow-${section.color}-100` 
                                                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                }`}
                                            >
                                                {channel === 'email' && <Mail className="w-5 h-5" />}
                                                {channel === 'push' && <Bell className="w-5 h-5" />}
                                                {channel === 'sms' && <MessageSquare className="w-5 h-5" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{channel}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* In-App Alerts Guide */}
            <div className="bg-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-black tracking-tight leading-tight">Always receive important Alerts via In-App Notification Center</h2>
                        <p className="text-indigo-200 font-bold text-lg leading-relaxed">
                            Even if you disable email or SMS, you will always see important updates in your dashboard notification center. 
                            This includes security alerts, payment confirmation, and critical system updates.
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-4 border-indigo-900 bg-indigo-500 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-indigo-300 font-bold text-sm">Join 500+ merchants using Engitech</span>
                        </div>
                    </div>
                    <div className="w-full md:w-72 aspect-square bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col items-center justify-center border border-white/20">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                            <Check className="w-10 h-10 text-white" />
                        </div>
                        <h4 className="text-xl font-black mb-2">Sync Daily</h4>
                        <p className="text-indigo-300 text-center text-xs font-bold uppercase tracking-widest">Profile: 100% Complete</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal colors for dynamic tailwind classes if needed (though strings are safer)
// border-indigo-600 bg-indigo-50 text-indigo-700 shadow-indigo-100
// border-amber-600 bg-amber-50 text-amber-700 shadow-amber-100
// border-emerald-600 bg-emerald-50 text-emerald-700 shadow-emerald-100
// border-blue-600 bg-blue-50 text-blue-700 shadow-blue-100
// border-purple-600 bg-purple-50 text-purple-700 shadow-purple-100
