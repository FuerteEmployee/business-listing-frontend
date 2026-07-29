import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    File,
    Image as ImageIcon,
    HelpCircle,
    Plus,
    Eye,
    Edit,
    Trash2,
    BarChart3,
    ArrowRight,
    Search,
    Clock,
    CheckCircle,
    Zap,
    LayoutDashboard,
    Database,
    Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

const CMSDashboard = () => {
    const [stats, setStats] = useState({
        articles: { total: 0, published: 0, draft: 0 },
        pages: { total: 0, published: 0, draft: 0 },
        media: { total: 0, images: 0, videos: 0, documents: 0 },
        faqs: { total: 0, published: 0, draft: 0 }
    });
    const [recentContent, setRecentContent] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [articlesRes, pagesRes, mediaRes, faqsRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/cms/articles?limit=5`),
                fetchWithAuth(`${API_BASE_URL}/cms/pages?limit=5`),
                fetchWithAuth(`${API_BASE_URL}/cms/media?limit=5`),
                fetchWithAuth(`${API_BASE_URL}/cms/faqs?limit=5`)
            ]);

            const [articles, pages, media, faqs] = await Promise.all([
                articlesRes.json(),
                pagesRes.json(),
                mediaRes.json(),
                faqsRes.json()
            ]);

            // Calculate stats
            const articlesStats = {
                total: articles.articles?.length || 0,
                published: articles.articles?.filter(a => a.status === 'published').length || 0,
                draft: articles.articles?.filter(a => a.status === 'draft').length || 0
            };

            const pagesStats = {
                total: pages.pages?.length || 0,
                published: pages.pages?.filter(p => p.status === 'published').length || 0,
                draft: pages.pages?.filter(p => p.status === 'draft').length || 0
            };

            const mediaStats = {
                total: media.media?.length || 0,
                images: media.media?.filter(m => m.mediaType === 'image').length || 0,
                videos: media.media?.filter(m => m.mediaType === 'video').length || 0,
                documents: media.media?.filter(m => m.mediaType === 'document').length || 0
            };

            const faqsStats = {
                total: faqs.faqs?.length || 0,
                published: faqs.faqs?.filter(f => f.status === 'published').length || 0,
                draft: faqs.faqs?.filter(f => f.status === 'draft').length || 0
            };

            setStats({
                articles: articlesStats,
                pages: pagesStats,
                media: mediaStats,
                faqs: faqsStats
            });

            // Combine recent content
            const recent = [
                ...(articles.articles || []).map(item => ({ ...item, type: 'article', icon: FileText })),
                ...(pages.pages || []).map(item => ({ ...item, type: 'page', icon: File })),
                ...(faqs.faqs || []).map(item => ({ ...item, type: 'faq', icon: HelpCircle }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

            setRecentContent(recent);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'published': return <Badge variant="success">Active</Badge>;
            case 'draft': return <Badge variant="secondary">Draft</Badge>;
            case 'archived': return <Badge variant="outline">Legacy</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'article': return 'text-blue-600 bg-blue-50';
            case 'page': return 'text-purple-600 bg-purple-50';
            case 'faq': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <AdminHeader 
                title="CMS Intelligence"
                subtitle="Coordinate, publish and monitor platform documentation"
                actions={
                    <div className="flex gap-3">
                        <Button 
                            as={Link}
                            to="/admin/cms/articles/new"
                            variant="primary"
                            icon={Plus}
                            className="shadow-indigo-200 shadow-lg"
                        >
                            Draft Article
                        </Button>
                        <Button 
                            as={Link}
                            to="/admin/cms/pages/new"
                            variant="outline"
                            icon={Plus}
                            className="text-purple-600 border-purple-100 hover:bg-purple-50"
                        >
                            New Static Page
                        </Button>
                    </div>
                }
            />

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Articles Card */}
                <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm group hover:border-indigo-100 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-[28px] flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                             <FileText className="w-8 h-8" />
                        </div>
                        <Link to="/admin/cms/articles" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </Link>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Journal Hub</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{stats.articles.total}</p>
                        <div className="flex gap-2">
                            <Badge variant="success" className="px-2 py-0.5 text-[8px] font-black uppercase">{stats.articles.published} Live</Badge>
                            <Badge variant="secondary" className="px-2 py-0.5 text-[8px] font-black uppercase text-slate-500">{stats.articles.draft} Queued</Badge>
                        </div>
                    </div>
                </div>

                {/* Pages Card */}
                <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm group hover:border-purple-100 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 bg-purple-50 rounded-[28px] flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500">
                             <File className="w-8 h-8" />
                        </div>
                        <Link to="/admin/cms/pages" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </Link>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Architecture</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{stats.pages.total}</p>
                        <div className="flex gap-2">
                            <Badge variant="primary" className="px-2 py-0.5 text-[8px] font-black uppercase bg-purple-500 hover:bg-purple-600 font-bold">{stats.pages.published} Online</Badge>
                            <Badge variant="secondary" className="px-2 py-0.5 text-[8px] font-black uppercase text-slate-500">{stats.pages.draft} Staged</Badge>
                        </div>
                    </div>
                </div>

                {/* Media Card */}
                <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm group hover:border-emerald-100 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 bg-emerald-50 rounded-[28px] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                             <ImageIcon className="w-8 h-8" />
                        </div>
                        <Link to="/admin/cms/media" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </Link>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Visual Assets</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{stats.media.total}</p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <Badge variant="outline" className="px-2 py-0.5 text-[8px] font-black uppercase border-slate-200 text-slate-400 whitespace-nowrap">{stats.media.images} Img</Badge>
                            <Badge variant="outline" className="px-2 py-0.5 text-[8px] font-black uppercase border-slate-200 text-slate-400 whitespace-nowrap">{stats.media.videos} Vid</Badge>
                        </div>
                    </div>
                </div>

                {/* FAQ Card */}
                <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm group hover:border-orange-100 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-16 h-16 bg-orange-50 rounded-[28px] flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-500">
                             <HelpCircle className="w-8 h-8" />
                        </div>
                        <Link to="/admin/cms/faqs" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </Link>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Knowledge Base</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{stats.faqs.total}</p>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="px-2 py-0.5 text-[8px] font-black uppercase border-orange-200 text-orange-600 font-bold">{stats.faqs.published} Logic</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Intelligence Transmission */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Recent Pulse</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Content Synchronization</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentContent.length > 0 ? (
                            recentContent.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <div key={`${item.type}-${item._id}`} className="px-10 py-6 hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-transparent group-hover:border-white transition-all ${getTypeColor(item.type)}`}>
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                                        {item.title || item.question || item.filename}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-slate-300">Authored by System</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                {getStatusBadge(item.status)}
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/admin/cms/${item.type === 'faq' ? 'faqs' : item.type === 'page' ? 'pages' : 'articles'}/edit/${item._id}`}
                                                        className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-6 py-20 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-200 mb-6">
                                     <Database size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Repository Empty</h3>
                                <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">No content entities identified in the current sector.</p>
                                <Button as={Link} to="/admin/cms/articles/new" variant="primary" icon={Plus}>Initialize First Entity</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sector Navigation & Status */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-1000">
                             <Zap size={120} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-2">Protocol Quicklinks</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Deploying system assets</p>
                            
                            <div className="space-y-3">
                                <Link to="/admin/cms/banners" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/5 hover:border-white/10 group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover/item:scale-110 transition-transform">
                                            <ImageIcon size={18} />
                                        </div>
                                        <span className="text-sm font-bold">Homepage Banners</span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-600 group-hover/item:text-white" />
                                </Link>
                                
                                <Link to="/admin/cms/seo" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/5 hover:border-white/10 group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover/item:scale-110 transition-transform">
                                            <Search size={18} />
                                        </div>
                                        <span className="text-sm font-bold">SEO Content Blocks</span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-600 group-hover/item:text-white" />
                                </Link>

                                <Link to="/admin/cms/media" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/5 hover:border-white/10 group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 group-hover/item:scale-110 transition-transform">
                                            <Database size={18} />
                                        </div>
                                        <span className="text-sm font-bold">Protocol Media</span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-600 group-hover/item:text-white" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Intelligence Reach</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organic Resonance</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                    <span className="text-slate-400">Content Indexing</span>
                                    <span className="text-slate-900">92% Health</span>
                                </div>
                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                    <span className="text-slate-400">Media Optimization</span>
                                    <span className="text-slate-900">78% Sync</span>
                                </div>
                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CMSDashboard;