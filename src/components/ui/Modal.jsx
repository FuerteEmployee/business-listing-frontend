import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    subtitle,
    icon: Icon,
    children, 
    footer,
    size = 'md',
    className = '',
    showClose = true
}) => {
    // Escape key listener
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        }
        return () => { 
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
        full: 'max-w-[95vw]'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div 
                className={`relative w-full ${sizeClasses[size]} bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div>
                            <h3 id="modal-title" className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-none">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {showClose && (
                        <button 
                            onClick={onClose}
                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 absolute right-8 top-8"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 p-8 bg-slate-50 border-t border-slate-100">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
