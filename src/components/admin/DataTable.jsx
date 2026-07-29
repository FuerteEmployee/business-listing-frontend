import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Spinner } from '../ui/Loading';
import Dropdown from '../ui/Dropdown';

/**
 * Premium DataTable Component
 */
export default function DataTable({
    data = [],
    columns = [],
    actions = [],
    itemsPerPage = 20,
    onRowClick = null,
    showCheckbox = false,
    currentPage: controlledCurrentPage,
    totalItems,
    onPageChange,
    selectedRows: controlledSelectedRows,
    onSelectRows,
    onSelectionChange = null,
    isLoading = false,
    emptyMessage = "No records found",
    actionMode = "buttons" // "buttons" or "dropdown"
}) {
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [internalSelectedRows, setInternalSelectedRows] = useState(new Set());

    const isServerPaginated = typeof totalItems === 'number' && typeof onPageChange === 'function';
    const currentPage = controlledCurrentPage ?? internalCurrentPage;
    const selectedRows = useMemo(() => {
        if (controlledSelectedRows instanceof Set) return controlledSelectedRows;
        if (Array.isArray(controlledSelectedRows)) return new Set(controlledSelectedRows);
        return internalSelectedRows;
    }, [controlledSelectedRows, internalSelectedRows]);

    const updatePage = (page) => {
        if (typeof onPageChange === 'function') {
            onPageChange(page);
            return;
        }
        setInternalCurrentPage(page);
    };

    const updateSelection = (nextSelection) => {
        if (controlledSelectedRows === undefined) setInternalSelectedRows(nextSelection);
        const selectedIds = Array.from(nextSelection);
        onSelectRows?.(selectedIds);
        onSelectionChange?.(selectedIds);
    };

    const handleSort = (key, isSortable) => {
        if (!isSortable) return;
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        updatePage(1);
    };

    const processedData = useMemo(() => {
        let sorted = [...data];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [data, sortConfig]);

    const totalCount = isServerPaginated ? totalItems : processedData.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedData = useMemo(() => {
        const raw = isServerPaginated ? processedData : processedData.slice(startIdx, startIdx + itemsPerPage);
        return raw.filter(row => !!row);
    }, [isServerPaginated, processedData, startIdx, itemsPerPage]);
    
    const visibleStart = totalCount === 0 ? 0 : startIdx + 1;
    const visibleEnd = totalCount === 0 ? 0 : startIdx + paginatedData.length;

    const handleSelectAll = (e) => {
        const newSelection = new Set(selectedRows);
        if (e.target.checked) {
            paginatedData.forEach(row => {
                if (row) newSelection.add(row._id || row.id);
            });
        } else {
            paginatedData.forEach(row => {
                if (row) newSelection.delete(row._id || row.id);
            });
        }
        updateSelection(newSelection);
    };

    const handleSelectRow = (rowId) => {
        const newSelection = new Set(selectedRows);
        if (newSelection.has(rowId)) newSelection.delete(rowId);
        else newSelection.add(rowId);
        updateSelection(newSelection);
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => row && selectedRows.has(row._id || row.id));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                <Spinner label="Loading Records..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                {showCheckbox && (
                                    <th className="pl-8 py-5 w-12">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                        />
                                    </th>
                                )}
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ${
                                            col.sortable ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''
                                        }`}
                                        onClick={() => handleSort(col.key, col.sortable)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.sortable && (
                                                <div className="flex flex-col opacity-30 group-hover:opacity-100">
                                                    <ChevronUp className={`w-3 h-3 -mb-1 ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-indigo-600 opacity-100' : ''}`} />
                                                    <ChevronDown className={`w-3 h-3 ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-indigo-600 opacity-100' : ''}`} />
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {actions.length > 0 && (
                                    <th className="pr-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + (showCheckbox ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                        className="px-8 py-20 text-center"
                                    >
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">{emptyMessage}</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row, idx) => (
                                    <tr
                                        key={row?._id || row?.id || idx}
                                        className="group hover:bg-slate-50/80 transition-all duration-300 cursor-pointer"
                                        onClick={() => row && onRowClick?.(row)}
                                    >
                                        {showCheckbox && (
                                            <td className="pl-8 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={row && selectedRows.has(row._id || row.id)}
                                                    onChange={() => row && handleSelectRow(row._id || row.id)}
                                                    className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        {columns.map(col => (
                                            <td key={col.key} className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                                    {col.render
                                                        ? col.render(row[col.key], row)
                                                        : row[col.key]}
                                                </div>
                                            </td>
                                        ))}
                                        {actions.length > 0 && (
                                            <td className="pr-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                {actionMode === 'dropdown' ? (
                                                    <div className="flex justify-end">
                                                        <Dropdown 
                                                            align="right"
                                                            trigger={
                                                                <button className="p-2.5 rounded-xl text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all active:scale-90">
                                                                    <MoreVertical className="w-5 h-5" />
                                                                </button>
                                                            }
                                                            items={actions
                                                                .filter(action => row && (!action.condition || action.condition(row)))
                                                                .map(action => ({
                                                                    label: action.label,
                                                                    icon: action.icon,
                                                                    onClick: () => action.onClick(row),
                                                                    danger: typeof action.isDangerous === 'function' ? action.isDangerous(row) : action.isDangerous
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        {actions
                                                            .filter(action => !action.condition || action.condition(row))
                                                            .map((action, i) => {
                                                                const isDangerous = typeof action.isDangerous === 'function'
                                                                    ? action.isDangerous(row)
                                                                    : action.isDangerous;
                                                                return (
                                                                    <button
                                                                        key={`${action.label}-${i}`}
                                                                        onClick={() => action.onClick(row)}
                                                                        className={`p-2 rounded-lg transition-all active:scale-90 ${
                                                                            isDangerous
                                                                                ? 'text-rose-400 hover:bg-rose-50 hover:text-rose-600'
                                                                                : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                                                                        }`}
                                                                        title={action.label}
                                                                    >
                                                                        {action.icon && <action.icon className="w-4 h-4" />}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-indigo-600">{visibleStart}-{visibleEnd}</span> of {totalCount}
                    </p>
                    <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => updatePage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-transparent hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, i, arr) => (
                                    <React.Fragment key={page}>
                                        {i > 0 && arr[i-1] !== page - 1 && <span className="text-slate-300 px-1">...</span>}
                                        <button
                                            onClick={() => updatePage(page)}
                                            className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                                currentPage === page
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))}
                        </div>

                        <button
                            onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl border border-transparent hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
