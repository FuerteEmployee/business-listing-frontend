import { useState } from 'react';
import { Bell, Shield, Eye, Trash2, Save, Loader2, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import Modal from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export default function AccountSettings() {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        notificationPreferences: user?.notificationPreferences || { 
            email: true, 
            sms: false, 
            push: true, 
            whatsapp: false,
            digestFrequency: 'Weekly'
        },
        privacySettings: user?.privacySettings || { profileVisible: true, activityVisible: true }
    });

    const handleToggle = (path, value) => {
        const [section, field] = path.split('.');
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetchWithAuth(getApiUrl('me/profile'), {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                if (setUser) setUser(data.data); // Update context without clearing token
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Update settings error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateAccount = async () => {
        if (!window.confirm('Are you sure you want to deactivate your account? You will be logged out from all devices.')) return;
        
        setActionLoading(true);
        try {
            const res = await fetchWithAuth(getApiUrl('auth/deactivate'), {
                method: 'PUT'
            });
            if (res.ok) {
                logout();
                navigate('/login');
            }
        } catch (err) {
            console.error('Deactivation error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setActionLoading(true);
        try {
            const res = await fetchWithAuth(getApiUrl('auth/account'), {
                method: 'DELETE'
            });
            if (res.ok) {
                logout();
                navigate('/register');
            }
        } catch (err) {
            console.error('Deletion error:', err);
        } finally {
            setActionLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage notifications, privacy, and account security.</p>
                </div>
                {success && (
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Settings Updated
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Notifications Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Notifications</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(formData.notificationPreferences)
                            .filter(key => typeof formData.notificationPreferences[key] === 'boolean')
                            .map((key) => (
                                <div key={key} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 transition-all hover:border-orange-200">
                                    <div>
                                        <h4 className="font-black text-slate-900 capitalize">{key} Alerts</h4>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Receive updates via {key}.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={formData.notificationPreferences[key]}
                                            onChange={(e) => handleToggle(`notificationPreferences.${key}`, e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                    </label>
                                </div>
                            ))}
                        
                        {/* Digest Frequency Selector */}
                        <div className="flex items-center justify-between p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100 md:col-span-2">
                            <div>
                                <h4 className="font-black text-slate-900">Email Digest frequency</h4>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Summary of your missed notifications.</p>
                            </div>
                            <select 
                                value={formData.notificationPreferences.digestFrequency}
                                onChange={(e) => handleToggle('notificationPreferences.digestFrequency', e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="None">None (Instant only)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                            <Eye className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Privacy & Visibility</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div>
                                <h4 className="font-black text-slate-900">Public Profile</h4>
                                <p className="text-slate-500 text-xs font-medium mt-1">Allow others to see your reviews and bookmarks on your profile.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.privacySettings.profileVisible}
                                    onChange={(e) => handleToggle('privacySettings.profileVisible', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div>
                                <h4 className="font-black text-slate-900">Activity History</h4>
                                <p className="text-slate-500 text-xs font-medium mt-1">Keep a log of your recent searches and interactions.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.privacySettings.activityVisible}
                                    onChange={(e) => handleToggle('privacySettings.activityVisible', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-6 pt-12 border-t border-slate-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Danger Zone</h3>
                    </div>

                    <div className="p-8 bg-red-50 rounded-[40px] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h4 className="font-black text-red-700 text-lg">Permanently Delete Account</h4>
                            <p className="text-red-600/70 text-sm font-medium mt-1 leading-relaxed">
                                Once you delete your account, there is no going back. All your data, reviews, and bookmarks will be purged.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                type="button" 
                                onClick={handleDeactivateAccount}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-xs hover:bg-red-50 transition-all"
                            >
                                Deactivate Instead
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={actionLoading}
                                className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Delete Your Account?"
                    subtitle="This action is irreversible"
                    icon={Trash2}
                    footer={
                        <>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteAccount}
                                disabled={actionLoading}
                                className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-sm flex items-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                                Confirm Deletion
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-slate-600 font-medium leading-relaxed">
                            Are you absolutely sure you want to delete your account? This will permanently remove:
                        </p>
                        <ul className="space-y-2">
                             {['Your entire profile data', 'All active business listings', 'All reviews and ratings', 'Saved bookmarks and activity history'].map((item, idx) => (
                                 <li key={idx} className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                     {item}
                                 </li>
                             ))}
                        </ul>
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl mt-4">
                            <p className="text-orange-700 text-xs font-black uppercase tracking-wider">Warning</p>
                            <p className="text-orange-600 text-sm font-medium mt-1">If you just need a break, you can deactivate your account instead.</p>
                        </div>
                    </div>
                </Modal>

                <div className="pt-8 mb-12">
                     <button 
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save All Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
