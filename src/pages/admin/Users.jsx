import { useState, useEffect, useCallback } from "react";
import { 
    Plus, 
    Mail, 
    Shield, 
    Lock, 
    ExternalLink, 
    ShieldCheck, 
    CheckCircle, 
    Download, 
    Trash2, 
    UserPlus, 
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Copy,
    UserCheck,
    MessageSquare,
    Files,
    User,
    Edit2,
    Save
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import AdminHeader from "../../components/admin/AdminHeader";
import { Spinner, FullPageLoader } from "../../components/ui/Loading";
import Modal from "../../components/ui/Modal";
import Alert from "../../components/ui/Alert";
import Dropdown from "../../components/ui/Dropdown";
import UserDetailCard from "../../components/admin/UserDetailCard";
import LoginHistory from "../../components/admin/users/LoginHistory";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import SearchableSelect from "../../components/ui/SearchableSelect";
import toast from "react-hot-toast";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [brands, setBrands] = useState([]);
    const [brandsLoaded, setBrandsLoaded] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        role: "",
        sortBy: "-createdAt"
    });

    // Detail Modal State
    const [detailModal, setDetailModal] = useState({
        isOpen: false,
        user: null,
        stats: null,
        activity: null,
        activeTab: 'profile',
        loading: false
    });

    // User CRUD Modal State
    const [userModal, setUserModal] = useState({
        isOpen: false,
        type: 'create', // 'create' or 'edit'
        user: null,
        loading: false,
        formData: {
            name: '', email: '', password: '', mobileNumber: '',
            role: 'User', status: 'Active', isEmailVerified: false, performanceScore: 100, assignedBrand: ''
        }
    });

    // Action Modal States
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: null, // 'ban', 'unban', 'verify', 'message', 'merge', 'delete'
        user: null,
        loading: false,
        formData: {}
    });

    const fetchUsers = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                limit: pagination.limit,
                page,
                ...filters
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setPagination(prev => ({ ...prev, page, total: data.pagination.total || 0 }));
                setSelectedUsers([]);
            } else {
                const errData = await res.json();
                setError(errData.msg || "Failed to fetch users");
            }
        } catch (err) {
            setError("Connection failed. Please check your network.");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchUsers(1);
    }, [filters]);

    const fetchBrands = useCallback(async () => {
        if (brandsLoaded) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/listings?limit=1000`);
            if (res.ok) {
                const data = await res.json();
                setBrands(data.listings || []);
                setBrandsLoaded(true);
            }
        } catch (e) {
            console.error("Failed to fetch brands", e);
        }
    }, [brandsLoaded]);

    const fetchUserDetail = async (userId) => {
        try {
            setDetailModal(prev => ({ ...prev, isOpen: true, loading: true, user: null }));
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setDetailModal(prev => ({ 
                    ...prev, 
                    user: data.user, 
                    stats: data.stats,
                    activity: data.activity,
                    loading: false 
                }));
            }
        } catch (err) {
            setDetailModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleSaveUser = async () => {
        const { type, user, formData } = userModal;
        
        try {
            setUserModal(prev => ({ ...prev, loading: true }));
            const url = type === 'create' 
                ? `${API_BASE_URL}/admin/users/standard` 
                : `${API_BASE_URL}/admin/users/standard/${user._id}`;
            const method = type === 'create' ? 'POST' : 'PUT';

            const payload = { ...formData };
            if (!payload.mobileNumber) delete payload.mobileNumber;
            if (type === 'edit' && (!payload.password || payload.password.trim() === '')) {
                delete payload.password;
            }

            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`User profile ${type === 'create' ? 'created' : 'updated'} successfully`);
                setUserModal(prev => ({ ...prev, isOpen: false, loading: false }));
                fetchUsers(pagination.page);
            } else {
                toast.error(data.msg || "Operation failed");
                setUserModal(prev => ({ ...prev, loading: false }));
            }
        } catch (err) {
            toast.error("Network error");
            setUserModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleAction = async () => {
        const { type, user, formData } = actionModal;
        if (!user && type !== 'bulk') return;

        try {
            setActionModal(prev => ({ ...prev, loading: true }));
            let url = `${API_BASE_URL}/admin/users/`;
            let method = 'PUT';
            let body = {};

            switch (type) {
                case 'ban':
                    url += `${user._id}/ban`;
                    body = { reason: formData.reason, duration: formData.duration || 'Permanent' };
                    break;
                case 'unban':
                    url += `${user._id}/unban`;
                    body = { note: formData.note };
                    break;
                case 'verify':
                    url += `${user._id}/verify`;
                    body = { verify: true };
                    break;
                case 'message':
                    url += `${user._id}/message`;
                    method = 'POST';
                    body = { subject: formData.subject, message: formData.message };
                    break;
                case 'merge':
                    url += `merge`;
                    method = 'POST';
                    body = { primaryUserId: user._id, secondaryUserId: formData.secondaryUserId };
                    break;
                case 'reset-password':
                    url += `${user._id}/force-password-reset`;
                    method = 'PUT';
                    break;
                case 'delete':
                    url += `${user._id}?mode=${formData.mode || 'anonymize'}`;
                    method = 'DELETE';
                    break;
                default: return;
            }

            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                if (type === 'reset-password') {
                    toast.success(data.msg + (data.tempPassword !== '****' ? `\n(Temp Password: ${data.tempPassword})` : ''));
                } else {
                    toast.success("Action completed successfully");
                }
                setActionModal({ isOpen: false, type: null, user: null, loading: false, formData: {} });
                fetchUsers(pagination.page);
            } else {
                const data = await res.json();
                toast.error(data.msg || "Failed to complete action");
            }
        } catch (err) {
            console.error("Action failed", err);
        } finally {
            setActionModal(prev => ({ ...prev, loading: false }));
        }
    };

    const exportToCSV = async () => {
        try {
            toast.loading("Preparing CSV export...", { id: 'export-toast' });
            const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/export/csv?${new URLSearchParams(filters)}`);
            
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success("Registry exported successfully", { id: 'export-toast' });
        } catch (err) {
            toast.error("Failed to export registry", { id: 'export-toast' });
            console.error("Export Error:", err);
        }
    };

    const columns = [
        {
            label: "User Identity",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100 shadow-sm">
                        {row.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-black text-slate-800 tracking-tight">{row.name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Role / Access",
            key: "role",
            render: (value, row) => (
                <Badge variant={value === 'Super Admin' ? 'premium' : (value === 'Admin' ? 'indigo' : 'slate')} size="sm">
                    {value === 'Merchant' || value === 'Company Owner' ? 'BRAND' : value.toUpperCase()}
                </Badge>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (value, row) => (
                <Badge 
                    variant={value === 'Active' ? 'success' : value === 'Banned' ? 'danger' : 'warning'} 
                    dot 
                    size="sm"
                >
                    {value}
                </Badge>
            )
        },
        {
            label: "Activity",
            key: "reviewCount",
            render: (value, row) => (
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="text-sm font-black text-slate-700">{row.reviewCount || 0}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Reviews</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-black text-slate-700">{row.enquiryCount || 0}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Enquiries</div>
                    </div>
                </div>
            )
        },
        {
            label: "Joined",
            key: "createdAt",
            render: (value, row) => (
                <div className="text-xs font-bold text-slate-500">
                    {new Date(row.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            )
        }
    ];

    const actions = [
        {
            label: "Edit Profile",
            icon: Edit2,
            onClick: async (user) => {
                fetchBrands();
                let assignedBrand = '';
                if (user.role === 'Merchant' || user.role === 'Brand Owner' || user.role === 'Company Owner') {
                    try {
                        const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${user._id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.ownedCompany) {
                                assignedBrand = data.ownedCompany._id;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to fetch owned company');
                    }
                }
                setUserModal({
                    isOpen: true,
                    type: 'edit',
                    user,
                    loading: false,
                    formData: {
                        name: user.name || '',
                        email: user.email || '',
                        mobileNumber: user.mobileNumber || '',
                        role: user.role || 'User',
                        status: user.status || 'Active',
                        isEmailVerified: user.isEmailVerified || false,
                        performanceScore: user.performanceScore || 100,
                        assignedBrand
                    }
                });
            }
        },
        {
            label: "View Explorer",
            icon: ExternalLink,
            onClick: (user) => fetchUserDetail(user._id)
        },
        {
            label: "Verification",
            icon: ShieldCheck,
            condition: (user) => !user.isEmailVerified,
            onClick: (user) => setActionModal({ isOpen: true, type: 'verify', user, formData: {} })
        },
        {
            label: "Security Ban",
            icon: Shield,
            isDangerous: true,
            condition: (user) => user.status !== 'Banned',
            onClick: (user) => setActionModal({ isOpen: true, type: 'ban', user, formData: { duration: 'Permanent' } })
        },
        /*
        {
            label: "Force Password Reset",
            icon: Lock,
            isDangerous: true,
            onClick: (user) => setActionModal({ isOpen: true, type: 'reset-password', user, formData: {} })
        },
        */
        {
            label: "Unban User",
            icon: UserCheck,
            condition: (user) => user.status === 'Banned',
            onClick: (user) => setActionModal({ isOpen: true, type: 'unban', user, formData: { note: '' } })
        },
        /*
        {
            label: "System Message",
            icon: MessageSquare,
            onClick: (user) => setActionModal({ isOpen: true, type: 'message', user, formData: { subject: '', message: '' } })
        },
        */
        {
            label: "Account Merge",
            icon: Files,
            condition: (user) => user.role === 'User',
            onClick: (user) => setActionModal({ isOpen: true, type: 'merge', user, formData: { secondaryUserId: '' } })
        },
        {
            label: "Delete User",
            icon: Trash2,
            isDangerous: true,
            onClick: (user) => setActionModal({ isOpen: true, type: 'delete', user, formData: { mode: 'anonymize' } })
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header section */}
            <AdminHeader 
                title="Identity & Access"
                subtitle="Centrally manage platform participants, monitor security logs, and ensure account integrity across all tenant systems."
                badge={<Badge variant="premium">Admin Hub</Badge>}
                actions={
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        <Button variant="outline" leftIcon={Download} onClick={exportToCSV}>
                            Export Registry
                        </Button>
                        <Button variant="primary" leftIcon={Plus} onClick={() => {
                            fetchBrands();
                            setUserModal({
                                isOpen: true, type: 'create', user: null, loading: false,
                                formData: { name: '', email: '', password: '', mobileNumber: '', role: 'User', status: 'Active', isEmailVerified: true, performanceScore: 100, assignedBrand: '' }
                            });
                        }}>
                            Create Member
                        </Button>
                    </div>
                }
            />

            {/* Metrics cards if needed could go here */}

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                    <FormInput 
                        label="Global Search"
                        placeholder="Find by name, email, or device signature..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="!mb-0"
                        autoComplete="off"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <FormSelect 
                        label="Access Tier"
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        options={[
                            { label: 'All Tiers', value: '' },
                            { label: 'Super Admin', value: 'Super Admin' },
                            { label: 'Admin', value: 'Admin' },
                            { label: 'Brand / Owner', value: 'Merchant' },
                            { label: 'User', value: 'User' }
                        ]}
                        className="!mb-0"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <FormSelect 
                        label="Presence"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        options={[
                            { label: 'All Statuses', value: '' },
                            { label: 'Active', value: 'Active' },
                            { label: 'Banned', value: 'Banned' },
                            { label: 'Unverified', value: 'Unverified' }
                        ]}
                        className="!mb-0"
                    />
                </div>
                <Button 
                    variant="outline" 
                    className="h-[46px] w-[46px]" 
                    size="icon" 
                    onClick={() => setFilters({ search: '', status: '', role: '', sortBy: '-createdAt' })}
                >
                    <Filter className="w-5 h-5" />
                </Button>
            </div>

            {/* Main Table */}
            <DataTable 
                data={users}
                columns={columns}
                actions={actions}
                actionMode="dropdown"
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={(page) => fetchUsers(page)}
            />

            {/* User Detail Modal */}
            <Modal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
                size="lg"
                title={detailModal.user?.name || "Member Profile"}
                subtitle={detailModal.user ? `UID: ${detailModal.user._id.substring(0, 12)}... • Registered ${new Date(detailModal.user.createdAt).toLocaleDateString()}` : "Synchronizing Identity Data..."}
                icon={User}
            >
                {detailModal.loading ? (
                    <div className="py-20 flex justify-center">
                        <Spinner label="Synchronizing Identity Data..." />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Tab Switcher */}
                        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                            {['profile', 'activity', 'logins'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDetailModal(prev => ({ ...prev, activeTab: tab }))}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        detailModal.activeTab === tab 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[400px]">
                            {detailModal.activeTab === 'profile' && (
                                <UserDetailCard user={detailModal.user} stats={detailModal.stats} />
                            )}
                            {detailModal.activeTab === 'activity' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Platform Interactions</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Feedback History</p>
                                            {detailModal.activity?.recentReviews.length > 0 ? (
                                                detailModal.activity.recentReviews.map((rev, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-xs font-black text-slate-800">{rev.businessId?.name}</p>
                                                            <div className="flex text-amber-500"><Badge variant="warning">{rev.rating} ★</Badge></div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-2">{rev.comment}</p>
                                                    </div>
                                                ))
                                            ) : <p className="text-xs text-slate-400 italic">No reviews recorded.</p>}
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Business Enquiries</p>
                                            {detailModal.activity?.recentEnquiries.length > 0 ? (
                                                detailModal.activity.recentEnquiries.map((enq, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-xs font-black text-slate-800 mb-1">{enq.businessIds[0]?.name || 'Direct Lead'}</p>
                                                        <p className="text-xs text-slate-500 line-clamp-2">{enq.message}</p>
                                                        <div className="mt-2 text-[8px] font-black text-slate-400 uppercase">{new Date(enq.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                ))
                                            ) : <p className="text-xs text-slate-400 italic">No enquiries sent.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {detailModal.activeTab === 'logins' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                     <LoginHistory history={detailModal.activity?.loginHistory} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Premium Action Modal */}
            <Modal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                title={
                    actionModal.type === 'ban' ? "Security Sanction" :
                    actionModal.type === 'message' ? "Protocol Transmission" :
                    actionModal.type === 'merge' ? "Identity Consolidation" :
                    actionModal.type === 'verify' ? "Trust Elevation" :
                    actionModal.type === 'unban' ? "Access Restoration" : 
                    actionModal.type === 'reset-password' ? "Force Password Reset" : "User Action"
                }
                subtitle={actionModal.user ? `Target Member: ${actionModal.user.name}` : "System Level Action"}
                icon={
                    actionModal.type === 'ban' ? Shield :
                    actionModal.type === 'message' ? MessageSquare :
                    actionModal.type === 'merge' ? Files :
                    actionModal.type === 'verify' ? ShieldCheck :
                    actionModal.type === 'reset-password' ? Lock :
                    actionModal.type === 'unban' ? UserCheck : User
                }
                footer={
                    <div className="flex justify-end gap-3 w-full">
                         <Button variant="ghost" onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}>Discard</Button>
                         <Button variant={actionModal.type === 'ban' ? 'danger' : 'primary'} onClick={handleAction} isLoading={actionModal.loading}>
                             Confirm {actionModal.type?.charAt(0).toUpperCase() + actionModal.type?.slice(1)}
                         </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {actionModal.type === 'ban' && (
                        <>
                            <Alert type="warning">Implementing a ban will restrict all platform access for this identity immediately.</Alert>
                            <div className="space-y-4">
                                <FormSelect 
                                    label="Duration Strategy"
                                    value={actionModal.formData.duration || 'Permanent'}
                                    onChange={(e) => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, duration: e.target.value } }))}
                                    options={[
                                        { label: 'Temporary (30 Days)', value: 'Temporary' },
                                        { label: 'Permanent Access Revocation', value: 'Permanent' }
                                    ]}
                                    required
                                />
                                <FormInput 
                                    label="Violation Rationale"
                                    placeholder="Outline specific policy violations..."
                                    value={actionModal.formData.reason || ''}
                                    onChange={(e) => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, reason: e.target.value } }))}
                                    required
                                />
                            </div>
                        </>
                    )}
                    {actionModal.type === 'message' && (
                        <div className="space-y-4">
                            <FormInput 
                                label="Transmission Subject"
                                placeholder="Message Subject Line"
                                value={actionModal.formData.subject || ''}
                                onChange={(e) => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, subject: e.target.value } }))}
                                required
                            />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Protocol Content</label>
                                <textarea 
                                    className="w-full p-4 rounded-xl bg-white border border-slate-200 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-48"
                                    placeholder="Type your message here..."
                                    value={actionModal.formData.message || ''}
                                    onChange={(e) => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, message: e.target.value } }))}
                                />
                            </div>
                        </div>
                    )}
                    {actionModal.type === 'merge' && (
                        <div className="space-y-6">
                            <Alert type="info">Merging accounts will consolidate all reviews and enquiries into the primary identity. This action is irreversible.</Alert>
                            <FormInput 
                                label="Secondary User ID"
                                placeholder="Enter MongoID of the duplicate account..."
                                value={actionModal.formData.secondaryUserId || ''}
                                onChange={(e) => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, secondaryUserId: e.target.value } }))}
                                required
                            />
                        </div>
                    )}
                    {actionModal.type === 'verify' && (
                        <Alert type="success">Manually verifying this account will elevate its trust score and enable full platform participation.</Alert>
                    )}
                    {actionModal.type === 'unban' && (
                        <Alert type="info">Restoring access will allow the member to resume previous activity. Audit logs will capture this restoration.</Alert>
                    )}
                    {actionModal.type === 'reset-password' && (
                        <Alert type="warning">Forcing a password reset will immediately log out the user. A new temporary password will be generated and emailed to them, and they will be required to change it upon their next login.</Alert>
                    )}
                    {actionModal.type === 'delete' && (
                        <div className="space-y-5">
                            <Alert type="danger">
                                You are about to delete <strong>{actionModal.user?.name}</strong>. This action cannot be undone.
                            </Alert>
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Deletion Mode</label>
                                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    actionModal.formData.mode === 'anonymize' ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                                }`}>
                                    <input
                                        type="radio"
                                        name="deleteMode"
                                        value="anonymize"
                                        checked={actionModal.formData.mode === 'anonymize'}
                                        onChange={() => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, mode: 'anonymize' } }))}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Anonymize (Recommended)</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Strips personal info but keeps reviews and activity data for audit integrity.</div>
                                    </div>
                                </label>
                                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    actionModal.formData.mode === 'hard' ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                                }`}>
                                    <input
                                        type="radio"
                                        name="deleteMode"
                                        value="hard"
                                        checked={actionModal.formData.mode === 'hard'}
                                        onChange={() => setActionModal(prev => ({ ...prev, formData: { ...prev.formData, mode: 'hard' } }))}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-bold text-red-700 text-sm">Hard Delete (Permanent)</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Completely removes the user and all associated data from the database. This is irreversible.</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Create / Edit User Modal */}
            <Modal
                isOpen={userModal.isOpen}
                onClose={() => setUserModal(prev => ({ ...prev, isOpen: false }))}
                title={userModal.type === 'create' ? "Provision New Member" : "Edit Profile"}
                subtitle={userModal.type === 'create' ? "Manually add a user to the platform" : `Updating ${userModal.user?.name}`}
                icon={UserPlus}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" onClick={() => setUserModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveUser} isLoading={userModal.loading} leftIcon={Save}>
                            {userModal.type === 'create' ? 'Create User' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Full Name"
                            name="name"
                            value={userModal.formData.name}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, name: e.target.value } }))}
                            required
                        />
                        <FormInput 
                            label="Email Address"
                            name="email"
                            type="email"
                            value={userModal.formData.email}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, email: e.target.value } }))}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label={userModal.type === 'create' ? "Initial Password" : "New Password (Optional)"}
                            name="password"
                            type="password"
                            value={userModal.formData.password || ''}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, password: e.target.value } }))}
                            required={userModal.type === 'create'}
                            placeholder={userModal.type === 'edit' ? "Leave blank to keep current" : ""}
                            autoComplete="new-password"
                        />
                        <FormInput 
                            label="Mobile Number"
                            value={userModal.formData.mobileNumber}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, mobileNumber: e.target.value } }))}
                            placeholder="e.g. 9876543210"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect 
                            label="Access Tier"
                            value={userModal.formData.role}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, role: e.target.value } }))}
                            options={[
                                { label: 'User', value: 'User' },
                                { label: 'Brand / Owner', value: 'Merchant' }
                            ]}
                            required
                        />
                        <FormSelect 
                            label="Account Status"
                            value={userModal.formData.status}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, status: e.target.value } }))}
                            options={[
                                { label: 'Active', value: 'Active' },
                                { label: 'Banned', value: 'Banned' },
                                { label: 'Unverified', value: 'Unverified' },
                                { label: 'Suspended', value: 'Suspended' }
                            ]}
                        />
                    </div>

                    {userModal.formData.role === 'Merchant' && (
                        <div className="grid grid-cols-1 gap-4">
                            <SearchableSelect 
                                label="Assigned Brand (Listing)"
                                placeholder="Select a brand to assign..."
                                value={userModal.formData.assignedBrand || ''}
                                onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, assignedBrand: e.target.value } }))}
                                options={[
                                    { label: 'Select a brand to assign...', value: '' },
                                    ...brands.map(brand => ({ label: brand.name, value: brand._id }))
                                ]}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect 
                            label="Email Verification"
                            value={userModal.formData.isEmailVerified ? 'true' : 'false'}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, isEmailVerified: e.target.value === 'true' } }))}
                            options={[
                                { label: 'Verified', value: 'true' },
                                { label: 'Unverified', value: 'false' }
                            ]}
                        />
                        <FormInput 
                            label="Performance Score (Trust Factor)"
                            type="number"
                            min="0"
                            max="100"
                            value={userModal.formData.performanceScore}
                            onChange={(e) => setUserModal(prev => ({ ...prev, formData: { ...prev.formData, performanceScore: parseInt(e.target.value) || 0 } }))}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
