import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader2, AlertTriangle, CheckCircle, Palette, User, Camera, Monitor, Smartphone, Globe, Clock, Shield, LogOut } from "lucide-react";
import { API_BASE_URL, fetchWithAuth, getApiUrl } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import FormInput from "../../components/ui/FormInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { useAuth } from "../../context/AuthContext";
import BusinessHoursEditor from "../../components/ui/BusinessHoursEditor";
import { emptyBusinessHours, normalizeBusinessHours } from "../../utils/businessHours";

export default function BrandSettings() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    
    // Brand States
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingBrand, setIsSavingBrand] = useState(false);
    const [brandMessage, setBrandMessage] = useState({ type: "", text: "" });
    const [brandFormData, setBrandFormData] = useState({
        name: "",
        primaryColor: "#4f46e5",
        secondaryColor: "#f8fafc",
        email: "",
        phone: "",
        footerText: "",
        businessHours: emptyBusinessHours()
    });
    const [brandLogoFile, setBrandLogoFile] = useState(null);
    const [brandLogoPreview, setBrandLogoPreview] = useState(null);
    const [brandFaviconFile, setBrandFaviconFile] = useState(null);
    const [brandFaviconPreview, setBrandFaviconPreview] = useState(null);
    const [isBrandUploading, setIsBrandUploading] = useState(false);
    const [brandUploadProgress, setBrandUploadProgress] = useState(0);

    // Personal Profile States
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [userMessage, setUserMessage] = useState({ type: "", text: "" });
    const [userFormData, setUserFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        location: "",
        profilePhoto: ""
    });
    const [isUserUploading, setIsUserUploading] = useState(false);
    const [userUploadError, setUserUploadError] = useState("");

    // Active Sessions States
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [revokingSessionId, setRevokingSessionId] = useState(null);

    // Fetch Brand and User data
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/companies/my-companies`);
                if (res.ok) {
                    const result = await res.json();
                    const companies = result.data || result;
                    if (Array.isArray(companies) && companies.length > 0) {
                        const comp = companies[0];
                        setCompany(comp);
                        setBrandFormData({
                            name: comp.name || "",
                            primaryColor: comp.primaryColor || "#4f46e5",
                            secondaryColor: comp.secondaryColor || "#f8fafc",
                            email: comp.email || "",
                            phone: comp.phone || "",
                            footerText: comp.footerText || "",
                            businessHours: normalizeBusinessHours(comp.businessHours)
                        });
                        setBrandLogoPreview(comp.logo || null);
                        setBrandFaviconPreview(comp.favicon || null);
                    } else {
                        setBrandMessage({ type: "error", text: "No business profile found to configure settings." });
                    }
                } else {
                    setBrandMessage({ type: "error", text: "Failed to load brand settings." });
                }
            } catch (err) {
                console.error("Error fetching company details:", err);
                setBrandMessage({ type: "error", text: "Error loading brand settings." });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompany();
        fetchSessions();
    }, []);

    // Fetch user sessions
    const fetchSessions = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/auth/sessions`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (err) {
            console.error("Fetch sessions error:", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    // Revoke a specific session
    const handleRevokeSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to terminate this session?")) return;
        setRevokingSessionId(sessionId);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
                setUserMessage({ type: "success", text: "Session terminated successfully." });
            } else {
                const data = await res.json();
                setUserMessage({ type: "error", text: data.msg || "Failed to terminate session." });
            }
        } catch (err) {
            console.error("Revocation error:", err);
            setUserMessage({ type: "error", text: "Error terminating session." });
        } finally {
            setRevokingSessionId(null);
        }
    };

    // Sync user data
    useEffect(() => {
        if (user) {
            setUserFormData({
                name: user.name || "",
                email: user.email || "",
                mobileNumber: user.mobileNumber || "",
                location: user.location || "",
                profilePhoto: user.profilePhoto || ""
            });
        }
    }, [user]);

    // Handlers for Brand Form
    const handleBrandInputChange = (e) => {
        const { name, value } = e.target;
        setBrandFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBrandLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBrandLogoFile(file);
            setBrandLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleBrandFaviconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBrandFaviconFile(file);
            setBrandFaviconPreview(URL.createObjectURL(file));
        }
    };

    const handleBrandSubmit = async (e) => {
        e.preventDefault();
        setBrandMessage({ type: "", text: "" });
        setIsSavingBrand(true);

        try {
            let logo = company.logo;
            let favicon = company.favicon;

            // Handle Brand Logo Upload
            if (brandLogoFile) {
                setIsBrandUploading(true);
                setBrandUploadProgress(0);

                const progressInterval = setInterval(() => {
                    setBrandUploadProgress(prev => prev < 90 ? prev + Math.random() * 12 : prev);
                }, 300);

                const uploadData = new FormData();
                uploadData.append('image', brandLogoFile);
                const uploadRes = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });

                clearInterval(progressInterval);
                const uploadResult = await uploadRes.json();

                if (!uploadRes.ok) {
                    setIsBrandUploading(false);
                    setIsSavingBrand(false);
                    setBrandMessage({ type: "error", text: uploadResult.msg || 'Brand logo upload failed.' });
                    return;
                }

                setBrandUploadProgress(100);
                await new Promise(r => setTimeout(r, 400));
                logo = uploadResult.url;
                setIsBrandUploading(false);
                setBrandUploadProgress(0);
            }

            // Handle Brand Favicon Upload
            if (brandFaviconFile) {
                setIsBrandUploading(true);
                setBrandUploadProgress(0);

                const progressInterval = setInterval(() => {
                    setBrandUploadProgress(prev => prev < 90 ? prev + Math.random() * 12 : prev);
                }, 300);

                const uploadData = new FormData();
                uploadData.append('image', brandFaviconFile);
                const uploadRes = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });

                clearInterval(progressInterval);
                const uploadResult = await uploadRes.json();

                if (!uploadRes.ok) {
                    setIsBrandUploading(false);
                    setIsSavingBrand(false);
                    setBrandMessage({ type: "error", text: uploadResult.msg || 'Brand favicon upload failed.' });
                    return;
                }

                setBrandUploadProgress(100);
                await new Promise(r => setTimeout(r, 400));
                favicon = uploadResult.url;
                setIsBrandUploading(false);
                setBrandUploadProgress(0);
            }

            const payload = { 
                ...brandFormData, 
                logo, 
                favicon
            };
            
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/${company._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok) {
                setBrandMessage({ type: "success", text: "Brand configuration saved successfully!" });
                setBrandLogoFile(null); 
                setBrandFaviconFile(null);
            } else {
                setBrandMessage({ type: "error", text: result.msg || 'Failed to update brand settings.' });
            }
        } catch (err) {
            console.error("Save settings error:", err);
            setBrandMessage({ type: "error", text: 'Network error. Could not connect to backend.' });
        } finally {
            setIsSavingBrand(false);
        }
    };

    // Handlers for User Form
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setUserMessage({ type: "", text: "" });
        setIsSavingUser(true);

        try {
            const res = await fetchWithAuth(getApiUrl('me/profile'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userFormData)
            });

            const data = await res.json();
            if (res.ok) {
                login(data.data, localStorage.getItem('token'));
                setUserMessage({ type: "success", text: "Owner profile saved successfully!" });
            } else {
                setUserMessage({ type: "error", text: data.msg || "Failed to update profile." });
            }
        } catch (err) {
            console.error('Update error:', err);
            setUserMessage({ type: "error", text: "Error saving profile details." });
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleUserProfilePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUserUploadError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUserUploadError('Image must be under 5MB.');
            return;
        }

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            setIsUserUploading(true);
            setUserUploadError('');
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('upload'), {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: uploadData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                const newPhotoUrl = data.url;
                setUserFormData(prev => ({ ...prev, profilePhoto: newPhotoUrl }));
                
                const saveRes = await fetchWithAuth(getApiUrl('me/profile'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profilePhoto: newPhotoUrl })
                });
                const saveData = await saveRes.json();
                if (saveRes.ok) {
                    login(saveData.data, localStorage.getItem('token'));
                    setUserMessage({ type: "success", text: "Owner avatar updated successfully!" });
                }
            } else {
                setUserUploadError(data.msg || 'Upload failed. Please try again.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUserUploadError('Network error during upload.');
        } finally {
            setIsUserUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 border-indigo-600 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading preferences...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            <AdminHeader 
                title="Profile & Settings"
                subtitle="Configure personal account settings, brand customization, and active login sessions."
                badge={
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        Preferences
                    </div>
                }
            />

            <Tabs defaultValue="profile">
                {/* Unified Tab Selector */}
                <TabsList className="bg-white/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-x-auto flex flex-nowrap whitespace-nowrap no-scrollbar mb-8 justify-start items-center gap-1.5">
                    <TabsTrigger value="profile" className="rounded-xl px-6 py-2.5 flex items-center gap-2 flex-shrink-0">
                        <User className="w-4 h-4" /> Owner Profile
                    </TabsTrigger>
                    <TabsTrigger value="brand" className="rounded-xl px-6 py-2.5 flex items-center gap-2 flex-shrink-0">
                        <Palette className="w-4 h-4" /> Brand Customization
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="rounded-xl px-6 py-2.5 flex items-center gap-2 flex-shrink-0">
                        <Shield className="w-4 h-4" /> Active Sessions
                    </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 gap-8">
                    {/* Tab 1: Owner Profile details */}
                    <TabsContent value="profile" className="space-y-8 animate-in fade-in duration-400">
                        {userMessage.text && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
                                userMessage.type === "success" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                                {userMessage.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
                                {userMessage.text}
                            </div>
                        )}
                        {userUploadError && (
                            <div className="p-4 rounded-xl text-sm font-medium flex items-center gap-3 bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                {userUploadError}
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-semibold text-slate-800">Personal Details</h3>
                            </div>

                            <form onSubmit={handleUserSubmit} className="p-6 space-y-8">
                                {/* Avatar Upload */}
                                <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-150 group-hover:scale-102 transition-transform duration-300">
                                            {userFormData.profilePhoto ? (
                                                <img src={userFormData.profilePhoto} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                                    <User className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all">
                                            <Camera className="w-4 h-4" />
                                            <input type="file" className="hidden" onChange={handleUserProfilePhotoUpload} accept="image/*" />
                                        </label>
                                    </div>
                                    <div className="text-center md:text-left space-y-1">
                                        <h4 className="font-bold text-slate-800 text-sm">Profile Avatar</h4>
                                        <p className="text-slate-400 text-xs font-semibold max-w-sm">We recommend an image of at least 400x400px.</p>
                                        <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                                            <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-sm transition-all">
                                                Upload New
                                                <input type="file" className="hidden" onChange={handleUserProfilePhotoUpload} accept="image/*" />
                                            </label>
                                            {userFormData.profilePhoto && (
                                                <button type="button" onClick={() => setUserFormData(prev => ({...prev, profilePhoto: ''}))} className="text-rose-600 text-xs font-bold hover:underline px-2">Remove</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput 
                                        label="Full Name"
                                        name="name"
                                        value={userFormData.name}
                                        onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                                        placeholder="Your Name"
                                        required
                                    />
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                                        <input 
                                            type="email" 
                                            readOnly
                                            value={userFormData.email}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-none" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Mobile Number</label>
                                        <input 
                                            type="tel" 
                                            readOnly
                                            value={userFormData.mobileNumber}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-none" 
                                        />
                                    </div>
                                    <FormInput 
                                        label="Default Location"
                                        name="location"
                                        value={userFormData.location}
                                        onChange={(e) => setUserFormData({...userFormData, location: e.target.value})}
                                        placeholder="e.g. Mumbai, India"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button 
                                        type="submit"
                                        disabled={isSavingUser}
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:scale-100 flex items-center gap-2"
                                    >
                                        {isSavingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Brand customization */}
                    <TabsContent value="brand" className="space-y-8 animate-in fade-in duration-400">
                        {brandMessage.text && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
                                brandMessage.type === "success" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                                {brandMessage.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
                                {brandMessage.text}
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-semibold text-slate-800">Brand & Theme</h3>
                            </div>

                            <form onSubmit={handleBrandSubmit} className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Logo Upload */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Brand Logo</label>
                                        <p className="text-xs text-slate-500 mb-2">Recommended size: 200x50 pixels (transparent PNG).</p>
                                        <ImageUploadBox
                                            imagePreview={brandLogoPreview}
                                            isUploading={isBrandUploading}
                                            uploadProgress={brandUploadProgress}
                                            onImageChange={handleBrandLogoUpload}
                                            title="Upload Logo"
                                            subtitle="PNG, JPG max 5MB"
                                            imageSizeClass="w-full h-24 object-contain p-2"
                                        />
                                    </div>

                                    {/* Favicon Upload */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Brand Favicon</label>
                                        <p className="text-xs text-slate-500 mb-2">Recommended: 32x32 or 64x64 pixels (ICO/PNG).</p>
                                        <ImageUploadBox
                                            imagePreview={brandFaviconPreview}
                                            isUploading={isBrandUploading}
                                            uploadProgress={brandUploadProgress}
                                            onImageChange={handleBrandFaviconUpload}
                                            title="Upload Favicon"
                                            subtitle="ICO, PNG max 2MB"
                                            imageSizeClass="w-16 h-16 object-contain p-1 mx-auto"
                                        />
                                    </div>

                                    {/* General brand details */}
                                    <div className="space-y-4 md:col-span-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput 
                                                label="Brand Name"
                                                name="name"
                                                value={brandFormData.name}
                                                onChange={handleBrandInputChange}
                                                placeholder="Your Business Name"
                                                required
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            name="primaryColor"
                                                            value={brandFormData.primaryColor}
                                                            onChange={handleBrandInputChange}
                                                            className="w-10 h-10 border border-slate-200 rounded-lg p-0.5 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="primaryColor"
                                                            value={brandFormData.primaryColor}
                                                            onChange={handleBrandInputChange}
                                                            className="flex-1 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            name="secondaryColor"
                                                            value={brandFormData.secondaryColor}
                                                            onChange={handleBrandInputChange}
                                                            className="w-10 h-10 border border-slate-200 rounded-lg p-0.5 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="secondaryColor"
                                                            value={brandFormData.secondaryColor}
                                                            onChange={handleBrandInputChange}
                                                            className="flex-1 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <FormInput 
                                                label="Contact Email"
                                                name="email"
                                                type="email"
                                                value={brandFormData.email}
                                                onChange={handleBrandInputChange}
                                                placeholder="info@yourcompany.com"
                                            />

                                            <FormInput 
                                                label="Contact Phone"
                                                name="phone"
                                                value={brandFormData.phone}
                                                onChange={handleBrandInputChange}
                                                placeholder="+91 XXXXX XXXXX"
                                            />

                                            <div className="md:col-span-2">
                                                <FormInput 
                                                    label="Footer Text"
                                                    name="footerText"
                                                    value={brandFormData.footerText}
                                                    onChange={handleBrandInputChange}
                                                    placeholder="e.g. © 2026 YOUR BRAND. All Rights Reserved."
                                                />
                                            </div>

                                            <div className="md:col-span-2 pt-6 border-t border-slate-100">
                                                <BusinessHoursEditor
                                                    value={brandFormData.businessHours}
                                                    onChange={hours => setBrandFormData(prev => ({ ...prev, businessHours: hours }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSavingBrand}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                                    >
                                        {isSavingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Brand Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Active Sessions list */}
                    <TabsContent value="sessions" className="space-y-8 animate-in fade-in duration-400">
                        {userMessage.text && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
                                userMessage.type === "success" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                                {userMessage.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-rose-500" />}
                                {userMessage.text}
                            </div>
                        )}
                        {loadingSessions ? (
                            <div className="flex flex-col items-center justify-center min-h-[300px]">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-4">Syncing active logins...</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-lg font-semibold text-slate-800">Active Sessions</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Locations and devices currently logged into your merchant account.</p>
                                </div>

                                <div className="p-6 divide-y divide-slate-100">
                                    {sessions.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm">No session logs</h4>
                                            <p className="text-slate-400 text-xs mt-1">Your recent login history will appear here.</p>
                                        </div>
                                    ) : (
                                        sessions.slice().reverse().map((session, idx) => {
                                            const isCurrent = idx === 0;
                                            return (
                                                <div 
                                                    key={session._id || idx}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between py-5 first:pt-0 last:pb-0 gap-4"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                            {session.device?.toLowerCase().includes('mobi') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-slate-800 text-sm">{session.device || 'Unknown Device'}</span>
                                                                {isCurrent && (
                                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-md border border-emerald-100">Current Session</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold">
                                                                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {session.ip || '127.0.0.1'}</span>
                                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(session.timestamp).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!isCurrent && (
                                                        <button
                                                            type="button"
                                                            disabled={revokingSessionId === session._id}
                                                            onClick={() => handleRevokeSession(session._id)}
                                                            className="self-start sm:self-center px-4 py-2 border border-rose-250 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                                                        >
                                                            {revokingSessionId === session._id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <LogOut className="w-3.5 h-3.5" />
                                                            )}
                                                            Revoke Device
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
