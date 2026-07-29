import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '', mobileNumber: '' });
    const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const identifier = loginType === 'email' ? formData.email : formData.mobileNumber;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, password: formData.password })
            });
// ... rest of email login logic ...

            let data;
            try {
                data = await res.json();
            } catch (parseError) {
                data = null;
            }

            if (res.ok && data?.success) {
                login(data.user, data.token);
                // Redirect based on role
                if (data.user.role === 'Super Admin') {
                    navigate('/admin/dashboard');
                } else if (data.user.role === 'Brand Owner' || data.user.role === 'Company Owner') {
                    navigate('/brand/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                const serverMessage = data?.msg || data?.error || (data && JSON.stringify(data)) || `${res.status} ${res.statusText}`;
                setError(`Server error: ${serverMessage}`);
                console.error('Login error response:', res.status, res.statusText, data);
            }
        } catch (err) {
            console.error('Login request failed:', err);
            setError('Cannot connect to server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (response) => {
        setIsLoading(true);
        setError('');
        try {
            // response would typically come from Google One Tap or Sign-In button
            // Example: const tokenId = response.credential;
            const tokenId = response?.credential || 'dev-google-token';

            const res = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenId }) 
            });

            const data = await res.json();
            if (res.ok && data.success) {
                login(data.user, data.token);
                navigate('/');
            } else {
                setError(data.msg || 'Google login failed');
            }
        } catch (err) {
            console.error('Google Login Error:', err);
            setError('Google connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setIsLoading(true);
        setError('Facebook login is not currently available');
        setIsLoading(false);
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        if (!formData.mobileNumber) return setError('Please enter mobile number');
        
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber: formData.mobileNumber })
            });

            if (res.ok) {
                navigate('/verify-otp', { state: { mobileNumber: formData.mobileNumber } });
            } else {
                const data = await res.json();
                setError(data.msg || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or{' '}
                    <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
                    {error && (
                        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center mb-6">
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setLoginType('email')}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType('phone')}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Phone
                            </button>
                        </div>
                    </div>

                    {loginType === 'email' && (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                                <div className="mt-1">
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <div className="mt-1">
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <Link to="/forgot-password" title="Click here to reset" className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Forgot your password?
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    )}

                    {loginType === 'phone' && (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
                                <div className="mt-1">
                                    <input
                                        name="mobileNumber"
                                        type="tel"
                                        required
                                        placeholder="e.g. 9876543210"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <div className="mt-1">
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or continue with</span>
                            </div>
                        </div>

                         <div className="mt-6 grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleGoogleLogin()}
                                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <span className="sr-only">Sign in with Google</span>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.024 1.032-2.312 1.792-4.496 1.792-3.512 0-6.184-2.392-6.184-5.92s2.672-5.92 6.184-5.92c1.92 0 3.336.752 4.392 1.76l2.312-2.312C19.12 4.184 16.32 3 12.48 3c-4.936 0-9 4.064-9 9s4.064 9 9 9c2.664 0 4.68-.88 6.16-2.432 1.576-1.576 2.08-3.792 2.08-5.544 0-.584-.048-1.144-.144-1.656h-8.12z" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleFacebookLogin}
                                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <span className="sr-only">Sign in with Facebook</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
