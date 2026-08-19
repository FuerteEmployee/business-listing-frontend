import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, Mail, Edit2, Trash2, X } from 'lucide-react';
import { fetchWithAuth, getApiUrl } from '../../config/api';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import LocationSelector from '../../components/location/LocationSelector';

export default function BrandLocations() {
    const [locations, setLocations] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        brandId: '',
        name: '',
        address: '',
        country_id: '',
        state_id: '',
        city_id: '',
        area_id: '',
        phone: '',
        email: '',
        status: 'Active'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [locRes, brandRes] = await Promise.all([
                fetchWithAuth(`${getApiUrl('brand-locations')}?owned=true`),
                fetchWithAuth(`${getApiUrl('companies')}?owned=true`)
            ]);
            setLocations(await locRes.json());
            setBrands(await brandRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (locData) => {
        setFormData(prev => ({ ...prev, ...locData }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId 
                ? getApiUrl(`brand-locations/${editingId}`) 
                : getApiUrl('brand-locations');
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({
                    brandId: '', name: '', address: '',
                    country_id: '', state_id: '', city_id: '', area_id: '',
                    phone: '', email: '', status: 'Active'
                });
                fetchData();
            }
        } catch (error) {
            console.error('Error saving location:', error);
        }
    };

    const handleEdit = (loc) => {
        setEditingId(loc._id);
        setFormData({
            brandId: loc.brandId._id,
            name: loc.name,
            address: loc.address,
            country_id: loc.country_id?._id || '',
            state_id: loc.state_id?._id || '',
            city_id: loc.city_id?._id || '',
            area_id: loc.area_id?._id || '',
            phone: loc.phone || '',
            email: loc.email || '',
            status: loc.status
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        await fetchWithAuth(getApiUrl(`brand-locations/${id}`), { method: 'DELETE' });
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Store Locations</h1>
                    <p className="text-slate-500 text-sm">Manage physical branches for your brands.</p>
                </div>
                <button 
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Store
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
                ) : locations.length === 0 ? (
                    <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
                        No locations added yet. Click "Add Store" to get started.
                    </div>
                ) : (
                    locations.map(loc => (
                        <div key={loc._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(loc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(loc._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="pr-12">
                                    <h3 className="font-bold text-slate-900 leading-tight">{loc.name}</h3>
                                    <p className="text-xs font-semibold text-indigo-600 mt-1 uppercase tracking-wider">{loc.brandId?.name}</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span>{loc.address}, {loc.city_id?.name}, {loc.state_id?.name}</span>
                                </div>
                                {loc.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>{loc.phone}</span>
                                    </div>
                                )}
                                {loc.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>{loc.email}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${
                                    loc.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {loc.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Store' : 'Add New Store'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormSelect 
                                    label="Select Brand"
                                    name="brandId"
                                    value={formData.brandId}
                                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                    required
                                    options={brands.map(b => ({ value: b._id, label: b.name }))}
                                />
                                <FormInput 
                                    label="Branch/Store Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Downtown Service Center"
                                    required
                                />
                                <div className="md:col-span-2">
                                    <FormInput 
                                        label="Street Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="123 Industry Ave, Block 4"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Location Details</label>
                                    <LocationSelector 
                                        selectedLocation={{
                                            country_id: formData.country_id,
                                            state_id: formData.state_id,
                                            city_id: formData.city_id,
                                            area_id: formData.area_id
                                        }}
                                        onChange={handleLocationChange}
                                    />
                                </div>
                                <FormInput 
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 234 567 890"
                                />
                                <FormInput 
                                    label="Contact Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="branch@email.com"
                                />
                                <FormSelect 
                                    label="Status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    options={['Active', 'Inactive']}
                                />
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-semibold hover:text-slate-800 transition-colors">Cancel</button>
                                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                                    {editingId ? 'Save Changes' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
