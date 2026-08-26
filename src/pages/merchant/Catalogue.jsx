import { useState, useEffect } from "react";
import { 
    Package, Plus, GripVertical, MoreVertical, 
    Eye, EyeOff, Edit3, Trash2, ChevronRight,
    Search, Filter, FolderTree, Info, AlertCircle,
    ArrowUpRight, BarChart3, Star, Layers
} from "lucide-react";
import {
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { Button } from "../../components/ui/button";
import AddServiceModal from "../../components/merchant/AddServiceModal";

function SortableServiceItem({ service, onToggleStatus, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: service._id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.9 : 1,
        scale: isDragging ? 1.02 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={`bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group flex items-center gap-5 ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500/20 forced-colors:ring-[Highlight] cursor-grabbing' : ''}`}
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-2 -ml-1 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all hover:bg-slate-100"
                title="Drag to reorder"
            >
                <GripVertical className="w-5 h-5 transition-transform group-hover:scale-110" />
            </div>

            <div className="w-20 h-20 rounded-[22px] bg-slate-50 border border-slate-100 overflow-hidden shrink-0 pointer-events-none relative group/img shadow-inner">
                {service.images?.length > 0 ? (
                    <img src={service.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-8 h-8 opacity-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 min-w-0 pointer-events-none">
                <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight truncate">{service.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        service.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                        {service.status}
                    </span>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{service.description || "No description provided."}</p>
            </div>

            <div className="text-right px-6 shrink-0 pointer-events-none">
                <div className="text-xl font-black text-slate-900 tracking-tighter flex items-baseline justify-end gap-0.5">
                    <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                    {service.priceType === 'range' ? (
                        <>
                            <span>{service.minPrice}</span>
                            <span className="mx-1 text-slate-300 text-sm">-</span>
                            <span>{service.maxPrice}</span>
                        </>
                    ) : (
                        <span>{service.price || 0}</span>
                    )}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1.5 opacity-70">
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    {service.priceType === 'fixed' ? 'Fixed Price' : service.priceType === 'hourly' ? 'per hour' : 'Starting Price'}
                </div>
            </div>

            <div className="flex items-center gap-2 pr-1">
                <button 
                    onClick={() => onToggleStatus(service)}
                    className={`w-11 h-11 flex items-center justify-center rounded-2xl border transition-all shadow-sm ${
                        service.status === 'Active' 
                        ? 'bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50' 
                        : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50'
                    }`}
                    title={service.status === 'Active' ? "Disable" : "Enable"}
                >
                    {service.status === 'Active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="w-px h-8 bg-slate-100 mx-1" />
                <button 
                    onClick={() => onEdit(service)}
                    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                    title="Edit Service"
                >
                    <Edit3 className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onDelete(service._id)}
                    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                    title="Delete Service"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default function Catalogue() {
    const [services, setServices] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [companiesRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/companies/my-companies`)
            ]);
            const companiesData = await companiesRes.json();
            if (companiesData.success && companiesData.data.length > 0) {
                setCompanies(companiesData.data);
                if (!selectedCompany) setSelectedCompany(companiesData.data[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch companies", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchServices = async () => {
        if (!selectedCompany) return;
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/services?listingId=${selectedCompany}`);
            const data = await res.json();
            // Ensure sorting by displayOrder if not already done by backend
            if (data.success) {
                const sorted = data.data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                setServices(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch services", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { fetchServices(); }, [selectedCompany]);

    const handleToggleStatus = async (service) => {
        const newStatus = service.status === 'Active' ? 'Draft' : 'Active';
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/services/${service._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchServices();
        } catch (err) {
            console.error("Failed to toggle status", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/services/${id}`, { method: 'DELETE' });
            if (res.ok) fetchServices();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            const oldIndex = services.findIndex(s => s._id === active.id);
            const newIndex = services.findIndex(s => s._id === over.id);
            
            const newServices = arrayMove(services, oldIndex, newIndex);
            
            // Optimistic UI update
            setServices(newServices);

            // API call for bulk reorder
            try {
                const orders = newServices.map((s, idx) => ({ id: s._id, displayOrder: idx }));
                await fetchWithAuth(`${API_BASE_URL}/services/reorder`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orders })
                });
            } catch (err) {
                console.error("Reorder failed", err);
                fetchServices(); // Rollback on error
            }
        }
    };

    // Grouping by category
    const groupedServices = services.reduce((acc, service) => {
        const category = service.categoryId?.name || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(service);
        return acc;
    }, {});

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="w-8 h-8 text-indigo-600" />
                        Service Catalogue
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Organize and manage your service offerings across your brands.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select 
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all w-full sm:w-auto"
                    >
                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <button 
                        onClick={() => { setEditingService(null); setIsAddModalOpen(true); }}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add Service
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Catalogue...</p>
                    </div>
                ) : Object.keys(groupedServices).length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center flex flex-col items-center border-dashed">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300 mb-8">
                            <Layers className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Your catalogue is empty</h3>
                        <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Start adding services to showcase your business expertise to potential leads.</p>
                        <Button onClick={() => setIsAddModalOpen(true)} className="px-10 py-6 rounded-2xl">Create First Service</Button>
                    </div>
                ) : (
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {Object.entries(groupedServices).map(([category, items]) => (
                            <div key={category} className="space-y-6 pb-4">
                                <div className="flex items-center gap-4 px-2 group/cat">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover/cat:scale-110 transition-transform">
                                        <FolderTree className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{category}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{items.length} Services</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Category</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-slate-100 to-transparent flex-1 ml-4 line-indigo"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 pl-2">
                                    <SortableContext 
                                        items={items.map(i => i._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {items.map((service) => (
                                            <SortableServiceItem 
                                                key={service._id} 
                                                service={service} 
                                                onToggleStatus={handleToggleStatus}
                                                onEdit={(s) => { setEditingService(s); setIsAddModalOpen(true); }}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </SortableContext>
                                </div>
                            </div>
                        ))}
                    </DndContext>
                )}
            </div>

            <AddServiceModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                service={editingService}
                listingId={selectedCompany}
                onSuccess={fetchServices}
            />
        </div>
    );
}
