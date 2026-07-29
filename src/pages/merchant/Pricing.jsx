import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, Loader2, ArrowRight, Zap, Info } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Pricing() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [businesses, setBusinesses] = useState([]);
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
        fetchBusinesses();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/plans`);
            const data = await res.json();
            setPlans(data);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBusinesses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/companies/my-companies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setBusinesses(data.data);
                if (data.data.length > 0) setSelectedBusinessId(data.data[0]._id);
            }
        } catch (err) {
            console.error('Error fetching businesses:', err);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (plan) => {
        if (!selectedBusinessId) {
            alert('Please select a business to upgrade');
            return;
        }

        const res = await loadRazorpayScript();
        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 1. Create Order on Backend
            const orderRes = await fetch(`${API_BASE_URL}/subscriptions/create-order`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    planId: plan._id,
                    billingCycle,
                    businessId: selectedBusinessId
                })
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.msg);

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Fuerte Business",
                description: `Upgrade to ${plan.name} (${billingCycle})`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    // 3. Verify Payment on Backend
                    const verifyRes = await fetch(`${API_BASE_URL}/subscriptions/verify-payment`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                            ...response,
                            businessId: selectedBusinessId,
                            billingDetails: {
                                name: businesses.find(b => b._id === selectedBusinessId)?.name || 'Merchant',
                                email: 'merchant@example.com' // Should come from user context
                            }
                        })
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyRes.ok) {
                        alert('Success! Your subscription is now active.');
                        navigate('/brand/billing');
                    } else {
                        alert(verifyData.msg || 'Verification failed');
                    }
                },
                prefill: {
                    name: businesses.find(b => b._id === selectedBusinessId)?.name,
                    email: "merchant@example.com"
                },
                theme: { color: "#4f46e5" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert(err.message || 'Failed to process. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">
                    Choose Your <span className="text-indigo-600">Growth Plan</span>
                </h1>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    Scale your business visibility with India's most powerful listing platform. 
                    Unlock premium features, priority search, and real-time analytics.
                </p>

                <div className="mt-8 flex items-center justify-center gap-4">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
                    <button 
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                        className="w-14 h-7 bg-slate-200 rounded-full relative transition-all"
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${billingCycle === 'annual' ? 'left-8' : 'left-1'}`}></div>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>Annual</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Save 20%</span>
                    </div>
                </div>

                {businesses.length > 1 && (
                    <div className="mt-6 inline-flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                        <span className="text-xs font-black text-slate-400 uppercase">Upgrading:</span>
                        <select 
                            value={selectedBusinessId} 
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none"
                        >
                            {businesses.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                {plans.map((plan) => (
                    <div 
                        key={plan._id}
                        className={`relative flex flex-col p-8 rounded-3xl transition-all ${
                            plan.slug === 'standard' 
                            ? 'bg-slate-900 text-white shadow-2xl scale-105 ring-4 ring-indigo-500/20' 
                            : 'bg-white border border-slate-100 shadow-xl shadow-slate-200'
                        }`}
                    >
                        {plan.slug === 'standard' && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">
                                Best Value
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-black mb-2 uppercase">{plan.name}</h3>
                            <p className={`text-sm ${plan.slug === 'standard' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {plan.description}
                            </p>
                        </div>

                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-4xl font-black">₹{billingCycle === 'annual' ? Math.floor(plan.priceAnnual / 12) : plan.priceMonthly}</span>
                            <span className={`text-sm font-bold ${plan.slug === 'standard' ? 'text-slate-400' : 'text-slate-500'}`}>/Mo</span>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            {plan.features.slice(0, 5).map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className={`mt-0.5 p-0.5 rounded-full ${plan.slug === 'standard' ? 'bg-indigo-500' : 'bg-emerald-500'} text-white`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm font-medium">{feature.label}</span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => handleUpgrade(plan)}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 ${
                                plan.slug === 'standard'
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95'
                                : 'bg-slate-900 hover:bg-black text-white active:scale-95'
                            }`}
                        >
                            {plan.priceMonthly === 0 ? 'Current Plan' : 'Go Pro Now'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Feature Comparison Matrix */}
            <div className="mb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Full Feature <span className="text-indigo-600">Comparison</span></h2>
                    <p className="text-slate-500 text-sm mt-2">Compare across all plans to find your perfect fit</p>
                </div>

                <div className="bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-8 text-xs font-black uppercase tracking-widest text-slate-400">Features</th>
                                    {plans.map(p => (
                                        <th key={p._id} className="p-8 text-center min-w-[150px]">
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-600 block mb-1">Plan</span>
                                            <span className="text-sm font-black uppercase text-slate-900">{p.name}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { label: 'Business Visibility', key: 'visibility' },
                                    { label: 'Verified Badge', key: 'verified' },
                                    { label: 'Priority Search Rank', key: 'priority' },
                                    { label: 'Custom Keywords', key: 'keywords' },
                                    { label: 'Advanced Analytics', key: 'analytics' },
                                    { label: 'WhatsApp Leads', key: 'whatsapp' },
                                    { label: 'Photo/Media Limit', key: 'media' },
                                    { label: 'Customer Support', key: 'support' }
                                ].map((feature) => (
                                    <tr key={feature.key} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 pl-8">
                                            <span className="text-sm font-bold text-slate-700">{feature.label}</span>
                                        </td>
                                        {plans.map(p => {
                                            const f = p.features.find(feat => feat.key === feature.key);
                                            return (
                                                <td key={p._id} className="p-6 text-center">
                                                    {f?.enabled ? (
                                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-16 bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-xl font-black text-indigo-900 mb-1">Safe & Secure Billing</h4>
                    <p className="text-indigo-700/80 text-sm">
                        All transactions are encrypted with 256-bit SSL security. 
                        We don't store your card details. Cancel or change plans anytime.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-indigo-600">
                    <div className="flex flex-col items-center">
                        <Zap className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-black uppercase">Instant</span>
                    </div>
                    <div className="w-px h-10 bg-indigo-200"></div>
                    <div className="flex flex-col items-center">
                        <Info className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-black uppercase">Support</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
