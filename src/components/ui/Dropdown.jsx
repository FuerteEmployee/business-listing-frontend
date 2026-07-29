import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export const Dropdown = ({ 
    trigger, 
    items = [], 
    align = 'right', 
    className = '',
    contentClassName = '' 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                right: rect.right + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuContent = (
        <div 
            ref={dropdownRef}
            style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: align === 'right' ? 'auto' : `${coords.left}px`,
                right: align === 'right' ? `${window.innerWidth - coords.right}px` : 'auto',
                zIndex: 9999
            }}
            className={`mt-3 min-w-[200px] bg-white rounded-3xl shadow-2xl shadow-indigo-100 p-2 border border-slate-50 animate-in fade-in zoom-in-95 duration-200 origin-top-${align} ${contentClassName}`}
        >
            <div className="flex flex-col gap-1">
                {items.map((item, index) => (
                    item.divider ? (
                        <div key={`divider-${index}`} className="h-px bg-slate-50 my-1 mx-2"></div>
                    ) : (
                        <button
                            key={index}
                            onClick={() => {
                                item.onClick?.();
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-left text-sm font-bold transition-all ${
                                item.danger 
                                    ? 'text-rose-500 hover:bg-rose-50' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                        >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            {item.label}
                        </button>
                    )
                ))}
            </div>
        </div>
    );

    const toggleDropdown = (e) => {
        if (!isOpen) {
            updateCoords();
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className={`relative inline-block ${className}`} ref={triggerRef}>
            <div onClick={toggleDropdown} className="cursor-pointer">
                {trigger || (
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-indigo-600 transition-all">
                        Menu
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {isOpen && createPortal(menuContent, document.body)}
        </div>
    );
};

export default Dropdown;
