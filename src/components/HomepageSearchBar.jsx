import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import LocationSelector from './location/LocationSelector';

export default function HomepageSearchBar({ onSearch = () => {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState({
        country_id: '',
        state_id: '',
        city_id: '',
        area_id: ''
    });
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch({
            q: searchTerm,
            city: location.city_id,
            area: location.area_id,
            category: ''
        });
    };

    const selectedLocation = 
        location.area_id ? 'Area selected' :
        location.city_id ? 'City selected' :
        location.state_id ? 'State selected' :
        location.country_id ? 'Country selected' :
        'All locations';

    return (
        <div className="w-full">
            <form onSubmit={handleSearch} className="space-y-4">
                {/* Main Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search businesses, services, or shops..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 transition-colors sm:w-auto"
                    >
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{selectedLocation}</span>
                    </button>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        Search
                    </button>
                </div>

                {/* Expanded Location Selector */}
                {isExpanded && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <LocationSelector
                            value={location}
                            onChange={setLocation}
                            showLabel={true}
                            className="mb-3"
                        />
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                        >
                            Collapse
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
