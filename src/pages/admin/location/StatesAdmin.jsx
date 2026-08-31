import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Map, Trash } from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import FormInput from '../../../components/ui/FormInput';
import FormSelect from '../../../components/ui/FormSelect';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/button';

export default function StatesAdmin() {
    const [states, setStates] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stateToDelete, setStateToDelete] = useState(null);
    const [currentStateObj, setCurrentStateObj] = useState(null);
    const [formData, setFormData] = useState({ country_id: '', name: '', status: 'Active' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [statesRes, countriesRes] = await Promise.all([
                fetch(getApiUrl('/locations/admin/states?limit=200'), { headers }).then(r => r.json()),
                fetch(getApiUrl('/locations/admin/countries'), { headers }).then(r => r.json())
            ]);
            setStates(statesRes.data);
            setCountries(countriesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (state = null) => {
        if (state) {
            setCurrentStateObj(state);
            setFormData({ country_id: state.country_id._id, name: state.name, status: state.status });
        } else {
            setCurrentStateObj(null);
            setFormData({ country_id: countries[0]?._id || '', name: '', status: 'Active' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentStateObj(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            const url = currentStateObj 
                ? getApiUrl(`/locations/admin/states/${currentStateObj._id}`)
                : getApiUrl('/locations/admin/states');
            
            const method = currentStateObj ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (!response.ok) {
                alert(data.msg || 'Error saving state');
                return;
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            alert('Error saving state');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (state) => {
        setStateToDelete(state);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!stateToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(getApiUrl(`/locations/admin/states/${stateToDelete._id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
                setStateToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting state:', error);
        }
    };

    const filteredStates = states.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.country_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading states...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search states by name or country..."
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
                    Add State
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">State Name</th>
                            <th className="px-6 py-4">Country</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStates.map((state) => (
                            <tr key={state._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{state.name}</td>
                                <td className="px-6 py-4 text-slate-500">{state.country_id?.name || 'Unknown'}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${state.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                        {state.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {state.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-slate-400">
                                        <button onClick={() => handleOpenModal(state)} className="p-1 hover:text-indigo-600 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => confirmDelete(state)} className="p-1 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredStates.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500 content-center">
                                    No states found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentStateObj ? 'Edit State' : 'Add New State'}
                subtitle="Define regional administrative boundaries"
                icon={Map}
                footer={
                    <>
                        <Button variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" form="state-form" isLoading={isSubmitting}>
                            Save State
                        </Button>
                    </>
                }
            >
                <form id="state-form" onSubmit={handleSubmit} className="space-y-4">
                    <FormSelect 
                        label="Country"
                        value={formData.country_id}
                        onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                        required
                        options={countries.map(c => ({ label: c.name, value: c._id }))}
                        placeholder="Select a country"
                    />
                    <FormInput 
                        label="State Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. Gujarat"
                    />
                    <FormSelect 
                        label="Status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={["Active", "Inactive"]}
                    />
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete State"
                subtitle="This action will delete all linked cities and areas"
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
                    <p className="text-sm font-medium">Are you sure you want to delete <span className="font-bold text-slate-900">"{stateToDelete?.name}"</span>?</p>
                    <p className="text-xs mt-2 leading-relaxed">This will permanently remove all geographic data associated with this state.</p>
                </div>
            </Modal>
        </div>
    );
}
