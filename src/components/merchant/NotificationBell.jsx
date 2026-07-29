import { useState, useEffect } from 'react';
import { Bell, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(getApiUrl('notifications'));
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data.slice(0, 5)); // Show only latest 5
                setUnreadCount(data.data.filter(n => !n.isRead).length);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await fetchWithAuth(`${getApiUrl('notifications')}/${id}/read`, {
                method: 'PUT'
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                <Bell className="w-4 h-4 text-indigo-600" />
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-slate-400 text-xs font-bold font-medium mt-1">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(item => (
                                    <div 
                                        key={item._id}
                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!item.isRead ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className={`text-xs font-black truncate ${!item.isRead ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap uppercase">
                                                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                    {item.message}
                                                </p>
                                                
                                                {!item.isRead && (
                                                    <button 
                                                        onClick={(e) => markAsRead(e, item._id)}
                                                        className="mt-2 text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <NavLink 
                            to="/brand/notifications/settings" 
                            onClick={() => setIsOpen(false)}
                            className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            Notification Center <ArrowRight className="w-3 h-3" />
                        </NavLink>
                    </div>
                </>
            )}
        </div>
    );
}
