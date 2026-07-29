import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Settings, MapPin, Trash } from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import FormInput from '../../../components/ui/FormInput';
import FormSelect from '../../../components/ui/FormSelect';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/button';

export default function AreasAdmin() {
    const [areas, setAreas] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [areaToDelete, setAreaToDelete] = useState(null);
    const [currentAreaObj, setCurrentAreaObj] = useState(null);
    const [formData, setFormData] = useState({ 
        city_id: '', 
        name: '', 
        pincode: '', 
        slug: '', 
        status: 'Active',
        meta: { title: '', description: '', keywords: '' }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [areasRes, citiesRes] = await Promise.all([
                fetch(getApiUrl('/locations/admin/areas'), { headers }).then(r => r.json()),
                fetch(getApiUrl('/locations/admin/cities'), { headers }).then(r => r.json())
            ]);
            setAreas(Array.isArray(areasRes.data) ? areasRes.data : []);
            setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (area = null) => {
        if (area) {
            setCurrentAreaObj(area);
            setFormData({ 
                city_id: area.city_id._id, 
                name: area.name, 
                pincode: area.pincode || '', 
                slug: area.slug, 
                status: area.status,
                meta: {
                    title: area.meta?.title || '',
                    description: area.meta?.description || '',
                    keywords: area.meta?.keywords || ''
                }
            });
        } else {
            setCurrentAreaObj(null);
            setFormData({ 
                city_id: cities[0]?._id || '', 
                name: '', 
                pincode: '', 
                slug: '', 
                status: 'Active',
                meta: { title: '', description: '', keywords: '' }
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentAreaObj(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            const url = currentAreaObj 
                ? getApiUrl(`/locations/admin/areas/${currentAreaObj._id}`)
                : getApiUrl('/locations/admin/areas');
            
            const method = currentAreaObj ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (!response.ok) {
                alert(data.msg || 'Error saving area');
                return;
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            alert('Error saving area');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (area) => {
        setAreaToDelete(area);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!areaToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(getApiUrl(`/locations/admin/areas/${areaToDelete._id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
                setAreaToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting area:', error);
        }
    };

    const filteredAreas = (Array.isArray(areas) ? areas : []).filter(a =>
        (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.city_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.pincode || '').includes(searchTerm)
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading areas...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search areas, cities, or pincodes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Area
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Area Name</th>
                            <th className="px-6 py-4">City</th>
                            <th className="px-6 py-4">Pincode</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAreas.map((area) => (
                            <tr key={area._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{area.name}</div>
                                    <div className="text-xs text-slate-500">/{area.slug}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">{area.city_id?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-slate-500">{area.pincode || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${area.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                        {area.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {area.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-slate-400">
                                        <button onClick={() => handleOpenModal(area)} className="p-1 hover:text-indigo-600 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => confirmDelete(area)} className="p-1 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentAreaObj ? 'Edit Area' : 'Add New Area'}
                subtitle="Locality Management"
                icon={MapPin}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" form="area-form" isLoading={isSubmitting}>
                            Save Locality
                        </Button>
                    </>
                }
            >
                <form id="area-form" onSubmit={handleSubmit} className="space-y-6">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-wrap">Basic info</h4>
                        </div>
                        <FormSelect 
                            label="City Target"
                            value={formData.city_id}
                            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                            required
                            options={cities.map(c => ({ label: `${c.name} (${c.state_id?.name || 'N/A'})`, value: c._id }))}
                            placeholder="Select a city"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput 
                                label="Area Name"
                                value={formData.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({ 
                                        ...formData, 
                                        name: val, 
                                        slug: currentAreaObj ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                    });
                                }}
                                required
                                placeholder="e.g. Alkapuri"
                            />
                            <FormInput 
                                label="Pincode"
                                value={formData.pincode}
                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                placeholder="e.g. 390007"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput 
                                label="URL Slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="alkapuri-area"
                            />
                            <FormSelect 
                                label="Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                options={["Active", "Inactive"]}
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <Settings className="w-4 h-4 text-slate-500" />
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-wrap">SEO Optimization</h4>
                        </div>
                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                            <FormInput 
                                label="Meta Title"
                                value={formData.meta.title}
                                onChange={e => setFormData({ ...formData, meta: { ...formData.meta, title: e.target.value } })}
                                placeholder="Shops in Alkapuri, Vadodara"
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Meta Description</label>
                                <textarea 
                                    className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none transition-all"
                                    value={formData.meta.description}
                                    onChange={e => setFormData({ ...formData, meta: { ...formData.meta, description: e.target.value } })}
                                />
                            </div>
                            <FormInput 
                                label="Meta Keywords"
                                value={formData.meta.keywords}
                                onChange={e => setFormData({ ...formData, meta: { ...formData.meta, keywords: e.target.value } })}
                                placeholder="alkapuri, vadodara, local market"
                            />
                        </div>
                    </section>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Area"
                subtitle="This action will permanently remove this locality"
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
                <div className="text-center text-slate-600">
                    <p className="text-sm font-medium">Are you sure you want to delete <span className="font-bold text-slate-900">"{areaToDelete?.name}"</span>?</p>
                    <p className="text-xs mt-2 leading-relaxed tracking-tight font-medium">This action cannot be undone and will remove all associated location data.</p>
                </div>
            </Modal>
        </div>
    );
}
