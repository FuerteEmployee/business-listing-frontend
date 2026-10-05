import React, { useState, useEffect } from "react";
import { Upload, X, Star, MoveLeft, MoveRight, Video, Trash2, CheckCircle, Clock, AlertCircle, Plus, Image as ImageIcon } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

export default function MediaManager({ images = [], videos = [], logo = null, coverPhotoUrl = null, onUpdate }) {
    const [gallery, setGallery] = useState(images);
    const [videoList, setVideoList] = useState(videos);
    const [businessLogo, setBusinessLogo] = useState(logo);
    const [coverPhoto, setCoverPhoto] = useState(coverPhotoUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoInput, setVideoInput] = useState("");

    useEffect(() => {
        setGallery(images || []);
        setVideoList(videos || []);
        setBusinessLogo(logo);
        setCoverPhoto(coverPhotoUrl);
    }, [images, videos, logo, coverPhotoUrl]);

    const handleFileUpload = async (e, type = 'gallery') => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadedUrls = [];
            for (let i = 0; i < files.length; i++) {
                const startProgress = (i / files.length) * 100;
                const maxSimulatedProgress = ((i + 0.9) / files.length) * 100;
                setUploadProgress(startProgress);

                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev < maxSimulatedProgress) {
                            const diff = maxSimulatedProgress - prev;
                            const step = Math.min(5, Math.max(0.5, diff * 0.1));
                            return prev + step;
                        }
                        return prev;
                    });
                }, 100);

                const uploadData = new FormData();
                uploadData.append('image', files[i]); // Backend expects 'image' field

                const res = await fetchWithAuth(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: uploadData
                });

                clearInterval(progressInterval);

                if (!res.ok) throw new Error("Upload failed");

                const result = await res.json();
                uploadedUrls.push(result.url);
                
                const endProgress = ((i + 1) / files.length) * 100;
                setUploadProgress(endProgress);
            }

            setUploadProgress(100);
            await new Promise(resolve => setTimeout(resolve, 450));

            if (type === 'logo') {
                setBusinessLogo(uploadedUrls[0]);
                onUpdate({ logo: uploadedUrls[0] });
            } else if (type === 'cover') {
                setCoverPhoto(uploadedUrls[0]);
                onUpdate({ coverPhotoUrl: uploadedUrls[0] });
            } else {
                const newImages = [
                    ...gallery,
                    ...uploadedUrls.map((url, idx) => ({
                        url,
                        isCover: gallery.length === 0 && idx === 0,
                        order: gallery.length + idx,
                        status: 'Pending'
                    }))
                ];
                setGallery(newImages);
                onUpdate({ images: newImages });
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const removeImage = (index) => {
        const newGallery = gallery.filter((_, i) => i !== index);
        setGallery(newGallery);
        onUpdate({ images: newGallery });
    };

    const setAsCover = (index) => {
        const newGallery = gallery.map((img, i) => ({
            ...img,
            isCover: i === index
        }));
        setGallery(newGallery);
        onUpdate({ images: newGallery });
    };

    const moveImage = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === gallery.length - 1)) return;
        
        const newGallery = [...gallery];
        const temp = newGallery[index];
        newGallery[index] = newGallery[index + direction];
        newGallery[index + direction] = temp;
        
        // Update orders
        const updatedGallery = newGallery.map((img, i) => ({ ...img, order: i }));
        setGallery(updatedGallery);
        onUpdate({ images: updatedGallery });
    };

    const addVideo = () => {
        if (!videoInput) return;
        let platform = "YouTube";
        if (videoInput.includes("vimeo")) platform = "Vimeo";
        
        const newVideos = [...videoList, { url: videoInput, platform }];
        setVideoList(newVideos);
        onUpdate({ videos: newVideos });
        setVideoInput("");
    };

    const removeVideo = (index) => {
        const newVideos = videoList.filter((_, i) => i !== index);
        setVideoList(newVideos);
        onUpdate({ videos: newVideos });
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData("draggedIndex", index);
    };

    const handleDrop = (e, dropIndex) => {
        const dragIndex = parseInt(e.dataTransfer.getData("draggedIndex"));
        if (dragIndex === dropIndex) return;

        const newGallery = [...gallery];
        const draggedItem = newGallery[dragIndex];
        newGallery.splice(dragIndex, 1);
        newGallery.splice(dropIndex, 0, draggedItem);

        const updatedGallery = newGallery.map((img, i) => ({ ...img, order: i }));
        setGallery(updatedGallery);
        onUpdate({ images: updatedGallery });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-10">
            {/* Logo Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-indigo-50 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
                            {businessLogo ? (
                                <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-slate-300" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-transform hover:scale-110 active:scale-95">
                            <Plus className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </label>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Business Logo</h3>
                        <p className="text-sm text-slate-500 mb-4">This appears on your profile and search results. High-res PNG/JPG recommended.</p>
                        {businessLogo && (
                            <button 
                                onClick={() => { setBusinessLogo(null); onUpdate({ logo: null }); }}
                                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full transition-colors"
                            >
                                Remove Logo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Cover Photo Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative">
                        <div className="w-56 aspect-[16/9] rounded-2xl border-4 border-indigo-50 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
                            {coverPhoto ? (
                                <img src={coverPhoto} alt="Cover Photo" className="w-full h-full object-cover" />
                            ) : (
                                <Plus className="w-10 h-10 text-slate-300" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-transform hover:scale-110 active:scale-95">
                            <Plus className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                        </label>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Cover Photo</h3>
                        <p className="text-sm text-slate-500 mb-4">This is the main photo shown at the top of your business listing page. Recommended size: 1200x675px (16:9).</p>
                        {coverPhoto && (
                            <button 
                                onClick={() => { setCoverPhoto(null); onUpdate({ coverPhotoUrl: null }); }}
                                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full transition-colors"
                            >
                                REMOVE COVER PHOTO
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Photo Gallery Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Photo Gallery</h3>
                        <p className="text-sm text-slate-500">Drag to reorder. First approved photo is usually your cover.</p>
                    </div>
                    <label className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 cursor-pointer hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        <Upload className="w-4 h-4" />
                        Bulk Upload
                        <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'gallery')} />
                    </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map((img, index) => (
                        <div 
                            key={index} 
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`group relative aspect-square rounded-3xl overflow-hidden border-2 cursor-move transition-all ${img.isCover ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
                        >
                            <img src={img.url} alt="Gallery" className="w-full h-full object-cover pointer-events-none" />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                <div className="flex justify-between items-start">
                                    <button 
                                        onClick={() => removeImage(index)}
                                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-white rounded-lg transition-colors backdrop-blur-md"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={() => setAsCover(index)}
                                        className={`p-1.5 rounded-lg transition-colors backdrop-blur-md ${img.isCover ? 'bg-amber-500 text-white' : 'bg-white/20 hover:bg-white text-white hover:text-amber-500'}`}
                                        title={img.isCover ? "Cover Photo" : "Set as Cover"}
                                    >
                                        <Star className={`w-3.5 h-3.5 ${img.isCover ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => moveImage(index, -1)}
                                        className="p-1.5 bg-white/20 hover:bg-white text-slate-800 rounded-lg transition-colors backdrop-blur-md"
                                        disabled={index === 0}
                                    >
                                        <MoveLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={() => moveImage(index, 1)}
                                        className="p-1.5 bg-white/20 hover:bg-white text-slate-800 rounded-lg transition-colors backdrop-blur-md"
                                        disabled={index === gallery.length - 1}
                                    >
                                        <MoveRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="absolute bottom-2 left-2 flex gap-1">
                                {img.status === 'Approved' && (
                                    <div className="px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white uppercase rounded-full shadow-lg flex items-center gap-1">
                                        <CheckCircle className="w-2 h-2" /> Approved
                                    </div>
                                )}
                                {img.status === 'Pending' && (
                                    <div className="px-2 py-0.5 bg-amber-500 text-[8px] font-black text-white uppercase rounded-full shadow-lg flex items-center gap-1">
                                        <Clock className="w-2 h-2" /> Pending
                                    </div>
                                )}
                                {img.status === 'Rejected' && (
                                    <div className="px-2 py-0.5 bg-rose-500 text-[8px] font-black text-white uppercase rounded-full shadow-lg flex items-center gap-1">
                                        <AlertCircle className="w-2 h-2" /> Rejected
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Empty State placeholder */}
                    {gallery.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                            <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-bold text-slate-400">No photos uploaded yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Videos & Virtual Tours</h3>
                    <p className="text-sm text-slate-500">Add links from YouTube or Vimeo to showcase your work.</p>
                </div>

                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Paste YouTube or Vimeo link here..."
                            value={videoInput}
                            onChange={(e) => setVideoInput(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={addVideo}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-colors active:scale-95"
                    >
                        Add Video
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoList.map((video, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <Video className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">{video.platform}</p>
                                <p className="text-sm font-bold text-slate-700 truncate">{video.url}</p>
                            </div>
                            <button 
                                onClick={() => removeVideo(idx)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upload Overlay */}
            {isUploading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-sm w-full">
                        <div className="w-full max-w-[280px] mx-auto mb-6">
                            <div className="border-2 border-slate-900 rounded-full p-[3px] bg-white shadow-sm">
                                <div 
                                    className="h-3 rounded-full bg-slate-900 transition-all duration-500 ease-out" 
                                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                                />
                            </div>
                            <div className="mt-3 text-lg font-black text-slate-800">
                                {Math.round(uploadProgress)}%
                            </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-2">Processing Magic...</h4>
                        <p className="text-sm text-slate-500">We're uploading your high-res media. Please don't close this tab.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
