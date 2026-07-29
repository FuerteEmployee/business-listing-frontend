import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, ShieldCheck, MapPin, ExternalLink, ShieldAlert, X, AlertTriangle, Trash2, Star, ChevronRight, Globe, Phone, Building2, User as UserIcon, CheckCircle, Shield, Mail, Trash, MoreVertical, Megaphone } from "lucide-react";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import LocationSelector from "../../components/location/LocationSelector";
import FormSelect from "../../components/ui/FormSelect";
import FormInput from "../../components/ui/FormInput";
import Dropdown from "../../components/ui/Dropdown";
import { FormTextarea } from "../../components/ui/FormTextarea";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import Alert from "../../components/ui/Alert";
import { Badge } from "../../components/ui/badge";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import PromoteListingModal from "../../components/merchant/PromoteListingModal";
import AdminHeader from "../../components/admin/AdminHeader";

import { useAuth } from "../../context/AuthContext";

export default function Companies() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const isBrandOwner = currentUser?.role === 'Brand Owner' || currentUser?.role === 'Company Owner';
    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [companyToPromote, setCompanyToPromote] = useState(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [companyToDelete, setCompanyToDelete] = useState(null);

    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState('');
    const [error, setError] = useState(null);

    // Fetch companies from Backend
    const fetchCompanies = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const url = isBrandOwner ? `${API_BASE_URL}/companies?owned=true` : `${API_BASE_URL}/companies`;
            const res = await fetchWithAuth(url);
            if (res.ok) {
                const data = await res.json();
                setCompanies(Array.isArray(data) ? data : (data.data || []));

            } else {
                const errData = await res.json();
                setError(errData.msg || 'Failed to fetch companies. Is the backend running on port 5000?');
            }
        } catch (err) {
            setError('Cannot connect to backend. Make sure the server is running: node server.js');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch categories from Backend
    const fetchCategories = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    // Fetch users from Backend
    const fetchUsers = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/users`);
            if (res.ok) {
                const data = await res.json();
                setAllUsers(Array.isArray(data) ? data : data.users || data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    useEffect(() => {
        fetchCompanies();
        fetchCategories();
        fetchUsers();
    }, []);

    const defaultFormState = {
        name: "", category: "", description: "",
        country_id: "", state_id: "", city_id: "", area_id: "",
        address: "", latitude: null, longitude: null,
        status: "Pending", claimed: false, verified: false, verificationStatus: "Not Verified", isFeatured: false, manualRank: 0, image: null, owner: ""
    };
    const [formData, setFormData] = useState(defaultFormState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: finalValue
            };
            // Automatically mark as claimed if an owner is assigned
            if (name === 'owner' && value) {
                newState.claimed = true;
            }
            // If explicitly unmarking as claimed, clear the owner
            if (name === 'claimed' && !finalValue) {
                newState.owner = "";
            }
            return newState;
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); // local preview only
        }
    };

    const openAddModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData(defaultFormState);
        setFormError('');
        setImageFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (company) => {
        setIsEditMode(true);
        setEditingId(company._id);
        
        const newFormData = {
            name: company.name,
            category: company.category || "",
            description: company.description || '',
            country_id: company.country_id?._id || company.country_id || '',
            state_id: company.state_id?._id || company.state_id || '',
            city_id: company.city_id?._id || company.city_id || '',
            area_id: company.area_id?._id || company.area_id || '',
            address: company.address || '',
            latitude: company.latitude || null,
            longitude: company.longitude || null,
            status: company.status || 'Active',
            claimed: company.claimed || false,
            verified: company.verified || false,
            verificationStatus: company.verificationStatus || 'Not Verified',
            isFeatured: company.isFeatured || false,
            manualRank: company.manualRank || 0,
            image: company.image || null,
            owner: company.owner?._id || company.owner || ''
        };
        
        setFormData(newFormData);
        setFormError('');
        setImageFile(null);
        setImagePreview(company.image || null);
        setIsModalOpen(true);
    };

    const confirmDelete = (company) => {
        setCompanyToDelete(company);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (companyToDelete) {
            try {
                const res = await fetchWithAuth(`${API_BASE_URL}/companies/${companyToDelete._id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setCompanies(companies.filter(c => c._id !== companyToDelete._id));
                } else {
                    const errData = await res.json();
                    setError(errData.msg || 'Failed to delete company.');
                }
            } catch (err) {
                setError('Cannot connect to backend. Make sure the server is running: node server.js');
            } finally {
                setIsDeleteModalOpen(false);
                setCompanyToDelete(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            let imageUrl = formData.image; // keep existing URL if no new file

            // If user selected a new image file, upload it to Cloudinary first
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
                ? `${API_BASE_URL}/companies/${editingId}`
                : `${API_BASE_URL}/companies`;
            const res = await fetchWithAuth(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                // Refresh full list to ensure all populated fields (owner, location) are correct
                fetchCompanies();
                setIsModalOpen(false);
                setFormData(defaultFormState);
                setImageFile(null);
                setImagePreview(null);
            } else {
                setFormError(data.error ? `Server Error: ${data.error}` : (data.msg || 'Failed to save company. Please try again.'));
            }
        } catch (err) {
            setFormError('Network error. Is the backend server running on port 5000?');
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {error && <Alert type="danger" onClose={() => setError(null)}>{error}</Alert>}
            
            <AdminHeader 
                title={isBrandOwner ? "My Brands" : "Company Management"}
                subtitle={isBrandOwner ? "Manage your assigned brand listings and verification status." : "Manage listings, claim requests, and verification statuses."}
                actions={
                    <Button variant="primary" leftIcon={Plus} onClick={openAddModal}>
                        Add Company
                    </Button>
                }
            />

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search companies by name or category..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold">Company Info</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Category</th>
                                {!isBrandOwner && <th scope="col" className="px-6 py-4 font-semibold">Owner</th>}
                                <th scope="col" className="px-6 py-4 font-semibold">Claim & Verify Status</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Profile Status</th>
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
                            ) : filteredCompanies.map((company) => (
                                <tr key={company._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-start gap-4">
                                        {company.image ? (
                                            <img src={company.image} alt={company.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                                                {company.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-semibold text-slate-800 text-base">{company.name}</div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {company.city_id?.name || company.address || 'No location'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                            {company.category}
                                        </span>
                                    </td>
                                    {!isBrandOwner && (
                                        <td className="px-6 py-4">
                                            {company.owner && typeof company.owner === 'object' ? (
                                                <div>
                                                    <div className="text-sm font-medium text-slate-800">{company.owner.name}</div>
                                                    <div className="text-xs text-slate-500">{company.owner.email}</div>
                                                </div>
                                            ) : company.owner ? (
                                                <div className="text-xs text-amber-600 font-mono break-all">
                                                    ID: {company.owner.toString()}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">No owner assigned</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 space-y-2">
                                        <div className="flex flex-col gap-1.5">
                                            {company.claimed ? (
                                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 w-fit">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Claimed
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 w-fit">
                                                        <ShieldAlert className="w-3.5 h-3.5" /> Unclaimed
                                                    </span>
                                                    {company.isClaimPending && (
                                                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 w-fit italic uppercase tracking-tighter animate-pulse">
                                                            <Clock className="w-3 h-3" /> Claim Pending
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {company.verified && (
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div> Verified
                                            </div>
                                        )}
                                        {company.isFeatured && (
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 uppercase tracking-wide">
                                                <Star className="w-3 h-3 fill-orange-600" /> Featured
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${company.status === 'Active'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {company.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end">
                                            <Dropdown
                                                align="right"
                                                trigger={
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                }
                                                items={[
                                                    {
                                                        label: "View Public Profile",
                                                        icon: ExternalLink,
                                                        onClick: () => window.open(`/business/${company.slug}`, '_blank')
                                                    },
                                                    {
                                                        label: "Edit Company",
                                                        icon: Edit2,
                                                        onClick: () => isBrandOwner 
                                                            ? navigate(`/brand/profile/${company._id}`) 
                                                            : openEditModal(company)
                                                    },
                                                    ...(isBrandOwner ? [{
                                                        label: "Boost Listing",
                                                        icon: Megaphone,
                                                        onClick: () => {
                                                            setCompanyToPromote(company);
                                                            setIsPromoteModalOpen(true);
                                                        }
                                                    }] : []),
                                                    {
                                                        label: "Delete Company",
                                                        icon: Trash2,
                                                        onClick: () => confirmDelete(company),
                                                        isDangerous: true
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!isLoading && filteredCompanies.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No companies found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Company Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? "Edit Company" : "Add New Company"}
                subtitle="Manage business profile, location and verification assets"
                icon={Building2}
                size="lg"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary"
                            type="submit" 
                            form="company-form" 
                            isLoading={isUploading}
                        >
                            {isEditMode ? 'Save Changes' : 'Save Company'}
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
                    <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                        <ImageUploadBox
                            imagePreview={imagePreview}
                            isUploading={isUploading}
                            uploadProgress={uploadProgress}
                            onImageChange={handleImageUpload}
                            title="Click to upload company logo"
                            subtitle="PNG, JPG max 5MB (Recommended: 400x400px)"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput 
                                label="Company Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. Acme Corp"
                            />
                            <FormSelect
                                label="Category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="-- Select Category --"
                                options={[
                                    ...(formData.category && !categories.some(c => c.name === formData.category) 
                                        ? [{ value: formData.category, label: `${formData.category} (Legacy)` }] 
                                        : []),
                                    ...(categories.length > 0 
                                        ? categories.map(cat => ({ value: cat.name, label: cat.name }))
                                        : [
                                            { value: "Software", label: "Software" },
                                            { value: "Restaurants", label: "Restaurants" },
                                            { value: "Home Services", label: "Home Services" }
                                          ]
                                    )
                                ]}
                            />
                        </div>

                        <LocationSelector
                            value={{
                                country_id: formData.country_id,
                                state_id: formData.state_id,
                                city_id: formData.city_id,
                                area_id: formData.area_id
                            }}
                            onChange={(location) => setFormData(prev => ({
                                ...prev,
                                ...location
                            }))}
                            showLabel={true}
                        />

                        <FormInput 
                            label="Street Address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="e.g. 123 Business St, Suite 100"
                        />

                        <FormTextarea 
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Short bio about the company..."
                            className="h-32"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                            <FormSelect
                                label="Profile Status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                options={isBrandOwner ? ["Active", "Inactive"] : ["Active", "Inactive", "Pending"]}
                            />
                            <FormSelect
                                label="Verification Status"
                                name="verificationStatus"
                                value={formData.verificationStatus}
                                onChange={handleInputChange}
                                options={["Not Verified", "Pending Review", "Verified"]}
                            />
                        </div>

                        {!isBrandOwner && (
                            <div className="pt-4 border-t border-slate-100">
                                <FormSelect
                                    label="Assign Owner"
                                    name="owner"
                                    value={formData.owner}
                                    onChange={handleInputChange}
                                    placeholder="-- Select Owner --"
                                    options={allUsers.map(u => ({ value: u._id, label: `${u.name} (${u.email})` }))}
                                />
                            </div>
                        )}

                        {!isBrandOwner && (
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:bg-white hover:shadow-md active:scale-95 group">
                                        <input 
                                            type="checkbox" 
                                            name="claimed" 
                                            checked={formData.claimed} 
                                            onChange={handleInputChange} 
                                            className="w-5 h-5 text-indigo-600 rounded-lg border-2 border-slate-200 focus:ring-0" 
                                        />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Mark as Claimed</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:bg-white hover:shadow-md active:scale-95 group">
                                        <input 
                                            type="checkbox" 
                                            name="verified" 
                                            checked={formData.verified} 
                                            onChange={handleInputChange} 
                                            className="w-5 h-5 text-indigo-600 rounded-lg border-2 border-slate-200 focus:ring-0" 
                                        />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Verified Badge</span>
                                    </label>
                                </div>
                                
                                <label className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-2xl border border-orange-100/50 cursor-pointer transition-all hover:bg-white hover:shadow-md active:scale-95 group">
                                    <input 
                                        type="checkbox" 
                                        name="isFeatured" 
                                        checked={formData.isFeatured} 
                                        onChange={handleInputChange} 
                                        className="w-5 h-5 text-orange-600 rounded-lg border-2 border-orange-200 focus:ring-0" 
                                    />
                                    <span className="text-sm font-black text-orange-600 uppercase tracking-widest">Featured Listing</span>
                                </label>

                                <div className="pt-2">
                                    <FormInput 
                                        label="Manual Rank Override"
                                        type="number"
                                        name="manualRank"
                                        value={formData.manualRank}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 10"
                                        className="bg-slate-50"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Higher value moves business to top of search results (base: 0).</p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Company"
                subtitle="This action is permanent and cannot be undone"
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
                        Are you sure you want to delete <span className="font-black text-slate-800">"{companyToDelete?.name}"</span>?
                    </p>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                        Deleting this company will remove all associated listings and data. Please confirm you want to proceed.
                    </p>
                </div>
            </Modal>

            <PromoteListingModal 
                isOpen={isPromoteModalOpen}
                onClose={() => setIsPromoteModalOpen(false)}
                company={companyToPromote}
                onPromoted={() => {
                    navigate('/brand/promotions');
                }}
            />

        </div>
    );
}
