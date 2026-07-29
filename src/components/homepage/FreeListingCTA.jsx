import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';

export default function FreeListingCTA() {
    return (
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Left Content */}
                    <div className="flex-1 space-y-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Zap className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-semibold uppercase tracking-wider">Get Discovered</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold">
                            List Your Business and Get Found by Customers
                        </h2>
                        <p className="text-lg text-white/90 max-w-lg">
                            Reach thousands of customers looking for your services. Add your business in minutes and get discovered today.
                        </p>
                        <ul className="space-y-2 text-white/90 pt-4">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                list your business and get discovered by customers
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                Verified badge for credibility
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                Quick and easy setup
                            </li>
                        </ul>
                    </div>

                    {/* Right CTA */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/free-listing"
                            className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Start Listing
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
