import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import MerchantDashboard from '../../components/merchant/MerchantDashboard';
import UniversalCatalogue from '../../components/merchant/UniversalCatalogue';
import OrderManagement from '../../components/merchant/OrderManagement';
import InventoryManagement from '../../components/merchant/InventoryManagement';
import MerchantAnalytics from '../../components/merchant/MerchantAnalytics';

const MerchantCatalogue = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !['Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER'].includes(user.role)) {
            navigate('/auth');
            return;
        }
        fetchInitialData();
    }, [user, navigate]);

    useEffect(() => {
        if (selectedCompany) {
            fetchDashboardData();
        }
    }, [selectedCompany]);

    const fetchInitialData = async () => {
        try {
            const res = await api.get('/companies/my-companies');
            if (res.data.success && res.data.data.length > 0) {
                setCompanies(res.data.data);
                setSelectedCompany(res.data.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const res = await api.get(`/merchant/dashboard?listingId=${selectedCompany}`);
            setDashboardData(res.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'services', label: 'Services', icon: '🛠️' },
        { id: 'orders', label: 'Orders', icon: '📋' },
        { id: 'inventory', label: 'Inventory', icon: '📈' },
        { id: 'analytics', label: 'Analytics', icon: '📊' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <MerchantDashboard data={dashboardData} refreshData={fetchDashboardData} />;
            case 'products':
                return <UniversalCatalogue type="product" listingId={selectedCompany} />;
            case 'services':
                return <UniversalCatalogue type="service" listingId={selectedCompany} />;
            case 'orders':
                return <OrderManagement listingId={selectedCompany} />;
            case 'inventory':
                return <InventoryManagement listingId={selectedCompany} />;
            case 'analytics':
                return <MerchantAnalytics listingId={selectedCompany} />;
            default:
                return <MerchantDashboard data={dashboardData} refreshData={fetchDashboardData} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Merchant Catalogue</h1>
                            <p className="text-sm text-gray-600">Manage your products, services, and orders</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {companies.length > 1 && (
                                <select 
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            )}
                            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white shadow-sm border-b border-gray-200 overflow-x-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8 min-w-max pb-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default MerchantCatalogue;