import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, Plus, Edit, Trash2, Eye, Search, Filter, 
    Calendar, User, Tag, Globe, Lock, Archive
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import AdminFilters from "../../components/admin/AdminFilters";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Modal from "../../components/ui/Modal";
import AdminHeader from "../../components/admin/AdminHeader";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

export default function ArticleList() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        status: ''
    });

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, articleId: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchArticles = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page,
                limit: pagination.limit,
                ...(filters.search && { search: filters.search }),
                ...(filters.category && { category: filters.category }),
                ...(filters.status && { status: filters.status })
            });

            const res = await fetchWithAuth(`${API_BASE_URL}/cms/articles?${params}`);
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles || []);
                setPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0 }));
            } else {
                throw new Error('Failed to fetch articles');
            }
        } catch (err) {
            console.error("Error fetching articles:", err);
            setError("Could not load articles. Technical disruption detected.");
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchArticles(1);
    }, [fetchArticles]);

    const handleDelete = async () => {
        if (!confirmModal.articleId) return;
        try {
            setActionLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/cms/articles/${confirmModal.articleId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Resource decommissioned successfully');
                setConfirmModal({ isOpen: false, articleId: null });
                fetchArticles(pagination.page);
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
            case 'published': return <Badge variant="success" icon={Globe}>Published</Badge>;
            case 'draft': return <Badge variant="warning" icon={Lock}>Draft</Badge>;
            case 'archived': return <Badge variant="secondary" icon={Archive}>Archived</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const columns = [
        {
            label: "Article Title",
            key: "title",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                        {row.featuredImage ? (
                            <img src={row.featuredImage} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <FileText className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 leading-tight">{row.title}</div>
                        <div className="text-[11px] text-slate-500 font-medium">/{row.slug || 'no-slug'}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Category",
            key: "category",
            render: (value) => (
                <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 capitalize">{value}</span>
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (value) => getStatusBadge(value)
        },
        {
            label: "Author",
            key: "author",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                        {row.author?.name?.charAt(0) || 'A'}
                    </div>
                    <span className="text-xs font-bold text-slate-600">{row.author?.name || 'Admin'}</span>
                </div>
            )
        },
        {
            label: "Date",
            key: "createdAt",
            render: (value) => (
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs whitespace-nowrap">
                        {new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            )
        }
    ];

    const actions = [
        {
            label: "View / Preview",
            icon: Eye,
            onClick: (row) => navigate(`/admin/cms/articles/preview/${row._id}`)
        },
        {
            label: "Refine Content",
            icon: Edit,
            onClick: (row) => navigate(`/admin/cms/articles/edit/${row._id}`)
        },
        {
            label: "Decommission",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, articleId: row._id })
        }
    ];

    const filterFields = [
        {
            key: 'search',
            label: 'Intelligence Search',
            type: 'search',
            placeholder: 'Search titles or keywords...'
        },
        {
            key: 'category',
            label: 'Classification',
            type: 'select',
            options: [
                { label: 'All Categories', value: '' },
                { label: 'Blog Post', value: 'blog' },
                { label: 'News', value: 'news' },
                { label: 'Update', value: 'update' },
                { label: 'Guide', value: 'guide' }
            ]
        },
        {
            key: 'status',
            label: 'Publication State',
            type: 'select',
            options: [
                { label: 'All Statuses', value: '' },
                { label: 'Published / Public', value: 'published' },
                { label: 'Draft / Private', value: 'draft' },
                { label: 'Archived / Legacy', value: 'archived' }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Intelligence Journal"
                subtitle="Manage and broadcast strategic articles, blogs, and insights"
                actions={
                    <Button 
                        variant="primary" 
                        icon={Plus} 
                        onClick={() => navigate('/admin/cms/articles/new')}
                    >
                        Initialize Article
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
                    setFilters({ search: '', category: '', status: '' });
                }}
            />

            {/* Content Table */}
            <DataTable 
                columns={columns}
                data={articles}
                isLoading={isLoading}
                actions={actions}
                actionMode="dropdown"
                error={error}
                pagination={{
                    currentPage: pagination.page,
                    totalItems: pagination.total,
                    itemsPerPage: pagination.limit,
                    onPageChange: fetchArticles
                }}
            />

            {/* Delete Confirmation */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, articleId: null })}
                title="Resource Decommissioning"
                subtitle="Permanent database entry removal"
                icon={Trash2}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, articleId: null })}>Abind Protocol</Button>
                        <Button 
                            variant="danger" 
                            onClick={handleDelete}
                            isLoading={actionLoading}
                        >
                            Confirm Deletion
                        </Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-bold leading-relaxed">
                    Are you certain you wish to delete this article? This operation is permanent and all associated intelligence data will be purged.
                </p>
            </Modal>
        </div>
    );
}
