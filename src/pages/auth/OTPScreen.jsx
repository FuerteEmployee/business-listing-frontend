import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck, ArrowLeft, RefreshCw, MessageSquare, Smartphone } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function OTPScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const mobileNumber = location.state?.mobileNumber || '';
    
    const { login } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendChannel, setResendChannel] = useState('SMS');
    const [timer, setTimer] = useState(30);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!mobileNumber) {
            navigate('/signup');
        }
        
        // Start resend timer
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [mobileNumber, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        const otpString = otp.join('');
        
        if (otpString.length < 6) {
            return setError('Please enter 6-digit OTP');
        }

        setIsVerifying(true);
        try {
            const res = await fetch(`${API_BASE_URL}/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, otp: otpString })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.token && data.user) {
                    login(data.user, data.token);
                    alert('Login successful!');
                    if (data.user.role === 'Super Admin') {
                        navigate('/admin/dashboard');
                    } else if (['Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER'].includes(data.user.role)) {
                        navigate('/brand/products');
                    } else {
                        navigate('/');
                    }
                } else {
                    alert('Verification successful!');
                    navigate('/');
                }
            } else {
                setError(data.msg || 'Invalid OTP');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        
        setIsResending(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, channel: resendChannel })
            });


            if (res.ok) {
                setTimer(30);
                alert('OTP sent again');
            } else {
                setError('Failed to resend OTP');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back</span>
                </button>
                
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Verify Phone</h2>
                    <p className="text-slate-500 text-sm mb-8">
                        We've sent a 6-digit code to <span className="font-bold text-slate-900">{mobileNumber}</span>
                    </p>

                    {error && (
                        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => inputRefs.current[idx] = el}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(idx, e.target.value)}
                                    onKeyDown={e => handleKeyDown(idx, e)}
                                    className="w-12 h-14 text-center text-xl font-black bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                        >
                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
                        </button>

                        <div className="pt-6 border-t border-slate-50 mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Didn't receive code?</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setResendChannel('SMS'); handleResend(); }}
                                    disabled={timer > 0 || isResending}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${timer > 0 ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                >
                                    <Smartphone className="w-4 h-4" />
                                    SMS {timer > 0 ? `(${timer}s)` : ''}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setResendChannel('WhatsApp'); handleResend(); }}
                                    disabled={timer > 0 || isResending}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${timer > 0 ? 'bg-slate-50 text-slate-300' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    WhatsApp {timer > 0 ? `(${timer}s)` : ''}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
