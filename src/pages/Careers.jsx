import React from 'react';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';

export default function Careers() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Come Build the Future</h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    We're looking for passionate individuals to join our team. 
                    Currently, our career portal is undergoing a major upgrade. Please check back soon for open positions!
                </p>
                <a href="mailto:careers@engitech.com" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    Email Your Resume
                </a>
            </main>
            <Footer />
        </div>
    );
}
