import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Clock, CheckCircle2, AlertCircle, FileText, ExternalLink, Download } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Billing() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [refundReason, setRefundReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/companies/my-companies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setBusinesses(data.data);
                // Fetch subscription for each business
                const subPromises = data.data.map(b => 
                    fetch(`${API_BASE_URL}/subscriptions/business/${b._id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(r => r.ok ? r.json() : null)
                );
                const subResults = await Promise.all(subPromises);
                setSubscriptions(subResults.filter(Boolean));
            }

            // Fetch Transactions (Simplified: using revenue endpoint if available or dedicated user transactions)
            const txRes = await fetch(`${API_BASE_URL}/revenue/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const txData = await txRes.json();
            if (txRes.ok) setTransactions(txData.transactions || []);
        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAutoRenew = async (subId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/subscriptions/toggle-autorenew/${subId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSubscriptions(prev => prev.map(s => s._id === subId ? { ...s, autoRenew: !s.autoRenew } : s));
            }
        } catch (err) {
            console.error('Error toggling auto-renew:', err);
        }
    };

    const handleRequestRefund = async () => {
        if (!refundReason.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/subscriptions/request-refund`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ transactionId: selectedTransaction._id, reason: refundReason })
            });
            if (res.ok) {
                alert('Refund request submitted successfully');
                setIsRefundModalOpen(false);
                setRefundReason('');
            }
        } catch (err) {
            console.error('Error requesting refund:', err);
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
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                        Billing & <span className="text-indigo-600">Plans</span>
                    </h1>
                    <p className="text-slate-500">Manage your subscriptions and download invoices.</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-tighter">Next Invoice: 16 Apr 2026</span>
                </div>
            </div>

            {subscriptions.length === 0 ? (
                <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200 rounded-3xl p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                        <CreditCard className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">No Active Plans Found</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Upgrade your business listing to get more visibility, 
                        leads, and advanced analytics.
                    </p>
                    <a 
                        href="/brand/pricing" 
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                    >
                        View Plans
                    </a>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Expiry Banner */}
                    {subscriptions.some(s => {
                        const daysLeft = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return daysLeft > 0 && daysLeft <= 7;
                    }) && (
                        <div className="bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">Plan Expiring Soon!</p>
                                    <p className="text-[10px] text-white/80 font-bold uppercase">Renew now to maintain your search ranking visibility</p>
                                </div>
                            </div>
                            <button className="bg-white text-rose-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-rose-50 transition-colors">
                                Renew Now
                            </button>
                        </div>
                    )}

                    {/* Active Subscriptions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {subscriptions.map((sub) => {
                            const business = businesses.find(b => b._id === sub.businessId);
                            const daysLeft = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                            
                            return (
                                <div key={sub._id} className="bg-white border border-slate-100 shadow-xl shadow-slate-200 rounded-3xl overflow-hidden group">
                                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Business</span>
                                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{business?.name}</h4>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                            sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {sub.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                            {sub.status}
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 gap-6 relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-12 bg-slate-50"></div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Plan</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black text-slate-800 uppercase text-lg">{sub.planId?.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">/ {sub.billingCycle}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${daysLeft > 0 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                                <span className="text-xs font-black text-slate-700 uppercase">{daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Renew</span>
                                            <button 
                                                onClick={() => handleToggleAutoRenew(sub._id)}
                                                className={`w-10 h-5 rounded-full transition-all relative ${sub.autoRenew ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sub.autoRenew ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/brand/pricing')}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                        >
                                            Upgrade Plan →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white border border-slate-100 shadow-xl shadow-slate-300/30 rounded-[40px] overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                Payment History
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{transactions.length} Transactions</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Date</th>
                                        <th className="px-8 py-5">Amount</th>
                                        <th className="px-8 py-5">Gateway</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {transactions.length > 0 ? transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-slate-700">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-slate-900 tracking-tight">₹{tx.amount}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded-md">{tx.gateway}</span>
                                            </td>
                                            <td className="px-8 py-5 uppercase">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                                                    tx.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase transition-colors">
                                                        <Download className="w-3.5 h-3.5" />
                                                        Invoice
                                                    </button>
                                                    {tx.status === 'success' && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedTransaction(tx);
                                                                setIsRefundModalOpen(true);
                                                            }}
                                                            className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <p className="text-slate-400 italic text-sm font-medium">No transactions found in your history.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {isRefundModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-10 bg-rose-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-1">Request Refund</h3>
                                <p className="text-rose-100 text-xs font-bold uppercase tracking-widest">Transaction: {selectedTransaction?.gatewayOrderId || selectedTransaction?._id}</p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="p-10 space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Reason for refund</label>
                                <textarea 
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Please describe why you are requesting a refund..."
                                    className="w-full h-40 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setIsRefundModalOpen(false)}
                                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleRequestRefund}
                                    className="flex-2 bg-slate-900 text-white px-10 py-4 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
