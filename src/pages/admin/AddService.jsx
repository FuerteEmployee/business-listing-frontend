import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle2, Save } from 'lucide-react';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import FormTextarea from '../../components/ui/FormTextarea';
import FormSelect from '../../components/ui/FormSelect';
import { Button } from '../../components/ui/button';
import Alert from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Loading';
import AdminHeader from '../../components/admin/AdminHeader';

export default function AddService() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { user: currentUser } = useAuth();
    const isBrandOwner = currentUser?.role === 'Brand Owner' || currentUser?.role === 'Company Owner';
    const basePath = isBrandOwner ? '/brand' : '/admin';
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        description: '',
        listingId: '',
        categoryId: '',
        subCategoryId: '',
        
        priceType: 'fixed',
        price: '',
        hourlyRate: '',
        discountPrice: '',
        
        duration: '',
        slotDuration: '',
        maxBookingsPerSlot: '1',
        
        serviceArea: {
            city: '',
            state: '',
            radius: ''
        },
        
        availability: {
            days: [],
            startTime: '09:00',
            endTime: '18:00'
        },

        status: 'Draft'
    });

    // Image State
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newImageUrls, setNewImageUrls] = useState([]);
    
    // Dropdown Data
    const [listings, setListings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    
    // UI State
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);

    const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchListings();
        fetchCategories();
        if (isEditMode) {
            fetchServiceDetails();
        }
    }, [id]);

    const fetchServiceDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetchWithAuth(getApiUrl(`services/${id}`));
            const responseData = await res.json();
            if (res.ok) {
                const data = responseData.data || responseData; // Handle nested 'data' object
                setFormData({
                    name: data.name || '',
                    slug: data.slug || '',
                    shortDescription: data.shortDescription || '',
                    description: data.description || '',
                    listingId: data.listingId?._id || data.listingId || '',
                    categoryId: data.categoryId?._id || data.categoryId || '',
                    subCategoryId: data.subCategoryId?._id || data.subCategoryId || '',
                    
                    priceType: data.priceType || 'fixed',
                    price: data.price ? String(data.price) : '',
                    hourlyRate: data.hourlyRate ? String(data.hourlyRate) : '',
                    discountPrice: data.discountPrice ? String(data.discountPrice) : '',
                    
                    duration: data.duration ? String(data.duration) : '',
                    slotDuration: data.slotDuration ? String(data.slotDuration) : '',
                    maxBookingsPerSlot: data.maxBookingsPerSlot ? String(data.maxBookingsPerSlot) : '1',
                    
                    serviceArea: {
                        city: data.serviceArea?.city || '',
                        state: data.serviceArea?.state || '',
                        radius: data.serviceArea?.radius ? String(data.serviceArea?.radius) : ''
                    },
                    
                    availability: {
                        days: data.availability?.days || [],
                        startTime: data.availability?.startTime || '09:00',
                        endTime: data.availability?.endTime || '18:00'
                    },
                    status: data.status || 'Draft'
                });
                if (data.categoryId) {
                    const catId = data.categoryId?._id || data.categoryId;
                    const subRes = await fetchWithAuth(getApiUrl(`categories?parentId=${catId}`));
                    const subData = await subRes.json();
                    if (subRes.ok) setSubCategories(subData);
                }
                if (data.images && Array.isArray(data.images)) {
                    setExistingImageUrls(data.images);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchListings = async () => {
        try {
            const url = isBrandOwner ? getApiUrl('companies?owned=true&limit=100') : getApiUrl('companies?limit=100');
            const res = await fetchWithAuth(url);
            const data = await res.json();
            const listingsArray = Array.isArray(data) ? data : (data.data || []);
            if (res.ok) {
                setListings(listingsArray);
                // Pre-select if only one brand exists for Brand Owner
                if (isBrandOwner && listingsArray.length === 1 && !isEditMode) {
                    setFormData(prev => ({ ...prev, listingId: listingsArray[0]._id }));
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetchWithAuth(getApiUrl('categories?parentId=null'));
            const data = await res.json();
            if (res.ok) setCategories(data);
        } catch (err) { console.error(err); }
    };

    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setFormData({ ...formData, categoryId: catId, subCategoryId: '' });
        
        if (catId) {
            try {
                const res = await fetchWithAuth(getApiUrl(`categories?parentId=${catId}`));
                const data = await res.json();
                if (res.ok) setSubCategories(data);
            } catch (err) { console.error(err); }
        } else {
            setSubCategories([]);
        }
    };

    const handleDayToggle = (day) => {
        setFormData(prev => {
            const days = prev.availability.days.includes(day)
                ? prev.availability.days.filter(d => d !== day)
                : [...prev.availability.days, day];
            return { ...prev, availability: { ...prev.availability, days } };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Service name is required';
        if (!formData.listingId) newErrors.listingId = 'Parent business listing is required';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        
        if (formData.priceType === 'fixed' && (!formData.price || Number(formData.price) <= 0)) {
            newErrors.price = 'Fixed price is required and must be > 0';
        }
        if (formData.priceType === 'hourly' && (!formData.hourlyRate || Number(formData.hourlyRate) <= 0)) {
            newErrors.hourlyRate = 'Hourly rate is required and must be > 0';
        }

        if (existingImageUrls.length === 0 && newImages.length === 0) {
            newErrors.images = 'At least 1 service image is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(prev => [...prev, ...files]);
        
        const newUrls = files.map(file => URL.createObjectURL(file));
        setNewImageUrls(prev => [...prev, ...newUrls]);
    };

    const removeExistingImage = (index) => {
        setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (submitStatus) => {
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);
        try {
            const uploadedImageUrls = [...existingImageUrls];
            
            for (const file of newImages) {
                const imgData = new FormData();
                imgData.append('image', file);
                
                const uploadRes = await fetchWithAuth(getApiUrl('upload'), {
                    method: 'POST',
                    body: imgData,
                });
                
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    uploadedImageUrls.push(data.url);
                }
            }

            const payload = {
                ...formData,
                status: submitStatus,
                images: uploadedImageUrls,
                price: formData.price ? Number(formData.price) : undefined,
                hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
                discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
                duration: formData.duration ? Number(formData.duration) : undefined,
                slotDuration: formData.slotDuration ? Number(formData.slotDuration) : undefined,
                maxBookingsPerSlot: Number(formData.maxBookingsPerSlot),
                serviceArea: {
                    ...formData.serviceArea,
                    radius: formData.serviceArea.radius ? Number(formData.serviceArea.radius) : undefined
                }
            };

            const endpoint = isEditMode ? `services/${id}` : 'services';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetchWithAuth(getApiUrl(endpoint), {
                method,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                navigate(`${basePath}/services`);
            } else {
                setErrors({ submit: data.error || data.msg || 'Failed to update service' });
            }
        } catch (error) {
            setErrors({ submit: 'An unexpected error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner label="Loading service data..." />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <AdminHeader 
                title={isEditMode ? 'Edit Service' : 'Add New Service'}
                subtitle={isEditMode ? 'Update existing service' : 'Create a new service offering tied to a business listing'}
                badge={
                    <button onClick={() => navigate(`${basePath}/services`)} className="mb-4 p-2 hover:bg-slate-100 rounded-full transition-colors inline-block">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit('Draft')}
                            isLoading={isSubmitting}
                            leftIcon={Save}
                        >
                            Save Draft
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => handleSubmit('Active')}
                            isLoading={isSubmitting}
                            leftIcon={CheckCircle2}
                        >
                            {isEditMode ? 'Update Service' : 'Publish Service'}
                        </Button>
                    </div>
                }
            />

            {errors.submit && <Alert type="error">{errors.submit}</Alert>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Service Information</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormInput 
                                label="Service Name"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                                error={errors.name}
                                placeholder="e.g. Premium Home Cleaning"
                            />
                            
                            <FormTextarea 
                                label="Short Description"
                                value={formData.shortDescription}
                                onChange={e => setFormData({...formData, shortDescription: e.target.value})}
                                rows={2}
                                placeholder="Brief summary of the service"
                            />

                            <FormTextarea 
                                label="Full Description"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                rows={5}
                                placeholder="Detailed service descriptions and terms..."
                            />
                        </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Media *</h2>
                        </div>
                        <div className="p-6">
                            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${errors.images ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden" 
                                    id="image-upload" 
                                />
                                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium text-indigo-600 mb-1">Click to upload images</span>
                                    <span className="text-sm text-slate-500 mb-1">Showcase past work or service locations (Max 5MB)</span>
                                    <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">Recomanded: 400x400px (1:1 Ratio)</span>
                                </label>
                            </div>
                            {errors.images && <p className="text-red-500 text-xs mt-2">{errors.images}</p>}

                            {/* Image Previews */}
                            {(existingImageUrls.length > 0 || newImageUrls.length > 0) && (
                                <div className="grid grid-cols-4 gap-4 mt-6">
                                    {existingImageUrls.map((url, index) => (
                                        <div key={`existing-${index}`} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group">
                                            <img src={url} alt="Stored preview" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {newImageUrls.map((url, index) => (
                                        <div key={`new-${index}`} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group">
                                            <img src={url} alt="New preview" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Pricing Strategy</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormSelect 
                                label="Pricing Model"
                                value={formData.priceType}
                                onChange={e => setFormData({...formData, priceType: e.target.value})}
                                required
                                options={[
                                    { label: 'Fixed Price', value: 'fixed' },
                                    { label: 'Hourly Rate', value: 'hourly' },
                                    { label: 'Starting Price / Range', value: 'range' }
                                ]}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(formData.priceType === 'fixed' || formData.priceType === 'range') && (
                                    <FormInput 
                                        label={formData.priceType === 'range' ? 'Starting Price' : 'Price'}
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                        required
                                        error={errors.price}
                                        placeholder="0.00"
                                    />
                                )}

                                {formData.priceType === 'hourly' && (
                                    <FormInput 
                                        label="Hourly Rate"
                                        type="number"
                                        value={formData.hourlyRate}
                                        onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
                                        required
                                        error={errors.hourlyRate}
                                        placeholder="0.00 / hr"
                                    />
                                )}

                                <FormInput 
                                    label="Discount Price"
                                    type="number"
                                    value={formData.discountPrice}
                                    onChange={e => setFormData({...formData, discountPrice: e.target.value})}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Booking Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Booking Settings</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput 
                                label="Est. Duration (mins)"
                                type="number"
                                value={formData.duration}
                                onChange={e => setFormData({...formData, duration: e.target.value})}
                                placeholder="e.g. 60"
                            />
                            <FormInput 
                                label="Slot Length (mins)"
                                type="number"
                                value={formData.slotDuration}
                                onChange={e => setFormData({...formData, slotDuration: e.target.value})}
                                placeholder="e.g. 30"
                            />
                            <FormInput 
                                label="Max Bookings/Slot"
                                type="number"
                                value={formData.maxBookingsPerSlot}
                                onChange={e => setFormData({...formData, maxBookingsPerSlot: e.target.value})}
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    {/* Organization / Parents */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Organization</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormSelect 
                                label="Parent Listing (Provider)"
                                value={formData.listingId}
                                onChange={e => setFormData({...formData, listingId: e.target.value})}
                                required
                                error={errors.listingId}
                                options={listings.map(l => ({ label: l.name, value: l._id }))}
                                placeholder="Select Business Listing..."
                            />

                            <FormSelect 
                                label="Category"
                                value={formData.categoryId}
                                onChange={handleCategoryChange}
                                required
                                error={errors.categoryId}
                                options={categories.map(c => ({ label: c.name, value: c._id }))}
                                placeholder="Select Category..."
                            />

                            {subCategories.length > 0 && (
                                <FormSelect 
                                    label="Subcategory"
                                    value={formData.subCategoryId}
                                    onChange={e => setFormData({...formData, subCategoryId: e.target.value})}
                                    options={subCategories.map(c => ({ label: c.name, value: c._id }))}
                                    placeholder="Select Subcategory..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Service Area */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Service Area</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormInput 
                                label="City"
                                value={formData.serviceArea.city}
                                onChange={e => setFormData({...formData, serviceArea: {...formData.serviceArea, city: e.target.value}})}
                                placeholder="e.g. New York"
                            />
                            <FormInput 
                                label="Service Radius (km)"
                                type="number"
                                value={formData.serviceArea.radius}
                                onChange={e => setFormData({...formData, serviceArea: {...formData.serviceArea, radius: e.target.value}})}
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Availability</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Working Days</label>
                                <div className="space-y-2">
                                    {DAY_OPTIONS.map(day => (
                                        <label key={day} className="flex items-center gap-2 text-sm text-slate-600">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.availability.days.includes(day)}
                                                onChange={() => handleDayToggle(day)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput 
                                    label="Start Time"
                                    type="time"
                                    value={formData.availability.startTime}
                                    onChange={e => setFormData({...formData, availability: {...formData.availability, startTime: e.target.value}})}
                                />
                                <FormInput 
                                    label="End Time"
                                    type="time"
                                    value={formData.availability.endTime}
                                    onChange={e => setFormData({...formData, availability: {...formData.availability, endTime: e.target.value}})}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
