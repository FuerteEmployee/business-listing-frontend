import { useState, useCallback } from "react";
import { 
    FileBarChart2, Download, Mail, FileText, LayoutDashboard, 
    Users, Building2, DollarSign, Megaphone, Star, Search,
    RefreshCw, Calendar
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminFilters from "../../components/admin/AdminFilters";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader";

const ReportCard = ({ title, description, icon: Icon, onExport, colorClass = "bg-indigo-50 text-indigo-700" }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2"
                    onClick={() => onExport('csv')}
                >
                    <FileText className="w-3.5 h-3.5" /> CSV
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2"
                    onClick={() => onExport('pdf')}
                >
                    <FileBarChart2 className="w-3.5 h-3.5" /> PDF
                </Button>
            </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
    </div>
);

export default function Reports() {
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleExport = async (reportType, format) => {
        try {
            const queryParams = new URLSearchParams({
                startDate: filters.startDate,
                endDate: filters.endDate,
                format
            }).toString();

            const url = `${API_BASE_URL}/reports/${reportType}?${queryParams}`;
            
            if (format === 'csv') {
                // For CSV, we can just open in new window or use a blob
                const token = localStorage.getItem('token');
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Export failed');
                
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${reportType}-report-${filters.startDate}-to-${filters.endDate}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} CSV exported!`);
            } else {
                toast.error("PDF Export is currently being optimized. Please use CSV for now.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to export report.");
        }
    };

    const scheduleFilters = [
        { key: "startDate", label: "From Date", type: "date", value: filters.startDate },
        { key: "endDate", label: "To Date", type: "date", value: filters.endDate }
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Reports & Analytics"
                subtitle="Generate and export platform performance data"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2">
                            <Mail className="w-4 h-4" /> Automate
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh Data
                        </Button>
                    </div>
                }
            />

            {/* Date Range Filters */}
            <AdminFilters 
                filters={scheduleFilters} 
                onFilterChange={handleFilterChange}
                onReset={handleReset}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard 
                    title="User Growth"
                    description="Daily and monthly user registrations and verification rates."
                    icon={Users}
                    onExport={(fmt) => handleExport('users', fmt)}
                />
                <ReportCard 
                    title="Business Listings"
                    description="Listing counts by status, category, and verification level."
                    icon={Building2}
                    colorClass="bg-emerald-50 text-emerald-700"
                    onExport={(fmt) => handleExport('listings', fmt)}
                />
                <ReportCard 
                    title="Revenue & Sales"
                    description="Detailed revenue breakdown by package and transaction status."
                    icon={DollarSign}
                    colorClass="bg-amber-50 text-amber-700"
                    onExport={(fmt) => handleExport('revenue', fmt)}
                />
                <ReportCard 
                    title="Leads & Enquiries"
                    description="Conversion tracking for lead generation and merchant enquiries."
                    icon={Megaphone}
                    colorClass="bg-purple-50 text-purple-700"
                    onExport={(fmt) => handleExport('leads', fmt)}
                />
                <ReportCard 
                    title="Review & Ratings"
                    description="Platform-wide review sentiment and average business ratings."
                    icon={Star}
                    colorClass="bg-orange-50 text-orange-700"
                    onExport={(fmt) => handleExport('reviews', fmt)}
                />
                <ReportCard 
                    title="Search Trends"
                    description="Most frequent search terms and category browsing patterns."
                    icon={Search}
                    colorClass="bg-blue-50 text-blue-700"
                    onExport={(fmt) => handleExport('search-trends', fmt)}
                />
            </div>

            {/* Platform Health Section */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Calendar className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Auto-Email Reports</h2>
                        <p className="text-slate-400 text-sm">Automated summaries delivered to your inbox every midnight.</p>
                    </div>
                    <div className="ml-auto">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Frequency</span>
                        <p className="mt-1 font-medium italic">Every Day at 00:00</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Format</span>
                        <p className="mt-1 font-medium">Platform Health HTML</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recipient</span>
                        <p className="mt-1 font-medium">All Super Admins</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
