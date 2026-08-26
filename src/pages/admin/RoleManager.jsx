import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, AlertCircle, Copy, Trash2, User, Search, Save, X, Trash, Edit2, Filter } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormSelect from "../../components/ui/FormSelect";
import FormInput from "../../components/ui/FormInput";
import AdminHeader from "../../components/admin/AdminHeader";

export default function RoleManager() {
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

    // Filter state
    const [filters, setFilters] = useState({
        search: ""
    });

    // Modal states
    const [createModal, setCreateModal] = useState({ isOpen: false, formData: { name: "", description: "", cloneFrom: "" } });
    const [editModal, setEditModal] = useState({ isOpen: false, role: null, formData: { name: "", description: "" } });
    const [permissionModal, setPermissionModal] = useState({ isOpen: false, role: null, permissions: {} });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, role: null });

    const [actionLoading, setActionLoading] = useState(false);
    const [allRoles, setAllRoles] = useState([]);

    // Permission modules aligned with backend schema
    const permissionModules = [
        { id: "userManagement", label: "User Management", actions: ["read", "write", "delete"] },
        { id: "listingManagement", label: "Listing Management", actions: ["read", "write", "delete", "approve"] },
        { id: "reviewModeration", label: "Review Moderation", actions: ["read", "write", "delete", "approve"] },
        { id: "cmsManagement", label: "CMS Management", actions: ["read", "write", "delete", "approve"] },
        { id: "visualManagement", label: "Visuals (Banners/Media)", actions: ["read", "write", "delete"] },
        { id: "seoManagement", label: "SEO Blocks", actions: ["read", "write", "delete"] },
        { id: "roleManagement", label: "Role Management", actions: ["read", "write", "delete"] },
        { id: "adminManagement", label: "Admin Management", actions: ["read", "write", "delete"] },
        { id: "auditLog", label: "Audit Logs", actions: ["read"] },
        { id: "analytics", label: "Analytics", actions: ["read"] },
        { id: "messaging", label: "Messaging", actions: ["read", "write"] },
        { id: "impersonation", label: "Impersonation", actions: ["execute"] },
        { id: "reporting", label: "Reporting & Exports", actions: ["read", "export"] }
    ];

    // Fetch roles
    const fetchRoles = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams({
                limit: pagination.limit,
                page,
                ...(filters.search && { search: filters.search })
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/admin/roles?${params}`);
            if (res.ok) {
                const data = await res.json();
                setRoles(data.roles || []);
                setAllRoles(data.roles || []);
                setPagination(prev => ({ ...prev, page, total: data.total || 0 }));
            } else {
                const errData = await res.json();
                setError(errData.msg || "Failed to fetch roles");
            }
        } catch (err) {
            console.error("Error fetching roles:", err);
            setError("Error loading roles");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchRoles(1);
    }, [filters]);

    // Action handlers
    const handleCreateRole = async () => {
        if (!createModal.formData.name) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/roles`, {
                method: 'POST',
                body: JSON.stringify({
                    name: createModal.formData.name,
                    description: createModal.formData.description,
                    // API field is `baseRole`; the UI calls the same thing "Clone Permissions From"
                    baseRole: createModal.formData.cloneFrom || null
                })
            });
            if (res.ok) {
                await fetchRoles(pagination.page);
                setCreateModal({ isOpen: false, formData: { name: "", description: "", cloneFrom: "" } });
            }
        } catch (err) {
            console.error("Error creating role:", err);
            setError("Failed to create role");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditRole = async () => {
        if (!editModal.role || !editModal.formData.name) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/roles/${editModal.role._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: editModal.formData.name,
                    description: editModal.formData.description
                })
            });
            if (res.ok) {
                await fetchRoles(pagination.page);
                setEditModal({ isOpen: false, role: null, formData: { name: "", description: "" } });
            }
        } catch (err) {
            console.error("Error updating role:", err);
            setError("Failed to update role");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!permissionModal.role) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/roles/${permissionModal.role._id}`, {
                method: 'PUT',
                body: JSON.stringify({ permissions: permissionModal.permissions })
            });
            if (res.ok) {
                await fetchRoles(pagination.page);
                setPermissionModal({ isOpen: false, role: null, permissions: {} });
            }
        } catch (err) {
            console.error("Error updating permissions:", err);
            setError("Failed to update permissions");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!deleteModal.role) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/roles/${deleteModal.role._id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchRoles(pagination.page);
                setDeleteModal({ isOpen: false, role: null });
            }
        } catch (err) {
            console.error("Error deleting role:", err);
            setError("Failed to delete role");
        } finally {
            setActionLoading(false);
        }
    };

    // DataTable columns definition
    const columns = [
        {
            label: "Role Name",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-800">{row.name}</span>
                </div>
            )
        },
        {
            label: "Permissions",
            key: "permissions",
            render: (value, row) => {
                const p = row.permissions || {};
                const activeModules = Object.keys(p).filter(key => 
                    Object.values(p[key] || {}).some(val => val === true)
                );
                return (
                    <div className="flex flex-wrap gap-1">
                        {activeModules.slice(0, 2).map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
                                {m}
                            </span>
                        ))}
                        {activeModules.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">+{activeModules.length - 2} more</span>
                        )}
                        {activeModules.length === 0 && (
                            <span className="text-[10px] text-slate-300 italic font-medium">No permissions</span>
                        )}
                    </div>
                );
            }
        },
        {
            label: "Status",
            key: "isBuiltIn",
            render: (value, row) => (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-tighter ${
                    row.isBuiltIn 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                    {row.isBuiltIn ? 'Built-in' : 'Custom'}
                </span>
            )
        }
    ];

    const tableActions = [
        {
            label: "Edit Permissions",
            icon: Shield,
            onClick: (role) => setPermissionModal({ isOpen: true, role, permissions: role.permissions || {} })
        },
        {
            label: "Edit Role",
            icon: Edit2,
            onClick: (role) => setEditModal({ isOpen: true, role, formData: { name: role.name, description: role.description } })
        },
        {
            label: "Delete Role",
            icon: Trash2,
            onClick: (role) => setDeleteModal({ isOpen: true, role }),
            isDangerous: true,
            condition: role => !role.isBuiltIn
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Role Management"
                subtitle="Centrally manage administrative roles, fine-tune granular permissions, and ensure principle of least privilege access control."
                badge={<Badge variant="premium">Administrative Hub</Badge>}
                actions={
                    <Button variant="primary" leftIcon={Plus} onClick={() => setCreateModal({ isOpen: true, formData: { name: "", description: "", cloneFrom: "" } })}>
                        Create Role
                    </Button>
                }
            />

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="w-full sm:flex-1 sm:min-w-[250px]">
                    <FormInput 
                        label="Identity Search"
                        placeholder="Search roles by name..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="!mb-0"
                    />
                </div>
                <Button 
                    variant="outline" 
                    className="h-[46px] w-[46px] !hidden sm:!inline-flex"
                    size="icon"
                    onClick={() => setFilters({ search: "" })}
                >
                    <Filter className="w-5 h-5" />
                </Button>
            </div>

            {/* Main Table */}
            <DataTable 
                data={roles}
                columns={columns}
                actions={tableActions}
                actionMode="dropdown"
                isLoading={isLoading}
                itemsPerPage={pagination.limit}
                currentPage={pagination.page}
                totalItems={pagination.total}
                onPageChange={(page) => fetchRoles(page)}
            />

            {/* Create Role Modal */}
            <Modal
                isOpen={createModal.isOpen}
                onClose={() => setCreateModal({ isOpen: false, formData: { name: "", description: "", cloneFrom: "" } })}
                title="Create New Role"
                subtitle="Define a new administrative role and its scope"
                icon={Shield}
                size="md"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setCreateModal({ isOpen: false, formData: { name: "", description: "", cloneFrom: "" } })}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateRole} 
                            isLoading={actionLoading}
                        >
                            Create Role
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <FormInput
                        label="Role Name"
                        placeholder="e.g., Moderator, Billing Admin"
                        value={createModal.formData.name}
                        onChange={e => setCreateModal(prev => ({ ...prev, formData: { ...prev.formData, name: e.target.value } }))}
                        required
                    />
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest pl-1">Description</label>
                        <textarea rows={3} placeholder="Describe what this role can do..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                            value={createModal.formData.description}
                            onChange={e => setCreateModal(prev => ({ ...prev, formData: { ...prev.formData, description: e.target.value } }))} />
                    </div>
                    <FormSelect
                        label="Clone Permissions From"
                        value={createModal.formData.cloneFrom}
                        onChange={e => setCreateModal(prev => ({ ...prev, formData: { ...prev.formData, cloneFrom: e.target.value } }))}
                        placeholder="None (Start Fresh)"
                        options={allRoles.map(r => ({ label: r.name, value: r.name }))}
                    />
                </div>
            </Modal>

            {/* Edit Role Modal */}
            <Modal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, role: null, formData: { name: "", description: "" } })}
                title="Edit Role"
                subtitle={`Modify details for ${editModal.role?.name}`}
                icon={Edit2}
                size="md"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setEditModal({ isOpen: false, role: null, formData: { name: "", description: "" } })}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleEditRole} 
                            isLoading={actionLoading}
                        >
                            Save Changes
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <FormInput
                        label="Role Name"
                        placeholder="Role name..."
                        value={editModal.formData.name}
                        onChange={e => setEditModal(prev => ({ ...prev, formData: { ...prev.formData, name: e.target.value } }))}
                        required
                    />
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest pl-1">Description</label>
                        <textarea rows={3} placeholder="Describe what this role can do..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                            value={editModal.formData.description}
                            onChange={e => setEditModal(prev => ({ ...prev, formData: { ...prev.formData, description: e.target.value } }))} />
                    </div>
                </div>
            </Modal>

            {/* Permissions Modal with Matrix UI */}
            <Modal
                isOpen={permissionModal.isOpen}
                onClose={() => setPermissionModal({ isOpen: false, role: null, permissions: {} })}
                title="Edit Permissions"
                subtitle={`Configuring access for ${permissionModal.role?.name}`}
                icon={Shield}
                size="xl"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setPermissionModal({ isOpen: false, role: null, permissions: {} })}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdatePermissions} 
                            isLoading={actionLoading}
                        >
                            Save Permissions
                        </Button>
                    </>
                }
            >
                <div className="overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Module / Scope</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Read / View</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Write / Create</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Delete / Ban</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Approve / Export</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {permissionModules.map(module => (
                                <tr key={module.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <span className="text-sm font-black text-slate-800">{module.label}</span>
                                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5 opacity-50">{module.id}</p>
                                    </td>
                                    {["read", "write", "delete", "approve"].map(action => {
                                        const isExport = action === "approve" && module.id === "reporting";
                                        const isSupported = module.actions.includes(action) || 
                                                           (action === "approve" && module.actions.includes("execute")) ||
                                                           isExport;
                                        
                                        let actualAction = action;
                                        if (action === "approve" && module.actions.includes("execute")) actualAction = "execute";
                                        if (isExport) actualAction = "export";
                                        
                                        return (
                                            <td key={action} className="p-6 text-center">
                                                {isSupported ? (
                                                    <div className="flex justify-center">
                                                        <label className="relative inline-flex items-center cursor-pointer group">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer"
                                                                checked={!!(permissionModal.permissions[module.id] && permissionModal.permissions[module.id][actualAction])}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    setPermissionModal(prev => ({
                                                                        ...prev,
                                                                        permissions: {
                                                                            ...prev.permissions,
                                                                            [module.id]: {
                                                                                ...(prev.permissions[module.id] || {}),
                                                                                [actualAction]: isChecked
                                                                            }
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 group-hover:ring-4 group-hover:ring-indigo-100"></div>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center items-center h-full">
                                                        <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, role: null })}
                title="Delete Role"
                subtitle="This action cannot be undone"
                icon={Trash}
                size="sm"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteModal({ isOpen: false, role: null })}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={handleDeleteRole} 
                            isLoading={actionLoading}
                            className="flex-1"
                        >
                            Delete Role
                        </Button>
                    </>
                }
            >
                <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        Are you sure you want to delete <span className="font-black text-slate-800">"{deleteModal.role?.name}"</span>?
                    </p>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                        Users assigned to this role will need to be reassigned to a different role to maintain their access levels.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
