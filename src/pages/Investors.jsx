import React from 'react';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';

export default function Investors() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Investor Relations</h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Access financial reports, news, and information about our company's performance. Our new investor portal is launching soon.
                </p>
                <button className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
                    Download Annual Report
                </button>
            </main>
            <Footer />
        </div>
    );
}
