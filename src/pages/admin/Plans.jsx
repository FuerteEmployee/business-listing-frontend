import { useState, useEffect } from 'react';
import { 
    Zap, Plus, Edit, Trash2, Check, X, GripVertical, 
    Eye, EyeOff, Archive, Loader2, Save, Info, Trash
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import AdminHeader from "../../components/admin/AdminHeader";

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [planToArchive, setPlanToArchive] = useState(null);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        priceMonthly: 0,
        priceAnnual: 0,
        trialDays: 0,
        isVisible: true,
        features: [
            { key: "verified_badge", label: "Verified Badge", enabled: true },
            { key: "leads_access", label: "Leads Access", enabled: true },
            { key: "priority_listing", label: "Priority Listing", enabled: false },
            { key: "premium_support", label: "Premium Support", enabled: false }
        ]
    });

    const fetchPlans = async () => {
        try {
            setIsLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/plans/admin`);
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            }
        } catch (err) {
            console.error("Failed to fetch plans:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                slug: plan.slug,
                description: plan.description || "",
                priceMonthly: plan.priceMonthly,
                priceAnnual: plan.priceAnnual,
                trialDays: plan.trialDays,
                isVisible: plan.isVisible,
                features: plan.features.length > 0 ? plan.features : [
                    { key: "verified_badge", label: "Verified Badge", enabled: true },
                    { key: "leads_access", label: "Leads Access", enabled: true },
                    { key: "priority_listing", label: "Priority Listing", enabled: false },
                    { key: "premium_support", label: "Premium Support", enabled: false }
                ]
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                slug: "",
                description: "",
                priceMonthly: 0,
                priceAnnual: 0,
                trialDays: 0,
                isVisible: true,
                features: [
                    { key: "verified_badge", label: "Verified Badge", enabled: true },
                    { key: "leads_access", label: "Leads Access", enabled: true },
                    { key: "priority_listing", label: "Priority Listing", enabled: false },
                    { key: "premium_support", label: "Premium Support", enabled: false }
                ]
            });
        }
        setIsModalOpen(true);
    };

    const handleToggleFeature = (index) => {
        const updatedFeatures = [...formData.features];
        updatedFeatures[index].enabled = !updatedFeatures[index].enabled;
        setFormData({ ...formData, features: updatedFeatures });
    };

    const handleAddFeature = () => {
        setFormData({
            ...formData,
            features: [...formData.features, { key: "", label: "", enabled: true }]
        });
    };

    const handleRemoveFeature = (index) => {
        const updatedFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({ ...formData, features: updatedFeatures });
    };

    const handleFeatureChange = (index, field, value) => {
        const updatedFeatures = [...formData.features];
        updatedFeatures[index][field] = value;
        if (field === 'label' && !updatedFeatures[index].key) {
            updatedFeatures[index].key = value.toLowerCase().replace(/\s+/g, '_');
        }
        setFormData({ ...formData, features: updatedFeatures });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const url = editingPlan 
                ? `${API_BASE_URL}/plans/${editingPlan._id}` 
                : `${API_BASE_URL}/plans`;
            
            const method = editingPlan ? "PUT" : "POST";

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchPlans();
                setIsModalOpen(false);
            } else {
                alert("Failed to save plan");
            }
        } catch (err) {
            console.error("Save plan error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleArchive = (plan) => {
        setPlanToArchive(plan);
        setIsArchiveModalOpen(true);
    };

    const executeArchive = async () => {
        if (!planToArchive) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/plans/${planToArchive._id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await fetchPlans();
                setIsArchiveModalOpen(false);
                setPlanToArchive(null);
            }
        } catch (err) {
            console.error("Archive error:", err);
        }
    };

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Subscription Plans"
                subtitle="Configure tiered pricing and merchant feature access."
                actions={
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-100"
                    >
                        <Plus className="w-4 h-4" /> Create New Plan
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="h-[400px] bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
                    ))
                ) : plans.map((plan) => (
                    <div key={plan._id} className={`bg-white rounded-[32px] border ${plan.isArchived ? 'border-slate-100 opacity-60 grayscale' : 'border-slate-200'} shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden`}>
                        <div className="p-8 border-b border-slate-50 relative">
                            {plan.isArchived && (
                                <div className="absolute top-4 right-4 px-2 py-1 bg-slate-200 text-[8px] font-black uppercase tracking-tighter rounded text-slate-500">Archived</div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{plan.name}</h3>
                                {!plan.isVisible && <EyeOff className="w-4 h-4 text-slate-300" />}
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900">₹{plan.priceMonthly}</span>
                                <span className="text-xs font-bold text-slate-400">/mo</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 font-medium leading-relaxed italic line-clamp-2">
                                {plan.description || "No description provided."}
                            </p>
                        </div>
                        
                        <div className="p-8 bg-slate-50/50 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Check className="w-3 h-3 text-emerald-500" /> Included Features
                            </h4>
                            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {plan.features.map((f, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${f.enabled ? 'text-slate-700' : 'text-slate-300 line-through'}`}>{f.label}</span>
                                        {f.enabled ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => handleOpenModal(plan)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                            >
                                <Edit className="w-3.5 h-3.5 mx-auto" />
                            </button>
                            <button 
                                onClick={() => handleArchive(plan)}
                                disabled={plan.isArchived}
                                className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 disabled:opacity-0"
                            >
                                <Archive className="w-3.5 h-3.5 mx-auto" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Editor Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                subtitle="Pricing Model & Feature Matrix"
                icon={Zap}
                size="xl"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1"
                        >
                            Discard Changes
                        </Button>
                        <Button 
                            type="submit" 
                            form="plan-form" 
                            isLoading={isSaving}
                            className="flex-[2]"
                        >
                            Save Tier Specifications
                        </Button>
                    </>
                }
            >
                <form id="plan-form" onSubmit={handleSubmit} className="space-y-12">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Plan Name</label>
                                <input 
                                    required
                                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-[28px] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="e.g. Premium Business"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Plan URL Slug</label>
                                <input 
                                    required
                                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-[28px] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="premium-business"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Plan Description</label>
                            <textarea 
                                rows="6"
                                className="w-full px-8 py-6 bg-slate-50 border-none rounded-[28px] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                placeholder="Explain what this plan offers to merchants..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    {/* Pricing Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Monthly Price (₹)</label>
                            <input 
                                type="number"
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[28px] text-sm font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={formData.priceMonthly}
                                onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Annual Price (₹)</label>
                            <input 
                                type="number"
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[28px] text-sm font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={formData.priceAnnual}
                                onChange={(e) => setFormData({ ...formData, priceAnnual: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Trial Days</label>
                            <input 
                                type="number"
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[28px] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={formData.trialDays}
                                onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Feature Matrix */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Included Features</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Define limits and access</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visibility</span>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isVisible: !formData.isVisible})}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {formData.isVisible ? 'Public' : 'Hidden'}
                                    </button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleAddFeature}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Feature
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {formData.features.map((feature, idx) => (
                                <div key={idx} className="group relative">
                                    <div className={`p-6 rounded-[28px] border-2 transition-all flex items-center justify-between ${
                                        feature.enabled ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-transparent'
                                    }`}>
                                        <div className="flex items-center gap-4 flex-1">
                                            <button 
                                                type="button"
                                                onClick={() => handleToggleFeature(idx)}
                                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                                                    feature.enabled ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 shadow-sm'
                                                }`}
                                            >
                                                {feature.enabled ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                            </button>
                                            <div className="flex-1 space-y-1">
                                                <input 
                                                    className="w-full bg-transparent border-none p-0 text-xs font-black text-slate-800 placeholder:text-slate-300 focus:ring-0"
                                                    placeholder="Feature Label"
                                                    value={feature.label}
                                                    onChange={(e) => handleFeatureChange(idx, 'label', e.target.value)}
                                                />
                                                <input 
                                                    className="w-full bg-transparent border-none p-0 text-[10px] text-slate-400 font-bold uppercase tracking-widest placeholder:text-slate-200 focus:ring-0"
                                                    placeholder="internal_key"
                                                    value={feature.key}
                                                    onChange={(e) => handleFeatureChange(idx, 'key', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveFeature(idx)}
                                            className="w-8 h-8 rounded-xl bg-white text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Archive Confirmation Modal */}
            <Modal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                title="Archive Plan"
                subtitle="Subscriptions will remain active until renewal"
                icon={Archive}
                size="sm"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsArchiveModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={executeArchive}
                            className="flex-1"
                        >
                            Archive Plan
                        </Button>
                    </>
                }
            >
                <div className="text-center text-slate-600">
                    <p className="text-sm font-medium">Are you sure you want to archive <span className="font-bold text-slate-900">"{planToArchive?.name}"</span>?</p>
                    <p className="text-xs mt-2 leading-relaxed tracking-tight font-medium">This will hide the plan from new signups but won't affect existing subscribers until their next billing cycle.</p>
                </div>
            </Modal>
        </div>
    );
}
