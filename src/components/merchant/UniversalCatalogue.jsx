import { useState, useEffect } from "react";
import { 
    Package, Plus, GripVertical, MoreVertical, 
    Eye, EyeOff, Edit3, Trash2, ChevronRight,
    Search, Filter, FolderTree, Info, AlertCircle,
    ArrowUpRight, BarChart3, Star, Layers, Box
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
import { Button } from "../ui/button";
import AddCatalogueItemModal from "./AddCatalogueItemModal";

function SortableItem({ item, type, onToggleStatus, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item._id });

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
            <div className="flex items-center gap-4">
                <input 
                    type="checkbox"
                    checked={item.isSelected}
                    onChange={() => item.onSelect(item._id)}
                    className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                />
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="cursor-grab active:cursor-grabbing p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all hover:bg-slate-100"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
            </div>

            <div className="w-20 h-20 rounded-[22px] bg-slate-50 border border-slate-100 overflow-hidden shrink-0 pointer-events-none relative group/img shadow-inner">
                {item.images?.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {type === 'product' ? <Box className="w-8 h-8 opacity-20" /> : <Package className="w-8 h-8 opacity-20" />}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 min-w-0 pointer-events-none">
                <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight truncate">{item.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        item.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                        {item.status}
                    </span>
                    {type === 'product' && item.sku && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">SKU: {item.sku}</span>
                    )}
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{item.description || "No description provided."}</p>
                {type === 'product' && (
                    <div className="flex items-center gap-2 mt-2">
                         <div className={`w-2 h-2 rounded-full ${item.stock > 10 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock: {item.stock || 0}</span>
                    </div>
                )}
            </div>

            <div className="text-right px-6 shrink-0 pointer-events-none">
                <div className="text-xl font-black text-slate-900 tracking-tighter flex items-baseline justify-end gap-0.5">
                    <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                    {item.priceType === 'range' ? (
                        <>
                            <span>{item.minPrice}</span>
                            <span className="mx-1 text-slate-300 text-sm">-</span>
                            <span>{item.maxPrice}</span>
                        </>
                    ) : (
                        <span>{item.price || 0}</span>
                    )}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1.5 opacity-70">
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    {item.priceType === 'fixed' ? 'Fixed Price' : item.priceType === 'hourly' ? 'per hour' : 'Starting Price'}
                </div>
            </div>

            <div className="flex items-center gap-2 pr-1">
                <button 
                    onClick={() => onToggleStatus(item)}
                    className={`w-11 h-11 flex items-center justify-center rounded-2xl border transition-all shadow-sm ${
                        item.status === 'Active' 
                        ? 'bg-white border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50' 
                        : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50'
                    }`}
                    title={item.status === 'Active' ? "Disable" : "Enable"}
                >
                    {item.status === 'Active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="w-px h-8 bg-slate-100 mx-1" />
                <button 
                    onClick={() => onEdit(item)}
                    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                    title={`Edit ${type}`}
                >
                    <Edit3 className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onDelete(item._id)}
                    className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                    title={`Delete ${type}`}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default function UniversalCatalogue({ type = "service", listingId }) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchItems = async () => {
        if (!listingId) return;
        setIsLoading(true);
        try {
            const endpoint = type === "product" ? "products" : "services";
            const res = await fetchWithAuth(`${API_BASE_URL}/${endpoint}?listingId=${listingId}`);
            const data = await res.json();
            if (data.success) {
                const sorted = data.data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                setItems(sorted);
            }
        } catch (err) {
            console.error(`Failed to fetch ${type}s`, err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, [listingId, type]);

    const handleToggleStatus = async (item) => {
        const newStatus = item.status === 'Active' ? 'Draft' : 'Active';
        try {
            const endpoint = type === "product" ? "products" : "services";
            const res = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchItems();
        } catch (err) {
            console.error("Failed to toggle status", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const endpoint = type === "product" ? "products" : "services";
            const res = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            if (res.ok) fetchItems();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleBulkStatus = async (status) => {
        if (selectedItemIds.length === 0) return;
        setIsBulkLoading(true);
        try {
            const endpoint = type === "product" ? "products" : "services";
            await Promise.all(selectedItemIds.map(id => 
                fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                })
            ));
            setSelectedItemIds([]);
            fetchItems();
        } catch (err) {
            console.error("Bulk status update failed", err);
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItemIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedItemIds.length} ${type}s?`)) return;
        setIsBulkLoading(true);
        try {
            const endpoint = type === "product" ? "products" : "services";
            await Promise.all(selectedItemIds.map(id => 
                fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' })
            ));
            setSelectedItemIds([]);
            fetchItems();
        } catch (err) {
            console.error("Bulk delete failed", err);
        } finally {
            setIsBulkLoading(false);
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItemIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            const oldIndex = items.findIndex(s => s._id === active.id);
            const newIndex = items.findIndex(s => s._id === over.id);
            
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            try {
                const orders = newItems.map((s, idx) => ({ id: s._id, displayOrder: idx }));
                const endpoint = type === "product" ? "products" : "services";
                await fetchWithAuth(`${API_BASE_URL}/${endpoint}/reorder`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orders })
                });
            } catch (err) {
                console.error("Reorder failed", err);
                fetchItems();
            }
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || item.categoryId?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const groupedItems = filteredItems.reduce((acc, item) => {
        const category = item.categoryId?.name || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    const categories = ["all", ...new Set(items.map(item => item.categoryId?.name).filter(Boolean))];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Mini */}
            <div className="flex justify-between items-center pb-2">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        {type === 'product' ? <Box className="w-5 h-5 text-indigo-600" /> : <Package className="w-5 h-5 text-indigo-600" />}
                        {type} Catalogue
                    </h2>
                </div>
                <button 
                    onClick={() => { setEditingItem(null); setIsAddModalOpen(true); }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add {type}
                </button>
            </div>

            {/* Premium Search & Filter Bar */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text"
                        placeholder={`Search ${type}s by name or SKU...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:min-w-[200px]">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black uppercase tracking-widest text-[10px] appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {selectedItemIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right duration-300">
                            <button 
                                onClick={() => handleBulkStatus('Active')}
                                className="h-14 px-4 bg-white border border-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all flex items-center gap-2 font-black uppercase text-[9px] tracking-widest shadow-sm"
                                disabled={isBulkLoading}
                            >
                                <Eye className="w-4 h-4" /> Enable
                            </button>
                            <button 
                                onClick={() => handleBulkStatus('Draft')}
                                className="h-14 px-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 font-black uppercase text-[9px] tracking-widest shadow-sm"
                                disabled={isBulkLoading}
                            >
                                <EyeOff className="w-4 h-4" /> Disable
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                className="h-14 px-4 bg-white border border-rose-100 text-rose-600 rounded-2xl hover:bg-rose-50 transition-all flex items-center gap-2 font-black uppercase text-[9px] tracking-widest shadow-sm"
                                disabled={isBulkLoading}
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                            <div className="w-px h-8 bg-slate-100 mx-1" />
                            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{selectedItemIds.length} SELECTED</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Loading {type}s...</p>
                    </div>
                ) : Object.keys(groupedItems).length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center flex flex-col items-center border-dashed">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300 mb-8">
                            <Layers className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No {type}s found</h3>
                        <p className="text-slate-500 font-medium max-w-sm mt-3 mb-8">Start adding items to showcase your business offerings.</p>
                        <Button onClick={() => setIsAddModalOpen(true)} className="px-10 py-6 rounded-2xl">Create First {type}</Button>
                    </div>
                ) : (
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {Object.entries(groupedItems).map(([category, catItems]) => (
                            <div key={category} className="space-y-6">
                                <div className="flex items-center gap-4 px-2 group/cat">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover/cat:scale-110 transition-transform">
                                        <FolderTree className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{category}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{catItems.length} Items</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Group</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-slate-100 to-transparent flex-1 ml-4"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 pl-2">
                                    <SortableContext 
                                        items={catItems.map(i => i._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {catItems.map((item) => (
                                            <SortableItem 
                                                key={item._id} 
                                                item={{
                                                    ...item,
                                                    isSelected: selectedItemIds.includes(item._id),
                                                    onSelect: toggleSelectItem
                                                }} 
                                                type={type}
                                                onToggleStatus={handleToggleStatus}
                                                onEdit={(it) => { setEditingItem(it); setIsAddModalOpen(true); }}
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

            <AddCatalogueItemModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                item={editingItem}
                type={type}
                listingId={listingId}
                onSuccess={fetchItems}
            />
        </div>
    );
}
