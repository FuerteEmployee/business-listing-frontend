import { useState, useEffect } from "react";
import { X, Megaphone, Calendar, Target, Zap, ShieldCheck, ChevronRight, AlertCircle, Info } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";

export default function PromoteListingModal({ isOpen, onClose, company, onPromoted }) {
    const [step, setStep] = useState(1);
    const [budget, setBudget] = useState(500);
    const [duration, setDuration] = useState(7);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [targetLocations, setTargetLocations] = useState([]);
    const [targetCategories, setTargetCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchSlots();
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [locRes, catRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/locations/cities`),
                fetchWithAuth(`${API_BASE_URL}/categories`)
            ]);
            const locData = await locRes.json();
            const catData = await catRes.json();
            if (locData.success) setLocations(locData.data || []);
            setCategories(Array.isArray(catData) ? catData : (catData.data || []));
            
            // Auto-select company's current city and category
            if (company) {
                if (company.city_id) setTargetLocations([company.city_id._id || company.city_id]);
                if (company.category) setTargetCategories([company.category]);
            }
        } catch (err) {
            console.error("Failed to fetch initial data", err);
        }
    };

    const fetchSlots = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/merchant-ads/slots`);
            const data = await res.json();
            if (data.success) {
                // Focus on 'between_listings' or 'search' positions for "Boost"
                const boostSlots = data.slots.filter(s => s.position === 'between_listings' || s.page === 'search');
                setSlots(boostSlots);
                if (boostSlots.length > 0) setSelectedSlot(boostSlots[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch slots", err);
        }
    };

    const handlePromote = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + parseInt(duration));

            const payload = {
                businessId: company._id,
                slotId: selectedSlot,
                title: `Boost: ${company.name}`,
                budget: parseFloat(budget),
                schedule: {
                    startDate,
                    endDate
                },
                targetLocations,
                targetCategories,
                pricingModel: 'flat'
            };

            const res = await fetchWithAuth(`${API_BASE_URL}/merchant-ads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                onPromoted(data.ad);
                onClose();
            } else {
                setError(data.msg || "Failed to create promotion.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const totalEstimate = budget; // For now flat pricing

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Boost Your Listing"
            subtitle={`Promote "${company?.name}" to reach more customers`}
            icon={Megaphone}
            size="md"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estimated Cost</span>
                        <span className="text-xl font-black text-slate-900">₹{totalEstimate}</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handlePromote} isLoading={isLoading}>
                            Launch Campaign
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-8">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* Listing Preview Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                        {company?.image ? <img src={company.image} className="w-full h-full object-cover" /> : company?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">{company?.name}</h4>
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-md tracking-tighter">Sponsored</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{company?.address}</p>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-indigo-600 opacity-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Daily Budget (₹)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                            <input 
                                type="number" 
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Duration (Days)</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none"
                            >
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="15">15 Days</option>
                                <option value="30">30 Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Target Placement</label>
                    <div className="grid grid-cols-1 gap-3">
                        {slots.map(slot => (
                            <label key={slot._id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedSlot === slot._id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                                <input 
                                    type="radio" 
                                    name="slot" 
                                    value={slot._id}
                                    checked={selectedSlot === slot._id}
                                    onChange={() => setSelectedSlot(slot._id)}
                                    className="w-5 h-5 text-indigo-600 focus:ring-0 border-slate-300"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-800">{slot.name}</span>
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Recommended</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{slot.description || `Appear in ${slot.page} results`}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <FormSelect 
                            label="Target Category"
                            value={targetCategories[0] || ""}
                            onChange={(e) => setTargetCategories([e.target.value])}
                            options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                            placeholder="Select target category..."
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Promote your brand in this specific category</p>
                    </div>
                    <div>
                        <FormSelect 
                            label="Target City"
                            value={targetLocations[0] || ""}
                            onChange={(e) => setTargetLocations([e.target.value])}
                            options={locations.map(loc => ({ value: loc._id, label: loc.name }))}
                            placeholder="Select target city..."
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Target your local area or expand reach</p>
                    </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                        Your campaign will be submitted for review. Once approved, your listing will receive a <span className="font-bold uppercase tracking-tight">Sponsored</span> badge and higher visibility in search results.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
