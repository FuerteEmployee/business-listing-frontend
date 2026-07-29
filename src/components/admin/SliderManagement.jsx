import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, X, AlertTriangle, Save } from "lucide-react";
import ImageUploadBox from "../ui/ImageUploadBox";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import FormInput from "../ui/FormInput";
import FormTextarea from "../ui/FormTextarea";
import FormSelect from "../ui/FormSelect";

export default function SliderManagement() {
    const [sliders, setSliders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [sliderToDelete, setSliderToDelete] = useState(null);

    // Form state
    const defaultFormState = {
        title: "",
        description: "",
        image: null,
        link: "",
        status: "Active",
        order: 0
    };
    const [formData, setFormData] = useState(defaultFormState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formError, setFormError] = useState("");

    const fetchSliders = async () => {
        try {
            setIsLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/sliders`);
            const data = await res.json();
            if (res.ok) {
                setSliders(data.data);
            } else {
                setError(data.msg || "Failed to fetch sliders.");
            }
        } catch (err) {
            setError("Cannot connect to backend.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

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

    const openAddModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData(defaultFormState);
        setImageFile(null);
        setImagePreview(null);
        setFormError("");
        setIsModalOpen(true);
    };

    const openEditModal = (slider) => {
        setIsEditMode(true);
        setEditingId(slider._id);
        setFormData({
            title: slider.title || "",
            description: slider.description || "",
            image: slider.image,
            link: slider.link || "",
            status: slider.status,
            order: slider.order || 0
        });
        setImageFile(null);
        setImagePreview(slider.image);
        setFormError("");
        setIsModalOpen(true);
    };

    const confirmDelete = (slider) => {
        setSliderToDelete(slider);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/sliders/${sliderToDelete._id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setSliders(sliders.filter(s => s._id !== sliderToDelete._id));
                setIsDeleteModalOpen(false);
                setSliderToDelete(null);
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to delete slider.");
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        try {
            let imageUrl = formData.image;

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
                    setFormError(uploadResult.msg || 'Image upload failed.');
                    return;
                }

                setUploadProgress(100);
                await new Promise(r => setTimeout(r, 400));
                imageUrl = uploadResult.url;
                setIsUploading(false);
                setUploadProgress(0);
            }

            if (!imageUrl) {
                setFormError("Image is required.");
                return;
            }

            const payload = { ...formData, image: imageUrl };
            const url = isEditMode
                ? `${API_BASE_URL}/sliders/${editingId}`
                : `${API_BASE_URL}/sliders`;

            const res = await fetchWithAuth(url, {
                method: isEditMode ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                if (isEditMode) {
                    setSliders(sliders.map(s => s._id === editingId ? data.data : s));
                } else {
                    setSliders([data.data, ...sliders]);
                }
                setIsModalOpen(false);
            } else {
                setFormError(data.msg || 'Failed to save slider.');
            }
        } catch (err) {
            setFormError('Network error.');
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Slider Images</h3>
                    <p className="text-sm text-slate-500">Manage images that appear in the homepage hero slider.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Slider
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm italic">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Image</th>
                                <th className="px-6 py-4 font-semibold">Title/Description</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-center">Order</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading sliders...</td>
                                </tr>
                            ) : sliders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No sliders found. Click "Add Slider" to create one.</td>
                                </tr>
                            ) : (
                                sliders.map((slider) => (
                                    <tr key={slider._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-24 h-14 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
                                                <img src={slider.image} alt={slider.title} className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{slider.title || 'Untitled'}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{slider.description || 'No description'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                slider.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {slider.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-600">
                                            {slider.order}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(slider)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => confirmDelete(slider)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Slider Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {isEditMode ? "Edit Slider" : "Add New Slider"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {formError && (
                                <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> {formError}
                                </div>
                            )}
                            <form id="slider-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Slider Image *</label>
                                    <p className="text-[10px] text-slate-500 font-medium">Recommended size: 1200x400 pixels (3:1 aspect ratio) for best display.</p>
                                    <ImageUploadBox
                                        imagePreview={imagePreview}
                                        isUploading={isUploading}
                                        uploadProgress={uploadProgress}
                                        onImageChange={handleImageUpload}
                                        title="Upload Slider Image"
                                        subtitle="PNG, JPG max 5MB"
                                        imageSizeClass="w-full h-32 object-cover rounded-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <FormInput 
                                            label="Title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Slider headline"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormTextarea 
                                            label="Description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Brief description or subtitle"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormInput 
                                            label="Link URL"
                                            name="link"
                                            value={formData.link}
                                            onChange={handleInputChange}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <FormInput 
                                        label="Sort Order"
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleInputChange}
                                    />
                                    <FormSelect
                                        label="Status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        options={["Active", "Inactive"]}
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" form="slider-form" disabled={isUploading || isUploading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm flex items-center gap-2">
                                {isUploading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {isEditMode ? 'Update Slider' : 'Add Slider'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-6 pb-0 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Slider</h3>
                            <p className="text-sm text-slate-500">
                                Are you sure you want to delete this slider? This action cannot be undone.
                            </p>
                            {sliderToDelete?.image && (
                                <div className="mt-4 w-full h-20 rounded-lg overflow-hidden border border-slate-200">
                                    <img src={sliderToDelete.image} className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                        <div className="p-6 flex justify-center gap-3 w-full">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={executeDelete} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
