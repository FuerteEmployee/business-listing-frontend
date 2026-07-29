import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Mail, MessageSquare, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(getApiUrl('notifications'));
            const data = await res.json();
            if (res.ok) {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
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

    const markAllAsRead = async () => {
        try {
            const res = await fetchWithAuth(`${getApiUrl('notifications')}/read-all`, {
                method: 'PUT'
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const res = await fetchWithAuth(`${getApiUrl('notifications')}/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const deleted = notifications.find(n => n._id === id);
                if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.filter(n => n._id !== id));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Enquiry': return MessageSquare;
            case 'Alert': return AlertTriangle;
            case 'System': return Bell;
            default: return Bell;
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Stay updated with your account activity.</p>
                </div>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                    >
                        <Check className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Bell className="w-8 h-8 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">You're all caught up!</h3>
                    <p className="text-slate-400 text-sm font-bold mt-2">New notifications will appear here as they arrive.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((item) => {
                        const Icon = getIcon(item.type);
                        return (
                            <div 
                                key={item._id} 
                                className={`group relative p-6 bg-white rounded-[2.5rem] border transition-all duration-300 ${item.isRead ? 'border-slate-100 opacity-70 grayscale-[0.5]' : 'border-orange-200 shadow-xl shadow-orange-50/50 bg-orange-50/20'}`}
                                onClick={() => !item.isRead && markAsRead(item._id)}
                            >
                                <div className="flex gap-6">
                                    <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${item.isRead ? 'bg-slate-100 text-slate-400' : 'bg-orange-600 text-white shadow-lg'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <h4 className={`font-black text-lg text-slate-900 truncate ${item.isRead ? '' : 'text-orange-600'}`}>{item.title}</h4>
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl line-clamp-2">{item.message}</p>
                                        
                                        <div className="flex items-center gap-6 mt-6">
                                            {item.link && (
                                                <a href={item.link} className="flex items-center gap-2 text-xs font-black text-orange-600 hover:gap-3 transition-all uppercase tracking-widest">
                                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(item._id); }}
                                                className="flex items-center gap-2 text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {!item.isRead && <div className="absolute top-8 right-8 w-2 h-2 bg-orange-600 rounded-full animate-pulse" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
