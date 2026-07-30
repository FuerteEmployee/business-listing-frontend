import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, AlertTriangle, ChevronRight, Home, ChevronLeft, Tag, Trash } from "lucide-react";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

import { useAuth } from "../../context/AuthContext";

export default function Categories() {
    const { user: currentUser } = useAuth();
    const isBrandOwner = currentUser && ['Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER'].includes(currentUser.role);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Edit & Delete tracking
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState('');
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [brands, setBrands] = useState([]); // Added for brand-specific category support

    // Navigation state
    const [currentParent, setCurrentParent] = useState(null); // The current category we are "inside"
    const [breadcrumbs, setBreadcrumbs] = useState([]); // Array of {id, name} objects

    // Fetch categories from Backend
    const fetchCategories = async (parentId = null) => {
        try {
            setIsLoading(true);
            setError(null);
            const url = `${API_BASE_URL}/categories?parentId=${parentId || 'null'}`;
            const res = await fetchWithAuth(url);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            } else {
                const errData = await res.json();
                setError(errData.msg || 'Failed to fetch categories.');
            }
        } catch (err) {
            setError('Cannot connect to backend.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(currentParent?._id);
    }, [currentParent]);

    const [allCategories, setAllCategories] = useState([]); // Used for parent selection dropdown
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/categories`); // No parentId filter
                if (res.ok) {
                    const data = await res.json();
                    const parents = data.filter(c => !c.parent);
                    const structured = [];
                    parents.forEach(p => {
                        structured.push(p);
                        const children = data.filter(c => c.parent === p._id);
                        children.forEach(c => {
                            structured.push({ ...c, name: `— ${c.name}` });
                        });
                    });
                    setAllCategories(structured);
                }
            } catch (err) { console.error("Error fetching all categories", err); }
        };
        if (isModalOpen) {
            fetchAll();
            if (isBrandOwner) {
                // Fetch brands for the owner so they can link categories to them
                const fetchBrands = async () => {
                    const res = await fetchWithAuth(`${API_BASE_URL}/companies`);
                    if (res.ok) setBrands(await res.json());
                };
                fetchBrands();
            }
        }
    }, [isModalOpen, isBrandOwner]);

    const defaultFormState = { name: "", slug: "", status: "Active", image: null, parent: "", brandId: "" };
    const [formData, setFormData] = useState(defaultFormState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from name if typing in name (only in Add mode)
        if (name === 'name' && !isEditMode) {
            setFormData(prev => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
        }
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
        setFormData({ ...defaultFormState, parent: currentParent?._id || "" });
        setFormError('');
        setErrors({});
        setImageFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setIsEditMode(true);
        setEditingId(category._id);
        setFormData({
            name: category.name,
            slug: category.slug,
            status: category.status,
            image: category.image || null,
            parent: category.parent || "",
            brandId: category.brandId || ""
        });
        setFormError('');
        setErrors({});
        setImageFile(null);
        setImagePreview(category.image || null);
        setIsModalOpen(true);
    };

    // Open modal for Deleting
    const confirmDelete = (category) => {
        setCategoryToDelete(category);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (categoryToDelete) {
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/categories/${categoryToDelete._id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setCategories(categories.filter(c => c._id !== categoryToDelete._id));
                } else {
                    const errData = await res.json();
                    setError(errData.msg || 'Failed to delete category.');
                }
            } catch (err) {
                setError('Cannot connect to backend. Make sure the server is running: node server.js');
            } finally {
                setIsDeleteModalOpen(false);
                setCategoryToDelete(null);
            }
        }
    };

    const handleNavigateDown = (category) => {
        setBreadcrumbs([...breadcrumbs, { _id: category._id, name: category.name }]);
        setCurrentParent(category);
    };

    const handleNavigateTo = (index) => {
        if (index === -1) {
            setBreadcrumbs([]);
            setCurrentParent(null);
        } else {
            const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
            setBreadcrumbs(newBreadcrumbs);
            setCurrentParent(newBreadcrumbs[newBreadcrumbs.length - 1]);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Category name is required";
        if (!formData.slug.trim()) newErrors.slug = "Slug is required";
        if (isBrandOwner && !formData.brandId) newErrors.brandId = "Linking to a brand is required";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setFormError('');
        try {
            let imageUrl = formData.image;

            if (imageFile) {
                setIsUploading(true);
                setUploadProgress(0);

                // Simulate progress while waiting for upload response
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
                    setUploadProgress(0);
                    setIsUploading(false);
                    setFormError(uploadResult.msg || 'Image upload failed.');
                    return;
                }
                setUploadProgress(100);
                await new Promise(r => setTimeout(r, 400)); // show 100% briefly
                imageUrl = uploadResult.url;
                setIsUploading(false);
                setUploadProgress(0);
            }

            const payload = { ...formData, image: imageUrl };
            const url = isEditMode
                ? `${API_BASE_URL}/categories/${editingId}`
                : `${API_BASE_URL}/categories`;
            const res = await fetchWithAuth(url, {
                method: isEditMode ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (isEditMode) {
                    setCategories(categories.map(c => c._id === editingId ? data : c));
                } else {
                    setCategories([data, ...categories]);
                }
                setIsModalOpen(false);
                setFormData(defaultFormState);
                setImageFile(null);
                setImagePreview(null);
            } else {
                setFormError(data.msg || 'Failed to save category. A category with this slug may already exist.');
            }
        } catch (err) {
            setFormError('Network error. Is the backend server running on port 5000?');
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                    <span className="font-semibold shrink-0">⚠️ Error:</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 font-bold shrink-0">✕</button>
                </div>
            )}
            <AdminHeader 
                title={isBrandOwner ? "My Category Taxonomy" : "Category Management"}
                subtitle={isBrandOwner ? "Manage global and brand-specific categories for your products." : "Manage platform categories and sub-categories."}
                actions={
                    <Button
                        onClick={openAddModal}
                        variant="primary"
                        leftIcon={Plus}
                    >
                        Add Category
                    </Button>
                }
            />

            {/* Breadcrumbs / Navigation Path */}
            <div className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => handleNavigateTo(-1)}
                    className={`flex items-center gap-1.5 hover:text-indigo-600 transition-colors whitespace-nowrap ${!currentParent ? 'text-indigo-600 font-semibold' : ''}`}
                >
                    <Home className="w-4 h-4" />
                    Categories
                </button>
                {breadcrumbs.map((crumb, idx) => (
                    <div key={crumb._id} className="flex items-center gap-2 shrink-0">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <button
                            onClick={() => handleNavigateTo(idx)}
                            className={`hover:text-indigo-600 transition-colors whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'text-indigo-600 font-semibold' : ''}`}
                        >
                            {crumb.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold">Category Name</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Scope</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-center">Sub-Categories</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Date Added</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        Loading data from database...
                                    </td>
                                </tr>
                            ) : filteredCategories.map((category) => (
                                <tr key={category._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden">
                                            {category.image ? (
                                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">{category.name}</div>
                                            <div className="text-xs text-slate-400 font-normal">/{category.slug}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {category.brandId ? (
                                            <Badge variant="premium">Brand-Specific</Badge>
                                        ) : (
                                            <Badge variant="secondary">Global</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleNavigateDown(category)}
                                            className="group flex flex-col items-center gap-1 mx-auto"
                                        >
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-all">
                                                {category.subCount || 0}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium group-hover:text-indigo-500 uppercase tracking-tight">View Sub</span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge 
                                            variant={category.status === 'Active' ? 'success' : 'secondary'} 
                                            dot={category.status === 'Active'}
                                        >
                                            {category.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(category.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {(!isBrandOwner || (category.brandId)) && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(category)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Category"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(category)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!isLoading && filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No categories found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Category Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? "Edit Category" : "Add New Category"}
                subtitle="Organize listings into hierarchical taxonomies"
                icon={Tag}
                size="md"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            form="category-form" 
                            isLoading={isUploading}
                        >
                            {isEditMode ? 'Save Changes' : 'Save Category'}
                        </Button>
                    </>
                }
            >
                <div>
                    {formError && (
                        <div className="mb-6 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                        </div>
                    )}
                    <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload Component */}
                        <ImageUploadBox
                            imagePreview={imagePreview}
                            isUploading={isUploading}
                            uploadProgress={uploadProgress}
                            onImageChange={handleImageUpload}
                            title="Upload Icon or Banner"
                            subtitle="PNG, JPG max 5MB (Recommended: 200x200px)"
                            imageSizeClass="w-20 h-20"
                        />

                        <FormInput
                            label="Category Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            error={errors.name}
                            placeholder="e.g. Real Estate"
                        />

                        <FormInput
                            label="URL Slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            error={errors.slug}
                            placeholder="e.g. real-estate"
                            className="bg-slate-50"
                        />

                        <FormSelect
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            options={["Active", "Inactive"]}
                        />

                        {isBrandOwner && (
                            <FormSelect
                                label="Link to Brand"
                                name="brandId"
                                value={formData.brandId}
                                onChange={handleInputChange}
                                options={[
                                    { label: "-- Select Brand --", value: "" },
                                    ...brands.map(b => ({ label: b.name, value: b._id }))
                                ]}
                                required
                                error={errors.brandId}
                            />
                        )}

                        <FormSelect
                            label="Parent Category"
                            name="parent"
                            value={formData.parent}
                            onChange={handleInputChange}
                            options={[
                                { label: "None (Top Level)", value: "" },
                                ...allCategories
                                    .filter(cat => cat._id !== editingId)
                                    .map(cat => ({ label: cat.name, value: cat._id }))
                            ]}
                            placeholder="Select Parent Category"
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Leave empty to make this a main category.</p>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Category"
                subtitle="This action is permanent and may affect linked listings"
                icon={Trash}
                size="sm"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={executeDelete}
                            className="flex-1"
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        Are you sure you want to delete <span className="font-black text-slate-800">"{categoryToDelete?.name}"</span>?
                    </p>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                        Deleting a category might leave some listings uncategorized. Please confirm your decision.
                    </p>
                </div>
            </Modal>


        </div>
    );
}
