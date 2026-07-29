import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Globe, MapPin, Settings, Star, Trash, Save } from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import FormInput from '../../../components/ui/FormInput';
import FormSelect from '../../../components/ui/FormSelect';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/button';

export default function CitiesAdmin() {
    const [cities, setCities] = useState([]);
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cityToDelete, setCityToDelete] = useState(null);
    const [currentCityObj, setCurrentCityObj] = useState(null);
    const [formData, setFormData] = useState({ 
        state_id: '', 
        name: '', 
        slug: '', 
        status: 'Active',
        isPopular: false,
        order: 0,
        meta: { title: '', description: '', keywords: '' },
        boundary: { type: 'Polygon', coordinates: [] }
    });
    const [boundaryJSON, setBoundaryJSON] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [citiesRes, statesRes] = await Promise.all([
                fetch(getApiUrl('/locations/admin/cities'), { headers }).then(r => r.json()),
                fetch(getApiUrl('/locations/admin/states'), { headers }).then(r => r.json())
            ]);
            setCities(citiesRes.data);
            setStates(statesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (city = null) => {
        if (city) {
            setCurrentCityObj(city);
            setFormData({ 
                state_id: city.state_id._id, 
                name: city.name, 
                slug: city.slug, 
                status: city.status,
                isPopular: city.isPopular || false,
                order: city.order || 0,
                meta: {
                    title: city.meta?.title || '',
                    description: city.meta?.description || '',
                    keywords: city.meta?.keywords || ''
                },
                boundary: city.boundary || { type: 'Polygon', coordinates: [] }
            });
            setBoundaryJSON(JSON.stringify(city.boundary?.coordinates || []));
        } else {
            setCurrentCityObj(null);
            setFormData({ 
                state_id: states[0]?._id || '', 
                name: '', 
                slug: '', 
                status: 'Active',
                isPopular: false,
                order: 0,
                meta: { title: '', description: '', keywords: '' },
                boundary: { type: 'Polygon', coordinates: [] }
            });
            setBoundaryJSON('[]');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCityObj(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            let parsedBoundary = [];
            try {
                parsedBoundary = JSON.parse(boundaryJSON);
            } catch (err) {
                alert('Invalid Boundary JSON format. Should be [[[lng, lat], ...]]');
                return;
            }

            const payload = {
                ...formData,
                boundary: { type: 'Polygon', coordinates: parsedBoundary }
            };

            const url = currentCityObj 
                ? getApiUrl(`/locations/admin/cities/${currentCityObj._id}`)
                : getApiUrl('/locations/admin/cities');
            
            const method = currentCityObj ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (!response.ok) {
                alert(data.msg || 'Error saving city');
                return;
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            alert('Error saving city');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (city) => {
        setCityToDelete(city);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!cityToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(getApiUrl(`/locations/admin/cities/${cityToDelete._id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
                setCityToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting city:', error);
        }
    };

    const filteredCities = cities.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.state_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.state_id?.country_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => (b.isPopular - a.isPopular) || (a.order - b.order));

    if (loading) return <div className="p-8 text-center text-slate-500">Loading cities...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search cities, states, or countries..."
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
                    Add City
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">City Name</th>
                            <th className="px-6 py-4">State</th>
                            <th className="px-6 py-4">Popularity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCities.map((city) => (
                            <tr key={city._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-slate-900">{city.name}</div>
                                        {city.isPopular && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div className="text-xs text-slate-500">/{city.slug} • Order: {city.order || 0}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-900">{city.state_id?.name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500">{city.state_id?.country_id?.name || 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${city.isPopular ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                        {city.isPopular ? 'Popular' : 'Standard'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${city.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                        {city.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {city.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-slate-400">
                                        <button onClick={() => handleOpenModal(city)} className="p-1 hover:text-indigo-600 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => confirmDelete(city)} className="p-1 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Advanced Multi-step Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentCityObj ? `Edit City: ${currentCityObj.name}` : 'Add New City'}
                subtitle="Location Taxonomy Management"
                icon={MapPin}
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={handleCloseModal}>
                            Discard Changes
                        </Button>
                        <Button type="submit" form="city-form" isLoading={isSubmitting}>
                            Persist City Data
                        </Button>
                    </>
                }
            >
                <form id="city-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* General Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Base Identity</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect 
                                label="State Parent"
                                value={formData.state_id}
                                onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                                required
                                options={states.map(s => ({ label: `${s.name} (${s.country_id?.name || 'N/A'})`, value: s._id }))}
                                placeholder="Select a state"
                            />
                            <FormInput 
                                label="City Name"
                                value={formData.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({ 
                                        ...formData, 
                                        name: val, 
                                        slug: currentCityObj ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                    });
                                }}
                                required
                                placeholder="e.g. Vadodara"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput 
                                label="URL Slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="vadodara-city"
                            />
                            <FormSelect 
                                label="Active Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                options={["Active", "Inactive"]}
                            />
                        </div>
                    </section>
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <Star className="w-4 h-4 text-amber-500" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visibility & Ranking</h4>
                        </div>
                        <div className="flex items-end gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3 h-10">
                                <input 
                                    type="checkbox" 
                                    id="isPopular"
                                    className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isPopular}
                                    onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                />
                                <label htmlFor="isPopular" className="text-sm font-bold text-slate-700 cursor-pointer">Mark as Popular City</label>
                            </div>
                            <div className="flex-1 max-w-[150px]">
                                <FormInput 
                                    label="Display Order"
                                    type="number"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mb-3 italic">Popular cities appear first in search.</p>
                        </div>
                    </section>
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Boundary Mapping (GeoJSON)</h4>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Coordinates Matrix</label>
                            <textarea 
                                className="w-full h-32 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border-2 border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                placeholder="[[[12.3, 45.6], [12.4, 45.7], ...]]"
                                value={boundaryJSON}
                                onChange={e => setBoundaryJSON(e.target.value)}
                            />
                            <div className="flex justify-between">
                                <span className="text-[10px] text-slate-400 font-medium">Standard GeoJSON Polygon Format</span>
                                <button type="button" onClick={() => setBoundaryJSON('[]')} className="text-[10px] text-indigo-600 font-bold uppercase hover:underline">Clear Map</button>
                            </div>
                        </div>
                    </section>
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                            <Settings className="w-4 h-4 text-slate-500" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">SEO Optimization</h4>
                        </div>
                        <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-dashed border-slate-200">
                            <FormInput 
                                label="Meta Title"
                                value={formData.meta.title}
                                onChange={e => setFormData({ ...formData, meta: { ...formData.meta, title: e.target.value } })}
                                placeholder="Best Businesses in Vadodara"
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Meta Description</label>
                                <textarea 
                                    className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                    value={formData.meta.description}
                                    onChange={e => setFormData({ ...formData, meta: { ...formData.meta, description: e.target.value } })}
                                />
                            </div>
                            <FormInput 
                                label="Meta Keywords"
                                value={formData.meta.keywords}
                                onChange={e => setFormData({ ...formData, meta: { ...formData.meta, keywords: e.target.value } })}
                                placeholder="vadodara, local business, directory"
                            />
                        </div>
                    </section>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete City"
                subtitle="This action will delete all linked areas and categories"
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
                    <p className="text-sm font-medium">Are you sure you want to delete <span className="font-bold text-slate-900">"{cityToDelete?.name}"</span>?</p>
                    <p className="text-xs mt-2 leading-relaxed tracking-tight font-medium">This will permanently remove all geographic data associated with this city.</p>
                </div>
            </Modal>
        </div>
    );
}
