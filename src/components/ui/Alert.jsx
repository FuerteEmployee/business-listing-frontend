import React from 'react';
import { 
    AlertCircle, 
    CheckCircle2, 
    Info, 
    XCircle, 
    X 
} from 'lucide-react';

const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    danger: XCircle
};

const styles = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    error: 'bg-rose-50 border-rose-100 text-rose-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-indigo-50 border-indigo-100 text-indigo-800',
    danger: 'bg-rose-50 border-rose-100 text-rose-800'
};

const iconStyles = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-indigo-500',
    danger: 'text-rose-500'
};

export const Alert = ({ 
    type = 'info', 
    title, 
    children, 
    onClose, 
    className = '' 
}) => {
    const Icon = icons[type];

    return (
        <div className={`relative flex gap-4 p-5 rounded-[32px] border transition-all duration-300 ${styles[type]} ${className}`}>
            <div className={`p-2 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm ${iconStyles[type]}`}>
                <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 pt-0.5">
                {title && (
                    <h5 className="text-sm font-black mb-1 uppercase tracking-wider">{title}</h5>
                )}
                <div className="text-sm font-bold opacity-90 leading-relaxed">
                    {children}
                </div>
            </div>

            {onClose && (
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-black/5 rounded-xl transition-colors self-start"
                >
                    <X className="w-4 h-4 opacity-50" />
                </button>
            )}
        </div>
    );
};

export default Alert;
