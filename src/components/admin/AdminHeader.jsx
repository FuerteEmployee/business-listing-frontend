import React from 'react';

/**
 * Standardized Header for Admin Panels
 * @param {Object} props
 * @param {string} props.title - The main heading text
 * @param {string} props.subtitle - Descriptive text below the heading
 * @param {React.ReactNode} [props.actions] - Action buttons or elements on the right
 * @param {React.ReactNode} [props.badge] - Optional badge or tag above the title
 */
const AdminHeader = ({ title, subtitle, actions, badge }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                {badge && (
                    <div className="mb-2">
                        {badge}
                    </div>
                )}
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-slate-600 font-medium mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default AdminHeader;
