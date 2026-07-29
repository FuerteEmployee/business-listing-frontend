import { useState, useEffect } from "react";
import { X, Star, Calendar, Percent, Tag, ShieldCheck, ChevronRight, AlertCircle, Info, Building2 } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

export default function CreateOfferModal({ isOpen, onClose, companies, onCreated }) {
    const [formData, setFormData] = useState({
        businessId: companies[0]?._id || "",
        title: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        validity: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        terms: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (companies.length > 0 && !formData.businessId) {
            setFormData(prev => ({ ...prev, businessId: companies[0]._id }));
        }
    }, [companies]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                onCreated(data.offer);
                onClose();
            } else {
                setError(data.msg || "Failed to create offer.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Offer"
            subtitle="Engage customers with exclusive deals and discounts"
            icon={Star}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSelect 
                        label="Select Business"
                        name="businessId"
                        value={formData.businessId}
                        onChange={handleInputChange}
                        icon={Building2}
                        options={companies.map(c => ({ value: c._id, label: c.name }))}
                        required
                    />
                    <FormInput 
                        label="Offer Title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. 20% Off Weekend Sale"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormSelect 
                        label="Discount Type"
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleInputChange}
                        icon={Tag}
                        options={[
                            { value: "percentage", label: "Percentage (%)" },
                            { value: "flat", label: "Flat Amount (₹)" },
                            { value: "buy_one_get_one", label: "Buy 1 Get 1" },
                            { value: "custom", label: "Custom Offer" }
                        ]}
                    />
                    {(formData.discountType === 'percentage' || formData.discountType === 'flat') && (
                        <FormInput 
                            label={formData.discountType === 'percentage' ? "Discount (%)" : "Amount (₹)"}
                            type="number"
                            name="discountValue"
                            value={formData.discountValue}
                            onChange={handleInputChange}
                            required
                        />
                    )}
                    <div className="md:col-span-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Active Status</label>
                         <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                             <span className="text-xs font-bold text-indigo-700 uppercase tracking-tight">Auto-Active on launch</span>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput 
                        label="Starts On"
                        type="date"
                        name="validity.startDate"
                        value={formData.validity.startDate}
                        onChange={handleInputChange}
                        icon={Calendar}
                        required
                    />
                    <FormInput 
                        label="Ends On"
                        type="date"
                        name="validity.endDate"
                        value={formData.validity.endDate}
                        onChange={handleInputChange}
                        icon={Calendar}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Offer Description & Terms</label>
                    <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium h-24"
                        placeholder="Describe your offer details..."
                    />
                    <textarea 
                        name="terms"
                        value={formData.terms}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium h-20"
                        placeholder="Terms & Conditions (e.g. valid only for new customers)"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading} className="px-8">
                        Launch Offer
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
