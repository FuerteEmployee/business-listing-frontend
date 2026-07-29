import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ children, value, onValueChange }) => {
    return (
        <div className="relative">
            {children}
        </div>
    );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
    return (
        <button
            className={`flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
};

const SelectValue = ({ placeholder }) => {
    return <span className="text-gray-500">{placeholder}</span>;
};

const SelectContent = ({ children, className = '' }) => {
    return (
        <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${className}`}>
            {children}
        </div>
    );
};

const SelectItem = ({ children, value, onClick }) => {
    return (
        <div
            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
            onClick={() => onClick && onClick(value)}
        >
            {children}
        </div>
    );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };