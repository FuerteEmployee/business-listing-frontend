import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';

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
                // Update local auth context
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

        // Validate type and size
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be under 5MB.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('image', file); // Backend expects field named 'image'

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
                // Auto-save immediately so it persists and updates the header avatar
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Public Profile</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage how others see you on the platform.</p>
                </div>
                {success && (
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" />
                        Changes Saved
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Profile Photo */}
                <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-[2rem] bg-white overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                            {formData.profilePhoto ? (
                                <img src={formData.profilePhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <User className="w-16 h-16" />
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-orange-700 hover:scale-110 active:scale-95 transition-all">
                            <Camera className="w-5 h-5" />
                            <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                        </label>
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="font-black text-xl text-slate-900">Your profile picture</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1 leading-relaxed max-w-sm">We recommend an image of at least 400x400px. Gifs work too!</p>
                        {uploadError && (
                            <p className="text-red-500 text-xs font-semibold mt-2">{uploadError}</p>
                        )}
                        <div className="flex items-center gap-4 mt-6">
                            <label className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-slate-50 cursor-pointer shadow-sm transition-all">
                                Upload New
                                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                            </label>
                            {formData.profilePhoto && (
                                <button type="button" onClick={() => setFormData(prev => ({...prev, profilePhoto: ''}))} className="text-red-500 text-xs font-black hover:underline px-2">Remove</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <User className="w-3 h-3" /> Full Name
                        </label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all" 
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <input 
                            type="email" 
                            readOnly
                            value={formData.email}
                            className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium text-slate-500 cursor-not-allowed outline-none" 
                        />
                        <p className="text-[10px] text-slate-400 font-bold italic ml-1">* Email cannot be changed here</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Phone className="w-3 h-3" /> Mobile Number
                        </label>
                        <input 
                            type="tel" 
                            value={formData.mobileNumber}
                            readOnly
                            className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium text-slate-500 cursor-not-allowed outline-none" 
                        />
                        <p className="text-[10px] text-slate-400 font-bold italic ml-1">* Change from Security Settings</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <MapPin className="w-3 h-3" /> Default Location
                        </label>
                        <input 
                            type="text" 
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all" 
                            placeholder="e.g. Mumbai, India"
                        />
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-100 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>

            </form>
        </div>
    );
}
