import React, { useState } from 'react';

const Tabs = ({ children, value, onValueChange, className = '' }) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {children}
        </div>
    );
};

const TabsList = ({ children, className = '' }) => {
    return (
        <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`}>
            {children}
        </div>
    );
};

const TabsTrigger = ({ children, value, className = '', ...props }) => {
    return (
        <button
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                props.active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const TabsContent = ({ children, value, className = '', ...props }) => {
    return (
        <div className={className} {...props}>
            {children}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };