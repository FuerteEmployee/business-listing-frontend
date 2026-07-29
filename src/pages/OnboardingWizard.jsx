import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
    Building2, MapPin, Phone, Mail, Globe, Info, 
    ChevronRight, CheckCircle2, Loader2, ArrowLeft, 
    ImageIcon, ShieldCheck, Zap, Clock, FileText
} from "lucide-react";
import Header from "../components/homepage/Header";
import Footer from "../components/homepage/Footer";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import FormTextarea from "../components/ui/FormTextarea";
import ImageUploadBox from "../components/ui/ImageUploadBox";
import LocationSelector from "../components/location/LocationSelector";
import MapPicker from "../components/location/MapPicker";
import { API_BASE_URL, fetchWithAuth, getApiUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { saveDraft, getDraft, clearDraft } from "../utils/DraftManager";

export default function FreeListing() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [formStep, setFormStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    const [formData, setFormData] = useState(() => {
        const draft = getDraft();
        return draft || {
            name: "",
            category: "",
            category_id: "",
            subCategory: "",
            description: "",
            gstPan: "",
            country_id: "",
            state_id: "",
            city_id: "",
            area_id: "",
            latitude: null,
            longitude: null,
            manualCountry: "",
            manualCountryCode: "",
            manualState: "",
            manualCity: "",
            manualArea: "",
            address: "",
            phone: "",
            whatsapp: "",
            email: "",
            website: "",
            image: null,
            businessHours: {
                monday: { open: "09:00", close: "21:00", closed: false },
                tuesday: { open: "09:00", close: "21:00", closed: false },
                wednesday: { open: "09:00", close: "21:00", closed: false },
                thursday: { open: "09:00", close: "21:00", closed: false },
                friday: { open: "09:00", close: "21:00", closed: false },
                saturday: { open: "09:00", close: "21:00", closed: false },
                sunday: { open: "09:00", close: "21:00", closed: true }
            },
            status: "Pending" // Multi-step onboarding starts as pending
        };
    });

    useEffect(() => {
        saveDraft(formData);
    }, [formData]);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${getApiUrl('categories')}`);
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const fetchSubcategories = async (parentId) => {
        if (!parentId) return setSubCategories([]);
        try {
            const res = await fetch(`${getApiUrl('categories')}?parent=${parentId}`);
            if (res.ok) {
                const data = await res.json();
                setSubCategories(data);
            }
        } catch (err) {
            console.error("Failed to fetch subcategories:", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const selectedCat = categories.find(c => c.name === value);
            setFormData(prev => ({ 
                ...prev, 
                category: value, 
                category_id: selectedCat?._id || "",
                subCategory: "" 
            }));
            fetchSubcategories(selectedCat?._id);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLocationChange = (updatedData) => {
        setFormData(prev => ({ ...prev, ...updatedData }));
    };

    const handleMapChange = ({ lat, lng }) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            let imageUrl = null;
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                const uploadRes = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });
                const uploadResult = await uploadRes.json();
                if (uploadRes.ok) {
                    imageUrl = uploadResult.url;
                }
            }

            const submissionUrl = `${API_BASE_URL}/companies`;
            const res = await fetch(submissionUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify({ ...formData, image: imageUrl, onboardingComplete: true })
            });

            if (res.ok) {
                clearDraft();
                setSubmitted(true);
                window.scrollTo(0, 0);
            } else {
                const data = await res.json();
                setError(data.msg || "Failed to submit listing. Please try again.");
            }
        } catch (err) {
            setError("A network error occurred. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-slate-200 border border-slate-100 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4">Onboarding Complete!</h1>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Your business listing has been submitted for review. You'll receive a confirmation email shortly.
                        </p>
                        <div className="space-y-3">
                            <Link to="/brand/dashboard" className="block w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                Go to Merchant Dashboard
                            </Link>
                            <Link to="/" className="block w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            
            <main className="flex-1 py-12 md:py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header Info */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Merchant Onboarding</h1>
                            <p className="text-slate-500 text-sm">Step {formStep} of 5: {
                                formStep === 1 ? "Business Identity" :
                                formStep === 2 ? "Location & Map" :
                                formStep === 3 ? "Contact Details" :
                                formStep === 4 ? "Business Hours" : "Media & Photos"
                            }</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Free Forever</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8 overflow-hidden bg-slate-200 h-1.5 rounded-full">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                            style={{ width: `${(formStep / 5) * 100}%` }}
                        ></div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden lg:grid lg:grid-cols-5">
                        {/* Sidebar Info */}
                        <div className="hidden lg:block lg:col-span-2 bg-slate-900 p-10 text-white relative">
                            <div className="relative z-10 space-y-10">
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-black mb-2 leading-tight">Create Your Professional Profile</h2>
                                    <p className="text-slate-400 text-sm italic leading-relaxed">
                                        {formStep === 1 && "Start with the basics. Your business name and category help customers find you easily."}
                                        {formStep === 2 && "Pin your exact location so customers can navigate to your store with one tap."}
                                        {formStep === 3 && "Make it easy for customers to reach out. Verified contacts get 3x more bookings."}
                                        {formStep === 4 && "Set your operating hours so customers know when to visit or call."}
                                        {formStep === 5 && "High-quality photos increase engagement by up to 60%. Show your best side!"}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { step: 1, label: 'Business Identity', icon: Building2 },
                                        { step: 2, label: 'Location & Map', icon: MapPin },
                                        { step: 3, label: 'Contact Details', icon: Phone },
                                        { step: 4, label: 'Business Hours', icon: Clock },
                                        { step: 5, label: 'Media & Photos', icon: ImageIcon }
                                    ].map((s) => (
                                        <div key={s.step} className="flex items-center gap-4 group">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                formStep === s.step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-110' : 
                                                formStep > s.step ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                                            }`}>
                                                {formStep > s.step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-black uppercase tracking-widest ${formStep === s.step ? 'text-white' : 'text-slate-500'}`}>Step {s.step}</span>
                                                <span className={`text-sm font-bold ${formStep === s.step ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="pt-10">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-xs text-slate-400 mb-3">NEED HELP?</p>
                                        <p className="text-sm font-medium">Chat with our onboarding experts at <span className="text-indigo-400">support@platform.com</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="lg:col-span-3 p-8 md:p-10 flex flex-col min-h-[600px]">
                            {error && (
                                <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <Info className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <div className="flex-1 space-y-8">
                                {formStep === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                            <Building2 className="w-6 h-6 text-indigo-600" />
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">Identity & Category</h3>
                                                <p className="text-xs text-slate-500">How do customers recognize you?</p>
                                            </div>
                                        </div>
                                        <FormInput label="Business Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Blue Heavens Spa" />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormSelect 
                                                label="Primary Category" 
                                                name="category" 
                                                value={formData.category} 
                                                options={categories.map(cat => ({ label: cat.name, value: cat.name }))} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                            <FormSelect 
                                                label="Subcategory" 
                                                name="subCategory" 
                                                value={formData.subCategory} 
                                                options={subCategories.map(cat => ({ label: cat.name, value: cat.name }))} 
                                                onChange={handleChange} 
                                                disabled={!formData.category}
                                            />
                                        </div>

                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Compliance (Optional)</h4>
                                            </div>
                                            <FormInput label="GST or PAN Number" name="gstPan" value={formData.gstPan} onChange={handleChange} placeholder="Required for verified badge" />
                                        </div>

                                        <FormTextarea label="Business Description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Tell customers what makes you special..." />
                                    </div>
                                )}

                                {formStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                            <MapPin className="w-6 h-6 text-indigo-600" />
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">Address & Location</h3>
                                                <p className="text-xs text-slate-500">Where can people find you?</p>
                                            </div>
                                        </div>
                                        <LocationSelector
                                            onChange={handleLocationChange}
                                            value={{ 
                                                country_id: formData.country_id, 
                                                state_id: formData.state_id, 
                                                city_id: formData.city_id, 
                                                area_id: formData.area_id,
                                                manualCountry: formData.manualCountry,
                                                manualCountryCode: formData.manualCountryCode,
                                                manualState: formData.manualState,
                                                manualCity: formData.manualCity,
                                                manualArea: formData.manualArea 
                                            }}
                                        />
                                        <FormInput label="Street Address / Landmark" name="address" value={formData.address} onChange={handleChange} placeholder="e.g. 123 Business Park, Near Station" />
                                        
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-700">Pin precise location on map</p>
                                            <MapPicker 
                                                value={{ lat: formData.latitude, lng: formData.longitude }} 
                                                onChange={handleMapChange} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {formStep === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                            <Phone className="w-6 h-6 text-indigo-600" />
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">Reachability</h3>
                                                <p className="text-xs text-slate-500">How should customers contact you?</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput label="Primary Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="+91 98XXX XXX00" />
                                            <FormInput label="WhatsApp Number" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} placeholder="For instant bookings" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput label="Business Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="info@business.com" />
                                            <FormInput label="Website (Optional)" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://www.yoursite.com" />
                                        </div>
                                    </div>
                                )}

                                {formStep === 4 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-6 h-6 text-indigo-600" />
                                                <div>
                                                    <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">Operational Hours</h3>
                                                    <p className="text-xs text-slate-500">When are you open for business?</p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const mondayHours = formData.businessHours.monday;
                                                    const updatedHours = {};
                                                    Object.keys(formData.businessHours).forEach(day => {
                                                        updatedHours[day] = { ...mondayHours };
                                                    });
                                                    setFormData(prev => ({ ...prev, businessHours: updatedHours }));
                                                }}
                                                className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100"
                                            >
                                                Apply Mon to all
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {Object.entries(formData.businessHours).map(([day, hours]) => (
                                                <div key={day} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${hours.closed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}>
                                                    <span className="text-xs font-black text-slate-900 uppercase w-12">{day.slice(0, 3)}</span>
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="time" 
                                                            value={hours.open} 
                                                            disabled={hours.closed}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                businessHours: { ...prev.businessHours, [day]: { ...hours, open: e.target.value } }
                                                            }))}
                                                            className="bg-slate-50 border-none rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-slate-300">-</span>
                                                        <input 
                                                            type="time" 
                                                            value={hours.close} 
                                                            disabled={hours.closed}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                businessHours: { ...prev.businessHours, [day]: { ...hours, close: e.target.value } }
                                                            }))}
                                                            className="bg-slate-50 border-none rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={hours.closed}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                businessHours: { ...prev.businessHours, [day]: { ...hours, closed: e.target.checked } }
                                                            }))}
                                                            className="w-4 h-4 accent-indigo-600"
                                                        />
                                                        <span className="text-[10px] font-black text-slate-600 uppercase">Closed</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formStep === 5 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                            <ImageIcon className="w-6 h-6 text-indigo-600" />
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">Visual Branding</h3>
                                                <p className="text-xs text-slate-500">First impressions matter!</p>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                                            <ImageUploadBox label="Main Store Photo" onImageChange={handleImageChange} preview={imagePreview} />
                                            <p className="mt-4 text-xs text-slate-500">Supported: JPG, PNG, WEBP (Max 5MB)</p>
                                        </div>

                                        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                <ShieldCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 mb-1">Verification Tip</p>
                                                <p className="text-xs text-slate-600 leading-relaxed">Businesses with their storefront photo clearly visible get approved 40% faster by our moderation team.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-10 mt-auto flex gap-4">
                                {formStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setFormStep(prev => prev - 1)}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        Back
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={formStep === 5 ? handleSubmit : () => setFormStep(prev => prev + 1)}
                                    disabled={submitting}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 group"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (formStep === 5 ? "Submit & Register" : "Next Step")}
                                    {formStep < 5 && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

