import React from 'react';

const Badge = ({ 
    children, 
    variant = 'default', 
    size = 'default',
    className = '',
    dot = false
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all';

    const variantClasses = {
        default: 'bg-indigo-100/50 text-indigo-700 border border-indigo-200',
        secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
        success: 'bg-emerald-100/50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-100/50 text-amber-700 border border-amber-200',
        danger: 'bg-rose-100/50 text-rose-700 border border-rose-200',
        info: 'bg-blue-100/50 text-blue-700 border border-blue-200',
        outline: 'border-2 border-slate-200 text-slate-600 bg-white hover:border-indigo-600 hover:text-indigo-600',
        premium: 'bg-slate-900 text-white border border-slate-800'
    };

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[8px] rounded-md',
        sm: 'px-2 py-0.5 text-[9px] rounded-lg',
        default: 'px-2.5 py-1 text-[10px] rounded-xl',
        lg: 'px-3.5 py-1.5 text-xs rounded-2xl'
    };

    const dotColors = {
        default: 'bg-indigo-500',
        secondary: 'bg-slate-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500',
        info: 'bg-blue-500',
        outline: 'bg-slate-500',
        premium: 'bg-indigo-400'
    };

    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]} animate-pulse`}></span>
            )}
            {children}
        </span>
    );
};

export { Badge };