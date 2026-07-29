import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Upload, Globe, Lock, Archive, Tag, Search, Image as ImageIcon, FileText, ChevronRight, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// System Standard Components
import { Button } from "../../components/ui/button";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import { FormTextarea } from "../../components/ui/FormTextarea";
import ImageUploadBox from "../../components/ui/ImageUploadBox";
import { Badge } from "../../components/ui/badge";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const ArticleEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: 'blog',
        tags: [],
        status: 'draft',
        featuredImage: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: []
    });
    const [tagInput, setTagInput] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchArticle();
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/articles/${id}`);
            if (!response.ok) throw new Error('Failed to fetch article');

            const data = await response.json();
            setFormData({
                ...data.article,
                tags: data.article.tags || [],
                seoKeywords: data.article.seoKeywords || []
            });
        } catch (error) {
            console.error('Error fetching article:', error);
            toast.error('Failed to load article');
            navigate('/admin/cms/articles');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e, publish = false) => {
        if (e) e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('Title and content are required for broadcasting');
            return;
        }

        try {
            setSaving(true);
            const submitData = {
                ...formData,
                status: publish ? 'published' : (isEditing ? formData.status : 'draft')
            };

            const url = isEditing ? `${API_BASE_URL}/cms/articles/${id}` : `${API_BASE_URL}/cms/articles`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(submitData)
            });

            if (!response.ok) throw new Error('Protocol failure during synchronization');

            const data = await response.json();
            toast.success(isEditing ? 'Intelligence updated' : 'Initial transmission successful');

            if (publish || isEditing) {
                navigate('/admin/cms/articles');
            } else {
                navigate(`/admin/cms/articles/edit/${data.article._id}`);
            }
        } catch (error) {
            console.error('Error saving article:', error);
            toast.error('Technical disruption: Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('category', 'article');

        try {
            setUploading(true);
            const response = await fetch(`${API_BASE_URL}/cms/media/upload`, {
                method: 'POST',
                body: uploadData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Media upload sequence failed');

            const data = await response.json();
            setFormData(prev => ({ ...prev, featuredImage: data.media.url }));
            toast.success('Visual asset integrated');
        } catch (error) {
            toast.error('Asset upload failure');
        } finally {
            setUploading(false);
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
                title={isEditing ? 'Refine Intelligence' : 'Draft New Insight'}
                subtitle="Manage and create high-resonance journal content and platform updates."
                badge={
                    <div className="flex items-center gap-5 mb-4">
                        <button
                            onClick={() => navigate('/admin/cms/articles')}
                            className="w-12 h-12 bg-white border border-slate-200 rounded-[18px] flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol</span>
                                <ChevronRight size={10} className="text-slate-300" />
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Journal System</span>
                            </div>
                        </div>
                    </div>
                }
                actions={
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            icon={Eye}
                            onClick={() => navigate(`/admin/cms/articles/preview/${id || 'new'}`)}
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
                            {isEditing ? 'Synchronize' : 'Broadcast'}
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
                            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                <Tag className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Primary Metadata</h3>
                        </div>
                        
                        <FormInput
                            label="Article Title"
                            placeholder="Enter the primary headline..."
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                            className="text-lg font-bold"
                        />

                        <FormTextarea
                            label="Cognitive Excerpt"
                            placeholder="Brief summary for indexing and previews..."
                            value={formData.excerpt}
                            onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                            rows={3}
                        />
                    </div>

                    {/* Rich Text Editor */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Core Intelligence Content</h3>
                        </div>
                        
                        <div className="rich-text-editor-container">
                             <ReactQuill 
                                theme="snow" 
                                value={formData.content} 
                                onChange={(content) => setFormData({ ...formData, content })}
                                modules={quillModules}
                                formats={quillFormats}
                                className="h-[500px] mb-12 rounded-2xl overflow-hidden border-slate-200"
                            />
                        </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                <Search className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Organic Search Optimization</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                            <FormInput
                                label="SEO Title Overrule"
                                placeholder="Custom title for search algorithms..."
                                value={formData.seoTitle}
                                onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                            />

                            <FormTextarea
                                label="Meta Description"
                                placeholder="Search engine snippet content..."
                                value={formData.seoDescription}
                                onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                                rows={3}
                            />

                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">SEO Keywords (Indexable Entities)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add entity keyword..."
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), keywordInput && (setFormData({ ...formData, seoKeywords: [...formData.seoKeywords, keywordInput] }), setKeywordInput('')))}
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-[20px] px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                    />
                                    <Button 
                                        variant="outline" 
                                        type="button" 
                                        onClick={() => { if(keywordInput) {setFormData({ ...formData, seoKeywords: [...formData.seoKeywords, keywordInput] }); setKeywordInput('');} }}
                                        className="rounded-[20px] px-8"
                                    >
                                        Extract
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {formData.seoKeywords.map((tag, i) => (
                                        <Badge key={i} variant="primary" className="pl-4 pr-3 py-2 flex items-center gap-2 group hover:bg-indigo-600 transition-colors">
                                            <span className="font-bold">{tag}</span>
                                            <button 
                                                onClick={() => setFormData({...formData, seoKeywords: formData.seoKeywords.filter((_, idx)=>idx!==i)})} 
                                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    ))}
                                    {formData.seoKeywords.length === 0 && (
                                        <div className="text-[10px] font-medium text-slate-400 italic">No keywords extracted yet...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Configuration */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Visual Asset Integration */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Featured Asset</h3>
                        </div>
                        
                        <ImageUploadBox
                            imagePreview={formData.featuredImage}
                            isUploading={uploading}
                            onImageChange={handleImageChange}
                            title="Hero Image"
                            imageSizeClass="w-full aspect-[4/3]"
                        />
                        {formData.featuredImage && (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-rose-500 font-bold hover:bg-rose-50 rounded-2xl" 
                                onClick={() => setFormData({...formData, featuredImage: ''})}
                            >
                                Purge Visual Asset
                            </Button>
                        )}
                    </div>

                    {/* Policy & Classification State */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                                <Lock className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Policy & Sector</h3>
                        </div>
                        
                        <FormSelect
                            label="Intelligence Sector"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            options={[
                                { label: 'Strategic Journal (Blog)', value: 'blog' },
                                { label: 'Platform Intelligence (News)', value: 'news' },
                                { label: 'Protocol Update', value: 'update' },
                                { label: 'Operational Guide', value: 'guide' }
                            ]}
                        />

                        <FormSelect
                            label="Publication Level"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            options={[
                                { label: 'Global Broadcast (Live)', value: 'published' },
                                { label: 'Restricted Draft', value: 'draft' },
                                { label: 'System Archive', value: 'archived' }
                            ]}
                        />
                    </div>

                    {/* Tips / Info */}
                    <div className="bg-indigo-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                             <Globe size={100} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-400" /> Professional Insight
                            </h4>
                            <p className="text-indigo-200/70 text-sm font-medium leading-relaxed italic">
                                "High-resonance content utilizes optimized metadata. Ensure excerpts are concise and keywords target organic platform resonance."
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
                    min-height: 400px !important;
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

export default ArticleEditor;;