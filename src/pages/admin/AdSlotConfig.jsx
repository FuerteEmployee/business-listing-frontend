import { useState, useEffect, useCallback } from "react";
import { 
    Layout, Plus, Save, Trash2, Edit2, X, AlertCircle, CheckCircle2, 
    Monitor, LayoutDashboard, Sidebar, PanelBottom as Footer, Maximize as Popup, Layers, RefreshCw, Loader2, MoreVertical
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import AdminHeader from "../../components/admin/AdminHeader";
import { Button } from "../../components/ui/button";
import Dropdown from "../../components/ui/Dropdown";
import FormSelect from "../../components/ui/FormSelect";

const PAGE_OPTIONS = [
    { value: 'home', label: 'Home Page' },
    { value: 'search', label: 'Search Results' },
    { value: 'category', label: 'Category Page' },
    { value: 'business_detail', label: 'Business Detail' },
    { value: 'all', label: 'All Pages' }
];

const POSITION_OPTIONS = [
    { value: 'top_banner', label: 'Top Banner', icon: Monitor },
    { value: 'sidebar', label: 'Sidebar', icon: Sidebar },
    { value: 'inline', label: 'Inline Content', icon: LayoutDashboard },
    { value: 'footer', label: 'Footer', icon: Footer },
    { value: 'popup', label: 'Popup Overlay', icon: Monitor },
    { value: 'between_listings', label: 'Between Listings', icon: Layers }
];

export default function AdSlotConfig() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, edit: false, data: null });
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [form, setForm] = useState({ 
        name: '', page: 'home', position: 'top_banner', 
        size: { width: 728, height: 90, label: 'Leaderboard' },
        pricingModel: 'cpm', pricePerUnit: 0, description: '', isActive: true 
    });
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/ads/slots`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data.slots);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (slot = null) => {
        if (slot) {
            setForm({ ...slot });
            setModal({ show: true, edit: true, data: slot });
        } else {
            setForm({ 
                name: '', page: 'home', position: 'top_banner', 
                size: { width: 728, height: 90, label: 'Leaderboard' },
                pricingModel: 'cpm', pricePerUnit: 0, description: '', isActive: true 
            });
            setModal({ show: true, edit: false, data: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = modal.edit ? `${API_BASE_URL}/ads/slots/${modal.data._id}` : `${API_BASE_URL}/ads/slots`;
            const method = modal.edit ? 'PATCH' : 'POST';
            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(form)
            });
            if (res.ok) {
                showToast(`Slot ${modal.edit ? 'updated' : 'created'} successfully!`);
                setModal({ show: false, edit: false, data: null });
                fetchData();
            } else {
                const d = await res.json();
                showToast(d.msg || "Operation failed", 'error');
            }
        } catch (e) {
            showToast("Network error", 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/ads/slots/${confirmDelete.id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast("Slot deleted successfully");
                setConfirmDelete({ show: false, id: null });
                fetchData();
            }
        } catch (e) {
            showToast("Delete failed", 'error');
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 ${
                    toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Ad Slot Modal */}
            <Modal
                isOpen={modal.show}
                onClose={() => setModal({ ...modal, show: false })}
                title={modal.edit ? 'Edit Ad Slot' : 'New Ad Slot'}
                subtitle="Configure ad placement and pricing rules"
                icon={Layers}
                size="md"
                footer={
                    <Button 
                        type="submit" 
                        form="slot-form"
                        className="w-full sm:w-auto"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {modal.edit ? 'Update Slot' : 'Create Slot'}
                    </Button>
                }
            >
                <form id="slot-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slot Name</label>
                        <input type="text" required placeholder="e.g. Home Page Top Leaderboard"
                            className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FormSelect
                                label="Page Target"
                                value={form.page}
                                onChange={e => setForm({ ...form, page: e.target.value })}
                                options={PAGE_OPTIONS}
                            />
                        </div>
                        <div>
                            <FormSelect
                                label="Position"
                                value={form.position}
                                onChange={e => setForm({ ...form, position: e.target.value })}
                                options={POSITION_OPTIONS}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Width (px)</label>
                            <input type="number" required
                                className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold"
                                value={form.size.width} onChange={e => setForm({ ...form, size: { ...form.size, width: parseInt(e.target.value) }})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height (px)</label>
                            <input type="number" required
                                className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold"
                                value={form.size.height} onChange={e => setForm({ ...form, size: { ...form.size, height: parseInt(e.target.value) }})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                            <input type="text" placeholder="Leaderboard"
                                className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium"
                                value={form.size.label} onChange={e => setForm({ ...form, size: { ...form.size, label: e.target.value }})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FormSelect
                                label="Pricing Model"
                                value={form.pricingModel}
                                onChange={e => setForm({ ...form, pricingModel: e.target.value })}
                                options={[
                                    { value: "cpm", label: "CPM (Per 1k Impressions)" },
                                    { value: "cpc", label: "CPC (Per Click)" },
                                    { value: "flat", label: "Flat Price (Fixed)" }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Price (₹)</label>
                            <input type="number" step="0.01"
                                className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold"
                                value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea rows={2} className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none placeholder:text-slate-300 font-medium"
                            placeholder="Briefly describe this ad position..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <input type="checkbox" id="isActive" className="w-5 h-5 text-indigo-600 rounded-lg border-slate-200 focus:ring-indigo-500"
                            checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                        <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Available for bookings</label>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                title="Delete Ad Slot?"
                subtitle="This action cannot be undone and may affect active campaigns."
                icon={Trash2}
                size="sm"
                footer={
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete({ show: false, id: null })}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete Slot</Button>
                    </div>
                }
            >
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-rose-700 leading-relaxed">
                        Are you sure you want to delete this ad slot? Active advertisements in this position might stop rendering correctly.
                    </p>
                </div>
            </Modal>

            <AdminHeader 
                title="Ad Slot Configuration"
                subtitle="Define where advertisements can appear on the platform"
                badge={
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 w-fit mb-4">
                        <Layers className="w-6 h-6 text-white" />
                    </div>
                }
                actions={
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-500">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleOpenModal()} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all">
                            <Plus className="w-5 h-5" /> New Ad Slot
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : slots.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                        <Layers className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900">No ad slots defined yet</p>
                        <p className="text-sm text-slate-400">Slots are required before you can create any advertisements.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {slots.map(slot => (
                        <div key={slot._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-2xl ${slot.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {POSITION_OPTIONS.find(o => o.value === slot.position)?.icon ? 
                                        (() => {
                                            const Icon = POSITION_OPTIONS.find(o => o.value === slot.position).icon;
                                            return <Icon className="w-6 h-6" />;
                                        })() : <Monitor className="w-6 h-6" />
                                    }
                                </div>
                                 <div className="flex gap-1.5">
                                    <Dropdown
                                        align="right"
                                        trigger={
                                            <button className="p-2 bg-slate-50 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-100 rounded-xl transition-all">
                                                <MoreVertical className="w-4 h-4 text-slate-400" />
                                            </button>
                                        }
                                        items={[
                                            {
                                                label: "Edit Slot",
                                                icon: Edit2,
                                                onClick: () => handleOpenModal(slot)
                                            },
                                            {
                                                label: "Delete Slot",
                                                icon: Trash2,
                                                onClick: () => setConfirmDelete({ show: true, id: slot._id }),
                                                danger: true
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{slot.name}</h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{slot.page} / {slot.position}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <p className="text-slate-400 mb-0.5">Dimensions</p>
                                    <p className="font-black text-slate-700">{slot.size.width} × {slot.size.height}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <p className="text-slate-400 mb-0.5">Pricing ({slot.pricingModel})</p>
                                    <p className="font-black text-indigo-600">₹{slot.pricePerUnit}</p>
                                </div>
                            </div>
                            {!slot.isActive && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-bold border border-amber-100">
                                    <AlertCircle className="w-3 h-3" />
                                    INACTIVE - NOT SHOWING ON FRONTEND
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
