import React, { useState } from 'react';
import Header from '../components/homepage/Header';
import Footer from '../components/homepage/Footer';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';
import { Megaphone, Send, CheckCircle2, User, Phone, Mail, FileText, Tag } from 'lucide-react';

export default function Advertise() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        category: '',
        type: 'Requirement',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone) {
            toast.error('Name and Phone number are required.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    source: 'Advertising',
                    agreedToPrivacy: true
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Inquiry submitted successfully!');
                setSubmitted(true);
            } else {
                toast.error(data.message || 'Failed to submit inquiry.');
            }
        } catch (error) {
            console.error('Submit Advertise Inquiry Error:', error);
            toast.error('Failed to submit inquiry. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            
            <main className="flex-1 flex flex-col md:flex-row max-w-6xl w-full mx-auto p-6 md:p-12 gap-12 items-center justify-center">
                {/* Left Side: Copywriting / Marketing Info */}
                <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                        <Megaphone className="w-4 h-4" />
                        Advertise With Us
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Grow Your Business with <span className="text-blue-600">Engitech Expo</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Reach thousands of decision-makers, industrial buyers, and verified leads every single day. Tell us about your advertising goals, and our team will get in touch with a customized marketing plan.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">✓</div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Featured Banner Ads</h3>
                                <p className="text-slate-500 text-sm">Get premium visibility at the top of category pages and searches.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">✓</div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Priority Listing</h3>
                                <p className="text-slate-500 text-sm">Rank above standard businesses to drive more direct buyer inquiries.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Inquiry Form */}
                <div className="w-full md:w-[450px] bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    {submitted ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Your advertising inquiry has been submitted successfully. Our relationship manager will contact you within 24 hours.
                            </p>
                            <button 
                                onClick={() => {
                                    setSubmitted(false);
                                    setFormData({
                                        name: '',
                                        phone: '',
                                        email: '',
                                        category: '',
                                        type: 'Requirement',
                                        message: ''
                                    });
                                }}
                                className="mt-4 px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                            >
                                Submit Another Response
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Get in Touch</h2>
                                <p className="text-slate-500 text-sm mt-1">Submit your details below to request advertising packages.</p>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase">Full Name *</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <User className="w-4 h-4" />
                                    </span>
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase">Phone Number *</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <Phone className="w-4 h-4" />
                                    </span>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. +91 9876543210"
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase">Email Address</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </span>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="e.g. business@example.com"
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Business Category */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase">Business Category</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                        <Tag className="w-4 h-4" />
                                    </span>
                                    <input 
                                        type="text" 
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        placeholder="e.g. Industrial Machinery"
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase">Message / Requirements *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">
                                        <FileText className="w-4 h-4" />
                                    </span>
                                    <textarea 
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Describe your advertising needs..."
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm transition-colors resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"
                            >
                                {submitting ? 'Submitting...' : 'Send Inquiry'}
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
