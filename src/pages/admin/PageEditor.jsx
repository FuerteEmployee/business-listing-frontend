import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Globe, Lock, Archive, Search, FileText, Layout, ChevronRight, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// System Standard Components
import { Button } from "../../components/ui/button";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import { FormTextarea } from "../../components/ui/FormTextarea";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const PageEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        slug: '',
        status: 'draft',
        layout: 'default',
        seoTitle: '',
        seoDescription: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchPage();
        }
    }, [id]);

    const fetchPage = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/pages/${id}`);
            if (!response.ok) throw new Error('Failed to fetch page');

            const data = await response.json();
            setFormData(data.page);
        } catch (error) {
            console.error('Error fetching page:', error);
            toast.error('Failed to load static resource');
            navigate('/admin/cms/pages');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e, publish = false) => {
        if (e) e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Architecture requires title and content definition');
            return;
        }

        try {
            setSaving(true);
            const submitData = {
                ...formData,
                status: publish ? 'published' : (isEditing ? formData.status : 'draft')
            };

            const url = isEditing ? `${API_BASE_URL}/cms/pages/${id}` : `${API_BASE_URL}/cms/pages`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(submitData)
            });

            if (!response.ok) throw new Error('Protocol failure during synchronization');

            toast.success(isEditing ? 'Architecture refined' : 'Static resource established');
            navigate('/admin/cms/pages');
        } catch (error) {
            console.error('Error saving page:', error);
            toast.error('Technical disruption: Save failed');
        } finally {
            setSaving(false);
        }
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image', 'video'],
            ['clean'],
            [{ 'align': [] }]
        ],
    };

    const quillFormats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'link', 'image', 'video',
        'color', 'background',
        'align'
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <AdminHeader 
                title={isEditing ? 'Architectural Refinement' : 'Static Page Definition'}
                subtitle="Configure static platform content and SEO parameters"
                badge={
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => navigate('/admin/cms/pages')}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol</span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Static Architecture</span>
                        </div>
                    </div>
                }
                actions={
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            icon={Eye}
                            onClick={() => window.open(`/${formData.slug}`, '_blank')}
                            className="flex-1 md:flex-none"
                        >
                            Preview
                        </Button>
                        <Button
                            variant="primary"
                            icon={Globe}
                            onClick={(e) => handleSubmit(e, true)}
                            isLoading={saving}
                            className="flex-1 md:flex-none shadow-indigo-200 shadow-lg"
                        >
                            {isEditing ? 'Synchronize Resource' : 'Initialize Resource'}
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Basic Info */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Primary Architecture</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormInput
                                label="Page Title"
                                placeholder="Enter page headline..."
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                                className="font-bold"
                            />
                            <FormInput
                                label="URL Slug"
                                placeholder="page-slug-identifier"
                                value={formData.slug}
                                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                required
                                className="font-mono text-xs italic"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Content Canvas</label>
                            <div className="rich-text-editor-container">
                                <ReactQuill 
                                    theme="snow" 
                                    value={formData.content} 
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    className="h-[600px] mb-12 rounded-2xl overflow-hidden border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                <Search className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Search Engine Parameters</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                            <FormInput
                                label="SEO Meta Title"
                                placeholder="Optimization title..."
                                value={formData.seoTitle}
                                onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                            />

                            <FormTextarea
                                label="Meta Description Snippet"
                                placeholder="Define the search indexing description..."
                                value={formData.seoDescription}
                                onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Configuration */}
                <div className="lg:col-span-4 space-y-10">
                    {/* State & Layout */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                                <Layout className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Structural Config</h3>
                        </div>
                        
                        <FormSelect
                            label="Publication State"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            options={[
                                { label: 'Online / Public', value: 'published' },
                                { label: 'Offline / Draft', value: 'draft' },
                                { label: 'Legacy / Archive', value: 'archived' }
                            ]}
                        />

                        <FormSelect
                            label="Template Model"
                            value={formData.layout}
                            onChange={(e) => setFormData({...formData, layout: e.target.value})}
                            options={[
                                { label: 'Default Structure', value: 'default' },
                                { label: 'Full Width Canvas', value: 'full-width' },
                                { label: 'Centered Document', value: 'centered' },
                                { label: 'Legal Documentation', value: 'legal' }
                            ]}
                        />
                    </div>

                    <div className="p-10 bg-indigo-50 rounded-[40px] border border-indigo-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                             <Zap size={80} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Live Protocol
                            </h4>
                            <p className="text-[11px] text-indigo-700/70 font-bold leading-relaxed italic">
                                "Static pages are top-level architectural elements. Modifying slugs may disrupt existing external link protocols across the global network."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .ql-container.ql-snow {
                    border: none !important;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 16px !important;
                }
                .ql-toolbar.ql-snow {
                    border: none !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 20px !important;
                    background: #f8fafc !important;
                    border-radius: 20px 20px 0 0 !important;
                }
                .ql-editor {
                    padding: 30px !important;
                    min-height: 500px !important;
                }
                .ql-editor.ql-blank::before {
                    left: 30px !important;
                    color: #94a3b8 !important;
                    font-style: normal !important;
                }
                .rich-text-editor-container .quill {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 24px !important;
                    overflow: hidden !important;
                    transition: all 0.2s ease !important;
                }
                .rich-text-editor-container .quill:focus-within {
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
                }
            ` }} />
        </div>
    );
};

export default PageEditor;
