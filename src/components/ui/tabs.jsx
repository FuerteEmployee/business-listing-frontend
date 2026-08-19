import React, { useState, createContext, useContext } from 'react';

const TabsContext = createContext(null);

const Tabs = ({ children, defaultValue, value, onValueChange, className = '' }) => {
    const [localValue, setLocalValue] = useState(defaultValue);
    const currentValue = value !== undefined ? value : localValue;

    const handleValueChange = (newValue) => {
        if (onValueChange) {
            onValueChange(newValue);
        }
        if (value === undefined) {
            setLocalValue(newValue);
        }
    };

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div className={`space-y-4 ${className}`}>
                {children}
            </div>
        </TabsContext.Provider>
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
    const context = useContext(TabsContext);
    if (!context) return null;

    const isActive = context.value === value;

    return (
        <button
            type="button"
            onClick={() => context.onValueChange(value)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const TabsContent = ({ children, value, className = '', ...props }) => {
    const context = useContext(TabsContext);
    if (!context) return null;

    const isActive = context.value === value;

    if (!isActive) return null;

    return (
        <div className={className} {...props}>
            {children}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };