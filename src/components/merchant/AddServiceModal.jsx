import { useState, useEffect } from "react";
import { X, Package, Tag, Info, AlertCircle, Camera, Trash2, Calendar, Clock, DollarSign } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import ImageUploadBox from "../ui/ImageUploadBox";

export default function AddServiceModal({ isOpen, onClose, service, listingId, onSuccess }) {
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
        listingId: listingId
    });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (service) {
            setFormData({
                ...service,
                categoryId: service.categoryId?._id || service.categoryId || "",
                listingId: listingId
            });
            setImagePreview(service.images?.[0] || null);
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
                listingId: listingId
            });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [service, listingId, isOpen]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/categories`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCategories(data.filter(c => c.type === 'service' || !c.type));
                }
            } catch (err) { console.error(err); }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (['price', 'minPrice', 'maxPrice'].includes(name) && value !== '') {
            const num = parseFloat(value);
            if (num < 0) {
                setFormData(prev => ({ ...prev, [name]: '0' }));
                return;
            }
        }
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

            const url = service ? `${API_BASE_URL}/services/${service._id}` : `${API_BASE_URL}/services`;
            const method = service ? 'PUT' : 'POST';
            
            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, images: currentImages })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to save service.");
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
            title={service ? "Edit Service" : "Add New Service"}
            subtitle="Define your offering details and pricing"
            icon={Package}
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
                        title="Add Service Photo"
                        subtitle="Professional photos attract 3x more leads"
                        imageSizeClass="w-32 h-32 rounded-3xl"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput 
                        label="Service Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Premium Hair Styling"
                        required
                    />
                    <FormSelect 
                        label="Category"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        options={categories.map(c => ({ value: c._id, label: c.name }))}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormSelect 
                        label="Pricing Model"
                        name="priceType"
                        value={formData.priceType}
                        onChange={handleInputChange}
                        options={[
                            { value: "fixed", label: "Fixed Price" },
                            { value: "hourly", label: "Hourly Rate" },
                            { value: "range", label: "Price Range" }
                        ]}
                    />
                    
                    {formData.priceType !== 'range' ? (
                        <FormInput 
                            label="Price (₹)"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            icon={DollarSign}
                            required
                            min="0"
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
                                min="0"
                            />
                            <FormInput 
                                label="Max Price (₹)"
                                type="number"
                                name="maxPrice"
                                value={formData.maxPrice}
                                onChange={handleInputChange}
                                required
                                min="0"
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
                        placeholder="Explain what's included in this service..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading} className="px-8 font-black uppercase tracking-widest text-xs">
                        {service ? "Update Service" : "Add to Catalogue"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
