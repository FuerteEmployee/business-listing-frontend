import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Header from "../../components/homepage/Header";
import Footer from "../../components/homepage/Footer";
import { Mail, Phone, AlertCircle, Loader2, CheckCircle } from "lucide-react";

export default function EnquiryForm() {
    const { user } = useAuth();
    const { businessId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        subject: "",
        message: "",
        enquiryType: "general"
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const enquiryTypes = [
        { value: "general", label: "General Enquiry" },
        { value: "pricing", label: "Pricing & Cost" },
        { value: "availability", label: "Availability & Timing" },
        { value: "product", label: "Product/Service Info" },
        { value: "complaint", label: "Complaint" },
        { value: "other", label: "Other" }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
            setError("Please fill in all required fields");
            return;
        }

        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError("Please enter a valid email address");
            return;
        }

        if (formData.message.length < 20) {
            setError("Message must be at least 20 characters");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/enquiries`, {
                method: 'POST',
                body: JSON.stringify({
                    businessIds: [businessId],
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    subject: formData.subject,
                    message: formData.message,
                    enquiryType: formData.enquiryType
                })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate(`/user/enquiries`);
                }, 2000);
            } else {
                const errData = await res.json();
                setError(errData.msg || "Failed to send enquiry");
            }
        } catch (err) {
            console.error("Error submitting enquiry:", err);
            setError("Error submitting enquiry");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl border border-emerald-200 p-8 max-w-md text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Enquiry Sent!</h2>
                        <p className="text-slate-600 mb-4">Your enquiry has been successfully sent to the business. You'll receive a response soon.</p>
                        <p className="text-sm text-slate-500">Redirecting to your enquiries...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Send an Enquiry</h1>
                    <p className="text-slate-600 mt-2">Get more information about this business</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-900 mb-2">
                            Your Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="your@email.com"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-slate-900 mb-2">
                            Phone Number *
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+91 XXXXX XXXXX"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Enquiry Type */}
                    <div>
                        <label htmlFor="enquiryType" className="block text-sm font-semibold text-slate-900 mb-2">
                            Type of Enquiry *
                        </label>
                        <select
                            id="enquiryType"
                            name="enquiryType"
                            value={formData.enquiryType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        >
                            {enquiryTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-slate-900 mb-2">
                            Subject *
                        </label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="Brief subject of your enquiry"
                            maxLength={100}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 mt-1">{formData.subject.length}/100</p>
                    </div>

                    {/* Message */}
                    <div>
                        <label htmlFor="message" className="block text-sm font-semibold text-slate-900 mb-2">
                            Message *
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Please provide details about your enquiry..."
                            rows={5}
                            minLength={20}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Minimum 20 characters</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-3 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Enquiry'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Enquiry Tips</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>✓ Be clear and specific about your enquiry</li>
                        <li>✓ Provide relevant details to get faster response</li>
                        <li>✓ Include your preferred contact method</li>
                        <li>✓ Check the business hours before expecting immediate response</li>
                        <li>✗ Don't share sensitive information like credit card details</li>
                    </ul>
                </div>
            </main>
            <Footer />
        </div>
    );
}
