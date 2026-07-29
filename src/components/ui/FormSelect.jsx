import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export default function FormSelect({ 
    label, 
    name, 
    value, 
    onChange, 
    options = [], 
    required = false, 
    disabled = false, 
    placeholder = "Select option",
    className = "",
    triggerClassName = "",
    error = "",
    searchable = true
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (e) => {
        if (disabled) return;
        e.stopPropagation(); // Prevent global mousedown from firing prematurely
        setIsOpen(!isOpen);
    };

    // Get selected option label
    const selectedOption = options.find(opt => {
        const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
        return optValue === value;
    });

    const displayLabel = selectedOption 
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : placeholder;

    // Filtered options based on search
    const filteredOptions = options.filter(opt => {
        const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;
        return String(optLabel).toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelect = (optValue) => {
        if (disabled) return;
        
        // Mocking an e.target object to maintain compatibility with existing handleInputChange
        onChange({
            target: {
                name: name,
                value: optValue
            }
        });
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`w-full ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    {label}
                    {required && <span className="text-rose-500 font-bold">*</span>}
                </label>
            )}
            
            <div className="relative">
                {/* Trigger Button */}
                <button
                    ref={triggerRef}
                    type="button"
                    onMouseDown={toggleDropdown}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm 
                        transition-all duration-200 outline-none text-left
                        ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 shadow-sm'}
                        ${disabled ? 'bg-slate-50 cursor-not-allowed border-slate-200' : 'cursor-pointer'}
                        ${error ? 'border-rose-300 ring-rose-500/10' : ''}
                        ${triggerClassName}
                    `}
                >
                    <span className={`truncate pointer-events-none ${!selectedOption ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {displayLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                        {searchable && options.length > 5 && (
                            <div className="p-2 border-b border-slate-100 bg-slate-50/50 sticky top-0">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, idx) => {
                                    const isObject = typeof option === 'object' && option !== null;
                                    const optValue = isObject ? option.value : option;
                                    const optLabel = isObject ? option.label : option;
                                    const isSelected = optValue === value;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelect(optValue)}
                                            className={`
                                                w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors group
                                                ${isSelected 
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
                                            `}
                                        >
                                            <span className="truncate">{optLabel}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-4 text-center text-xs text-slate-400">
                                    No results found for "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>
    );
}
