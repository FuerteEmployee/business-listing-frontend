import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Users, Receipt } from 'lucide-react';
import { api } from '@/services/api';

const RevenueAnalytics = ({ dateRange }) => {
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenueData();
    }, [dateRange]);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics/revenue', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString()
                }
            });
            setRevenueData(response.data.revenue);
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!revenueData) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <div className="space-y-6">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{revenueData.totals.totalRevenue.toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Subscription Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{revenueData.totals.subscriptionRevenue.toLocaleString()}
                                </p>
                            </div>
                            <CreditCard className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Lead Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{revenueData.totals.leadRevenue.toLocaleString()}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {revenueData.totals.subscriptions}
                                </p>
                            </div>
                            <Receipt className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Trends */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Revenue Trends Over Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                labelFormatter={(label) => `Date: ${label}`}
                                formatter={(value, name) => [
                                    `₹${value.toLocaleString()}`,
                                    name === 'subscriptionRevenue' ? 'Subscription Revenue' :
                                    name === 'leadRevenue' ? 'Lead Revenue' :
                                    name === 'couponRevenue' ? 'Coupon Revenue' : 'Total Revenue'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="subscriptionRevenue"
                                stroke="#8884d8"
                                strokeWidth={2}
                                name="subscriptionRevenue"
                            />
                            <Line
                                type="monotone"
                                dataKey="leadRevenue"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                name="leadRevenue"
                            />
                            <Line
                                type="monotone"
                                dataKey="couponRevenue"
                                stroke="#ffc658"
                                strokeWidth={2}
                                name="couponRevenue"
                            />
                            <Line
                                type="monotone"
                                dataKey="totalRevenue"
                                stroke="#ff7300"
                                strokeWidth={3}
                                name="totalRevenue"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Subscriptions', value: revenueData.totals.subscriptionRevenue, color: '#8884d8' },
                                        { name: 'Leads', value: revenueData.totals.leadRevenue, color: '#82ca9d' },
                                        { name: 'Coupons', value: revenueData.totals.couponRevenue, color: '#ffc658' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {[
                                        { name: 'Subscriptions', value: revenueData.totals.subscriptionRevenue, color: '#8884d8' },
                                        { name: 'Leads', value: revenueData.totals.leadRevenue, color: '#82ca9d' },
                                        { name: 'Coupons', value: revenueData.totals.couponRevenue, color: '#ffc658' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {revenueData.breakdown.map((plan, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{plan.planName}</p>
                                        <p className="text-sm text-gray-500">{plan.count} active subscriptions</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-green-600">
                                            ₹{plan.revenue.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">total revenue</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Revenue Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value, name) => [
                                    `₹${value.toLocaleString()}`,
                                    name === 'subscriptionRevenue' ? 'Subscriptions' :
                                    name === 'leadRevenue' ? 'Leads' :
                                    name === 'couponRevenue' ? 'Coupons' : 'Total'
                                ]}
                            />
                            <Bar dataKey="subscriptionRevenue" stackId="a" fill="#8884d8" name="subscriptionRevenue" />
                            <Bar dataKey="leadRevenue" stackId="a" fill="#82ca9d" name="leadRevenue" />
                            <Bar dataKey="couponRevenue" stackId="a" fill="#ffc658" name="couponRevenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Revenue Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {revenueData.totals.subscriptions}
                            </div>
                            <div className="text-sm text-gray-600">Total Subscriptions</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Avg: ₹{Math.round(revenueData.totals.subscriptionRevenue / revenueData.totals.subscriptions || 0).toLocaleString()} per subscription
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {revenueData.totals.leads}
                            </div>
                            <div className="text-sm text-gray-600">Total Leads Generated</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Avg: ₹{Math.round(revenueData.totals.leadRevenue / revenueData.totals.leads || 0).toLocaleString()} per lead
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {((revenueData.totals.totalRevenue / revenueData.timeline.length) || 0).toFixed(0)}
                            </div>
                            <div className="text-sm text-gray-600">Avg Daily Revenue</div>
                            <div className="text-xs text-gray-500 mt-1">
                                ₹{((revenueData.totals.totalRevenue / revenueData.timeline.length) || 0).toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export { RevenueAnalytics };