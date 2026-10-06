import { useRef, useState } from "react";
import { Plus, X, Search, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { parseKeywordFile, downloadKeywordSample } from "../../utils/keywordFile";

/**
 * Keyword / search-tag editor: chips, manual entry, and bulk add from an Excel or CSV file.
 * Safe inside a <form> - every button is type="button" and Enter never submits.
 */
export default function KeywordTagsInput({ value = [], onChange, label = "Keywords & Search Tags" }) {
    const tags = Array.isArray(value) ? value : [];
    const [newTag, setNewTag] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [notice, setNotice] = useState(null);
    const fileInputRef = useRef(null);

    const hasTag = (tag) => tags.some(t => t.toLowerCase() === tag.toLowerCase());

    const addTag = (e) => {
        if (e.type === "keydown" && e.key !== "Enter") return;
        e.preventDefault();
        const tag = newTag.trim();
        if (tag && !hasTag(tag)) onChange([...tags, tag]);
        setNewTag("");
    };

    const removeTag = (tagToRemove) => onChange(tags.filter(t => t !== tagToRemove));

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-selecting the same file
        if (!file) return;

        setIsParsing(true);
        setNotice(null);
        try {
            const keywords = await parseKeywordFile(file);
            const fresh = keywords.filter(k => !hasTag(k));
            if (!keywords.length) {
                setNotice({ type: "error", text: `No keywords found in "${file.name}". Put them in a column headed Keywords.` });
            } else {
                if (fresh.length) onChange([...tags, ...fresh]);
                const skipped = keywords.length - fresh.length;
                setNotice({
                    type: "success",
                    text: `Added ${fresh.length} keyword${fresh.length === 1 ? "" : "s"} from "${file.name}"`
                        + (skipped ? ` (${skipped} already present, skipped)` : "")
                        + ". Save to apply."
                });
            }
        } catch (err) {
            console.error("Keyword file parse error:", err);
            setNotice({ type: "error", text: "Could not read that file. Upload an .xlsx, .xls or .csv file." });
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">{label}</label>
                <div className="flex items-center gap-2">
                    {tags.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { onChange([]); setNotice(null); }}
                            className="text-xs font-bold text-slate-400 hover:text-rose-600 px-2"
                        >
                            Clear all
                        </button>
                    )}
                    <Button type="button" variant="ghost" size="sm" leftIcon={FileSpreadsheet} onClick={downloadKeywordSample}>
                        Sample File
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={Upload}
                        isLoading={isParsing}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Upload Excel
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                </div>
            </div>

            {notice && (
                <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${notice.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    {notice.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span className="flex-1">{notice.text}</span>
                    <button type="button" onClick={() => setNotice(null)} className="p-0.5 rounded-md hover:bg-black/5">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-xs font-bold transition-all hover:bg-indigo-100">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="p-0.5 hover:bg-indigo-200 rounded-md">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {tags.length === 0 && <p className="text-xs text-slate-400 italic">No tags added yet. Add keywords one by one or upload an Excel file.</p>}
            </div>

            <div className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Add keyword (hit Enter)..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={addTag}
                    />
                </div>
                <Button type="button" variant="outline" onClick={addTag} className="rounded-xl h-10">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <p className="text-[11px] text-slate-400">
                Excel / CSV: one keyword per row under a <span className="font-bold">Keywords</span> column, or several in one cell separated by <span className="font-mono">|</span> or commas.
            </p>
        </div>
    );
}
