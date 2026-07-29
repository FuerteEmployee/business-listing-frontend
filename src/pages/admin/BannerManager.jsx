import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Link as LinkIcon, MoveUp, MoveDown, CheckCircle, XCircle, ExternalLink, Layout, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import AdminFilters from "../../components/admin/AdminFilters";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import AdminHeader from "../../components/admin/AdminHeader";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

const BannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, bannerId: null });

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        imageUrl: '',
        link: '',
        buttonText: 'Explore Now',
        order: 0,
        status: 'active',
        type: 'homepage'
    });

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/banners`);
            if (!response.ok) throw new Error('Protocol failure during banner retrieval');

            const data = await response.json();
            setBanners(data.banners || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            setError('Could not establish connection to banner database');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.imageUrl) {
            toast.error('Banner visual asset required');
            return;
        }

        try {
            setActionLoading(true);
            const url = editingBanner ? `${API_BASE_URL}/cms/banners/${editingBanner._id}` : `${API_BASE_URL}/cms/banners`;
            const method = editingBanner ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Save protocol failed');

            toast.success(editingBanner ? 'Visual asset refined' : 'New banner deployed');
            setShowForm(false);
            setEditingBanner(null);
            resetForm();
            fetchBanners();
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('Technical disruption: Deployment failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            imageUrl: banner.imageUrl || '',
            link: banner.link || '',
            buttonText: banner.buttonText || 'Explore Now',
            order: banner.order || 0,
            status: banner.status || 'active',
            type: banner.type || 'homepage'
        });
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!confirmModal.bannerId) return;

        try {
            setActionLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/banners/${confirmModal.bannerId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Decommission sequence failed');

            toast.success('Visual asset decommissioned');
            setConfirmModal({ isOpen: false, bannerId: null });
            fetchBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast.error('Decommission protocol failed');
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            imageUrl: '',
            link: '',
            buttonText: 'Explore Now',
            order: 0,
            status: 'active',
            type: 'homepage'
        });
        setUploadProgress(0);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('category', 'banner');

        try {
            setUploading(true);
            setUploadProgress(10);
            
            // Simulating progress for better UX as fetch doesn't support progress easily without XHR
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
            label: "Visual / Asset",
            key: "imageUrl",
            render: (value, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-24 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        {value ? (
                            <img src={value} alt={row.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon size={20} />
                            </div>
                        )}
                    </div>
                    <div className="max-w-[200px]">
                        <div className="font-bold text-slate-900 leading-tight truncate">{row.title || 'Untitled Banner'}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">{row.subtitle || 'No subtitle provided'}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Configuration",
            key: "type",
            render: (value, row) => (
                <div className="space-y-1">
                    <Badge variant="outline" className="capitalize px-2 py-0.5 font-bold text-[9px] tracking-widest border-slate-200 text-slate-600 bg-slate-50">
                        {value}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-bold">
                        <LinkIcon size={10} />
                        <span className="truncate max-w-[120px]">{row.link || 'No Link'}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Operational State",
            key: "status",
            render: (value) => (
                value === 'active' ? 
                <Badge variant="success" icon={CheckCircle}>Deployed</Badge> : 
                <Badge variant="secondary" icon={XCircle}>Standby</Badge>
            )
        },
        {
            label: "Deployment Order",
            key: "order",
            render: (value) => (
                <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-400">
                    <Hash className="w-3 h-3" />
                    {value || 0}
                </div>
            )
        }
    ];

    const actions = [
        {
            label: "Modify Asset",
            icon: Edit,
            onClick: (row) => handleEdit(row)
        },
        {
            label: "Decommission",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, bannerId: row._id })
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Banner Management"
                subtitle="Configure primary visual interfaces for platform interfaces"
                actions={
                    <Button 
                        variant="primary" 
                        icon={Plus} 
                        onClick={() => {
                            setEditingBanner(null);
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        Initialize Banner
                    </Button>
                }
            />

            {/* Main Table */}
            <DataTable 
                columns={columns}
                data={banners}
                isLoading={loading}
                actions={actions}
                actionMode="buttons"
                error={error}
                emptyState={{
                    title: "No Banners Deployed",
                    subtitle: "Initialize your first visual asset to enhance platform interface",
                    icon: Layout
                }}
            />

            {/* Banner Editor Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingBanner(null);
                    resetForm();
                }}
                title={editingBanner ? "Refine Visual Asset" : "Deploy New Interface"}
                subtitle={editingBanner ? `Asset ID: ${editingBanner._id.substring(0, 12)}` : "Specify deployment parameters for new banner"}
                icon={Layout}
                size="2xl"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                         <Button variant="ghost" onClick={() => { setShowForm(false); setEditingBanner(null); resetForm(); }}>Abort Protocol</Button>
                         <Button variant="primary" onClick={handleSubmit} isLoading={actionLoading}>
                             {editingBanner ? 'Synchronize Data' : 'Authorize Deployment'}
                         </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <FormInput
                            label="Primary Title / Headline"
                            placeholder="Enter compelling headline..."
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />

                        <FormInput
                            label="Secondary Subtitle"
                            placeholder="Enter descriptive subtext..."
                            value={formData.subtitle}
                            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Action Button Label"
                                placeholder="Explore Now"
                                value={formData.buttonText}
                                onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                            />
                            <FormInput
                                label="Sort Priority"
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                            />
                        </div>

                        <FormInput
                            label="Redirection Target (URL)"
                            placeholder="https://example.com/target"
                            icon={ExternalLink}
                            value={formData.link}
                            onChange={(e) => setFormData({...formData, link: e.target.value})}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Platform Segment"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                options={[
                                    { value: 'homepage', label: 'Homepage Hero' },
                                    { value: 'category', label: 'Category Header' },
                                    { value: 'sidebar', label: 'Sidebar Promo' }
                                ]}
                            />
                            <FormSelect
                                label="Deployment State"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                options={[
                                    { value: 'active', label: 'Active / Deployed' },
                                    { value: 'inactive', label: 'Standby / Private' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-1 px-1 py-1">
                            <ImageUploadBox
                                title="Hero Banner Asset"
                                subtitle="Recommended: 1920x600 (Aspect 3.2:1)"
                                imagePreview={formData.imageUrl}
                                isUploading={uploading}
                                uploadProgress={uploadProgress}
                                onImageChange={handleImageChange}
                                imageSizeClass="w-full aspect-[3.2/1]"
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
                            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed italic text-center">
                                Tip: High-resolution assets ensure high engagement and professional platform resonance.
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>

             {/* confirm Decommission Modal */}
             <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, bannerId: null })}
                title="Asset Decommission"
                subtitle="Permanent removal from platform interfaces"
                icon={Trash2}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, bannerId: null })}>Retain Asset</Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>Confirm Decommission</Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-bold leading-relaxed">
                    Are you certain you wish to decommission this visual asset? This operation will permanently remove the banner from all platform segments.
                </p>
            </Modal>
        </div>
    );
};

export default BannerManager;
