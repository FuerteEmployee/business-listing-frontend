import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Zap, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

// System Standard Components
import DataTable from '../../components/admin/DataTable';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import Modal from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Loading';
import { toast } from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader";

export default function Services() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const isBrandOwner = currentUser && ['Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER'].includes(currentUser.role);
    const basePath = isBrandOwner ? '/brand' : '/admin';
    
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        id: null,
        isDeleting: false 
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const url = isBrandOwner ? `${getApiUrl('services')}?owned=true` : getApiUrl('services');
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if (data.success) {
                setServices(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmModal.id) return;
        
        try {
            setConfirmModal(prev => ({ ...prev, isDeleting: true }));
            const response = await fetchWithAuth(getApiUrl(`services/${confirmModal.id}`), {
                method: 'DELETE'
            });
            
            if (response.ok) {
                toast.success('Service deleted successfully');
                setConfirmModal({ isOpen: false, id: null, isDeleting: false });
                fetchServices();
            } else {
                throw new Error('Failed to delete service');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Error deleting service');
            setConfirmModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.listingId?.name && s.listingId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const columns = [
        {
            key: 'name',
            label: 'Service Details',
            sortable: true,
            render: (name, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 p-1 flex-shrink-0">
                        {row.images && row.images[0] ? (
                            <img src={row.images[0]} alt={name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-indigo-400">
                                <Zap className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800">{name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            ID: {row._id.slice(-6).toUpperCase()}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'listingId',
            label: 'Offered By',
            sortable: true,
            render: (listing) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{listing?.name || 'Unassigned'}</span>
                    <span className="text-[10px] font-medium text-slate-400">{listing?.city || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'priceType',
            label: 'Pricing Strategy',
            sortable: true,
            render: (type, row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{type}</span>
                    <span className="font-black text-indigo-600">
                        {type === 'fixed' && `₹${Number(row.price).toLocaleString()}`}
                        {type === 'hourly' && `₹${Number(row.hourlyRate).toLocaleString()}/hr`}
                        {type === 'range' && `Starts ₹${Number(row.price).toLocaleString()}`}
                    </span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Lifecycle',
            sortable: true,
            render: (status) => (
                <Badge 
                    variant={status === 'Active' ? 'success' : status === 'Draft' ? 'warning' : 'secondary'}
                    className="font-black uppercase tracking-widest text-[9px] px-2.5 py-1"
                >
                    {status}
                </Badge>
            )
        }
    ];

    const actions = [
        {
            label: 'Edit',
            icon: Edit2,
            onClick: (row) => navigate(`${basePath}/services/edit/${row._id}`)
        },
        {
            label: 'Delete',
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, id: row._id, isDeleting: false })
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <AdminHeader 
                title={isBrandOwner ? 'Service Catalog' : 'Global Service Offerings'}
                subtitle={isBrandOwner ? `Manage your ${services.length} service offerings, availability, and pricing models.` : `Monitoring ${services.length} service offerings across all registered platform entities.`}
                actions={
                    <Button 
                        variant="primary"
                        leftIcon={Plus}
                        onClick={() => navigate(`${basePath}/services/add`)}
                    >
                        New Service
                    </Button>
                }
            />

            {/* Filter Hub */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search service name or listing..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-400 transition-all shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button 
                        onClick={fetchServices}
                        className={`p-3 rounded-2xl border border-slate-100 transition-all ${loading ? 'bg-slate-100 text-indigo-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                        title="Refresh"
                        disabled={loading}
                    >
                        <Zap className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                    </button>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Sync status: Optimal
                    </p>
                </div>
            </div>

            {/* Main Data View */}
            <DataTable 
                data={filteredServices}
                columns={columns}
                actions={actions}
                isLoading={loading}
                emptyMessage="No service offerings found in the catalog."
                actionMode="dropdown"
                itemsPerPage={10}
            />

            {/* Standardized Delete Confirmation */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => !confirmModal.isDeleting && setConfirmModal({ isOpen: false, id: null, isDeleting: false })}
                title="De-activate Service"
                subtitle="This action will permanently withdraw the service from the public platform."
                icon={AlertCircle}
                variant="danger"
                footer={
                    <div className="flex items-center gap-3 w-full">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl py-6 font-bold"
                            onClick={() => setConfirmModal({ isOpen: false, id: null, isDeleting: false })}
                            disabled={confirmModal.isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-3 rounded-2xl py-6 font-black uppercase tracking-widest shadow-lg shadow-rose-100"
                            onClick={handleDelete}
                            isLoading={confirmModal.isDeleting}
                        >
                            Delete Service
                        </Button>
                    </div>
                }
            >
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-2">
                    <p className="text-sm text-rose-700 font-medium leading-relaxed">
                        Are you sure you want to terminate this service offering? This will cancel all recurring schedules and hide the detail page from potential customers. This action is not reversible.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
