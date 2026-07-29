import { Download, Apple, Smartphone } from 'lucide-react';

export default function MobileAppPromotion() {
    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Left Content */}
                    <div className="flex-1 space-y-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-semibold uppercase tracking-wider">Mobile App</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold">
                            Your Business Directory in Your Pocket
                        </h2>

                        <p className="text-lg text-slate-300 max-w-lg">
                            Download our app to search, discover, and connect with businesses
                            anywhere, anytime. Fast, reliable, and completely free.
                        </p>

                        {/* Download Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <a
                                href="#"
                                className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                App Store
                            </a>
                            <a
                                href="#"
                                className="inline-flex items-center justify-center gap-3 bg-white/10 text-white border border-white/20 px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Google Play
                            </a>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 text-slate-300 text-sm">
                            <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                Instant search results
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                Direct calling and messaging
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                Location-based recommendations
                            </p>
                        </div>
                    </div>

                    {/* Right Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-40 h-64 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-2xl flex items-center justify-center">
                            <Smartphone className="w-24 h-24 text-white opacity-30" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
