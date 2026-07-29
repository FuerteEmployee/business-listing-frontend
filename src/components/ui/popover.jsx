import React, { useState } from 'react';

const Popover = ({ children }) => {
    return (
        <div className="relative">
            {children}
        </div>
    );
};

const PopoverTrigger = ({ children, asChild }) => {
    return children;
};

const PopoverContent = ({ children, className = '', align = 'start' }) => {
    return (
        <div className={`absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg ${className}`}>
            {children}
        </div>
    );
};

export { Popover, PopoverTrigger, PopoverContent };