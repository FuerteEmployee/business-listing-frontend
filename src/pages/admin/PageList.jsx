import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    File, Plus, Edit, Trash2, Eye, Search, Filter, 
    Calendar, User, Globe, Lock, Archive, Layout
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import AdminFilters from "../../components/admin/AdminFilters";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Modal from "../../components/ui/Modal";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

export default function PageList() {
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    
    const [filters, setFilters] = useState({
        search: '',
        status: ''
    });

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, pageId: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPages = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page,
                limit: pagination.limit,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status })
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/cms/pages?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPages(data.pages || []);
                setPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0 }));
            } else {
                throw new Error('Failed to fetch pages');
            }
        } catch (err) {
            console.error("Error fetching pages:", err);
            setError("Could not load static pages. Technical disruption detected.");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchPages(1);
    }, [fetchPages]);

    const handleDelete = async () => {
        if (!confirmModal.pageId) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/cms/pages/${confirmModal.pageId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Static resource decommissioned');
                setConfirmModal({ isOpen: false, pageId: null });
                fetchPages(pagination.page);
            } else {
                toast.error('Deletion protocol failed');
            }
        } catch (err) {
            toast.error('Technical error during deletion');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'published': return <Badge variant="success" icon={Globe}>Online</Badge>;
            case 'draft': return <Badge variant="warning" icon={Lock}>Offline</Badge>;
            case 'archived': return <Badge variant="secondary" icon={Archive}>Archived</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const columns = [
        {
            label: "Page Name",
            key: "title",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                        <File className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 leading-tight">{row.title}</div>
                        <div className="text-[11px] text-slate-500 font-medium">/{row.slug || 'no-slug'}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Publication State",
            key: "status",
            render: (value) => getStatusBadge(value)
        },
        {
            label: "Layout Model",
            key: "layout",
            render: (value) => (
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-500 uppercase tracking-widest">
                    <Layout className="w-3 h-3" />
                    {value || 'Default'}
                </div>
            )
        },
        {
            label: "Last Modification",
            key: "updatedAt",
            render: (value) => (
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs">
                        {new Date(value).toLocaleDateString()}
                    </span>
                </div>
            )
        }
    ];

    const actions = [
        {
            label: "Inspect / View",
            icon: Eye,
            onClick: (row) => window.open(`/${row.slug}`, '_blank')
        },
        {
            label: "Modify Structure",
            icon: Edit,
            onClick: (row) => navigate(`/admin/cms/pages/edit/${row._id}`)
        },
        {
            label: "Decommission",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, pageId: row._id })
        }
    ];

    const filterFields = [
        {
            key: 'search',
            label: 'Search Pages',
            type: 'search',
            placeholder: 'Search titles...'
        },
        {
            key: 'status',
            label: 'Publication State',
            type: 'select',
            options: [
                { label: 'All Statuses', value: '' },
                { label: 'Online / Public', value: 'published' },
                { label: 'Offline / Draft', value: 'draft' },
                { label: 'Legacy / Archived', value: 'archived' }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Static Architecture"
                subtitle="Manage core platform pages and legal documentation"
                actions={
                    <Button 
                        variant="primary" 
                        icon={Plus} 
                        onClick={() => navigate('/admin/cms/pages/new')}
                    >
                        Establish New Page
                    </Button>
                }
            />

            {/* Filters */}
            <AdminFilters 
                filters={filterFields.map(f => ({ ...f, value: filters[f.key] }))}
                onFilterChange={(key, value) => {
                    setFilters(prev => ({ ...prev, [key]: value }));
                }}
                onReset={() => {
                    setFilters({ search: '', status: '' });
                }}
            />

            {/* Content Table */}
            <DataTable 
                columns={columns}
                data={pages}
                isLoading={isLoading}
                actions={actions}
                actionMode="dropdown"
                error={error}
                pagination={{
                    currentPage: pagination.page,
                    totalItems: pagination.total,
                    itemsPerPage: pagination.limit,
                    onPageChange: fetchPages
                }}
            />

            {/* Delete Confirmation */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, pageId: null })}
                title="Static Resource Decommissioning"
                subtitle="Permanent database entry removal"
                icon={Trash2}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, pageId: null })}>Abort Protocol</Button>
                        <Button 
                            variant="danger" 
                            onClick={handleDelete}
                            isLoading={actionLoading}
                        >
                            Confirm Purge
                        </Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-bold leading-relaxed">
                    Are you certain you wish to purge this static page? This action is irreversible.
                </p>
            </Modal>
        </div>
    );
}
