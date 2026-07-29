import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ 
    size = 'default', 
    color = 'indigo', 
    className = '',
    label 
}) => {
    const sizeClasses = {
        xs: 'w-4 h-4',
        sm: 'w-6 h-6',
        default: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    const colorClasses = {
        indigo: 'text-indigo-600',
        white: 'text-white',
        slate: 'text-slate-400',
        rose: 'text-rose-500',
        emerald: 'text-emerald-500'
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div className="relative">
                <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
            </div>
            {label && (
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                    {label}
                </p>
            )}
        </div>
    );
};

export const Skeleton = ({ 
    variant = 'text', 
    width = 'full', 
    height = '4', 
    className = '' 
}) => {
    const baseClasses = 'bg-slate-200 animate-pulse rounded-2xl';
    
    const variantStyles = {
        text: `h-${height} w-${width}`,
        circle: 'w-12 h-12 rounded-full',
        card: 'w-full h-48',
        avatar: 'w-10 h-10 rounded-xl'
    };

    return (
        <div 
            className={`${baseClasses} ${variant === 'text' ? '' : variantStyles[variant]} ${className}`}
            style={variant === 'text' ? { width: width.includes('%') || width.includes('px') ? width : undefined, height: height.includes('%') || height.includes('px') ? height : undefined } : {}}
        />
    );
};

export const FullPageLoader = ({ label = "Initializing Platform..." }) => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[9999] flex items-center justify-center">
        <Spinner size="lg" label={label} />
    </div>
);

const Loading = {
    Spinner,
    Skeleton,
    FullPageLoader
};

export default Loading;
