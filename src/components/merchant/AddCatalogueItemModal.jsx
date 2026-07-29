import { useState, useEffect } from "react";
import { X, Package, Tag, Info, AlertCircle, Camera, Trash2, Calendar, Clock, DollarSign, Box, Layers, BarChart3 } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import ImageUploadBox from "../ui/ImageUploadBox";

export default function AddCatalogueItemModal({ isOpen, onClose, item, type = "service", listingId, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        categoryId: "",
        priceType: "fixed",
        price: "",
        minPrice: "",
        maxPrice: "",
        images: [],
        status: "Active",
        listingId: listingId,
        // Product specific
        sku: "",
        stock: "",
        brandId: ""
    });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                categoryId: item.categoryId?._id || item.categoryId || "",
                listingId: listingId,
                sku: item.sku || "",
                stock: item.stock || "",
                brandId: item.brandId?._id || item.brandId || ""
            });
            setImagePreview(item.images?.[0] || null);
        } else {
            setFormData({
                name: "",
                description: "",
                categoryId: "",
                priceType: "fixed",
                price: "",
                minPrice: "",
                maxPrice: "",
                images: [],
                status: "Active",
                listingId: listingId,
                sku: "",
                stock: "",
                brandId: ""
            });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [item, listingId, isOpen]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/categories`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter based on type if needed, but often categories are shared
                    setCategories(data);
                }
            } catch (err) { console.error(err); }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setUploadProgress(0);

        try {
            let currentImages = [...(formData.images || [])];

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
                    setIsLoading(false);
                    return;
                }
                currentImages = [uploadResult.url];
                setUploadProgress(100);
            }

            const endpoint = type === "product" ? "products" : "services";
            const url = item ? `${API_BASE_URL}/${endpoint}/${item._id}` : `${API_BASE_URL}/${endpoint}`;
            const method = item ? 'PUT' : 'POST';
            
            // Clean up data before sending
            const submitData = { ...formData, images: currentImages };
            if (type === "service") {
                delete submitData.sku;
                delete submitData.stock;
                delete submitData.brandId;
            }

            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || `Failed to save ${type}.`);
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={item ? `Edit ${type}` : `Add New ${type}`}
            subtitle={`Define your ${type} details and pricing`}
            icon={type === "product" ? Box : Package}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="flex flex-col items-center mb-8 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                    <ImageUploadBox 
                        imagePreview={imagePreview}
                        isUploading={isLoading && imageFile}
                        uploadProgress={uploadProgress}
                        onImageChange={handleImageChange}
                        title={`Add ${type} Photo`}
                        subtitle="Professional photos attract 3x more leads"
                        imageSizeClass="w-32 h-32 rounded-3xl"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput 
                        label={`${type.charAt(0).toUpperCase() + type.slice(1)} Name`}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={`e.g. ${type === 'product' ? 'Modern Office Chair' : 'Premium Hair Styling'}`}
                        required
                    />
                    <FormSelect 
                        label="Category"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        options={categories.filter(c => c.type === type || !c.type).map(c => ({ value: c._id, label: c.name }))}
                        required
                    />
                </div>

                {type === "product" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput 
                            label="SKU / Model No"
                            name="sku"
                            value={formData.sku}
                            onChange={handleInputChange}
                            placeholder="e.g. FURN-001"
                            required
                        />
                        <FormInput 
                            label="Initial Stock"
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            placeholder="e.g. 100"
                            required
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormSelect 
                        label="Pricing Model"
                        name="priceType"
                        value={formData.priceType}
                        onChange={handleInputChange}
                        options={[
                            { value: "fixed", label: "Fixed Price" },
                            { value: "hourly", label: type === 'product' ? "N/A" : "Hourly Rate" },
                            { value: "range", label: "Price Range" }
                        ].filter(opt => opt.label !== "N/A")}
                    />
                    
                    {formData.priceType !== 'range' ? (
                        <FormInput 
                            label={`Price (₹)`}
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            icon={DollarSign}
                            required
                        />
                    ) : (
                        <>
                            <FormInput 
                                label="Min Price (₹)"
                                type="number"
                                name="minPrice"
                                value={formData.minPrice}
                                onChange={handleInputChange}
                                required
                            />
                            <FormInput 
                                label="Max Price (₹)"
                                type="number"
                                name="maxPrice"
                                value={formData.maxPrice}
                                onChange={handleInputChange}
                                required
                            />
                        </>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                    <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium h-32"
                        placeholder={`Explain details about this ${type}...`}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading} className="px-8 font-black uppercase tracking-widest text-xs">
                        {item ? `Update ${type}` : `Add to Catalogue`}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
