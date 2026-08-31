import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

/**
 * Server-driven searchable select, visually identical to FormSelect.
 *
 * FormSelect loads every option up front and filters in the browser, which stops
 * working once a list is large - the City list alone is ~7.9k rows, and one state
 * (Tamil Nadu) is over 1,000. This variant asks the server for one page at a time
 * and re-queries as the user types, so the payload stays bounded no matter how many
 * rows exist.
 *
 * Props:
 *   fetchPage(search, page, signal) -> { options: [{value,label}], hasMore, total }
 *      Must honour `signal`; keystrokes abort the previous request.
 *   resolveLabel(value, signal) -> string
 *      Optional. Supplies the label for a preselected value that is not on page 1
 *      (e.g. editing a listing whose city sits 900 entries deep).
 *   deps  Values that invalidate cached results - pass the parent id, so changing
 *         State clears the City list instead of showing the previous state's cities.
 */
export default function AsyncSelect({
    label,
    name,
    value,
    onChange,
    fetchPage,
    resolveLabel,
    deps = [],
    required = false,
    disabled = false,
    placeholder = 'Select option',
    searchPlaceholder = 'Type to search...',
    emptyMessage = 'No results found',
    className = '',
    error = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');

    const wrapperRef = useRef(null);
    const listRef = useRef(null);
    const depsKey = JSON.stringify(deps);

    // Callers naturally pass inline arrows, which are a new reference on every render.
    // Held in refs so the fetch effects key off `deps`/search only - depending on the
    // function identity would re-fire the request in a loop.
    const fetchPageRef = useRef(fetchPage);
    const resolveLabelRef = useRef(resolveLabel);
    useEffect(() => { fetchPageRef.current = fetchPage; }, [fetchPage]);
    useEffect(() => { resolveLabelRef.current = resolveLabel; }, [resolveLabel]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // A changed parent (or a cleared value) invalidates whatever is cached.
    useEffect(() => {
        setOptions([]);
        setPage(1);
        setSearchTerm('');
    }, [depsKey]);

    // Resolve the label for a preselected value the current page does not contain.
    useEffect(() => {
        if (!value) { setSelectedLabel(''); return; }

        const known = options.find(o => o.value === value);
        if (known) { setSelectedLabel(known.label); return; }
        if (!resolveLabelRef.current) return;

        const controller = new AbortController();
        resolveLabelRef.current(value, controller.signal)
            .then(text => { if (text) setSelectedLabel(text); })
            .catch(err => { if (err.name !== 'AbortError') console.error('Error resolving label:', err); });
        return () => controller.abort();
    }, [value, options]);

    // Debounced page-1 fetch. Only runs while open, so a form with many of these
    // does not fire a request per field on mount.
    useEffect(() => {
        if (!isOpen || disabled) return;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetchPageRef.current(searchTerm.trim(), 1, controller.signal);
                if (controller.signal.aborted) return;
                setOptions(res.options || []);
                setHasMore(Boolean(res.hasMore));
                setTotal(res.total ?? (res.options || []).length);
                setPage(1);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error loading options:', err);
                    setOptions([]);
                    setHasMore(false);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, searchTerm ? 250 : 0);

        return () => { clearTimeout(timer); controller.abort(); };
    }, [isOpen, searchTerm, depsKey, disabled]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const res = await fetchPageRef.current(searchTerm.trim(), next, undefined);
            setOptions(prev => [...prev, ...(res.options || [])]);
            setHasMore(Boolean(res.hasMore));
            setPage(next);
        } catch (err) {
            console.error('Error loading more options:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, page, searchTerm]);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) loadMore();
    };

    const handleSelect = (optValue, optLabel) => {
        setSelectedLabel(optLabel);
        onChange({ target: { name, value: optValue } });
        setIsOpen(false);
        setSearchTerm('');
    };

    const displayLabel = value ? (selectedLabel || 'Loading...') : placeholder;

    return (
        <div className={`w-full ${className}`} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    {label}
                    {required && <span className="text-rose-500 font-bold">*</span>}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onMouseDown={(e) => { if (disabled) return; e.stopPropagation(); setIsOpen(!isOpen); }}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm
                        transition-all duration-200 outline-none text-left
                        ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 shadow-sm'}
                        ${disabled ? 'bg-slate-50 cursor-not-allowed border-slate-200' : 'cursor-pointer'}
                        ${error ? 'border-rose-300 ring-rose-500/10' : ''}
                    `}
                >
                    <span className={`truncate pointer-events-none ${!value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {displayLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50 sticky top-0">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                                {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 animate-spin" />}
                            </div>
                        </div>

                        <div
                            ref={listRef}
                            onScroll={handleScroll}
                            className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200"
                        >
                            {options.length > 0 ? (
                                <>
                                    {options.map((option) => {
                                        const isSelected = option.value === value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => handleSelect(option.value, option.label)}
                                                className={`
                                                    w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors
                                                    ${isSelected
                                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
                                                `}
                                            >
                                                <span className="truncate">{option.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                    {hasMore && (
                                        <button
                                            type="button"
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="w-full px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-center gap-2"
                                        >
                                            {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {loadingMore ? 'Loading...' : `Load more (${options.length} of ${total})`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="px-3 py-4 text-center text-xs text-slate-400">
                                    {loading ? 'Searching...' : (searchTerm ? `${emptyMessage} for "${searchTerm}"` : emptyMessage)}
                                </div>
                            )}
                        </div>

                        {total > 0 && (
                            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-medium">
                                Showing {options.length} of {total}
                                {total > options.length && ' — keep typing to narrow results'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>
    );
}
