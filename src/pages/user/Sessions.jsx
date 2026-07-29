import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, LogOut, Clock, Globe, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Sessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(false);
    const [success, setSuccess] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetchWithAuth(getApiUrl('auth/sessions'));
            const data = await res.json();
            if (res.ok) {
                setSessions(data.sessions || []);
            }
        } catch (err) {
            console.error('Fetch sessions error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeAll = async () => {
        if (!window.confirm('Are you sure? This will log you out from ALL devices, including this one.')) return;
        
        setRevoking(true);
        try {
            const res = await fetchWithAuth(getApiUrl('auth/sessions'), {
                method: 'DELETE'
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            console.error('Revocation error:', err);
        } finally {
            setRevoking(false);
        }
    };

    const getDeviceIcon = (userAgent = '') => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobi')) return <Smartphone className="w-6 h-6" />;
        if (ua.includes('tablet')) return <Tablet className="w-6 h-6" />;
        return <Monitor className="w-6 h-6" />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest mt-4">Syncing sessions...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Sessions</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage all devices currently logged into your account.</p>
                </div>
                <button 
                    onClick={handleRevokeAll}
                    disabled={revoking}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-all border border-red-100"
                >
                    {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Logout All Devices
                </button>
            </div>

            {success && (
                <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-[2.5rem] flex items-center gap-4 animate-in slide-in-from-top-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-black text-green-900">All sessions revoked</h4>
                        <p className="text-green-700/70 text-sm font-medium">Redirecting you to login...</p>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {sessions.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No session history</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Your recent activity will appear here.</p>
                    </div>
                ) : (
                    sessions.slice().reverse().map((session, idx) => (
                        <div 
                            key={idx}
                            className={`group p-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-between transition-all hover:shadow-xl hover:shadow-slate-100 hover:border-orange-100 ${idx === 0 ? 'ring-2 ring-orange-500 ring-offset-4' : ''}`}
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[40%] flex items-center justify-center transition-all ${idx === 0 ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
                                    {getDeviceIcon(session.device)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-black text-slate-900 truncate max-w-[200px] md:max-w-md">
                                            {session.device || 'Unknown Device'}
                                        </h4>
                                        {idx === 0 && (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">Current</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <Globe className="w-3.5 h-3.5" />
                                            {session.ip || '127.0.0.1'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(session.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="hidden md:flex flex-col items-end gap-1">
                                <span className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    {idx === 0 ? 'Active Now' : 'Last Seen'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-12 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black text-blue-900">Security Tip</h4>
                    <p className="text-blue-700/70 text-sm font-medium leading-relaxed mt-1">
                        If you see a device you don't recognize, we recommend revoking all sessions and changing your password immediately.
                    </p>
                </div>
            </div>
        </div>
    );
}
