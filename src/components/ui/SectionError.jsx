import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Inline failure state for a homepage/section fetch.
 *
 * Sections used to swallow fetch errors and render nothing, so a backend hiccup
 * showed up as a homepage that was quietly missing its content. Showing the
 * failure plus a retry is both honest and actionable.
 */
export default function SectionError({ title, message, onRetry, compact = false }) {
    return (
        <div
            role="alert"
            className={`flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}
        >
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700">
                    {title || "Couldn't load this section"}
                </p>
                {message && (
                    <p className="text-xs text-slate-500 mt-1">{message}</p>
                )}
            </div>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                    <RotateCw className="w-3.5 h-3.5" />
                    Retry
                </button>
            )}
        </div>
    );
}
