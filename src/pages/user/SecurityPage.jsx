import { useState } from 'react';
import { ShieldCheck, Mail, Phone, Lock, ChevronRight, Loader2, CheckCircle2, AlertCircle, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function SecurityPage() {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('overview'); // overview, change-email, change-phone, change-password
    const [otpSent, setOtpSent] = useState(false);
    const [success, setSuccess] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const isBiometricSupported = window.PublicKeyCredential !== undefined;
    
    // New States for Profile Update
    const [newValue, setNewValue] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

    const handleBack = () => {
        setStep('overview');
        setOtpSent(false);
        setNewValue('');
        setOtpValue('');
        setStatusMsg({ text: '', type: '' });
    };

    const handleSendOTP = async () => {
        if (!newValue) {
            setStatusMsg({ text: `Please enter a new ${step.includes('email') ? 'email' : 'phone number'}.`, type: 'error' });
            return;
        }

        setLoading(true);
        setStatusMsg({ text: '', type: '' });
        try {
            const type = step.includes('email') ? 'email' : 'phone';
            const res = await fetchWithAuth(getApiUrl('me/request-change'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, value: newValue })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setOtpSent(true);
                setStatusMsg({ text: 'Verification code sent to your registered contact.', type: 'success' });
            } else {
                setStatusMsg({ text: data.msg || 'Failed to send OTP.', type: 'error' });
            }
        } catch (err) {
            setStatusMsg({ text: 'Network error. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpValue || otpValue.length !== 6) {
            setStatusMsg({ text: 'Please enter a valid 6-digit OTP.', type: 'error' });
            return;
        }

        setLoading(true);
        setStatusMsg({ text: '', type: '' });
        try {
            const type = step.includes('email') ? 'email' : 'phone';
            const res = await fetchWithAuth(getApiUrl('me/verify-change'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, value: newValue, otp: otpValue })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // Instantly sync context local user reference with the new data
                login(data.user, data.token || localStorage.getItem('token'));
                setSuccess(true);
                setStep('overview');
                setOtpSent(false);
                setNewValue('');
                setOtpValue('');
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setStatusMsg({ text: data.msg || 'Invalid or expired OTP.', type: 'error' });
            }
        } catch (err) {
            setStatusMsg({ text: 'Network error. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (step === 'overview') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Privacy</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage your account authentication and sensitive data.</p>
                </div>
                {success && (
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 mb-6 animate-pulse">
                        <CheckCircle2 className="w-5 h-5" />
                        Security Settings Updated Successfully
                    </div>
                )}

                <div className="space-y-6">
                    {/* Email Security */}
                    <div className="group p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm transition-colors">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-slate-900">Email Address</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-500 text-sm font-medium">{user?.email}</span>
                                    {user?.isEmailVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep('change-email')}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                            Change Email
                        </button>
                    </div>

                    {/* Phone Security */}
                    <div className="group p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm transition-colors">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-slate-900">Phone Number</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-500 text-sm font-medium">{user?.mobileNumber || 'Not provided'}</span>
                                    {user?.otpVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep('change-phone')}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                            {user?.mobileNumber ? 'Change Phone' : 'Add Phone'}
                        </button>
                    </div>

                    {/* Password */}
                    <div className="group p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm transition-colors">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-slate-900">Account Password</h4>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Last changed 3 months ago</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setStep('change-password')}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                            Change Password
                        </button>
                    </div>

                    {/* Biometric Login */}
                    {isBiometricSupported && (
                        <div className="group p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm transition-colors">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-lg text-slate-900">Biometric Login</h4>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                        Use Face ID or Fingerprint to secure your account
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={biometricEnabled}
                                        onChange={() => setBiometricEnabled(!biometricEnabled)}
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in slide-in-from-right-4 duration-500">
            <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-orange-600 transition-colors mb-8">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Security
            </button>

            <div className="max-w-md">
                <h2 className="text-2xl font-black text-slate-900 mb-2 capitalize">{step.replace('-', ' ')}</h2>
                <p className="text-slate-500 text-sm font-medium mb-10 italic">For your security, we'll send a 6-digit verification code to your {step.includes('email') ? 'new email' : 'phone'}.</p>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New {step.includes('email') ? 'Email' : 'Phone'}</label>
                        <input 
                            type={step.includes('email') ? 'email' : 'tel'}
                            placeholder={step.includes('email') ? 'john.new@example.com' : '+91 9876543210'}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            disabled={otpSent}
                        />
                    </div>

                    {otpSent && (
                        <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Code (OTP)</label>
                            <input 
                                type="text"
                                maxLength={6}
                                placeholder="0 0 0 0 0 0"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9A-Z]/ig, ''))}
                            />
                            <div className="flex justify-between items-center px-1">
                                <p className="text-[10px] text-slate-400 font-bold">Didn't receive code?</p>
                                <button type="button" onClick={handleSendOTP} disabled={loading} className="text-[10px] text-orange-600 font-black hover:underline uppercase tracking-widest disabled:opacity-50">Resend OTP</button>
                            </div>
                        </div>
                    )}

                    {statusMsg.text && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${statusMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            {statusMsg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                            {statusMsg.text}
                        </div>
                    )}

                    <div className="pt-4">
                        <button 
                            disabled={loading}
                            onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-100 disabled:opacity-50 disabled:scale-100"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {otpSent ? 'Verify & Continue' : 'Send Verification Code'}
                        </button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-700 font-bold leading-relaxed">Verification ensures only you can access your account and receive critical updates about your bookings and enquiries.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
