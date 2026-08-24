import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { getApiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Alert from './Alert';
import { logAnalyticsEvent } from '../../utils/tracker';

export default function EnquiryModal({ isOpen, onClose, business, businessIds = [], businessNameMap = {}, title = "Get Best Quotes", source }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [enquiryForm, setEnquiryForm] = useState({ 
        name: user?.name || '', 
        phone: user?.phone || '', 
        email: user?.email || '', 
        message: '' 
    });

    useEffect(() => {
        if (user) {
            setEnquiryForm(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);

    // Reset submission state when modal opens
    useEffect(() => {
        if (isOpen) setSubmitted(false);
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const ids = business ? [business._id] : businessIds;

            const res = await fetch(getApiUrl('enquiries'), {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    businessIds: ids,
                    ...enquiryForm,
                    source: source || (business ? 'Business Details Page' : 'Search Results')
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
                setEnquiryForm(prev => ({ ...prev, message: '' }));
                ids.forEach(id => {
                    logAnalyticsEvent('enquiry', id);
                });
            } else {
                setError(data.msg || 'Failed to send enquiry');
            }
        } catch (err) {
            console.error('Enquiry error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Determine businesses to display as chips
    const isBulk = !business && businessIds.length > 1;
    const isSingle = business || businessIds.length === 1;
    const singleName = business?.name || (isSingle && businessNameMap[businessIds[0]]) || 'Selected Business';

    // Build chip labels
    const chipIds = business ? [] : businessIds;
    const maxVisibleChips = 4;
    const visibleChips = chipIds.slice(0, maxVisibleChips);
    const remainCount = chipIds.length - maxVisibleChips;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-orange-600 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-2xl font-black mb-1">{title}</h3>
                    <p className="text-orange-100 text-xs opacity-80 italic tracking-wide">
                        Tell us what you're looking for and we'll connect you
                    </p>

                    {/* Business Chips (bulk) or single business name */}
                    <div className="mt-4">
                        {isBulk ? (
                            <div className="flex flex-wrap gap-2">
                                {visibleChips.map(id => (
                                    <span key={id} className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        <Building2 className="w-3 h-3 opacity-70" />
                                        {businessNameMap[id] || id}
                                    </span>
                                ))}
                                {remainCount > 0 && (
                                    <span className="inline-flex items-center bg-white/10 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                                        +{remainCount} more
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                <Building2 className="w-3 h-3 opacity-70" />
                                {singleName}
                            </div>
                        )}
                    </div>
                </div>

                {/* Success State */}
                {submitted ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">Enquiry Sent!</h4>
                        <p className="text-slate-500 text-sm mb-2">
                            Your enquiry has been sent to <strong>{chipIds.length || 1} business{chipIds.length !== 1 ? 'es' : ''}</strong>.
                        </p>
                        <p className="text-slate-400 text-xs mb-6">
                            {enquiryForm.email && 'A confirmation email has been sent to your inbox. '}
                            Track replies in <strong>My Enquiries</strong>.
                        </p>
                        {!user ? (
                            <div className="space-y-4">
                                <p className="text-slate-500 text-xs">
                                    Create an account to track your enquiry replies, message merchants, and receive notifications!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button 
                                        onClick={() => {
                                            onClose();
                                            navigate('/register', { state: { from: window.location.pathname } });
                                        }} 
                                        className="px-6 py-3 bg-orange-600 text-white rounded-xl font-black text-xs hover:bg-orange-700 transition-colors uppercase tracking-wider"
                                    >
                                        Create Account
                                    </button>
                                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-colors uppercase tracking-wider">
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3 justify-center">
                                <button onClick={onClose} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors">
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                ) : !user ? (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                            <Building2 className="w-8 h-8 text-orange-500" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">Create an Account First</h4>
                            <p className="text-slate-500 text-sm">
                                Please sign up or log in to send enquiries, track merchant responses, and get the best quotes.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    onClose();
                                    navigate('/register', { state: { from: window.location.pathname, openEnquiry: true } });
                                }} 
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs transition-colors uppercase tracking-wider"
                            >
                                Register / Create Account
                            </button>
                            <button 
                                onClick={() => {
                                    onClose();
                                    navigate('/login', { state: { from: window.location.pathname, openEnquiry: true } });
                                }} 
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs transition-colors uppercase tracking-wider"
                            >
                                Already have an account? Log In
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <Alert 
                                type="error" 
                                title="Submission Failed" 
                                onClose={() => setError(null)}
                                className="mb-2"
                            >
                                {error}
                            </Alert>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Your Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={enquiryForm.name} 
                                    onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})} 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone Number</label>
                                <input 
                                    type="tel" 
                                    required 
                                    value={enquiryForm.phone} 
                                    onChange={(e) => setEnquiryForm({...enquiryForm, phone: e.target.value})} 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                            <input 
                                type="email" 
                                value={enquiryForm.email} 
                                onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})} 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Requirements / Message</label>
                            <textarea 
                                required 
                                value={enquiryForm.message} 
                                onChange={(e) => setEnquiryForm({...enquiryForm, message: e.target.value})} 
                                placeholder="I want to know more about pricing and availability..." 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32 outline-none focus:ring-2 focus:ring-orange-500 resize-none" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <>Send Enquiry {isBulk ? `to ${chipIds.length} Businesses` : ''} <ArrowRight className="w-4 h-4" /></>
                            }
                        </button>
                        {!user && (
                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500 font-medium bg-slate-50 py-3 px-4 rounded-xl border border-slate-100">
                                <span>Already a member? <Link to="/login" className="font-extrabold text-orange-600 hover:text-orange-700 transition-colors">Login</Link></span>
                                <span className="text-slate-200">|</span>
                                <span>New user? <Link to="/register" className="font-extrabold text-orange-600 hover:text-orange-700 transition-colors">Register</Link></span>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
