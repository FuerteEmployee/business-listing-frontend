import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    ArrowLeft, Save, Building2, MapPin, 
    Globe, Phone, Mail, Instagram, Facebook, 
    Twitter, Linkedin, Youtube, CheckCircle, 
    AlertTriangle, Languages, CreditCard, 
    Users, Calendar, Target, Plus, X, Search,
    Briefcase, Link as LinkIcon, Image as ImageIcon, Video
} from "lucide-react";
import MediaManager from "../../components/merchant/MediaManager";
import { API_BASE_URL, fetchWithAuth, getApiUrl } from "../../config/api";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import LocationSelector from "../../components/location/LocationSelector";
import FormSelect from "../../components/ui/FormSelect";
import FormInput from "../../components/ui/FormInput";
import { FormTextarea } from "../../components/ui/FormTextarea";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import MapPicker from "../../components/location/MapPicker";
import BusinessHoursEditor from "../../components/ui/BusinessHoursEditor";
import { emptyBusinessHours, normalizeBusinessHours } from "../../utils/businessHours";

export default function ProfileEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState("basic");
    
    const [categories, setCategories] = useState([]);
    
    const defaultFormState = {
        name: "", tagline: "", description: "",
        category: "", subCategory: "", 
        country_id: "", state_id: "", city_id: "", area_id: "",
        address: "", latitude: null, longitude: null,
        phone: "", email: "", website: "", bookingUrl: "",
        yearEstablished: "", employeeCount: "",
        languages: [], paymentMethods: [],
        socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" },
        tags: [],
        image: null,
        logo: null,
        coverPhotoUrl: null,
        images: [],
        videos: [],
        serviceRadius: 0,
        serviceArea: { type: 'Polygon', coordinates: [] },
        businessHours: emptyBusinessHours()
    };
    
    const [formData, setFormData] = useState(defaultFormState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [newTag, setNewTag] = useState("");

    const languageOptions = ["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Tamil", "Telegu", "Kannada", "Malayalam", "Spanish", "French", "German"];
    const paymentOptions = ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet", "Paytm", "Google Pay", "Apple Pay"];

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                const [catsRes, companyRes] = await Promise.all([
                    fetchWithAuth(`${API_BASE_URL}/categories`),
                    fetchWithAuth(`${API_BASE_URL}/companies/${id}`)
                ]);

                if (catsRes.ok) setCategories(await catsRes.json());
                
                if (companyRes.ok) {
                    const company = await companyRes.json();
                    
                    setFormData({
                        ...defaultFormState,
                        ...company,
                        country_id: company.country_id?._id || company.country_id || "",
                        state_id: company.state_id?._id || company.state_id || "",
                        city_id: company.city_id?._id || company.city_id || "",
                        area_id: company.area_id?._id || company.area_id || "",
                        socialLinks: { ...defaultFormState.socialLinks, ...(company.socialLinks || {}) },
                        languages: Array.isArray(company.languages) ? company.languages : [],
                        paymentMethods: Array.isArray(company.paymentMethods) ? company.paymentMethods : [],
                        tags: Array.isArray(company.tags) ? company.tags : [],
                        businessHours: normalizeBusinessHours(company.businessHours),
                        coverPhotoUrl: company.coverPhotoUrl || null
                    });
                    setImagePreview(company.image || null);
                } else {
                    const errData = await companyRes.json();
                    setError(errData.msg || "Failed to fetch profile details.");
                }
            } catch (err) {
                console.error("Fetch Data Error:", err);
                setError("Network error. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith("social.")) {
            const socialField = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, [socialField]: value }
            }));
            return;
        }

        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleArrayToggle = (field, value) => {
        setFormData(prev => {
            const current = [...(prev[field] || [])];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
                setNewTag("");
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSaving(true);
        
        try {
            let imageUrl = formData.image;

            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                
                const uploadRes = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });
                
                const uploadResult = await uploadRes.json();
                if (!uploadRes.ok) {
                    setError(uploadResult.msg || "Image upload failed.");
                    setIsSaving(false);
                    return;
                }
                imageUrl = uploadResult.url;
            }

            const payload = { ...formData, image: imageUrl };
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess("Business profile updated successfully!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(null), 4000);
            } else {
                const data = await res.json();
                setError(data.msg || "Failed to update profile.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            {/* Premium Header */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all group scale-100 hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-5">
                            {imagePreview ? (
                                <img src={imagePreview} alt={formData.name} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-lg" />
                            ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                    {formData.name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
                                    Manage Business Profile
                                </h1>
                                <p className="text-slate-500 font-medium flex items-center gap-2">
                                    {formData.name} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {formData.category}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full md:w-auto gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate(-1)}
                            className="flex-1 md:flex-none h-12 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            isLoading={isSaving}
                            className="flex-1 md:flex-none h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Profile
                        </Button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="px-2">
                {error && (
                    <div className="px-6 py-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <span className="font-bold text-sm tracking-wide">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <CheckCircle className="w-6 h-6 shrink-0" />
                        <span className="font-bold text-sm tracking-wide">{success}</span>
                    </div>
                )}
            </div>

            {/* Multi-Tab Interface */}
            <Tabs defaultValue="basic" onValueChange={setActiveTab}>
                <TabsList className="bg-white/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-fit mb-8 mb:mx-auto lg:mx-0">
                    <TabsTrigger value="basic" className="rounded-xl px-6 py-2.5">Basic Info</TabsTrigger>
                    <TabsTrigger value="categories" className="rounded-xl px-6 py-2.5">Category & Tags</TabsTrigger>
                    <TabsTrigger value="location" className="rounded-xl px-6 py-2.5">Location & Area</TabsTrigger>
                    <TabsTrigger value="media" className="rounded-xl px-6 py-2.5">Media & Gallery</TabsTrigger>
                    <TabsTrigger value="contact" className="rounded-xl px-6 py-2.5">Contact & Social</TabsTrigger>
                    <TabsTrigger value="hours" className="rounded-xl px-6 py-2.5">Business Hours</TabsTrigger>
                    <TabsTrigger value="features" className="rounded-xl px-6 py-2.5">Additional Details</TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 gap-8">
                    {/* Business Hours Tab */}
                    <TabsContent value="hours" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <BusinessHoursEditor
                            value={formData.businessHours}
                            onChange={hours => setFormData(prev => ({ ...prev, businessHours: hours }))}
                            title="Your Business Hours"
                        />
                    </TabsContent>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Business Overview</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormInput label="Business Name" name="name" value={formData.name} onChange={handleInputChange} required />
                                <FormInput label="Tagline / Catchphrase" name="tagline" value={formData.tagline} onChange={handleInputChange} placeholder="e.g. Quality service you can trust" />
                                <div className="md:col-span-2">
                                    <FormTextarea label="Business Description" name="description" value={formData.description} onChange={handleInputChange} className="min-h-[160px]" placeholder="Describe your business, services, and history..." />
                                </div>
                                <FormInput label="Year Established" name="yearEstablished" type="number" value={formData.yearEstablished} onChange={handleInputChange} placeholder="e.g. 2010" />
                                <FormInput label="Number of Employees" name="employeeCount" type="number" value={formData.employeeCount} onChange={handleInputChange} placeholder="e.g. 50" />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Categories Tab */}
                    <TabsContent value="categories" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                         <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Classification & Tags</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormSelect 
                                    label="Primary Category" 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={handleInputChange} 
                                    options={categories.map(c => ({ value: c.name, label: c.name }))} 
                                />
                                <FormInput label="Sub-Category" name="subCategory" value={formData.subCategory} onChange={handleInputChange} placeholder="Specific niche..." />
                            </div>
                            
                            <div className="space-y-4 pt-4">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Keywords & Search Tags</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-xs font-bold transition-all hover:bg-indigo-100 group">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="p-0.5 hover:bg-indigo-200 rounded-md">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.tags.length === 0 && <p className="text-xs text-slate-400 italic">No tags added yet. Add some keywords to improve searchability.</p>}
                                </div>
                                <div className="flex gap-2 max-w-md">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Add keyword (hit Enter)..."
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={handleAddTag}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={handleAddTag} className="rounded-xl h-10">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Location Tab */}
                    <TabsContent value="location" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Store Location</h2>
                            </div>
                            <LocationSelector
                                value={{
                                    country_id: formData.country_id,
                                    state_id: formData.state_id,
                                    city_id: formData.city_id,
                                    area_id: formData.area_id
                                }}
                                onChange={(loc) => setFormData(prev => ({ ...prev, ...loc }))}
                                required
                            />
                            <FormInput label="Street Address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Building, Street, Landmark" />
                            
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">Map Placement & Service Area</h3>
                                    <p className="text-xs text-slate-500 mb-6">Pin your exact coordinates and define your business coverage zone.</p>
                                </div>
                                <div className="aspect-video w-full rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-inner ring-1 ring-slate-200">
                                    <MapPicker 
                                        center={[formData.latitude || 20.5937, formData.longitude || 78.9629]}
                                        marker={{ lat: formData.latitude, lng: formData.longitude }}
                                        onMarkerPositionChange={(pos) => setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))}
                                        serviceRadius={formData.serviceRadius}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Service Coverage Radius (km)</label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                step="1"
                                                name="serviceRadius"
                                                value={formData.serviceRadius || 0}
                                                onChange={handleInputChange}
                                                className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="w-16 p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-center font-bold text-indigo-700">
                                                {formData.serviceRadius || 0}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">Use the slider to define how far from your location you provide services.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Latitude</label>
                                            <span className="text-sm font-mono font-bold text-slate-700">{formData.latitude?.toFixed(6) || "Tap on map"}</span>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Longitude</label>
                                            <span className="text-sm font-mono font-bold text-slate-700">{formData.longitude?.toFixed(6) || "Tap on map"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Media Tab */}
                    <TabsContent value="media" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <MediaManager 
                            images={formData.images} 
                            videos={formData.videos} 
                            logo={formData.logo}
                            coverPhotoUrl={formData.coverPhotoUrl}
                            onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                        />
                    </TabsContent>

                    {/* Contact & Social Tab */}
                    <TabsContent value="contact" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Contact Links */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Connect Points</h2>
                                </div>
                                <div className="space-y-6">
                                    <FormInput label="Primary Phone" name="phone" icon={<Phone className="w-4 h-4" />} value={formData.phone} onChange={handleInputChange} />
                                    <FormInput label="Public Email" name="email" icon={<Mail className="w-4 h-4" />} value={formData.email} onChange={handleInputChange} />
                                    <FormInput label="Official Website" name="website" icon={<Globe className="w-4 h-4" />} value={formData.website} onChange={handleInputChange} placeholder="https://www.example.com" />
                                    <FormInput label="Booking / Menu URL" name="bookingUrl" icon={<LinkIcon className="w-4 h-4" />} value={formData.bookingUrl} onChange={handleInputChange} placeholder="https://linktree.com/business" />
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                        <Instagram className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Social Presence</h2>
                                </div>
                                <div className="space-y-6">
                                    <FormInput label="Instagram" name="social.instagram" icon={<Instagram className="w-4 h-4" />} value={formData.socialLinks.instagram} onChange={handleInputChange} placeholder="@yourbusiness" />
                                    <FormInput label="Facebook" name="social.facebook" icon={<Facebook className="w-4 h-4" />} value={formData.socialLinks.facebook} onChange={handleInputChange} placeholder="fb.me/yourbusiness" />
                                    <FormInput label="X / Twitter" name="social.twitter" icon={<Twitter className="w-4 h-4" />} value={formData.socialLinks.twitter} onChange={handleInputChange} placeholder="@yourbusiness" />
                                    <FormInput label="LinkedIn" name="social.linkedin" icon={<Linkedin className="w-4 h-4" />} value={formData.socialLinks.linkedin} onChange={handleInputChange} placeholder="linkedin.com/company/yourbusiness" />
                                    <FormInput label="YouTube" name="social.youtube" icon={<Youtube className="w-4 h-4" />} value={formData.socialLinks.youtube} onChange={handleInputChange} placeholder="youtube.com/c/yourbusiness" />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Additional Details Tab */}
                    <TabsContent value="features" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Payment Support</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {paymentOptions.map(opt => (
                                        <label key={opt} className={`flex items-center justify-center text-center p-3 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${formData.paymentMethods.includes(opt) ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold' : 'bg-white border-slate-100 text-slate-500 font-medium'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.paymentMethods.includes(opt)} onChange={() => handleArrayToggle('paymentMethods', opt)} />
                                            <span className="text-[11px] uppercase tracking-wide">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                    <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                                        <Languages className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Languages Spoken</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {languageOptions.map(opt => (
                                        <label key={opt} className={`flex items-center justify-center text-center p-3 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${formData.languages.includes(opt) ? 'bg-sky-50 border-sky-600 text-sky-700 font-bold' : 'bg-white border-slate-100 text-slate-500 font-medium'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.languages.includes(opt)} onChange={() => handleArrayToggle('languages', opt)} />
                                            <span className="text-[11px] uppercase tracking-wide">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
            
            {/* Sticky Save Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50 md:hidden flex gap-4">
                 <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    className="flex-1 h-12 rounded-xl"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    isLoading={isSaving}
                    className="flex-2 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
