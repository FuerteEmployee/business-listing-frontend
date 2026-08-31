import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Settings, MapPin, Trash, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import FormInput from '../../../components/ui/FormInput';
import FormSelect from '../../../components/ui/FormSelect';
import AsyncSelect from '../../../components/ui/AsyncSelect';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/button';

const PAGE_SIZE = 50;

// The city list is ~7.9k rows, so it cannot be preloaded into a plain <select> the way
// it used to be - both the filter and the modal's parent picker page through it.
const fetchCityPage = async (search, page, signal) => {
    const token = localStorage.getItem('token');
    const qs = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (search) qs.set('search', search);

    const res = await fetch(getApiUrl(`/locations/admin/cities?${qs}`), {
        headers: { Authorization: `Bearer ${token}` },
        signal
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return { options: [], hasMore: false, total: 0 };
    return {
        options: data.data.map(c => ({ value: c._id, label: `${c.name} (${c.state_id?.name || 'N/A'})` })),
        hasMore: Boolean(data.hasMore),
        total: data.total ?? data.data.length
    };
};

// Looks up one city by id, for showing the label of a selection that is not on the
// page currently loaded (an area being edited can belong to any of the ~7.9k cities).
const resolveCityLabel = async (id, signal) => {
    const token = localStorage.getItem('token');
    const res = await fetch(getApiUrl(`/locations/admin/cities?ids=${id}&limit=1`), {
        headers: { Authorization: `Bearer ${token}` },
        signal
    });
    const data = await res.json();
    const city = data?.data?.[0];
    return city ? `${city.name} (${city.state_id?.name || 'N/A'})` : '';
};

export default function AreasAdmin() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Search, the city filter and paging are resolved server-side; the page used to
    // pull every area AND every city on mount.
    const [cityFilter, setCityFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

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

    const fetchAreas = useCallback(async (signal) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const qs = new URLSearchParams({ page, limit: PAGE_SIZE });
            if (searchTerm.trim()) qs.set('search', searchTerm.trim());
            if (cityFilter) qs.set('city_id', cityFilter);

            const res = await fetch(getApiUrl(`/locations/admin/areas?${qs}`), {
                headers: { Authorization: `Bearer ${token}` },
                signal
            });
            const data = await res.json();
            if (signal?.aborted) return;
            setAreas(Array.isArray(data.data) ? data.data : []);
            setTotal(data.total ?? 0);
            setPages(data.pages ?? 1);
        } catch (error) {
            if (error.name !== 'AbortError') console.error('Error fetching areas:', error);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [page, searchTerm, cityFilter]);

    // Debounced so typing in the search box does not fire a request per keystroke.
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => fetchAreas(controller.signal), searchTerm ? 300 : 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [fetchAreas, searchTerm]);

    useEffect(() => { setPage(1); }, [searchTerm, cityFilter]);

    const refresh = () => fetchAreas();

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
                city_id: '', 
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
            refresh();
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
                refresh();
                setIsDeleteModalOpen(false);
                setAreaToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting area:', error);
        }
    };

    const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(page * PAGE_SIZE, total);

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search areas, slugs, or pincodes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
                    </div>
                    {/* City is now an explicit filter rather than part of the text search:
                        matching ~7.9k city names by substring server-side would mean an
                        unbounded $in of city ids. */}
                    <div className="sm:w-64">
                        <AsyncSelect
                            name="cityFilter"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            fetchPage={fetchCityPage}
                            resolveLabel={resolveCityLabel}
                            placeholder="All Cities"
                            searchPlaceholder="Type a city name..."
                            emptyMessage="No cities found"
                        />
                    </div>
                    {cityFilter && (
                        <button
                            type="button"
                            onClick={() => setCityFilter('')}
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 whitespace-nowrap px-2 py-2"
                        >
                            Clear city
                        </button>
                    )}
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
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
                        {areas.map((area) => (
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
                        {areas.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500 content-center">
                                    No areas found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Server-side pager */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 font-medium">
                    {total === 0
                        ? 'No areas'
                        : `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()} areas`}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1 || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Previous
                    </button>
                    <span className="text-xs text-slate-500 font-medium px-2">
                        Page {page} of {pages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                        disabled={page >= pages || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
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
                        <AsyncSelect
                            label="City Target"
                            name="city_id"
                            value={formData.city_id}
                            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                            required
                            fetchPage={fetchCityPage}
                            resolveLabel={resolveCityLabel}
                            placeholder="Select a city"
                            searchPlaceholder="Type a city name..."
                            emptyMessage="No cities found"
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
