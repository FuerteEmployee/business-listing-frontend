import { useState, useEffect } from "react";
import { 
    CreditCard, Search, Plus, User, Building2, 
    Calendar, CheckCircle2, AlertCircle,
    ArrowRight, Zap, Clock, ShieldCheck, X, ChevronRight
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader";

export default function SubscriptionsAdmin() {
    const [companies, setCompanies] = useState([]);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Form State
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [formData, setFormData] = useState({
        planId: "",
        billingCycle: "monthly",
        endDate: "",
        priceAtPurchase: 0
    });
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [compRes, planRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/companies`),
                fetchWithAuth(`${API_BASE_URL}/plans`)
            ]);
            
            if (compRes.ok && planRes.ok) {
                const compData = await compRes.json();
                const plnData = await planRes.json();
                
                // Handle both direct arrays and paginated objects { data: [...] }
                const comps = Array.isArray(compData) ? compData : (compData.data || []);
                const plns = Array.isArray(plnData) ? plnData : (plnData.data || []);
                
                setCompanies(comps);
                setPlans(plns.filter(p => !p.isArchived));
            }
        } catch (err) {
            console.error("Fetch data error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredCompanies = (Array.isArray(companies) ? companies : []).filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const handleSelectPlan = (plan) => {
        const price = formData.billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
        setFormData({
            ...formData,
            planId: plan._id,
            priceAtPurchase: price
        });
    };

    const handleCycleChange = (cycle) => {
        const plan = plans.find(p => p._id === formData.planId);
        const price = plan ? (cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual) : 0;
        setFormData({
            ...formData,
            billingCycle: cycle,
            priceAtPurchase: price
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCompany) return toast.error("Please select a business");
        if (!formData.planId) return toast.error("Please select a plan");

        try {
            setIsSaving(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/subscriptions/admin/assign`, {
                method: "POST",
                body: JSON.stringify({
                    businessId: selectedCompany._id,
                    ...formData
                })
            });

            if (res.ok) {
                toast.success(`Successfully assigned plan to ${selectedCompany.name}`);
                setSelectedCompany(null);
                setFormData({
                    planId: "",
                    billingCycle: "monthly",
                    endDate: "",
                    priceAtPurchase: 0
                });
                setSearchTerm("");
            } else {
                const data = await res.json();
                toast.error(data.msg || "Failed to assign subscription");
            }
        } catch (err) {
            console.error("Assign error:", err);
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <AdminHeader 
                title="Subscription Overrides"
                subtitle="Admin Manual Grant Tool"
                badge={
                    <div className="p-3 bg-indigo-600 rounded-[20px] shadow-2xl shadow-indigo-200 mb-4 inline-block">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Business Selection */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-600" /> 1. Select Business
                            </h2>
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[28px] text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="Search by company name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {searchTerm && filteredCompanies.map(company => (
                                <button 
                                    key={company._id}
                                    onClick={() => {
                                        setSelectedCompany(company);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full p-5 rounded-[28px] flex items-center gap-4 transition-all text-left group ${
                                        selectedCompany?._id === company._id 
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                        : 'bg-slate-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-indigo-100'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                                        selectedCompany?._id === company._id ? 'bg-indigo-500' : 'bg-white shadow-sm text-indigo-600'
                                    }`}>
                                        {company.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-xs uppercase truncate">{company.name}</div>
                                        <div className={`text-[10px] font-bold uppercase truncate ${
                                            selectedCompany?._id === company._id ? 'text-indigo-200' : 'text-slate-400'
                                        }`}>
                                            {company.city_id?.name || 'Local Merchant'}
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                                        selectedCompany?._id === company._id ? 'text-white' : 'text-slate-300'
                                    }`} />
                                </button>
                            ))}
                            {!searchTerm && !selectedCompany && (
                                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px] space-y-3">
                                    <Building2 className="w-10 h-10 text-slate-200 mx-auto" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type to find a merchant</p>
                                </div>
                            )}
                        </div>

                        {selectedCompany && !searchTerm && (
                            <div className="p-8 bg-indigo-50 rounded-[32px] border border-indigo-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Merchant</span>
                                        <h3 className="text-xl font-black text-indigo-900 uppercase leading-none">{selectedCompany.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCompany(null)}
                                        className="p-2 bg-white text-indigo-300 hover:text-rose-500 rounded-xl transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 bg-white text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                                        ID: {selectedCompany._id.slice(-6)}
                                    </div>
                                    <div className="px-3 py-1 bg-white text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                                        {selectedCompany.category}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Plan Selection & Config */}
                <div className="lg:col-span-7 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-12">
                        {/* Plan Grid */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Zap className="w-4 h-4 text-amber-500" /> 2. Choose Service Tier
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.isArray(plans) && plans.map(plan => (
                                    <button 
                                        key={plan._id}
                                        type="button"
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`p-6 rounded-[32px] border-2 transition-all text-left group flex flex-col justify-between h-full ${
                                            formData.planId === plan._id 
                                            ? 'bg-slate-900 border-slate-900 text-white scale-[1.02] shadow-2xl' 
                                            : 'bg-white border-slate-100 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className={`p-2 rounded-xl ${formData.planId === plan._id ? 'bg-slate-800' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    <CreditCard className="w-5 h-5" />
                                                </div>
                                                {formData.planId === plan._id && <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg uppercase tracking-tight">{plan.name}</h3>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${formData.planId === plan._id ? 'text-slate-400' : 'text-slate-400'}`}>
                                                    {plan.features.length} Premium Hooks
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-baseline gap-1">
                                            <span className="text-2xl font-black">₹{formData.billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual}</span>
                                            <span className="text-[10px] font-bold opacity-60 uppercase">{formData.billingCycle === 'monthly' ? '/MO' : '/YR'}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Config Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Billing Pulse</label>
                                <div className="flex bg-slate-50 p-2 rounded-[24px]">
                                    <button 
                                        type="button"
                                        onClick={() => handleCycleChange('monthly')}
                                        className={`flex-1 py-4 rounded-[18px] text-[10px] font-black uppercase transition-all ${formData.billingCycle === 'monthly' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleCycleChange('annual')}
                                        className={`flex-1 py-4 rounded-[18px] text-[10px] font-black uppercase transition-all ${formData.billingCycle === 'annual' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}
                                    >
                                        Annual
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Termination Date</label>
                                <div className="relative">
                                    <Calendar className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="date"
                                        required
                                        className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[28px] text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Ledger Price</span>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">₹{formData.priceAtPurchase || 0}</h2>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                type="submit"
                                isLoading={isSaving}
                                disabled={!selectedCompany || !formData.planId}
                                className="w-full md:w-auto px-12 py-5 uppercase tracking-[0.2em]"
                                rightIcon={ArrowRight}
                            >
                                Grant Service Access
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


