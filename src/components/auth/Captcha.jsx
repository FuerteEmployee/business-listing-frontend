import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

/**
 * Anti-bot challenge shown at registration. Exposes `captchaId` + the user's typed
 * `answer` to the parent form via the imperative ref, and a `refresh()` method the
 * parent calls after a failed submit (the server consumes/invalidates the captcha on
 * every verify attempt, so a fresh one is required either way).
 */
const Captcha = forwardRef(function Captcha(_props, ref) {
    const [captchaId, setCaptchaId] = useState(null);
    const [svg, setSvg] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCaptcha = async () => {
        setIsLoading(true);
        setError('');
        setAnswer('');
        try {
            const res = await fetch(`${API_BASE_URL}/captcha`);
            const data = await res.json();
            if (res.ok) {
                setCaptchaId(data.captchaId);
                setSvg(data.svg);
            } else {
                setError('Could not load captcha. Try refreshing.');
            }
        } catch {
            setError('Could not load captcha. Check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    useImperativeHandle(ref, () => ({
        getValue: () => ({ captchaId, answer }),
        refresh: fetchCaptcha
    }));

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700">Enter the text shown below</label>
            <div className="mt-1 flex items-center gap-2">
                <div
                    className="flex-1 h-[70px] rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden"
                    aria-label="Captcha image"
                >
                    {isLoading ? (
                        <span className="text-xs text-slate-400">Loading…</span>
                    ) : error ? (
                        <span className="text-xs text-rose-500 px-2 text-center">{error}</span>
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: svg }} />
                    )}
                </div>
                <button
                    type="button"
                    onClick={fetchCaptcha}
                    title="Get a new captcha"
                    className="p-2.5 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
            <input
                type="text"
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type the characters above"
                autoComplete="off"
                className="mt-2 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
        </div>
    );
});

export default Captcha;
