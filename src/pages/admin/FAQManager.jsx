import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, HelpCircle, Eye, EyeOff, Globe, Lock, Archive, MessageSquare, Tag, Hash, LayoutGrid, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import DataTable from "../../components/admin/DataTable";
import AdminFilters from "../../components/admin/AdminFilters";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import { FormTextarea } from "../../components/ui/FormTextarea";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const FAQManager = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        search: ''
    });

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'general',
        tags: [],
        status: 'draft',
        order: 0
    });

    const [tagInput, setTagInput] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, faqId: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchFAQs = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: pagination.limit,
                ...(filters.category && { category: filters.category }),
                ...(filters.status && { status: filters.status }),
                ...(filters.search && { search: filters.search })
            });

            const response = await fetchWithAuth(`${API_BASE_URL}/cms/faqs?${params}`);
            if (!response.ok) throw new Error('Protocol failure during FAQ retrieval');

            const data = await response.json();
            setFaqs(data.faqs || []);
            setPagination(prev => ({ ...prev, page, total: data.pagination?.total || 0 }));
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            setError('Could not establish connection to knowledge base');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        fetchFAQs(1);
    }, [fetchFAQs]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.question.trim() || !formData.answer.trim()) {
            toast.error('Question and answer required for knowledge entry');
            return;
        }

        try {
            setActionLoading(true);
            const url = editingFaq ? `${API_BASE_URL}/cms/faqs/${editingFaq._id}` : `${API_BASE_URL}/cms/faqs`;
            const method = editingFaq ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Save protocol failed');

            toast.success(editingFaq ? 'Intelligence entry refined' : 'New knowledge acquired');
            setShowForm(false);
            setEditingFaq(null);
            resetForm();
            fetchFAQs(pagination.page);
        } catch (error) {
            console.error('Error saving FAQ:', error);
            toast.error('Technical disruption: Save failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (faq) => {
        setEditingFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            tags: faq.tags || [],
            status: faq.status,
            order: faq.order || 0
        });
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!confirmModal.faqId) return;

        try {
            setActionLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/faqs/${confirmModal.faqId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Deletion sequence failed');

            toast.success('Resource decommissioned');
            setConfirmModal({ isOpen: false, faqId: null });
            fetchFAQs(pagination.page);
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            toast.error('Deletion protocol failed');
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            question: '',
            answer: '',
            category: 'general',
            tags: [],
            status: 'draft',
            order: 0
        });
        setTagInput('');
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()]
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const columns = [
        {
            label: "Inquiry / Question",
            key: "question",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 leading-tight truncate max-w-[300px]">{row.question}</div>
                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-[300px]">{row.answer}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Classification",
            key: "category",
            render: (value) => (
                <Badge variant="outline" className="capitalize px-3 py-1 font-bold text-[10px] tracking-widest border-slate-200 text-slate-600 bg-slate-50">
                    {value}
                </Badge>
            )
        },
        {
            label: "Publication State",
            key: "status",
            render: (value) => {
                switch (value) {
                    case 'published': return <Badge variant="success" icon={CheckCircle}>Public</Badge>;
                    case 'draft': return <Badge variant="warning" icon={Lock}>Draft</Badge>;
                    case 'archived': return <Badge variant="secondary" icon={Archive}>Archived</Badge>;
                    default: return <Badge variant="outline">{value}</Badge>;
                }
            }
        },
        {
            label: "Priority",
            key: "order",
            render: (value) => (
                <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-400">
                    <Hash className="w-3 h-3" />
                    {value || 0}
                </div>
            )
        }
    ];

    const actions = [
        {
            label: "Inspect / Edit",
            icon: Edit,
            onClick: (row) => handleEdit(row)
        },
        {
            label: "Decommission",
            icon: Trash2,
            isDangerous: true,
            onClick: (row) => setConfirmModal({ isOpen: true, faqId: row._id })
        }
    ];

    const filterFields = [
        {
            key: 'search',
            label: 'Intelligence Search',
            type: 'search',
            placeholder: 'Search inquiries...'
        },
        {
            key: 'category',
            label: 'Classification',
            type: 'select',
            options: [
                { label: 'All Categories', value: '' },
                { label: 'General', value: 'general' },
                { label: 'Business', value: 'business' },
                { label: 'User', value: 'user' },
                { label: 'Technical', value: 'technical' },
                { label: 'Billing', value: 'billing' },
                { label: 'Legal', value: 'legal' }
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
                title="Knowledge Base"
                subtitle="Manage and refine platform intelligence criteria"
                actions={
                    <Button 
                        variant="primary" 
                        icon={Plus} 
                        onClick={() => {
                            setEditingFaq(null);
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        Initialize Inquiry
                    </Button>
                }
            />

            {/* Dash Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Knowledge Units</p>
                            <p className="text-3xl font-black text-slate-900">{pagination.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Public Broadcast</p>
                            <p className="text-3xl font-black text-emerald-600">
                                {faqs.filter(f => f.status === 'published').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                            <Globe className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Internal Drafts</p>
                            <p className="text-3xl font-black text-amber-500">
                                {faqs.filter(f => f.status === 'draft').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                            <Lock className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <AdminFilters 
                filters={filterFields.map(f => ({ ...f, value: filters[f.key] }))}
                onFilterChange={(key, value) => {
                    setFilters(prev => ({ ...prev, [key]: value }));
                }}
                onReset={() => {
                    setFilters({ category: '', status: '', search: '' });
                }}
            />

            {/* Main Table */}
            <DataTable 
                columns={columns}
                data={faqs}
                isLoading={loading}
                actions={actions}
                actionMode="dropdown"
                error={error}
                pagination={{
                    currentPage: pagination.page,
                    totalItems: pagination.total,
                    itemsPerPage: pagination.limit,
                    onPageChange: fetchFAQs
                }}
            />

            {/* FAQ Manager Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingFaq(null);
                    resetForm();
                }}
                title={editingFaq ? "Refine Knowledge" : "Acquire Intelligence"}
                subtitle={editingFaq ? `Entry ID: ${editingFaq._id.substring(0, 12)}` : "Define new inquiry criteria"}
                icon={HelpCircle}
                size="xl"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                         <Button variant="ghost" onClick={() => { setShowForm(false); setEditingFaq(null); resetForm(); }}>Cancel Protocol</Button>
                         <Button variant="primary" onClick={handleSubmit} isLoading={actionLoading}>
                             {editingFaq ? 'Synchronize' : 'Authorize Entry'}
                         </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <FormInput
                        label="Question / Inquiry Protocol"
                        placeholder="What criteria should the user inquire about?"
                        value={formData.question}
                        onChange={(e) => setFormData({...formData, question: e.target.value})}
                        required
                    />

                    <FormTextarea
                        label="Definitive Resolution / Answer"
                        placeholder="Provide the comprehensive intelligence response..."
                        value={formData.answer}
                        onChange={(e) => setFormData({...formData, answer: e.target.value})}
                        rows={6}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormSelect
                            label="Intelligence Classification"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            options={[
                                { value: 'general', label: 'General' },
                                { value: 'business', label: 'Business' },
                                { value: 'user', label: 'User' },
                                { value: 'technical', label: 'Technical' },
                                { value: 'billing', label: 'Billing' },
                                { value: 'legal', label: 'Legal' }
                            ]}
                        />

                        <FormSelect
                            label="Security / Publication Level"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            options={[
                                { value: 'draft', label: 'Internal Draft' },
                                { value: 'published', label: 'Public Broadcast' },
                                { value: 'archived', label: 'Legacy Archive' }
                            ]}
                        />

                        <FormInput
                            label="Sort Order Priority"
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                        />
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata Tags</h4>
                        </div>
                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="flex-1 bg-white border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                placeholder="Add indexing keyword..."
                            />
                            <Button variant="ghost" type="button" onClick={addTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                                <Badge key={index} variant="primary" className="pl-3 pr-2 py-1.5 flex items-center gap-1.5">
                                    #{tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">×</button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* confirm Purge Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, faqId: null })}
                title="Intelligence Purge"
                subtitle="Permanent knowledge declassification"
                icon={Trash2}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, faqId: null })}>Retain Entry</Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>Confirm Deletion</Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-bold leading-relaxed">
                    Are you certain you wish to purge this knowledge entry? This operation is permanent and will remove the criteria from the public knowledge base.
                </p>
            </Modal>
        </div>
    );
};

export default FAQManager;