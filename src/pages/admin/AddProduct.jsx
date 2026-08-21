import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import FormTextarea from '../../components/ui/FormTextarea';
import FormSelect from '../../components/ui/FormSelect';
import AdminHeader from '../../components/admin/AdminHeader';
import Alert from '../../components/ui/Alert';
import { toast } from 'react-hot-toast';

export default function AddProduct() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { user: currentUser } = useAuth();
    const isBrandOwner = currentUser && ['Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER'].includes(currentUser.role);
    const basePath = isBrandOwner ? '/brand' : '/admin';
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        description: '',
        warranty: '',
        listingId: currentUser?.companyId || currentUser?.company || '',
        categoryId: '',
        subCategoryId: '',
        price: '',
        discountPrice: '',
        sku: '',
        stock: '0',
        status: 'Draft',
        metaTitle: '',
        metaDescription: ''
    });

    const [highlights, setHighlights] = useState([{ key: '', value: '' }]);
    const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);

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

    useEffect(() => {
        fetchListings();
        fetchCategories();
        if (isEditMode) {
            fetchProductDetails();
        } else if (currentUser) {
            const userCompanyId = currentUser.companyId || currentUser.company;
            if (userCompanyId) {
                setFormData(prev => ({ ...prev, listingId: userCompanyId }));
            }
        }
    }, [id, currentUser]);

    const fetchProductDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetchWithAuth(getApiUrl(`products/${id}`));
            const responseData = await res.json();
            if (res.ok) {
                const data = responseData.data || responseData; // Handle nested 'data' object
                setFormData({
                    name: data.name || '',
                    slug: data.slug || '',
                    shortDescription: data.shortDescription || '',
                    description: data.description || '',
                    warranty: data.warranty || '',
                    listingId: data.listingId?._id || data.listingId || '',
                    categoryId: data.categoryId?._id || data.categoryId || '',
                    subCategoryId: data.subCategoryId?._id || data.subCategoryId || '',
                    price: data.price ? String(data.price) : '',
                    discountPrice: data.discountPrice ? String(data.discountPrice) : '',
                    sku: data.sku || '',
                    stock: data.stock !== undefined ? String(data.stock) : '0',
                    status: data.status || 'Draft',
                    metaTitle: data.metaTitle || '',
                    metaDescription: data.metaDescription || ''
                });
                let initialHighlights = [{ key: '', value: '' }];
                if (data.highlights) {
                    try {
                        const parsed = JSON.parse(data.highlights);
                        if (Array.isArray(parsed)) {
                            initialHighlights = parsed;
                        } else {
                            initialHighlights = [{ key: 'Highlight', value: data.highlights }];
                        }
                    } catch (e) {
                        initialHighlights = [{ key: 'Highlight', value: data.highlights }];
                    }
                }
                setHighlights(initialHighlights);

                // Specifications are stored as an array of { key, value }; tolerate legacy
                // JSON-string rows written before the field became a real subdocument array.
                let initialSpecs = [{ key: '', value: '' }];
                if (Array.isArray(data.specifications) && data.specifications.length) {
                    initialSpecs = data.specifications.map(s => ({ key: s.key || '', value: s.value || '' }));
                } else if (typeof data.specifications === 'string' && data.specifications.trim()) {
                    try {
                        const parsed = JSON.parse(data.specifications);
                        initialSpecs = Array.isArray(parsed) && parsed.length
                            ? parsed.map(s => ({ key: s.key || '', value: s.value || '' }))
                            : [{ key: 'Specification', value: data.specifications }];
                    } catch {
                        initialSpecs = [{ key: 'Specification', value: data.specifications }];
                    }
                }
                setSpecifications(initialSpecs);

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

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.listingId) newErrors.listingId = 'Parent business listing is required';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
        if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
        if (existingImageUrls.length === 0 && newImages.length === 0) newErrors.images = 'At least 1 product image is required';
        
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

            // Filter out empty key/value pairs
            const activeHighlights = highlights.filter(hl => hl.key.trim() || hl.value.trim());
            const activeSpecifications = specifications
                .filter(sp => sp.key.trim() || sp.value.trim())
                .map(sp => ({ key: sp.key.trim(), value: sp.value.trim() }));
            const payload = {
                ...formData,
                highlights: JSON.stringify(activeHighlights),
                specifications: activeSpecifications,
                status: submitStatus,
                images: uploadedImageUrls,
                price: Number(formData.price),
                discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
                stock: Number(formData.stock)
            };

            const endpoint = isEditMode ? `products/${id}` : 'products';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetchWithAuth(getApiUrl(endpoint), {
                method,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(isEditMode ? 'Product updated successfully' : 'Product added successfully');
                navigate(`${basePath}/products`);
            } else {
                setErrors({ submit: data.error || data.msg || 'Failed to update product' });
            }
        } catch (error) {
            setErrors({ submit: 'An unexpected error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-10 text-center">Loading product data...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <AdminHeader 
                title={isEditMode ? 'Edit Product' : 'Add New Product'}
                subtitle={isEditMode ? 'Update existing product' : 'Create a new product tied to a business listing'}
                badge={
                    <button onClick={() => navigate(`${basePath}/products`)} className="mb-4 p-2 hover:bg-slate-100 rounded-full transition-colors inline-block">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleSubmit('Draft')}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        >
                            Save Draft
                        </button>
                        <button 
                            onClick={() => handleSubmit('Active')}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSubmitting ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Product' : 'Publish')}
                        </button>
                    </div>
                }
            />

            {errors.submit && (
                <Alert type="error" onClose={() => setErrors(prev => ({ ...prev, submit: null }))}>
                    {errors.submit}
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Product Information</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormInput 
                                label="Product Name"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                                error={errors.name}
                                placeholder="e.g. Samsung Galaxy S23"
                            />
                            
                            <FormTextarea 
                                label="Short Description"
                                value={formData.shortDescription}
                                onChange={e => setFormData({...formData, shortDescription: e.target.value})}
                                rows={2}
                                placeholder="Brief summary of the product"
                            />

                            <FormTextarea 
                                label="Product Description"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                rows={5}
                                placeholder="Detailed product descriptions..."
                            />

                            {/* Product Highlights Key-Value Editor */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700">Product Highlights</label>
                                <div className="space-y-2">
                                    {highlights.map((hl, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <input 
                                                type="text"
                                                value={hl.key}
                                                onChange={e => {
                                                    const updated = [...highlights];
                                                    updated[idx].key = e.target.value;
                                                    setHighlights(updated);
                                                }}
                                                placeholder="Label (e.g. Brand, Material)"
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
                                            />
                                            <input 
                                                type="text"
                                                value={hl.value}
                                                onChange={e => {
                                                    const updated = [...highlights];
                                                    updated[idx].value = e.target.value;
                                                    setHighlights(updated);
                                                }}
                                                placeholder="Value (e.g. Samsung, Steel)"
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
                                            />
                                            {highlights.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = highlights.filter((_, i) => i !== idx);
                                                        setHighlights(updated);
                                                    }}
                                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHighlights([...highlights, { key: '', value: '' }])}
                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-colors mt-2"
                                >
                                    + Add New Highlight
                                </button>
                            </div>

                            {/* Product Specifications Key-Value Editor */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700">Product Specifications</label>
                                <p className="text-xs text-slate-500 -mt-1">
                                    Add any technical parameters for this product — Power, Capacity, Application, Frequency, Dimensions, and so on. Leave blank if not applicable.
                                </p>
                                <div className="space-y-2">
                                    {specifications.map((sp, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={sp.key}
                                                onChange={e => {
                                                    const updated = [...specifications];
                                                    updated[idx] = { ...updated[idx], key: e.target.value };
                                                    setSpecifications(updated);
                                                }}
                                                placeholder="Parameter (e.g. Power, Capacity)"
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
                                            />
                                            <input
                                                type="text"
                                                value={sp.value}
                                                onChange={e => {
                                                    const updated = [...specifications];
                                                    updated[idx] = { ...updated[idx], value: e.target.value };
                                                    setSpecifications(updated);
                                                }}
                                                placeholder="Value (e.g. 7.5 kW, 500 L)"
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
                                            />
                                            {specifications.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSpecifications(specifications.filter((_, i) => i !== idx))}
                                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSpecifications([...specifications, { key: '', value: '' }])}
                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-colors mt-2"
                                >
                                    + Add New Specification
                                </button>
                            </div>

                            {/* Warranty: free-text, no default. Chips only pre-fill the field. */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700">Warranty</label>
                                <p className="text-xs text-slate-500 -mt-1">
                                    Enter this product's warranty terms in your own words. Leave blank if no warranty applies — nothing will be shown on the product page.
                                </p>
                                <input
                                    type="text"
                                    value={formData.warranty}
                                    onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                                    placeholder="e.g. 1 Year on motor, 6 Months on spare parts"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {['6 Months', '1 Year', '2 Years', 'No Warranty'].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                warranty: formData.warranty === opt ? '' : opt
                                            })}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                formData.warranty === opt
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                    {formData.warranty && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, warranty: '' })}
                                            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
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
                                    <span className="text-sm text-slate-500 mb-1">SVG, PNG, JPG or GIF (Max 5MB)</span>
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
                            <h2 className="font-semibold text-slate-800">Pricing</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput 
                                label="Base Price"
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                required
                                error={errors.price}
                                placeholder="0.00"
                            />
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

                {/* Sidebar Details */}
                <div className="space-y-6">
                    {/* Organization / Parents */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Organization & Tie-ins</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormSelect 
                                label="Parent Listing"
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

                    {/* Inventory */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                            <h2 className="font-semibold text-slate-800">Inventory</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <FormInput 
                                label="SKU"
                                value={formData.sku}
                                onChange={e => setFormData({...formData, sku: e.target.value})}
                                required
                                error={errors.sku}
                                placeholder="e.g. PROD-123"
                            />
                            <FormInput 
                                label="Stock Quantity"
                                type="number"
                                value={formData.stock}
                                onChange={e => setFormData({...formData, stock: e.target.value})}
                                min="0"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
