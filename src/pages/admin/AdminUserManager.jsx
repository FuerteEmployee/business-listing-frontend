import { useState, useEffect, useCallback } from "react";
import { 
    Plus, Shield, Lock, Trash2, Search, Filter, 
    LogOut, Globe, Mail, User, ShieldCheck, 
    AlertCircle, MoreVertical, Edit2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Modal from "../../components/ui/Modal";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader";

export default function AdminUserManager() {
    const [admins, setAdmins] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    const [filters, setFilters] = useState({
        search: "",
        role: "",
        status: ""
    });

    // Modals
    const [adminModal, setAdminModal] = useState({
        isOpen: false,
        type: 'create', // 'create' or 'edit'
        admin: null,
        formData: {
            name: '',
            email: '',
            password: '',
            role: '',
            status: 'Active',
            ipWhitelist: ''
        }
    });

    const [actionLoading, setActionLoading] = useState(false);

    // Fetch Roles for the dropdown
    const fetchRoles = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/roles`);
            if (res.ok) {
                const data = await res.json();
                setRoles(data.roles || []);
            }
        } catch (err) {
            console.error("Failed to fetch roles", err);
        }
    };

    const fetchAdmins = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                limit: pagination.limit,
                page,
                roleType: 'admin', // Backend filter for admin-only
                ...filters
            });

            // Reusing existing user list endpoint but filtered for admins
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                // Filter specifically for roles that are considered administrative if backend doesn't handle it
                setAdmins(data.users || []);
                setPagination(prev => ({ ...prev, page, total: data.pagination.total || 0 }));
            }
        } catch (err) {
            setError("Failed to load admin team");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchRoles();
        fetchAdmins(1);
    }, [filters]);

    const handleForceLogout = async (adminId) => {
        if (!window.confirm("Are you sure you want to invalidate all active sessions for this admin?")) return;
        
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${adminId}/force-logout`, {
                method: 'PUT'
            });
            if (res.ok) {
                toast.success("Force logout successful. All sessions invalidated.");
            } else {
                toast.error("Failed to force logout");
            }
        } catch (err) {
            toast.error("Error communicating with server");
        } finally {
            setActionLoading(false);
        }
    };

    const handleForcePasswordReset = async (adminId) => {
        if (!window.confirm("Are you sure you want to force a password reset for this admin? They will receive an email with a new temporary password.")) return;
        
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${adminId}/force-password-reset`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.msg + (data.tempPassword !== '****' ? `\n(Temp Password: ${data.tempPassword})` : ''));
            } else {
                toast.error(data.msg || "Failed to reset password");
            }
        } catch (err) {
            toast.error("Error communicating with server");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!window.confirm("Permanently remove this admin? This action cannot be undone.")) return;
        
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${adminId}?mode=delete`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Admin removed successfully");
                fetchAdmins(pagination.page);
            }
        } catch (err) {
            toast.error("Failed to delete admin");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveAdmin = async () => {
        const { type, admin, formData } = adminModal;
        
        try {
            setActionLoading(true);
            const url = type === 'create' 
                ? `${API_BASE_URL}/admin/users` // Assuming backend has a separate create admin or uses registration
                : `${API_BASE_URL}/admin/users/${admin._id}`;
            
            const method = type === 'create' ? 'POST' : 'PUT';
            
            // Convert ipWhitelist string to array
            const ipArray = formData.ipWhitelist.split(',').map(ip => ip.trim()).filter(ip => ip !== '');

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    ipWhitelist: ipArray
                })
            });

            if (res.ok) {
                toast.success(`Admin ${type === 'create' ? 'created' : 'updated'} successfully`);
                setAdminModal({ ...adminModal, isOpen: false });
                fetchAdmins(pagination.page);
            } else {
                const err = await res.json();
                toast.error(err.msg || "Operation failed");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            label: "Administrator",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black border border-slate-200">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{row.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{row.email}</p>
                    </div>
                </div>
            )
        },
        {
            label: "Assigned Role",
            key: "role",
            render: (value) => (
                <Badge variant={value === 'Super Admin' ? 'premium' : 'indigo'} size="sm">
                    {value}
                </Badge>
            )
        },
        {
            label: "IP Control",
            key: "ipWhitelist",
            render: (value) => (
                <div className="flex items-center gap-1.5">
                    <Globe className={`w-3 h-3 ${value && value.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className="text-xs font-bold text-slate-500">
                        {value && value.length > 0 ? `${value.length} Allowed` : 'Unrestricted'}
                    </span>
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (value) => (
                <Badge variant={value === 'Active' ? 'success' : 'danger'} dot size="sm">
                    {value}
                </Badge>
            )
        },
        {
            label: "Last Login",
            key: "lastLogin",
            render: (value) => (
                <span className="text-xs font-bold text-slate-500">
                    {value ? new Date(value).toLocaleString() : 'Never'}
                </span>
            )
        }
    ];

    const actions = [
        {
            label: "Edit Profile",
            icon: Edit2,
            onClick: (admin) => setAdminModal({
                isOpen: true,
                type: 'edit',
                admin,
                formData: {
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    status: admin.status,
                    ipWhitelist: (admin.ipWhitelist || []).join(', ')
                }
            })
        },
        {
            label: "Force Password Reset",
            icon: Lock,
            onClick: (admin) => handleForcePasswordReset(admin._id),
            isDangerous: true
        },
        {
            label: "Force Logout",
            icon: LogOut,
            onClick: (admin) => handleForceLogout(admin._id),
            isDangerous: true
        },
        {
            label: "Delete Admin",
            icon: Trash2,
            onClick: (admin) => handleDeleteAdmin(admin._id),
            isDangerous: true,
            condition: (admin) => admin.role !== 'Super Admin'
        }
    ];

    return (
        <div className="space-y-8 pb-20">
            <AdminHeader 
                title="Admin Team"
                subtitle="Manage system operators, monitor security logs, and enforce administrative protocols across the platform."
                badge={<Badge variant="premium">Administrative Hub</Badge>}
                actions={
                    <Button variant="primary" leftIcon={Plus} onClick={() => setAdminModal({
                        isOpen: true,
                        type: 'create',
                        admin: null,
                        formData: { name: '', email: '', password: '', role: '', status: 'Active', ipWhitelist: '' }
                    })}>
                        Add Operator
                    </Button>
                }
            />

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                    <FormInput 
                        label="Identity Search"
                        placeholder="Search by name or email..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="!mb-0"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <FormSelect 
                        label="Security Tier"
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        options={[
                            { label: 'All Roles', value: '' },
                            ...roles.map(r => ({ label: r.name, value: r.name }))
                        ]}
                        className="!mb-0"
                    />
                </div>
                <Button 
                    variant="outline" 
                    className="h-[46px] w-[46px]"
                    size="icon"
                    onClick={() => setFilters({ search: '', role: '', status: '' })}
                >
                    <Filter className="w-5 h-5" />
                </Button>
            </div>

            {/* Main Table */}
            <DataTable 
                data={admins}
                columns={columns}
                actions={actions}
                actionMode="dropdown"
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={(page) => fetchAdmins(page)}
            />

            {/* Admin Modal */}
            <Modal
                isOpen={adminModal.isOpen}
                onClose={() => setAdminModal({ ...adminModal, isOpen: false })}
                title={adminModal.type === 'create' ? "Add Admin Operator" : "Edit Security Profile"}
                subtitle={adminModal.type === 'create' ? "Provision new administrative credentials" : `Updating ${adminModal.admin?.name}`}
                icon={Shield}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="outline" onClick={() => setAdminModal({ ...adminModal, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveAdmin} isLoading={actionLoading}>
                            {adminModal.type === 'create' ? 'Create Account' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput 
                            label="Full Name"
                            value={adminModal.formData.name}
                            onChange={(e) => setAdminModal(prev => ({ ...prev, formData: { ...prev.formData, name: e.target.value } }))}
                            required
                        />
                        <FormInput 
                            label="Email Address"
                            type="email"
                            value={adminModal.formData.email}
                            onChange={(e) => setAdminModal(prev => ({ ...prev, formData: { ...prev.formData, email: e.target.value } }))}
                            required
                        />
                    </div>

                    {adminModal.type === 'create' && (
                        <FormInput 
                            label="Access Password"
                            type="password"
                            value={adminModal.formData.password}
                            onChange={(e) => setAdminModal(prev => ({ ...prev, formData: { ...prev.formData, password: e.target.value } }))}
                            required
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect 
                            label="Security Role"
                            value={adminModal.formData.role}
                            onChange={(e) => setAdminModal(prev => ({ ...prev, formData: { ...prev.formData, role: e.target.value } }))}
                            options={roles.map(r => ({ label: r.name, value: r.name }))}
                            required
                        />
                        <FormSelect 
                            label="Account Status"
                            value={adminModal.formData.status}
                            onChange={(e) => setAdminModal(prev => ({ ...prev, formData: { ...prev.formData, status: e.target.value } }))}
                            options={[
                                { label: 'Active', value: 'Active' },
                                { label: 'Inactive / Suspended', value: 'Inactive' }
                            ]}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">IP Whitelist (Comma separated)</label>
                        <textarea 
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-24 font-mono shadow-inner"
                            placeholder="e.g. 192.168.1.1, 10.0.0.5"
                            value={adminModal.formData.ipWhitelist}
                            onChange={(e) => setAdminModal(prev => ({ ...prev, formData: { ...prev.formData, ipWhitelist: e.target.value } }))}
                        />
                        <p className="text-[10px] text-slate-400 font-bold px-1 italic">Leave empty to allow access from any IP address.</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
