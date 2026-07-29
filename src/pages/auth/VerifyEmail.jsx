import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/verify/${token}`);
                const data = await res.json();

                if (res.ok && data.success) {
                    setStatus('success');
                    setMessage(data.msg);
                } else {
                    setStatus('error');
                    setMessage(data.msg || 'Verification failed');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Cannot connect to server');
            }
        };

        if (token) {
            verifyToken();
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Verifying your email...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Verified!</h2>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <Link to="/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            Go to Login
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-rose-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Failed</h2>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                            Back to login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
