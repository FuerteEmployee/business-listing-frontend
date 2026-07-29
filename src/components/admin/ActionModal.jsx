import { X } from 'lucide-react';

/**
 * Action Modal Component - For user actions (ban, verify, delete, etc.)
 */
export default function ActionModal({
    isOpen,
    title,
    description,
    onClose,
    onCancel,
    onConfirm,
    isLoading = false,
    isDangerous = false,
    fields = [],
    formData = {},
    onFieldChange = (key, value) => { },
    confirmText = 'Confirm'
}) {
    if (!isOpen) return null;

    const handleClose = onClose || onCancel || (() => { });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h3 className={`text-lg font-semibold ${isDangerous ? 'text-red-600' : 'text-slate-900'}`}>
                        {title}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {description && (
                        <p className="text-slate-600 text-sm">{description}</p>
                    )}

                    {/* Form Fields */}
                    {fields.map((field, idx) => (
                        <div key={field.key || field.name || idx}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-600"> *</span>}
                            </label>
                            {(() => {
                                const fieldKey = field.key || field.name;
                                const currentValue = formData[fieldKey] ?? field.value ?? '';

                                if (field.type === 'textarea') {
                                    return (
                                        <textarea
                                            placeholder={field.placeholder}
                                            value={currentValue}
                                            onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows={field.rows || 3}
                                        />
                                    );
                                }

                                if (field.type === 'select') {
                                    return (
                                        <select
                                            value={currentValue}
                                            onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select {field.label}</option>
                                            {field.options?.map((option) => {
                                                const normalizedOption = typeof option === 'string'
                                                    ? { label: option, value: option }
                                                    : option;

                                                return (
                                                    <option key={normalizedOption.value} value={normalizedOption.value}>
                                                        {normalizedOption.label}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    );
                                }

                                if (field.type === 'input') {
                                    return (
                                        <input
                                            type={field.inputType || 'text'}
                                            placeholder={field.placeholder}
                                            value={currentValue}
                                            onChange={(e) => onFieldChange(fieldKey, e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    );
                                }

                                return null;
                            })()}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                            isDangerous
                                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
                        }`}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
