import { useState, useEffect, useCallback } from "react";
import { 
    Search, Filter, Plus, MoreVertical, Edit2, Trash2, CheckCircle2, XCircle, 
    Pause, Play, Clock, Calendar, DollarSign, Building2, Image as ImageIcon,
    ExternalLink, AlertCircle, RefreshCw, Loader2, ChevronLeft, ChevronRight, X, Eye,
    Monitor, ShieldCheck
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import AdminHeader from "../../components/admin/AdminHeader";
import Dropdown from "../../components/ui/Dropdown";
import FormSelect from "../../components/ui/FormSelect";

const STATUS_STYLES = {
    draft:          "bg-slate-100 text-slate-600 border-slate-200",
    pending_review: "bg-amber-50 text-amber-700 border-amber-200",
    approved:       "bg-sky-50 text-sky-700 border-sky-200",
    rejected:       "bg-rose-50 text-rose-700 border-rose-200",
    active:         "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused:         "bg-purple-50 text-purple-700 border-purple-200",
    expired:        "bg-slate-200 text-slate-500 border-slate-300",
};

export default function AdManager() {
    const [ads, setAds] = useState([]);
    const [slots, setSlots] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    
    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [slotFilter, setSlotFilter] = useState("");

    // Modals
    const [modal, setModal] = useState({ show: false, type: 'create', data: null });
    const [moderateModal, setModerateModal] = useState({ show: false, data: null });

    const [form, setForm] = useState({
        title: '', businessId: '', slotId: '', campaignName: '', 
        creativeUrl: '', targetUrl: '', 
        schedule: { startDate: '', endDate: '' },
        pricingModel: 'cpm', bidAmount: 0, budget: 0,
        status: 'pending_review'
    });

    const [modForm, setModForm] = useState({ status: 'approved', moderationNote: '' });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ 
                page, 
                status: statusFilter, 
                slot: slotFilter, 
                search,
                limit: 10 
            });
            const [aRes, sRes, cRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/ads?${params}`),
                fetchWithAuth(`${API_BASE_URL}/ads/slots`),
                fetchWithAuth(`${API_BASE_URL}/companies`)
            ]);

            if (aRes.ok) {
                const aData = await aRes.json();
                setAds(aData.ads);
                setTotal(aData.total);
                setPages(aData.pages);
            }
            if (sRes.ok) {
                const sData = await sRes.json();
                setSlots(sData.slots);
            }
            if (cRes.ok) {
                const cData = await cRes.json();
                setCompanies(Array.isArray(cData) ? cData : cData.companies || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, slotFilter, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenCreate = () => {
        setForm({
            title: '', businessId: '', slotId: '', campaignName: '', 
            creativeUrl: '', targetUrl: '', 
            schedule: { 
                startDate: new Date().toISOString().split('T')[0], 
                endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] 
            },
            pricingModel: 'cpm', bidAmount: 0, budget: 0,
            status: 'pending_review'
        });
        setModal({ show: true, type: 'create', data: null });
    };

    const handleOpenEdit = (ad) => {
        setForm({
            ...ad,
            businessId: ad.businessId?._id || '',
            slotId: ad.slotId?._id || '',
            schedule: {
                startDate: new Date(ad.schedule.startDate).toISOString().split('T')[0],
                endDate: new Date(ad.schedule.endDate).toISOString().split('T')[0],
            }
        });
        setModal({ show: true, type: 'edit', data: ad });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = modal.type === 'edit' ? `${API_BASE_URL}/ads/${modal.data._id}` : `${API_BASE_URL}/ads`;
            const method = modal.type === 'edit' ? 'PATCH' : 'POST';
            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(form)
            });
            if (res.ok) {
                showToast(`Ad ${modal.type === 'edit' ? 'updated' : 'created'} successfully!`);
                setModal({ show: false, type: 'create', data: null });
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.msg || "Operation failed", 'error');
            }
        } catch (e) {
            showToast("Network error", 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this advertisement?")) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/ads/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast("Ad deleted");
                fetchData();
            }
        } catch (e) {
            showToast("Delete failed", 'error');
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/ads/${id}/toggle`, { method: 'PATCH' });
            if (res.ok) {
                showToast("Status updated");
                fetchData();
            }
        } catch (e) {
            showToast("Toggle failed", 'error');
        }
    };

    const handleModerate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/ads/${moderateModal.data._id}/moderate`, {
                method: 'POST',
                body: JSON.stringify(modForm)
            });
            if (res.ok) {
                showToast(`Ad ${modForm.status} successfully`);
                setModerateModal({ show: false, data: null });
                fetchData();
            }
        } catch (e) {
            showToast("Moderation failed", 'error');
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

            {/* Ad Create/Edit Modal */}
            <Modal
                isOpen={modal.show}
                onClose={() => setModal({ ...modal, show: false })}
                title={modal.type === 'edit' ? 'Edit Advertisement' : 'Create New Advertisement'}
                subtitle="Configure campaign details and creative assets"
                icon={ImageIcon}
                size="lg"
                footer={
                    <Button 
                        type="submit" 
                        form="ad-form"
                        className="w-full sm:w-auto"
                    >
                        {modal.type === 'edit' ? 'Save Changes' : 'Create Advertisement'}
                    </Button>
                }
            >
                <form id="ad-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ad Title</label>
                            <input type="text" required className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Name</label>
                            <input type="text" className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                value={form.campaignName} onChange={e => setForm({...form, campaignName: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FormSelect 
                                label="Business Owner"
                                value={form.businessId}
                                onChange={e => setForm({...form, businessId: e.target.value})}
                                options={[
                                    { label: "Select business...", value: "" },
                                    ...companies.map(c => ({ label: c.name, value: c._id }))
                                ]}
                            />
                        </div>
                        <div>
                            <FormSelect 
                                label="Ad Slot / Position"
                                required
                                value={form.slotId}
                                onChange={e => setForm({...form, slotId: e.target.value})}
                                options={[
                                    { label: "Select slot...", value: "" },
                                    ...slots.map(s => ({ label: `${s.name} (${s.size.width}x${s.size.height})`, value: s._id }))
                                ]}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Creative URL (Banner Image)</label>
                        <input type="url" required placeholder="https://..."
                            className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            value={form.creativeUrl} onChange={e => setForm({...form, creativeUrl: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target URL (Redirect Link)</label>
                        <input type="url" placeholder="https://..."
                            className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            value={form.targetUrl} onChange={e => setForm({...form, targetUrl: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule Start</label>
                            <input type="date" required className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                value={form.schedule.startDate} onChange={e => setForm({...form, schedule: {...form.schedule, startDate: e.target.value}})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule End</label>
                            <input type="date" required className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                value={form.schedule.endDate} onChange={e => setForm({...form, schedule: {...form.schedule, endDate: e.target.value}})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <FormSelect 
                                label="Pricing Model"
                                value={form.pricingModel}
                                onChange={e => setForm({...form, pricingModel: e.target.value})}
                                options={[
                                    { label: "CPM", value: "cpm" },
                                    { label: "CPC", value: "cpc" },
                                    { label: "Flat", value: "flat" }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bid (₹)</label>
                            <input type="number" step="0.01" className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                value={form.bidAmount} onChange={e => setForm({...form, bidAmount: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget (₹)</label>
                            <input type="number" step="0.01" className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                value={form.budget} onChange={e => setForm({...form, budget: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Moderation Modal */}
            <Modal
                isOpen={moderateModal.show}
                onClose={() => setModerateModal({ show: false, data: null })}
                title="Moderate Creative"
                subtitle="Review and approve ad content"
                icon={ShieldCheck}
                size="md"
                footer={
                    <Button 
                        type="submit" 
                        form="mod-form"
                        variant={modForm.status === 'approved' ? 'success' : 'danger'}
                        className="w-full"
                    >
                        Apply Decision
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div className="bg-slate-50 rounded-3xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-100 shadow-inner">
                        <img src={moderateModal.data?.creativeUrl} alt="Ad Content" className="max-h-full max-w-full object-contain" />
                    </div>
                    <form id="mod-form" onSubmit={handleModerate} className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Decision</label>
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setModForm({...modForm, status: 'approved'})}
                                    className={`flex-1 py-3 px-4 rounded-2xl border-2 font-black transition-all active:scale-95 ${modForm.status === 'approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-50' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                    Approve
                                </button>
                                <button type="button" onClick={() => setModForm({...modForm, status: 'rejected'})}
                                    className={`flex-1 py-3 px-4 rounded-2xl border-2 font-black transition-all active:scale-95 ${modForm.status === 'rejected' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-50' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                    Reject
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Internal Note</label>
                            <textarea rows={3} className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium resize-none placeholder:text-slate-300"
                                placeholder="Explain your decision..."
                                value={modForm.moderationNote} onChange={e => setModForm({...modForm, moderationNote: e.target.value})} />
                        </div>
                    </form>
                </div>
            </Modal>

            <AdminHeader 
                title="Ad Manager"
                subtitle={`${total} campaigns / advertisements`}
                badge={
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 w-fit mb-4">
                        <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                }
                actions={
                    <div className="flex gap-2">
                        <button onClick={handleOpenCreate} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all">
                            <Plus className="w-5 h-5" /> New Campaign
                        </button>
                        <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex-1">
                    <FormSelect
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={e => {setSearch(e.target.value); setPage(1);}}
                        searchable={true}
                    />
                </div>
                <div className="w-full sm:w-64">
                    <FormSelect
                        value={statusFilter}
                        onChange={e => {setStatusFilter(e.target.value || "all"); setPage(1);}}
                        options={[
                            { label: "All Statuses", value: "all" },
                            ...Object.keys(STATUS_STYLES).map(s => ({ label: s.replace('_', ' ').toUpperCase(), value: s }))
                        ]}
                    />
                </div>
                <div className="w-full sm:w-64">
                    <FormSelect
                        value={slotFilter}
                        onChange={e => {setSlotFilter(e.target.value); setPage(1);}}
                        options={[
                            { label: "All Ad Slots", value: "" },
                            ...slots.map(s => ({ label: s.name, value: s._id }))
                        ]}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 text-xs font-bold text-slate-400">
                    <Filter className="w-4 h-4" /> Filters Active
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                    </div>
                ) : ads.length === 0 ? (
                    <div className="p-20 text-center space-y-3">
                        <ImageIcon className="w-16 h-16 text-slate-200 mx-auto" />
                        <p className="text-sm font-bold text-slate-400">No advertisements found matching your criteria</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    {["Creative", "Ad Info", "Status", "Pricing", "Schedule", "Performance", "Actions"].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ads.map(ad => (
                                    <tr key={ad._id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                                        <td className="px-6 py-4">
                                            <div className="w-20 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group">
                                                <img src={ad.creativeUrl} alt="Ad" className="w-full h-full object-cover" />
                                                <button onClick={() => setModerateModal({ show: true, data: ad })} 
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-slate-900 text-sm leading-none">{ad.title}</p>
                                                    {ad.targetUrl && (
                                                        <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-indigo-400 transition-colors">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex flex-col mt-1 space-y-0.5">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        <Building2 className="w-3 h-3" />
                                                        {ad.businessId?.name || "Global / Unassigned"}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                                        <Monitor className="w-3 h-3" />
                                                        {ad.slotId?.name || "Unknown Slot"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${STATUS_STYLES[ad.status]}`}>
                                                {ad.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-700">₹{ad.bidAmount}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ad.pricingModel}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-slate-500 gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Play className="w-3 h-3 text-emerald-400" />
                                                    {new Date(ad.schedule.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <XCircle className="w-3 h-3 text-rose-400" />
                                                    {new Date(ad.schedule.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Impr.</span>
                                                    <span className="text-xs font-black text-slate-700">{ad.performance.impressions.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Clicks</span>
                                                    <span className="text-xs font-black text-slate-700">{ad.performance.clicks.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">CTR</span>
                                                    <span className="text-xs font-black text-indigo-600">{ad.ctr}%</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div onClick={e => e.stopPropagation()}>
                                                <Dropdown
                                                    align="right"
                                                    trigger={
                                                        <button className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                    }
                                                    items={[
                                                        ...(ad.status === 'active' || ad.status === 'paused' ? [{
                                                            label: ad.status === 'active' ? "Pause Ad" : "Resume Ad",
                                                            icon: ad.status === 'active' ? Pause : Play,
                                                            onClick: () => handleToggle(ad._id)
                                                        }] : []),
                                                        ...(ad.status === 'pending_review' ? [{
                                                            label: "Moderate Creative",
                                                            icon: ShieldCheck,
                                                            onClick: () => setModerateModal({ show: true, data: ad })
                                                        }] : []),
                                                        {
                                                            label: "View Creative",
                                                            icon: Eye,
                                                            onClick: () => setModerateModal({ show: true, data: ad })
                                                        },
                                                        {
                                                            label: "Edit Campaign",
                                                            icon: Edit2,
                                                            onClick: () => handleOpenEdit(ad)
                                                        },
                                                        {
                                                            label: "Delete Campaign",
                                                            icon: Trash2,
                                                            onClick: () => handleDelete(ad._id),
                                                            danger: true
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400">SHOWING 10 OF {total} CAMPAIGNS</p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-black text-slate-900">PAGE {page} / {pages}</span>
                            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

