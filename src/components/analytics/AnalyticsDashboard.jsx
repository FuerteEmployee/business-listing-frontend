import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, TrendingUp, Users, Eye, Search, Phone, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from './KPICard';
import { TrafficChart } from './TrafficChart';
import { SearchAnalytics } from './SearchAnalytics';
import { BusinessPerformance } from './BusinessPerformance';
import { RevenueAnalytics } from './RevenueAnalytics';
import { UserBehavior } from './UserBehavior';
import { api } from '@/services/api';
import AdminHeader from '../admin/AdminHeader';

const AnalyticsDashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
    });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchKPIs();
    }, [dateRange]);

    const fetchKPIs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics/dashboard/kpis', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString()
                }
            });
            setKpis(response.data.kpis);
        } catch (error) {
            console.error('Error fetching KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            const response = await api.get('/analytics/export', {
                params: {
                    type,
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    format: 'csv'
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-analytics.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    if (loading && !kpis) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Analytics Dashboard"
                subtitle="Comprehensive business intelligence and performance metrics"
                actions={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <DatePickerWithRange
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="w-full sm:w-auto"
                        />
                        <Button
                            variant="outline"
                            onClick={() => handleExport('traffic')}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                }
            />

            {/* KPI Cards */}
            {kpis && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Total Users"
                        value={kpis.totalUsers}
                        icon={Users}
                        trend={12.5}
                        color="blue"
                    />
                    <KPICard
                        title="Page Views"
                        value={kpis.totalPageViews}
                        icon={Eye}
                        trend={8.2}
                        color="green"
                    />
                    <KPICard
                        title="Total Searches"
                        value={kpis.totalSearches}
                        icon={Search}
                        trend={15.3}
                        color="purple"
                    />
                    <KPICard
                        title="Business Views"
                        value={kpis.totalBusinessViews}
                        icon={BarChart3}
                        trend={6.8}
                        color="orange"
                    />
                    <KPICard
                        title="Click-through Rate"
                        value={`${kpis.clickThroughRate}%`}
                        icon={TrendingUp}
                        trend={-2.1}
                        color="red"
                    />
                    <KPICard
                        title="Enquiry Rate"
                        value={`${kpis.enquiryConversionRate}%`}
                        icon={Phone}
                        trend={4.7}
                        color="green"
                    />
                    <KPICard
                        title="Active Subscriptions"
                        value={kpis.activeSubscriptions}
                        icon={DollarSign}
                        trend={22.4}
                        color="blue"
                    />
                    <KPICard
                        title="Total Revenue"
                        value={`₹${kpis.totalRevenue || 0}`}
                        icon={Activity}
                        trend={18.9}
                        color="green"
                    />
                </div>
            )}

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="traffic">Traffic</TabsTrigger>
                    <TabsTrigger value="search">Search</TabsTrigger>
                    <TabsTrigger value="businesses">Businesses</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Traffic Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TrafficChart dateRange={dateRange} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Key Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Unique Visitors</span>
                                        <Badge variant="secondary">{kpis?.uniqueVisitors || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Total Clicks</span>
                                        <Badge variant="secondary">{kpis?.totalClicks || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Total Leads</span>
                                        <Badge variant="secondary">{kpis?.totalLeads || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Total Reviews</span>
                                        <Badge variant="secondary">{kpis?.totalReviews || 0}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="traffic">
                    <TrafficChart dateRange={dateRange} detailed />
                </TabsContent>

                <TabsContent value="search">
                    <SearchAnalytics dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="businesses">
                    <BusinessPerformance dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="revenue">
                    <RevenueAnalytics dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="behavior">
                    <UserBehavior dateRange={dateRange} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AnalyticsDashboard;