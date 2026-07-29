import { Upload } from "lucide-react";

export default function ImageUploadBox({
    imagePreview,
    isUploading,
    uploadProgress,
    onImageChange,
    title = "Click to upload image",
    subtitle = "PNG, JPG up to 5MB",
    imageSizeClass = "w-24 h-24"
}) {
    const isVideo = (url) => {
        if (!url) return false;
        const lowercaseUrl = url.toLowerCase();
        return lowercaseUrl.includes('/video/upload/') || 
               lowercaseUrl.endsWith('.mp4') || 
               lowercaseUrl.endsWith('.mov') || 
               (url.startsWith('blob:') && url.includes('video'));
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer overflow-hidden">
            <input
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                onChange={onImageChange}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {imagePreview ? (
                isVideo(imagePreview) ? (
                    <video
                        src={imagePreview}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`${imageSizeClass} object-cover rounded-lg shadow-sm border border-slate-200`}
                    />
                ) : (
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className={`${imageSizeClass} object-cover rounded-lg shadow-sm border border-slate-200`}
                    />
                )
            ) : (
                <div className="text-center">
                    <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">{title}</p>
                    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                </div>
            )}
            {/* Upload Progress Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3 rounded-xl z-10 text-center px-4">
                    <div className="text-sm font-semibold text-indigo-600">Uploading image...</div>
                    <div className="w-full max-w-[200px] bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        {Math.round(Math.min(uploadProgress, 100))}%
                    </div>
                </div>
            )}
        </div>
    );
}
