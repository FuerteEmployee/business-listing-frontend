import { useState, useEffect } from "react";
import { Save, AlertTriangle, Monitor, Globe, BrainCircuit } from "lucide-react";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import SliderManagement from "../../components/admin/SliderManagement";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";
import FormInput from "../../components/ui/FormInput";
import { useTheme } from "../../context/ThemeContext";
import HomepageSettingsManager from "../../components/admin/HomepageSettingsManager";

export default function Settings() {
    const { settings, updateSettingsState, fetchSettings } = useTheme();

    // rankingWeights is only returned to Super Admins, and ThemeContext may have
    // loaded its copy before login. Refetch with the admin token on mount so the
    // form edits the real weights instead of saving defaults over them.
    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [activeTab, setActiveTab] = useState("global"); // 'global' or 'homepage' or 'ai'

    const [formData, setFormData] = useState({
        siteName: "",
        primaryColor: "#4f46e5",
        secondaryColor: "#f8fafc",
        contactEmail: "",
        contactPhone: "",
        footerText: "",
        faviconUrl: "",
        rankingWeights: {
            reviews: 1.0,
            distance: 1.0,
            responseTime: 1.0,
            premium: 1.5
        }
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });


    // Populate form with existing settings
    useEffect(() => {
        if (settings) {
            setFormData({
                siteName: settings.siteName || "",
                primaryColor: settings.primaryColor || "#4f46e5",
                secondaryColor: settings.secondaryColor || "#f8fafc",
                contactEmail: settings.contactEmail || "",
                contactPhone: settings.contactPhone || "",
                footerText: settings.footerText || "",
                faviconUrl: settings.faviconUrl || "",
                rankingWeights: settings.rankingWeights || {
                    reviews: 1.0,
                    distance: 1.0,
                    responseTime: 1.0,
                    premium: 1.5
                }
            });
            setImagePreview(settings.logoUrl || null);
            setFaviconPreview(settings.faviconUrl || null);
        }
    }, [settings]);

    const handleRankWeightChange = (key, val) => {
        setFormData(prev => ({
            ...prev,
            rankingWeights: {
                ...prev.rankingWeights,
                [key]: parseFloat(val)
            }
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFaviconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFaviconFile(file);
            setFaviconPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        setIsLoading(true);

        try {
            let logoUrl = settings.logoUrl;
            let faviconUrl = settings.faviconUrl;

            // Handle Logo Upload
            if (imageFile) {
                setIsUploading(true);
                setUploadProgress(0);

                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => prev < 90 ? prev + Math.random() * 12 : prev);
                }, 300);

                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                const uploadRes = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });

                clearInterval(progressInterval);
                const uploadResult = await uploadRes.json();

                if (!uploadRes.ok) {
                    setIsUploading(false);
                    setIsLoading(false);
                    setMessage({ type: "error", text: uploadResult.msg || 'Logo upload failed.' });
                    return;
                }

                setUploadProgress(100);
                await new Promise(r => setTimeout(r, 400));
                logoUrl = uploadResult.url;
                setIsUploading(false);
                setUploadProgress(0);
            }

            // Handle Favicon Upload
            if (faviconFile) {
                setIsUploading(true);
                setUploadProgress(0);

                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => prev < 90 ? prev + Math.random() * 12 : prev);
                }, 300);

                const uploadData = new FormData();
                uploadData.append('image', faviconFile);
                const uploadRes = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });

                clearInterval(progressInterval);
                const uploadResult = await uploadRes.json();

                if (!uploadRes.ok) {
                    setIsUploading(false);
                    setIsLoading(false);
                    setMessage({ type: "error", text: uploadResult.msg || 'Favicon upload failed.' });
                    return;
                }

                setUploadProgress(100);
                await new Promise(r => setTimeout(r, 400));
                faviconUrl = uploadResult.url;
                setIsUploading(false);
                setUploadProgress(0);
            }

            const payload = { 
                ...formData, 
                logoUrl, 
                faviconUrl,
                homepage: settings.homepage,
                hiddenFeatures: settings.hiddenFeatures
            };
            const res = await fetchWithAuth(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Settings updated successfully!" });
                updateSettingsState(data.data);
                setImageFile(null); // Clear pending file state
                setFaviconFile(null); // Clear pending file state
            } else {
                setMessage({ type: "error", text: data.message || 'Failed to update settings.' });
            }
        } catch (err) {
            setMessage({ type: "error", text: 'Network error. Could not connect to backend.' });
            setIsUploading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (updatedSettings) => {
        try {
            console.log("📤 Sending to API:", JSON.stringify(updatedSettings, null, 2));
            const requestPayload = updatedSettings;
            
            const res = await fetchWithAuth(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                body: JSON.stringify(requestPayload)
            });
            const data = await res.json();
            console.log("📥 API Response:", data);
            
            if (res.ok) {
                console.log("✅ Settings saved successfully");
                updateSettingsState(data.data);
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error("❌ Save error:", err);
            throw err;
        }
    };

    const tabs = [
        { id: "global", label: "Global Settings", icon: Globe },
        { id: "homepage", label: "Homepage Settings", icon: Monitor },
        { id: "ai", label: "AI Ranking", icon: BrainCircuit },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                    {message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <span className="text-emerald-500 w-5 h-5 flex items-center justify-center font-bold text-lg">✓</span>}
                    {message.text}
                </div>
            )}



            <AdminHeader 
                title="Platform Configuration"
                subtitle="Manage core system personalization, branding, and global layout parameters."
                badge={
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        System Control
                    </div>
                }
            />

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1 min-w-max pb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? "text-indigo-600"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-indigo-600" : "text-slate-400"}`} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "global" ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-semibold text-slate-800">Brand & Theme</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Logo Upload */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Platform Logo</label>
                                    <p className="text-xs text-slate-500 mb-2">Recommended size: 200x50 pixels (transparent PNG).</p>
                                    <ImageUploadBox
                                        imagePreview={imagePreview}
                                        isUploading={isUploading}
                                        uploadProgress={uploadProgress}
                                        onImageChange={handleImageUpload}
                                        title="Upload Logo"
                                        subtitle="PNG, JPG, MP4, MOV max 20MB"
                                        imageSizeClass="w-full h-24 object-contain p-2"
                                    />
                                </div>

                                {/* Favicon Upload */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Platform Favicon</label>
                                    <p className="text-xs text-slate-500 mb-2">Recommended: 32x32 or 64x64 pixels (ICO/PNG).</p>
                                    <ImageUploadBox
                                        imagePreview={faviconPreview}
                                        isUploading={isUploading}
                                        uploadProgress={uploadProgress}
                                        onImageChange={handleFaviconUpload}
                                        title="Upload Favicon"
                                        subtitle="ICO, PNG max 2MB"
                                        imageSizeClass="w-16 h-16 object-contain p-1 mx-auto"
                                    />
                                </div>

                                {/* General Setting inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <FormInput 
                                            label="Site Name"
                                            name="siteName"
                                            value={formData.siteName}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Fuerte Developers"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    name="primaryColor"
                                                    value={formData.primaryColor}
                                                    onChange={handleInputChange}
                                                    className="h-10 w-12 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    name="primaryColor"
                                                    value={formData.primaryColor}
                                                    onChange={handleInputChange}
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    name="secondaryColor"
                                                    value={formData.secondaryColor}
                                                    onChange={handleInputChange}
                                                    className="h-10 w-12 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    name="secondaryColor"
                                                    value={formData.secondaryColor}
                                                    onChange={handleInputChange}
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <FormInput 
                                        label="Contact Email"
                                        type="email"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleInputChange}
                                        placeholder="support@example.com"
                                    />
                                </div>
                                <div>
                                    <FormInput 
                                        label="Contact Phone"
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleInputChange}
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <FormInput 
                                        label="Footer Text"
                                        name="footerText"
                                        value={formData.footerText}
                                        onChange={handleInputChange}
                                        placeholder="© 2026 Your Company. All rights reserved."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || isUploading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {(isLoading || isUploading) ? (
                                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {isLoading ? 'Saving...' : isUploading ? 'Uploading Logo...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : activeTab === "homepage" ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <HomepageSettingsManager settings={settings} onSave={saveSettings} />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-semibold text-slate-800">AI Recommendation Algorithm</h3>
                            <p className="text-sm text-slate-500 mt-1">Adjust the weights to control how businesses are ranked in search results.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Reviews & Ratings Weight</label>
                                            <span className="text-sm font-mono text-indigo-600">{formData.rankingWeights.reviews.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={formData.rankingWeights.reviews}
                                            onChange={(e) => handleRankWeightChange('reviews', e.target.value)}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Higher weight prioritizes businesses with higher star ratings and review counts.</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Premium Listing Boost</label>
                                            <span className="text-sm font-mono text-indigo-600">{formData.rankingWeights.premium.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={formData.rankingWeights.premium}
                                            onChange={(e) => handleRankWeightChange('premium', e.target.value)}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Additional multiplier for 'Featured' businesses to appear at the top.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Response Time Weight</label>
                                            <span className="text-sm font-mono text-indigo-600">{formData.rankingWeights.responseTime.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={formData.rankingWeights.responseTime}
                                            onChange={(e) => handleRankWeightChange('responseTime', e.target.value)}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Penalizes businesses that take longer to respond to leads.</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm font-medium text-slate-700">Distance Weight</label>
                                            <span className="text-sm font-mono text-indigo-600">{formData.rankingWeights.distance.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={formData.rankingWeights.distance}
                                            onChange={(e) => handleRankWeightChange('distance', e.target.value)}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Prioritizes businesses physically closer to the user's location.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {isLoading ? 'Saving...' : 'Save Ranking Weights'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
