import { useState } from 'react';
import { User, Phone, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchWithAuth, getApiUrl } from '../../config/api';

export default function LeadFormSidebar({ title }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        message: '',
        type: 'Budget'
    });
    const [step, setStep] = useState(1); // 1: Form, 2: OTP
    const [otp, setOtp] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.name || !formData.phone) {
            setStatus({ type: 'error', message: 'Name and phone are required.' });
            return;
        }
        
        if (!agreed) {
            setStatus({ type: 'error', message: 'Please agree to the T&C to proceed.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${getApiUrl('/otp/send')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone })
            });

            const data = await response.json();

            if (data.success) {
                setStep(2);
                setStatus({ type: 'success', message: 'OTP sent! Check your phone (console).' });
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to send OTP.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to connect to server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!otp || otp.length < 4) {
            setStatus({ type: 'error', message: 'Please enter a valid OTP.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // 1. Verify OTP
            const verifyRes = await fetch(`${getApiUrl('/otp/verify')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone, otp })
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
                setStatus({ type: 'error', message: verifyData.message || 'Verification failed.' });
                setLoading(false);
                return;
            }

            // 2. Create Lead
            const response = await fetchWithAuth(getApiUrl('/leads'), {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    category: title,
                    agreedToPrivacy: agreed,
                    source: 'Verified Web Enquiry'
                })
            });

            const data = await response.json();

            if (data.success) {
                setStatus({ type: 'success', message: 'Verified! We\'ll contact you shortly.' });
                setFormData({ name: '', phone: '', type: 'Budget' });
                setAgreed(false);
                setOtp('');
                setStep(1);
            } else {
                setStatus({ type: 'error', message: data.message || 'Something went wrong.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to connect to server.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-40 transition-all">
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {step === 1 ? (
                    <>Get the List of Top <span className="text-blue-600">{title || 'Hotels'}</span></>
                ) : (
                    <>Verify Your <span className="text-blue-600">Mobile Number</span></>
                )}
            </h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">
                {step === 1 ? "We'll send you contact details in seconds for free" : `Enter the code sent to ${formData.phone}`}
            </p>

            <div className="mt-6">
                {step === 1 ? (
                    <>
                        <p className="text-sm font-bold text-slate-800 mb-3">What type of {title || 'Hotel'} are you looking for?</p>
                        <div className="flex flex-wrap gap-4">
                            {['Budget', 'Luxury', 'Others'].map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="type" 
                                        value={type} 
                                        checked={formData.type === type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                    />
                                    <span className="text-sm text-slate-600">{type}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="tel" 
                                    placeholder="Mobile Number" 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="relative">
                                <textarea 
                                    placeholder="Describe your requirements (optional)" 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px] resize-none"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded" 
                                />
                                <span className="text-[11px] text-slate-500 leading-tight font-medium">
                                    I Agree to <a href="#" className="underline">T&C's Privacy Policy</a>
                                </span>
                            </label>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            maxLength="6"
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-800"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                        <button 
                            onClick={() => { setStep(1); setStatus({ type: '', message: '' }); }}
                            className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest block mx-auto"
                        >
                            Change Number
                        </button>
                    </div>
                )}
            </div>

            {status.message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-medium animate-in zoom-in-95 ${
                    status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {status.message}
                </div>
            )}

            <button 
                onClick={step === 1 ? handleSendOTP : handleVerifyAndSubmit}
                disabled={loading}
                className={`w-full mt-6 text-white py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                    loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                }`}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {step === 1 ? 'Sending...' : 'Verifying...'}
                    </>
                ) : (
                    <>
                        {step === 1 ? 'Get Best Deals' : 'Verify & Submit'}
                        <ChevronRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </div>
    );
}
