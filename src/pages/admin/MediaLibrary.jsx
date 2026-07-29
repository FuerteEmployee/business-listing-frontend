import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Video, FileText, Search, X, Download, Trash2, Copy, Grid, List, CheckCircle, Clock, Database, HardDrive, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

// System Standard Components
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminHeader from "../../components/admin/AdminHeader";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

const MediaLibrary = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filters, setFilters] = useState({
        mediaType: '',
        category: '',
        search: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, fileId: null });
    const [viewMode, setViewMode] = useState('grid');

    const fetchMedia = useCallback(async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters);
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/media?${queryParams}`);

            if (!response.ok) throw new Error('Failed to fetch media');

            const data = await response.json();
            setFiles(data.media || []);
        } catch (error) {
            console.error('Error fetching media:', error);
            toast.error('Failed to load media files');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleFileUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setUploading(true);

        try {
            const uploadPromises = selectedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', 'gallery');

                const response = await fetchWithAuth(`${API_BASE_URL}/cms/media/upload`, {
                    method: 'POST',
                    body: formData,
                    isFormData: true
                });

                if (!response.ok) throw new Error(`Failed to upload ${file.name}`);

                return response.json();
            });

            await Promise.all(uploadPromises);
            toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
            setShowUploadModal(false);
            fetchMedia();
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Failed to upload some files');
        } finally {
            setUploading(false);
        }
    };

    const deleteFile = async () => {
        if (!confirmModal.fileId) return;

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/cms/media/${confirmModal.fileId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete file');

            toast.success('Resource decommissioned');
            setConfirmModal({ isOpen: false, fileId: null });
            fetchMedia();
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Failed to delete file');
        }
    };

    const copyToClipboard = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Asset URL copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy URL');
        }
    };

    const getFileIcon = (mediaType) => {
        switch (mediaType) {
            case 'image': return <ImageIcon className="w-8 h-8 text-blue-500" />;
            case 'video': return <Video className="w-8 h-8 text-rose-500" />;
            case 'document': return <FileText className="w-8 h-8 text-slate-500" />;
            default: return <FileText className="w-8 h-8 text-slate-500" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filterFields = [
        {
            key: 'search',
            label: 'Asset Search',
            type: 'search',
            placeholder: 'Search files...'
        },
        {
            key: 'mediaType',
            label: 'Resource Type',
            type: 'select',
            options: [
                { label: 'All Types', value: '' },
                { label: 'Images', value: 'image' },
                { label: 'Videos', value: 'video' },
                { label: 'Documents', value: 'document' }
            ]
        },
        {
            key: 'category',
            label: 'Classification',
            type: 'select',
            options: [
                { label: 'All Categories', value: '' },
                { label: 'Articles', value: 'article' },
                { label: 'Profiles', value: 'profile' },
                { label: 'Banners', value: 'banner' },
                { label: 'Logos', value: 'logo' },
                { label: 'Gallery', value: 'gallery' }
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Media Library"
                subtitle="Coordinate and manage platform visual assets"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <Button 
                            variant="primary" 
                            icon={Upload} 
                            onClick={() => setShowUploadModal(true)}
                        >
                            Ingest Assets
                        </Button>
                    </div>
                }
            />

            {/* Dash Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
                            <p className="text-3xl font-black text-slate-900">{files.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500">
                            <Database className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visual Media</p>
                            <p className="text-3xl font-black text-blue-600">
                                {files.filter(f => f.mediaType === 'image').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Motion Video</p>
                            <p className="text-3xl font-black text-rose-600">
                                {files.filter(f => f.mediaType === 'video').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                            <Video className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protocol Docs</p>
                            <p className="text-3xl font-black text-slate-600">
                                {files.filter(f => f.mediaType === 'document').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                            <FileText className="w-6 h-6" />
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
                    setFilters({ mediaType: '', category: '', search: '' });
                }}
            />

            {/* Media Display */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                {files.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
                            {files.map((file) => (
                                <div key={file._id} className="group border border-slate-100 rounded-[28px] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 bg-white">
                                    <div className="aspect-video bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                        {file.mediaType === 'image' ? (
                                            <img
                                                src={file.url}
                                                alt={file.altText || file.filename}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                {getFileIcon(file.mediaType)}
                                                <Badge variant="outline" className="uppercase font-bold text-[9px] tracking-widest border-slate-200 text-slate-400">
                                                    {file.mediaType}
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.includes(file._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedFiles([...selectedFiles, file._id]);
                                                    else setSelectedFiles(selectedFiles.filter(id => id !== file._id));
                                                }}
                                                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>

                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => copyToClipboard(file.url)} className="p-3 bg-white rounded-2xl text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-lg" title="Copy URL">
                                                <Copy size={18} />
                                            </button>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-2xl text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-lg" title="View Source">
                                                <ImageIcon size={18} />
                                            </a>
                                            <button onClick={() => setConfirmModal({ isOpen: true, fileId: file._id })} className="p-3 bg-white rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-lg" title="Purge Asset">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="text-sm font-black text-slate-900 truncate" title={file.originalName}>
                                                {file.originalName}
                                            </h4>
                                            <Badge variant="secondary" className="px-1.5 py-0.5 font-bold text-[8px] tracking-tighter uppercase shrink-0">
                                                {file.extension}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5">
                                                <HardDrive size={10} />
                                                {formatFileSize(file.size)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={10} />
                                                {new Date(file.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Size</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {files.map(file => (
                                        <tr key={file._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                                                        {file.mediaType === 'image' ? (
                                                            <img src={file.url} alt="" className="w-full h-full object-cover" />
                                                        ) : getFileIcon(file.mediaType)}
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <p className="font-bold text-slate-900 text-sm truncate">{file.originalName}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate">{file.url}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="capitalize px-3 py-1 font-bold text-[9px] tracking-widest border-slate-200 bg-white">
                                                    {file.mediaType}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 font-bold">{formatFileSize(file.size)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{new Date(file.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => copyToClipboard(file.url)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"><Copy size={16} /></button>
                                                    <button onClick={() => setConfirmModal({ isOpen: true, fileId: file._id })} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-slate-100"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-300 mb-6">
                            <ImageIcon size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Zero Assets Found</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                            The repository is currently devoid of media resources. Initialize an upload sequence to begin asset population.
                        </p>
                        <Button 
                            variant="primary" 
                            icon={Upload} 
                            onClick={() => setShowUploadModal(true)}
                        >
                            Authorize Transfer
                        </Button>
                    </div>
                )}
            </div>

            {/* Ingest Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Intelligence Storage"
                subtitle="Ingest new visual assets and protocol documentation"
                icon={Upload}
                size="lg"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="ghost" onClick={() => setShowUploadModal(false)}>Cancel Protocol</Button>
                    </div>
                }
            >
                <div className="space-y-8">
                    <div className="border-4 border-dashed border-slate-100 rounded-[40px] p-12 text-center hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group relative">
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto text-indigo-500 shadow-xl border border-slate-100 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Upload size={32} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">Initialize Data Transfer</h4>
                        <p className="text-slate-400 font-bold text-sm">Drag and drop or search for platform assets</p>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100">
                                <Database size={14} />
                            </div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Load Parameters</h4>
                        </div>
                        <ul className="grid grid-cols-2 gap-4">
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                PNG, JPG, WebP
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                MP4, MOV (Max 50MB)
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                PDF, DOCX, XLSX
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                10 Units Max Load
                            </li>
                        </ul>
                    </div>

                    {uploading && (
                        <div className="flex items-center gap-4 p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 animate-pulse">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-100">
                                <div className="animate-spin rounded-full h-5 w-5 border-3 border-indigo-600 border-t-transparent"></div>
                            </div>
                            <div>
                                <p className="text-sm font-black text-indigo-900">Uploading assets to secure storage...</p>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Protocol in progress</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Asset Decommission Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, fileId: null })}
                title="Asset Decommission"
                subtitle="Permanent resource removal from database"
                icon={Trash2}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, fileId: null })}>Retain Resource</Button>
                        <Button variant="danger" onClick={deleteFile}>Confirm Purge</Button>
                    </div>
                }
            >
                <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 text-rose-900 font-bold leading-relaxed mb-4">
                    Are you certain you wish to purge this media asset? This protocol will permanently remove the resource from the platform repository. All associations will be severed.
                </div>
            </Modal>
        </div>
    );
};

export default MediaLibrary;