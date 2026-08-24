import React, { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Activity, Shield, User as UserIcon, LogIn, MessageSquare, HelpCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { API_BASE_URL, fetchWithAuth } from '../../config/api';

const UserDetailCard = ({ user, stats }) => {
    if (!user) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Profile Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <div className="w-24 h-24 rounded-[32px] bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-indigo-600">
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{user.name}</h2>
                        <Badge variant="premium" size="sm">{user.role}</Badge>
                        <Badge 
                            variant={user.status === 'Active' ? 'success' : user.status === 'Banned' ? 'danger' : 'warning'} 
                            dot
                            size="sm"
                        >
                            {user.status}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {user.email}
                        </div>
                        {user.mobileNumber && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4 text-slate-400" />
                                {user.mobileNumber}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-2">
                    <div className="p-2 w-fit rounded-xl bg-indigo-50 text-indigo-600">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reviews</p>
                        <p className="text-2xl font-black text-slate-800">{stats?.totalReviews || 0}</p>
                    </div>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-2">
                    <div className="p-2 w-fit rounded-xl bg-emerald-50 text-emerald-600">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Enquiries</p>
                        <p className="text-2xl font-black text-slate-800">{stats?.totalEnquiries || 0}</p>
                    </div>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-2">
                    <div className="p-2 w-fit rounded-xl bg-amber-50 text-amber-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Score</p>
                        <p className="text-2xl font-black text-slate-800">{user.performanceScore || 100}%</p>
                    </div>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-2">
                    <div className="p-2 w-fit rounded-xl bg-slate-100 text-slate-600">
                        <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Last Active</p>
                        <p className="text-sm font-black text-slate-800">
                            {stats?.lastActive ? new Date(stats.lastActive).toLocaleDateString() : 'Never'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Ban/Safety Warnings if any */}
            {(user.status === 'Banned' || user.status === 'Suspended') && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] flex gap-4">
                    <div className="p-3 h-fit bg-red-100 text-red-600 rounded-2xl">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-red-900 uppercase tracking-wider">Restricted Account</h4>
                        <p className="text-sm font-bold text-red-700 leading-relaxed">
                            Reason: {user.banReason || 'Platform policy violation'}
                        </p>
                        {user.banExpires && (
                            <p className="text-xs font-black text-red-500 uppercase mt-2">
                                Expires: {new Date(user.banExpires).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Location Details</h4>
                    <div className="p-6 bg-white border border-slate-50 rounded-[32px] flex items-center gap-4">
                        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-600">
                            {user.location || 'No location data provided'}
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Security Status</h4>
                    <div className="p-6 bg-white border border-slate-50 rounded-[32px] flex items-center gap-4">
                        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={user.isEmailVerified ? 'success' : 'secondary'} size="sm">
                                {user.isEmailVerified ? 'Email Verified' : 'Unverified Email'}
                            </Badge>
                            {user.twoFactorEnabled && (
                                <Badge variant="info" size="sm">2FA Enabled</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default UserDetailCard;
