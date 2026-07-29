import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Globe, Trash } from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import FormInput from '../../../components/ui/FormInput';
import FormSelect from '../../../components/ui/FormSelect';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/button';

export default function CountriesAdmin() {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [countryToDelete, setCountryToDelete] = useState(null);
    const [currentCountry, setCurrentCountry] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', status: 'Active' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(getApiUrl('/locations/admin/countries'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setCountries(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching countries:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (country = null) => {
        if (country) {
            setCurrentCountry(country);
            setFormData({ name: country.name, code: country.code, status: country.status });
        } else {
            setCurrentCountry(null);
            setFormData({ name: '', code: '', status: 'Active' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCountry(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            const url = currentCountry 
                ? getApiUrl(`/locations/admin/countries/${currentCountry._id}`)
                : getApiUrl('/locations/admin/countries');
            
            const method = currentCountry ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (!response.ok) {
                alert(data.msg || 'Error saving country');
                return;
            }
            fetchCountries();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving country:', error);
            alert('Error saving country');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (country) => {
        setCountryToDelete(country);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!countryToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(getApiUrl(`/locations/admin/countries/${countryToDelete._id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchCountries();
                setIsDeleteModalOpen(false);
                setCountryToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting country:', error);
        }
    };

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading countries...</div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Country
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Country Name</th>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCountries.map((country) => (
                            <tr key={country._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{country.name}</td>
                                <td className="px-6 py-4 text-slate-500">{country.code}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${country.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                        {country.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {country.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-slate-400">
                                        <button onClick={() => handleOpenModal(country)} className="p-1 hover:text-indigo-600 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => confirmDelete(country)} className="p-1 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCountries.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500 content-center">
                                    No countries found matching your search.
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
                title={currentCountry ? 'Edit Country' : 'Add New Country'}
                subtitle="Manage global geographic boundaries"
                icon={Globe}
                footer={
                    <>
                        <Button variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" form="country-form" isLoading={isSubmitting}>
                            Save Country
                        </Button>
                    </>
                }
            >
                <form id="country-form" onSubmit={handleSubmit} className="space-y-4">
                    <FormInput 
                        label="Country Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. India"
                    />
                    <FormInput 
                        label="Country Code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                        placeholder="e.g. IN"
                        className="uppercase"
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
                title="Delete Country"
                subtitle="This action will delete all linked states, cities, and areas"
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
                    <p className="text-sm font-medium">Are you sure you want to delete <span className="font-bold text-slate-900">"{countryToDelete?.name}"</span>?</p>
                    <p className="text-xs mt-2 leading-relaxed">This will permanently remove all geographic data associated with this country.</p>
                </div>
            </Modal>
        </div>
    );
}
