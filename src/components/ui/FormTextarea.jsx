import React from 'react';

/**
 * Premium Form Textarea Component
 * Standardized for the Admin Backdrop system.
 */
export const FormTextarea = ({ 
    label, 
    name, 
    value, 
    onChange, 
    required = false, 
    disabled = false, 
    placeholder = "",
    className = "",
    rows = 3,
    error = ""
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    {label}
                    {required && <span className="text-rose-500 font-bold">*</span>}
                </label>
            )}
            <div className="relative group">
                <textarea
                    name={name}
                    value={value !== null && value !== undefined ? value : ''}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    rows={rows}
                    className={`
                        w-full px-4 py-2.5 bg-white border rounded-xl text-sm 
                        transition-all duration-200 outline-none resize-none
                        hover:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500
                        placeholder:text-slate-400
                        disabled:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200
                        ${error ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500' : 'border-slate-200 shadow-sm'}
                    `}
                ></textarea>
            </div>
            {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        </div>
    );
};

export default FormTextarea;