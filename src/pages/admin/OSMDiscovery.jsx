import { useState, useEffect, useCallback } from "react";
import { 
    Search, MapPin, Globe, Plus, Info, 
    Layers, Zap, Database, Download, CheckCircle2,
    Filter, RefreshCw, ExternalLink
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import DataTable from "../../components/admin/DataTable";
import AdminHeader from "../../components/admin/AdminHeader";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import toast from "react-hot-toast";

export default function OSMDiscovery() {
    const [results, setResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    
    // Search Params
    const [searchParams, setSearchParams] = useState({
        city: "Rajkot, Gujarat, India",
        category: "",
        radius: 5000,
        limit: 50
    });

    const [importingId, setImportingId] = useState(null);

    // Fetch OSM Categories
    const fetchCategories = useCallback(async () => {
        try {
            setIsCategoriesLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/osm/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data.data || []);
            }
        } catch (err) {
            console.error("Failed to load OSM categories");
        } finally {
            setIsCategoriesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            const query = new URLSearchParams(searchParams).toString();
            const res = await fetchWithAuth(`${API_BASE_URL}/osm/search?${query}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.data || []);
                toast.success(`Found ${data.count} businesses in ${searchParams.city}`);
            } else {
                const error = await res.json();
                toast.error(error.error || "Search failed. The discovery engine is congested.");
                setResults([]); // Clear previous results on failure
            }
        } catch (err) {
            toast.error("Process failed: Network connectivity issue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async (business) => {
        try {
            setImportingId(business.id);
            // This endpoint will be implemented in the next step
            const res = await fetchWithAuth(`${API_BASE_URL}/companies/import-osm`, {
                method: 'POST',
                body: JSON.stringify(business)
            });
            
            if (res.ok) {
                toast.success(`${business.name} imported successfully!`);
                // Mark as imported in local state
                setResults(prev => prev.map(item => 
                    item.id === business.id ? { ...item, alreadyImported: true } : item
                ));
            } else {
                const error = await res.json();
                toast.error(error.msg || "Import failed");
            }
        } catch (err) {
            toast.error("Network error during import");
        } finally {
            setImportingId(null);
        }
    };

    const columns = [
        {
            label: "Business Identity",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                        {row.emoji}
                    </div>
                    <div>
                        <p className="font-black text-slate-800 tracking-tight">{value}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                {row.category}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <a 
                                href={row.osmUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 hover:underline"
                            >
                                View on OSM <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Location Details",
            key: "address",
            render: (value, row) => (
                <div className="max-w-[250px] space-y-1">
                    <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed">
                        {value || "No address protocol provided"}
                    </p>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-mono text-slate-400">
                            {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                        </span>
                    </div>
                </div>
            )
        },
        {
            label: "Carrier Intel",
            key: "contact",
            render: (value, row) => (
                <div className="space-y-1">
                    {row.phone && (
                        <Badge variant="outline" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black">
                            CALL: {row.phone}
                        </Badge>
                    )}
                    {row.website && (
                        <Badge variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black">
                            WWW: {new URL(row.website).hostname.replace('www.', '')}
                        </Badge>
                    )}
                    {!row.phone && !row.website && (
                        <span className="text-[10px] font-bold text-slate-300 italic uppercase">No digital footprint</span>
                    )}
                </div>
            )
        }
    ];

    const actions = [
        {
            label: "Import to Database",
            icon: Download,
            className: "text-indigo-600",
            onClick: (row) => handleImport(row),
            condition: (row) => !row.alreadyImported
        },
        {
            label: "Already In-System",
            icon: CheckCircle2,
            className: "text-emerald-500 opacity-50",
            onClick: () => {},
            condition: (row) => row.alreadyImported
        }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <AdminHeader 
                title="Business Discovery Hub"
                subtitle="Harness OpenStreetMap intel to populate your platform with mission-critical business data. 100% Free, no API keys required."
                badge={<Badge variant="premium">OSM Overpass Integration</Badge>}
                actions={
                    <Button 
                        variant="primary" 
                        leftIcon={RefreshCw} 
                        isLoading={isLoading}
                        onClick={handleSearch}
                    >
                        Execute Discovery
                    </Button>
                }
            />

            {/* Discovery Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Filter className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Discovery Parameters</h3>
                        <p className="text-[10px] font-bold text-slate-400 italic">Configure target vector for OSM scanning</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <FormInput 
                        label="Target City"
                        placeholder="City, State, Country"
                        value={searchParams.city}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, city: e.target.value }))}
                        icon={MapPin}
                    />
                    <FormSelect 
                        label="Industry Segment"
                        value={searchParams.category}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                        options={[
                            { label: 'All Businesses', value: '' },
                            ...categories.map(c => ({ label: `${c.emoji} ${c.label}`, value: c.tag }))
                        ]}
                        isLoading={isCategoriesLoading}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 flex justify-between">
                            Scanning Radius <span>{searchParams.radius}m</span>
                        </label>
                        <input 
                            type="range"
                            min="500"
                            max="15000"
                            step="500"
                            value={searchParams.radius}
                            onChange={(e) => setSearchParams(prev => ({ ...prev, radius: e.target.value }))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                    <FormSelect 
                        label="Density Limit"
                        value={searchParams.limit}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, limit: e.target.value }))}
                        options={[
                            { label: '25 Results', value: '25' },
                            { label: '50 Results', value: '50' },
                            { label: '100 Results', value: '100' }
                        ]}
                    />
                </div>
            </div>

            {/* Results Table */}
            <div className="animate-in slide-in-from-bottom-2 duration-500">
                <DataTable 
                    data={results}
                    columns={columns}
                    actions={actions}
                    actionMode="dropdown"
                    isLoading={isLoading}
                    emptyMessage={searchParams.category ? `No ${searchParams.category} detected in current scanning zone` : "Initialize discovery protocol to view data"}
                />
            </div>
        </div>
    );
}
