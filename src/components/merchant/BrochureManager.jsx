import { useState } from "react";
import { Upload, FileText, Trash2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { formatFileSize } from "../../utils/fileSize";

const MAX_BROCHURES = 5;
const MAX_SIZE_MB = 10;

// Brochure changes are saved to the listing immediately (not via the page's "Save Profile"),
// so an uploaded PDF can't be lost by navigating away before saving.
export default function BrochureManager({ companyId, brochures = [], onUpdate }) {
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [savedAt, setSavedAt] = useState(null);

    const persist = async (list) => {
        setIsSaving(true);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/${companyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brochures: list })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Failed to save brochures");
            // Use the server's copy so every brochure has its _id (needed for the download link)
            onUpdate({ brochures: data.brochures || list });
            setSavedAt(Date.now());
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (files.length === 0) return;
        setError(null);

        if (brochures.length + files.length > MAX_BROCHURES) {
            setError(`You can upload up to ${MAX_BROCHURES} brochures.`);
            return;
        }
        const invalid = files.find(f => f.type !== "application/pdf" && !/\.pdf$/i.test(f.name));
        if (invalid) {
            setError(`"${invalid.name}" is not a PDF file.`);
            return;
        }
        const tooLarge = files.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
        if (tooLarge) {
            setError(`"${tooLarge.name}" is larger than ${MAX_SIZE_MB}MB.`);
            return;
        }

        setIsUploading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                const uploadData = new FormData();
                uploadData.append("document", file);
                const res = await fetchWithAuth(`${API_BASE_URL}/upload/document`, {
                    method: "POST",
                    body: uploadData
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.msg || "Upload failed");
                uploaded.push({
                    url: result.url,
                    name: result.name || file.name.replace(/\.pdf$/i, ""),
                    size: result.size || file.size,
                    publicId: result.publicId,
                    uploadedAt: new Date().toISOString()
                });
            }
            await persist([...brochures, ...uploaded]);
        } catch (err) {
            console.error("Brochure upload failed", err);
            setError(err.message || "Brochure upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    // Typing only updates local state; the new name is saved when the field loses focus
    const renameBrochure = (index, name) => {
        onUpdate({ brochures: brochures.map((b, i) => (i === index ? { ...b, name } : b)) });
    };

    const saveCurrent = async () => {
        setError(null);
        try {
            await persist(brochures);
        } catch (err) {
            setError(err.message || "Failed to save brochures.");
        }
    };

    const removeBrochure = async (index) => {
        setError(null);
        try {
            await persist(brochures.filter((_, i) => i !== index));
        } catch (err) {
            setError(err.message || "Failed to remove brochure.");
        }
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Brochures & Catalogues</h3>
                    <p className="text-sm text-slate-500">
                        Upload PDF brochures (max {MAX_SIZE_MB}MB each, up to {MAX_BROCHURES}). Customers can download them from your listing page.
                    </p>
                </div>
                <label className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all shrink-0 ${isUploading || brochures.length >= MAX_BROCHURES ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"}`}>
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? "Uploading..." : "Upload PDF"}
                    <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="application/pdf,.pdf"
                        disabled={isUploading || brochures.length >= MAX_BROCHURES}
                        onChange={handleUpload}
                    />
                </label>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {brochures.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <FileText className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-sm font-bold text-slate-400">No brochures uploaded yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {brochures.map((brochure, index) => (
                        <div key={brochure._id || brochure.url} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
                                <FileText className="w-5 h-5 text-rose-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <input
                                    type="text"
                                    value={brochure.name || ""}
                                    onChange={(e) => renameBrochure(index, e.target.value)}
                                    onBlur={saveCurrent}
                                    placeholder="Brochure title"
                                    className="w-full bg-transparent text-sm font-bold text-slate-700 border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none py-0.5"
                                />
                                <p className="text-xs text-slate-400 mt-0.5">PDF{brochure.size ? ` · ${formatFileSize(brochure.size)}` : ""}</p>
                            </div>
                            {/* Cloudinary blocks direct PDF links on this account, so preview via the API */}
                            {brochure._id && (
                                <a
                                    href={`${API_BASE_URL}/companies/${companyId}/brochures/${brochure._id}/download?inline=1`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Preview"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => removeBrochure(index)}
                                disabled={isSaving}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {brochures.some(b => !b._id) ? (
                        <div className="flex items-center justify-between gap-3 pt-1">
                            <p className="text-xs font-semibold text-amber-600">Some brochures are not saved to your listing yet.</p>
                            <button
                                type="button"
                                onClick={saveCurrent}
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {isSaving ? "Saving..." : "Save brochures"}
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 pt-1">
                            {isSaving ? "Saving..." : savedAt ? "Saved — visitors can download these from your listing page." : "Visitors can download these from your listing page."}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
