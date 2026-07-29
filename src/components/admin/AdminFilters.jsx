import FormSelect from "../ui/FormSelect";
import FormInput from "../ui/FormInput";

/**
 * Admin Filter Component - Reusable filter UI for tables
 */
export default function AdminFilters({ filters = [], onFilterChange = () => { }, onReset = () => { } }) {
    return (
        <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {filters.map((filter, idx) => (
                    <div key={idx}>
                        {filter.type === 'select' && (
                            <FormSelect
                                label={filter.label}
                                value={filter.value || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                                placeholder={filter.placeholder || `All ${filter.label}`}
                                options={filter.options}
                            />
                        )}
                        {filter.type === 'search' && (
                            <FormInput
                                label={filter.label}
                                placeholder={filter.placeholder || 'Search...'}
                                value={filter.value || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                            />
                        )}
                        {filter.type === 'date' && (
                            <FormInput
                                label={filter.label}
                                type="date"
                                value={filter.value || ''}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <button
                    onClick={onReset}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-widest transition-colors"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}
