import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Zap, 
    Target, 
    TrendingUp, 
    Users, 
    ShieldCheck, 
    MousePointer2, 
    PieChart, 
    ChevronRight,
    Building2,
    CheckCircle2
} from 'lucide-react';
import Header from '../../components/homepage/Header';
import Footer from '../../components/homepage/Footer';

export default function OnboardingLanding() {
    const benefits = [
        {
            icon: Target,
            title: "Targeted Visibility",
            description: "Reach customers exactly when they're looking for your services in their local area."
        },
        {
            icon: Zap,
            title: "Instant Leads",
            description: "Receive real-time enquiries directly on your dashboard and respond instantly."
        },
        {
            icon: PieChart,
            title: "Performance Analytics",
            description: "Track your business growth with detailed insights on views, clicks, and conversion."
        },
        {
            icon: ShieldCheck,
            title: "Verified Trust",
            description: "Get the 'Verified' badge to build instant credibility with potential customers."
        }
    ];

    const steps = [
        { title: "List Your Business", desc: "Enter your basic details and category." },
        { title: "Set Your Location", desc: "Pin your exact location on the map." },
        { title: "Upload Media", desc: "Add photos and your business logo." },
        { title: "Go Live", desc: "Start receiving leads within minutes!" }
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 lg:py-32 overflow-hidden bg-slate-900">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                            <div className="mb-12 lg:mb-0">
                                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-indigo-500/30">
                                    <TrendingUp className="w-4 h-4" />
                                    Scale Your Business
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
                                    Get More <span className="text-indigo-400">Customers</span> For Your Business.
                                </h1>
                                <p className="text-slate-400 text-lg lg:text-xl mb-10 max-w-xl leading-relaxed">
                                    Join thousands of business owners who use our platform to grow their reach and connect with local customers every day.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link 
                                        to="/free-listing" 
                                        className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 group"
                                    >
                                        Add Your Business Free
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <a 
                                        href="#benefits" 
                                        className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-black text-lg hover:bg-white/20 transition-all text-center"
                                    >
                                        Explore Benefits
                                    </a>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[2rem] p-4 backdrop-blur-sm border border-white/10">
                                    <img 
                                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80" 
                                        className="rounded-2xl shadow-2xl grayscale"
                                        alt="Dashboard Preview"
                                    />
                                </div>
                                {/* Floating Badges */}
                                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl animate-bounce duration-[3000ms]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400">New Lead</p>
                                            <p className="text-sm font-bold text-slate-900">Spa Enquiry +1</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section id="benefits" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">Why List With Us?</h2>
                            <p className="text-slate-500 text-lg max-w-2xl mx-auto">We provide the tools you need to succeed in today's digital marketplace.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {benefits.map((b, i) => (
                                <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <b.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">{b.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{b.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-20 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                                <div className="flex-1 text-white">
                                    <h2 className="text-3xl lg:text-5xl font-black mb-8 tracking-tight">Onboarding is easy.</h2>
                                    <div className="space-y-6">
                                        {steps.map((s, i) => (
                                            <div key={i} className="flex gap-6 items-start">
                                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-black text-white border-4 border-slate-800">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold mb-1">{s.title}</h4>
                                                    <p className="text-slate-400 text-sm">{s.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Link 
                                        to="/free-listing" 
                                        className="mt-12 inline-flex bg-white text-slate-900 px-10 py-4 rounded-xl font-black text-lg hover:bg-indigo-50 transition-all gap-3"
                                    >
                                        Get Started Now
                                    </Link>
                                </div>
                                <div className="flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                                <Building2 className="w-8 h-8 text-indigo-400 mb-4" />
                                                <p className="text-white font-bold">12k+</p>
                                                <p className="text-slate-500 text-xs">Businesses Listed</p>
                                            </div>
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                                <Users className="w-8 h-8 text-emerald-400 mb-4" />
                                                <p className="text-white font-bold">5M+</p>
                                                <p className="text-slate-500 text-xs">Monthly Users</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 mt-8">
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                                <MousePointer2 className="w-8 h-8 text-amber-400 mb-4" />
                                                <p className="text-white font-bold">500k+</p>
                                                <p className="text-slate-500 text-xs">Leads Generated</p>
                                            </div>
                                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                                                <TrendingUp className="w-8 h-8 text-rose-400 mb-4" />
                                                <p className="text-white font-bold">98%</p>
                                                <p className="text-slate-500 text-xs">Satisfaction Rate</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Sneak Peek */}
                <section className="py-24 bg-white">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Have Questions?</h2>
                        <div className="space-y-4 text-left">
                            {[
                                { q: "Is it really free?", a: "Yes! Listing your business in our basic directory is completely free forever." },
                                { q: "How long does it take?", a: "The wizard takes about 2 minutes to complete. We usually verify within 24 hours." }
                            ].map((faq, i) => (
                                <div key={i} className="p-6 bg-slate-50 rounded-2xl">
                                    <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                                    <p className="text-slate-500 text-sm">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-8 text-slate-400">
                            Need help? <Link to="/support" className="text-indigo-600 font-bold">Contact our support</Link>
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
