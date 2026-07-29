import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/services/api';

const TrafficChart = ({ dateRange, detailed = false }) => {
    const [trafficData, setTrafficData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState('day');

    useEffect(() => {
        fetchTrafficData();
    }, [dateRange, groupBy]);

    const fetchTrafficData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics/traffic', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    groupBy
                }
            });
            setTrafficData(response.data.traffic);
        } catch (error) {
            console.error('Error fetching traffic data:', error);
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

    if (!trafficData) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <div className="space-y-6">
            {detailed && (
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Traffic Analytics</h3>
                    <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hour">Hourly</SelectItem>
                            <SelectItem value="day">Daily</SelectItem>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Traffic Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Page Views & Visitors Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trafficData.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="period"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                labelFormatter={(label) => `Period: ${label}`}
                                formatter={(value, name) => [
                                    value.toLocaleString(),
                                    name === 'pageViews' ? 'Page Views' : 'Unique Visitors'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="pageViews"
                                stroke="#8884d8"
                                strokeWidth={2}
                                name="pageViews"
                            />
                            <Line
                                type="monotone"
                                dataKey="uniqueVisitors"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                name="uniqueVisitors"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Device Breakdown & Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Device Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={trafficData.deviceBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ device, percentage }) => `${device}: ${percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {trafficData.deviceBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Users']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trafficData.topPages.slice(0, 5).map((page, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium truncate" title={page.url}>
                                            {page.url.length > 40 ? `${page.url.substring(0, 40)}...` : page.url}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {page.uniqueVisitors} unique visitors
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {page.views} views
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics */}
            {detailed && (
                <Card>
                    <CardHeader>
                        <CardTitle>Traffic Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {trafficData.timeline.reduce((sum, day) => sum + day.pageViews, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">Total Page Views</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {trafficData.timeline.reduce((sum, day) => sum + day.uniqueVisitors, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">Total Unique Visitors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {trafficData.timeline.reduce((sum, day) => sum + day.sessions, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">Total Sessions</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export { TrafficChart };