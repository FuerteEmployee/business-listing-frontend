import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'default',
    className = '',
    isLoading = false,
    disabled = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-black transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
        primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 focus:ring-indigo-500',
        secondary: 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 focus:ring-slate-500',
        outline: 'border-2 border-slate-200 bg-white text-slate-600 hover:border-indigo-600 hover:text-indigo-600 focus:ring-indigo-500',
        ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
        danger: 'bg-rose-500 text-white shadow-lg shadow-rose-100 hover:bg-rose-600 focus:ring-rose-500',
        gradient: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 focus:ring-indigo-500',
        success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600 focus:ring-emerald-500'
    };

    const sizeClasses = {
        default: 'h-11 px-6 py-2.5 text-sm',
        sm: 'h-9 px-4 py-1.5 text-xs',
        lg: 'h-14 px-8 py-3.5 text-base',
        xl: 'h-16 px-10 py-4 text-lg',
        icon: 'h-11 w-11 p-0'
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Please wait...</span>
                </>
            ) : (
                <>
                    {LeftIcon && <LeftIcon className={`w-4 h-4 ${children ? 'mr-2.5' : ''}`} />}
                    {children}
                    {RightIcon && <RightIcon className={`w-4 h-4 ${children ? 'ml-2.5' : ''}`} />}
                </>
            )}
        </button>
    );
};

export { Button };