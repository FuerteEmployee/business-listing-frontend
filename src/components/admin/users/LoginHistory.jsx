import React from 'react';
import { Monitor, Smartphone, Globe, Clock, MapPin } from 'lucide-react';

const LoginHistory = ({ history = [] }) => {
    if (!history || history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <Clock className="w-10 h-10 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No login activity recorded</p>
            </div>
        );
    }

    const getDeviceIcon = (userAgent = '') => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobi') || ua.includes('android')) return Smartphone;
        return Monitor;
    };

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Recent Access Logs</h4>
            <div className="space-y-3">
                {history.map((login, index) => {
                    const DeviceIcon = getDeviceIcon(login.userAgent);
                    return (
                        <div 
                            key={index}
                            className="flex items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <DeviceIcon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-700">
                                            {login.ip || 'Unknown IP'}
                                        </p>
                                        <span className="text-[10px] font-black uppercase text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md">
                                            {login.device || 'Web Browser'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-[250px]">
                                        {login.userAgent}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold">
                                        {new Date(login.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase">
                                    {new Date(login.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LoginHistory;
