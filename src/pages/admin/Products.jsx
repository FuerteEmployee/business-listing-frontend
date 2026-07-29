import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

// System Standard Components
import DataTable from '../../components/admin/DataTable';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import Modal from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Loading';
import { toast } from 'react-hot-toast';
import AdminHeader from '../../components/admin/AdminHeader';

export default function Products() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const isBrandOwner = currentUser?.role === 'Brand Owner' || currentUser?.role === 'Company Owner';
    const basePath = isBrandOwner ? '/brand' : '/admin';
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        id: null,
        isDeleting: false 
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const url = isBrandOwner ? `${getApiUrl('products')}?owned=true` : getApiUrl('products');
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmModal.id) return;
        
        try {
            setConfirmModal(prev => ({ ...prev, isDeleting: true }));
            const response = await fetchWithAuth(getApiUrl(`products/${confirmModal.id}`), {
                method: 'DELETE'
            });
            
            if (response.ok) {
                toast.success('Product deleted successfully');
                setConfirmModal({ isOpen: false, id: null, isDeleting: false });
                fetchProducts();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Error deleting product');
            setConfirmModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.listingId?.name && p.listingId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const columns = [
        {
            key: 'name',
            label: 'Product Detail',
            sortable: true,
            render: (name, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0">
                        {row.images && row.images[0] ? (
                            <img src={row.images[0]} alt={name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800">{name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            SKU: {row.sku || 'N/A'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'listingId',
            label: 'Business Listing',
            sortable: true,
            render: (listing) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{listing?.name || 'Unassigned'}</span>
                    <span className="text-[10px] font-medium text-slate-400">{listing?.city || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'price',
            label: 'Pricing',
            sortable: true,
            render: (price) => (
                <div className="font-black text-indigo-600">
                    ₹{Number(price).toLocaleString()}
                </div>
            )
        },
        {
            key: 'stock',
            label: 'Inventory',
            sortable: true,
            render: (stock) => (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${Number(stock) > 10 ? 'bg-emerald-500' : Number(stock) > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                    <span className="text-sm font-bold text-slate-600">{stock} Units</span>
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
            label: 'Edit Product',
            icon: Edit2,
            onClick: (row) => navigate(`${basePath}/products/edit/${row._id}`)
        },
        {
            label: 'Remove Product',
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, id: row._id, isDeleting: false })
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <AdminHeader 
                title={isBrandOwner ? 'Product Catalog' : 'Global Inventory'}
                subtitle={isBrandOwner ? `Manage your ${products.length} product offerings and stock levels.` : `Monitoring ${products.length} products across all registered business entities.`}
                actions={
                    <Button 
                        variant="primary"
                        leftIcon={Plus}
                        onClick={() => navigate(`${basePath}/products/add`)}
                    >
                        Expand Catalog
                    </Button>
                }
            />

            {/* Filter Hub */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, SKU or brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-400 transition-all shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button 
                        onClick={fetchProducts}
                        className={`p-3 rounded-2xl border border-slate-100 transition-all ${loading ? 'bg-slate-100 text-indigo-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                        title="Sync Data"
                        disabled={loading}
                    >
                        <Package className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                    </button>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Last synced: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* Main Data View */}
            <DataTable 
                data={filteredProducts}
                columns={columns}
                actions={actions}
                isLoading={loading}
                emptyMessage="No products found in your catalog."
                actionMode="dropdown"
                itemsPerPage={10}
            />

            {/* Standardized Delete Confirmation */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => !confirmModal.isDeleting && setConfirmModal({ isOpen: false, id: null, isDeleting: false })}
                title="De-list Product"
                subtitle="This action will permanently remove the item from the marketplace."
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
                            Confirm Deletion
                        </Button>
                    </div>
                }
            >
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-2">
                    <p className="text-sm text-rose-700 font-medium leading-relaxed">
                        Are you absolutely sure? This record cannot be recovered once purged from the global inventory system. All associated analytics for this SKU will be archived.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
