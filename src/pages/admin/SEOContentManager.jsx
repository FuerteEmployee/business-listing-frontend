import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Tag, Globe, Settings, Layout, Hash, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import AdminFilters from "../../components/admin/AdminFilters";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import { FormTextarea } from "../../components/ui/FormTextarea";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const SEOContentManager = () => {
    const [contentBlocks, setContentBlocks] = useState([]);
    const [cities, setCities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBlock, setEditingBlock] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, blockId: null });

    const [filters, setFilters] = useState({
        city: '',
        category: '',
        search: ''
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        city: '',
        category: '',
        imageUrl: '',
        status: 'active'
    });

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [blocksRes, citiesRes, catsRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/cms/seo-content`),
                fetchWithAuth(`${API_BASE_URL}/cities`),
                fetchWithAuth(`${API_BASE_URL}/categories`)
            ]);

            if (!blocksRes.ok) throw new Error('SEO content retrieval failed');

            const blocksData = await blocksRes.json();
            const citiesData = await citiesRes.json();
            const catsData = await catsRes.json();

            setContentBlocks(blocksData.blocks || []);
            setCities(citiesData.cities || []);
            setCategories(catsData.categories || []);
        } catch (error) {
            console.error('Error fetching SEO content data:', error);
            setError('System synchronization failure');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.title || !formData.description) {
            toast.error('Title and description are mandatory parameters');
            return;
        }

        try {
            setActionLoading(true);
            const url = editingBlock ? `${API_BASE_URL}/cms/seo-content/${editingBlock._id}` : `${API_BASE_URL}/cms/seo-content`;
            const method = editingBlock ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Data persistence protocol failed');

            toast.success(editingBlock ? 'Content block synchronized' : 'New SEO entity authorized');
            setShowForm(false);
            setEditingBlock(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving SEO content:', error);
            toast.error('Technical disruption: Save failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (block) => {
        setEditingBlock(block);
        setFormData({
            title: block.title || '',
            description: block.description || '',
            city: block.city?._id || block.city || '',
            category: block.category?._id || block.category || '',
            imageUrl: block.imageUrl || '',
            status: block.status || 'active'
        });
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!confirmModal.blockId) return;

        try {
            setActionLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/seo-content/${confirmModal.blockId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Deletion protocol failed');

            toast.success('SEO entity declassified');
            setConfirmModal({ isOpen: false, blockId: null });
            fetchData();
        } catch (error) {
            console.error('Error deleting SEO content:', error);
            toast.error('Purge sequence failure');
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            city: '',
            category: '',
            imageUrl: '',
            status: 'active'
        });
        setUploadProgress(0);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('category', 'seo');

        try {
            setUploading(true);
            setUploadProgress(10);
            
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => prev < 90 ? prev + 10 : prev);
            }, 200);

            const response = await fetch(`${API_BASE_URL}/cms/media/upload`, {
                method: 'POST',
                body: uploadData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) throw new Error('Media upload sequence failed');

            const data = await response.json();
            setFormData(prev => ({ ...prev, imageUrl: data.media.url }));
            toast.success('Visual asset integrated');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Asset upload failure');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const columns = [
        {
            label: "Content Hierarchy",
            key: "title",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-100">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 leading-tight truncate max-w-[200px]">{row.title}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{row._id}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Scope / Targeting",
            key: "scope",
            render: (value, row) => (
                <div className="space-y-1.5 font-bold">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] text-slate-700 tracking-tight uppercase">
                            {row.city?.name || row.city || 'Global / Multiple'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        <span className="text-[10px] text-slate-500 tracking-tight">
                            {row.category?.name || row.category || 'All Categories'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            label: "Publication State",
            key: "status",
            render: (value) => (
                value === 'active' ? 
                <Badge variant="success" icon={CheckCircle}>Active</Badge> : 
                <Badge variant="secondary" icon={XCircle}>Standby</Badge>
            )
        }
    ];

    const actions = [
        {
            label: "Refine Block",
            icon: Edit,
            onClick: (row) => handleEdit(row)
        },
        {
            label: "Purge Database",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, blockId: row._id })
        }
    ];

    const filterFields = [
        {
            key: 'search',
            label: 'Search Entities',
            type: 'search',
            placeholder: 'Search content titles...'
        },
        {
            key: 'city',
            label: 'Geographical Scope',
            type: 'select',
            options: [
                { label: 'All Locations', value: '' },
                ...cities.map(c => ({ label: c.name, value: c._id }))
            ]
        },
        {
            key: 'category',
            label: 'Functional Scope',
            type: 'select',
            options: [
                { label: 'All Categories', value: '' },
                ...categories.map(c => ({ label: c.name, value: c._id }))
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="SEO Content blocks"
                subtitle="Configure location and category specific content structures"
                actions={
                    <Button 
                        variant="primary" 
                        icon={Plus} 
                        onClick={() => {
                            setEditingBlock(null);
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        Initialize Block
                    </Button>
                }
            />

            {/* Filters */}
            <AdminFilters 
                filters={filterFields.map(f => ({ ...f, value: filters[f.key] }))}
                onFilterChange={(key, value) => {
                    setFilters(prev => ({ ...prev, [key]: value }));
                }}
                onReset={() => {
                    setFilters({ city: '', category: '', search: '' });
                }}
            />

            {/* Main Table */}
            <DataTable 
                columns={columns}
                data={contentBlocks}
                isLoading={loading}
                actions={actions}
                actionMode="dropdown"
                error={error}
                emptyState={{
                    title: "Zero SEO Entities",
                    subtitle: "Authorize new content blocks to enhance organic resonance",
                    icon: Globe
                }}
            />

            {/* SEO Editor Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingBlock(null);
                    resetForm();
                }}
                title={editingBlock ? "Sync SEO Intelligence" : "Establish SEO Cluster"}
                subtitle={editingBlock ? `Entity ID: ${editingBlock._id.substring(0, 12)}` : "Specify deployment scope for new content block"}
                icon={Globe}
                size="xl"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                         <Button variant="ghost" onClick={() => { setShowForm(false); setEditingBlock(null); resetForm(); }}>Cancel Protocol</Button>
                         <Button variant="primary" onClick={handleSubmit} isLoading={actionLoading}>
                             {editingBlock ? 'Update Cluster' : 'Authorize Cluster'}
                         </Button>
                    </div>
                }
            >
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="Target Header / Title"
                            placeholder="Enter resonance headline..."
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />

                        <FormSelect
                            label="Operational State"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            options={[
                                { value: 'active', label: 'Authorized / Active' },
                                { value: 'inactive', label: 'Standby / Private' }
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormSelect
                            label="Geographical Scope (City)"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            options={[
                                { value: '', label: 'Global / Multi-Scope' },
                                ...cities.map(c => ({ label: c.name, value: c._id }))
                            ]}
                        />

                        <FormSelect
                            label="Functional Scope (Category)"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            options={[
                                { value: '', label: 'All Classifications' },
                                ...categories.map(c => ({ label: c.name, value: c._id }))
                            ]}
                        />
                    </div>

                    <FormTextarea
                        label="Rich SEO Narrative / Description"
                        placeholder="Establish comprehensive text presence for target cluster..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={6}
                        required
                    />

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Conceptual Visual Integration
                            </label>
                            <ImageUploadBox
                                title="Reference Asset (Optional)"
                                subtitle="Contextual image for this SEO block"
                                imagePreview={formData.imageUrl}
                                isUploading={uploading}
                                uploadProgress={uploadProgress}
                                onImageChange={handleImageChange}
                                imageSizeClass="w-full aspect-video"
                            />
                            {formData.imageUrl && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full mt-2 text-rose-500 font-bold hover:bg-rose-50 rounded-xl" 
                                    onClick={() => setFormData({...formData, imageUrl: ''})}
                                >
                                    Purge Asset
                                </Button>
                            )}
                        </div>
                </div>
            </Modal>

            {/* confirm Purge Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, blockId: null })}
                title="Entity Declassification"
                subtitle="Permanent database entry removal"
                icon={Trash2}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, blockId: null })}>Retain Entity</Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>Confirm Deletion</Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-bold leading-relaxed">
                    Are you certain you wish to purge this SEO content entity? This protocol is irreversible and will remove the targeted narrative from platform clusters.
                </p>
            </Modal>
        </div>
    );
};

export default SEOContentManager;
