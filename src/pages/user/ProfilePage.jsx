import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Loader2, Save, CheckCircle2, Globe, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import AdminHeader from "../../components/admin/AdminHeader";

export default function ProfilePage() {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobileNumber: '',
        location: '',
        profilePhoto: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobileNumber: user.mobileNumber || '',
                location: user.location || '',
                profilePhoto: user.profilePhoto || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetchWithAuth(getApiUrl('me/profile'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                login(data.data, localStorage.getItem('token'));
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Update error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be under 5MB.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            setLoading(true);
            setUploadError('');
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('upload'), {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: uploadData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                const newPhotoUrl = data.url;
                setFormData(prev => ({ ...prev, profilePhoto: newPhotoUrl }));
                
                const saveRes = await fetchWithAuth(getApiUrl('me/profile'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profilePhoto: newPhotoUrl })
                });
                const saveData = await saveRes.json();
                if (saveRes.ok) {
                    login(saveData.data, localStorage.getItem('token'));
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                }
            } else {
                setUploadError(data.msg || 'Upload failed. Please try again.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError('Network error during upload.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            {success && (
                <div className="p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Changes Saved Successfully!
                </div>
            )}
            {uploadError && (
                <div className="p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    {uploadError}
                </div>
            )}

            <AdminHeader 
                title="Public Profile"
                subtitle="Manage how others see you on the platform."
                badge={
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        User Control
                    </div>
                }
            />

            {/* Tab Navigation simulation */}
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-hide">
                <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap text-indigo-600">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    Profile Settings
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                </button>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">Personal Details</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Avatar Upload Container */}
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-150 group-hover:scale-102 transition-transform duration-300">
                                {formData.profilePhoto ? (
                                    <img src={formData.profilePhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                            </label>
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm">Profile Avatar</h4>
                            <p className="text-slate-400 text-xs font-semibold max-w-sm">We recommend an image of at least 400x400px.</p>
                            <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                                <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-sm transition-all">
                                    Upload New
                                    <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                                </label>
                                {formData.profilePhoto && (
                                    <button type="button" onClick={() => setFormData(prev => ({...prev, profilePhoto: ''}))} className="text-rose-600 text-xs font-bold hover:underline px-2">Remove</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all shadow-sm" 
                                placeholder="Your Name"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                            <input 
                                type="email" 
                                readOnly
                                value={formData.email}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-none" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Mobile Number</label>
                            <input 
                                type="tel" 
                                value={formData.mobileNumber}
                                readOnly
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-none" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Default Location</label>
                            <input 
                                type="text" 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all shadow-sm" 
                                placeholder="e.g. Mumbai, India"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:scale-100 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
