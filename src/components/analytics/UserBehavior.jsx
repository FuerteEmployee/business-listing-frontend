import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { Users, MousePointer, Search, Eye, Phone, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';

const UserBehavior = ({ dateRange }) => {
    const [behaviorData, setBehaviorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBehaviorData();
    }, [dateRange]);

    const fetchBehaviorData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics/behavior', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString()
                }
            });
            setBehaviorData(response.data.behavior);
        } catch (error) {
            console.error('Error fetching behavior data:', error);
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

    if (!behaviorData) return null;

    // Prepare funnel data
    const funnelData = [
        { name: 'Searches', value: behaviorData.conversionFunnel.searches, fill: '#8884d8' },
        { name: 'Business Views', value: behaviorData.conversionFunnel.views, fill: '#82ca9d' },
        { name: 'Clicks', value: behaviorData.conversionFunnel.clicks, fill: '#ffc658' },
        { name: 'Enquiries', value: behaviorData.conversionFunnel.enquiries, fill: '#ff7300' }
    ];

    return (
        <div className="space-y-6">
            {/* Conversion Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        User Conversion Funnel
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <FunnelChart>
                            <Tooltip
                                formatter={(value, name) => [value, name]}
                                labelFormatter={(label) => `${label}`}
                            />
                            <Funnel
                                dataKey="value"
                                data={funnelData}
                                isAnimationActive
                            >
                                <LabelList position="center" fill="#fff" stroke="none" />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Funnel Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{behaviorData.conversionFunnel.searches}</div>
                        <div className="text-sm text-gray-600">Searches</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{behaviorData.conversionFunnel.views}</div>
                        <div className="text-sm text-gray-600">Business Views</div>
                        <div className="text-xs text-gray-500">
                            {behaviorData.conversionFunnel.searches > 0 ?
                                ((behaviorData.conversionFunnel.views / behaviorData.conversionFunnel.searches) * 100).toFixed(1) : 0}% conversion
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <MousePointer className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{behaviorData.conversionFunnel.clicks}</div>
                        <div className="text-sm text-gray-600">Clicks</div>
                        <div className="text-xs text-gray-500">
                            {behaviorData.conversionFunnel.views > 0 ?
                                ((behaviorData.conversionFunnel.clicks / behaviorData.conversionFunnel.views) * 100).toFixed(1) : 0}% conversion
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Phone className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{behaviorData.conversionFunnel.enquiries}</div>
                        <div className="text-sm text-gray-600">Enquiries</div>
                        <div className="text-xs text-gray-500">
                            {behaviorData.conversionFunnel.clicks > 0 ?
                                ((behaviorData.conversionFunnel.enquiries / behaviorData.conversionFunnel.clicks) * 100).toFixed(1) : 0}% conversion
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Journeys */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top User Journeys
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {behaviorData.userJourneys.slice(0, 10).map((journey, index) => (
                            <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">User {journey.userId.slice(-6)}</Badge>
                                        <span className="text-sm text-gray-600">
                                            {journey.sessionCount} sessions • {journey.eventCount} events
                                        </span>
                                    </div>
                                    <Badge variant="secondary">
                                        #{index + 1}
                                    </Badge>
                                </div>

                                {/* Event Timeline */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {journey.topEventTypes.slice(0, 8).map((eventType, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            {eventType.type} ({eventType.count})
                                        </Badge>
                                    ))}
                                </div>

                                {/* Journey Flow */}
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Journey:</span> Started with{' '}
                                    <span className="font-medium text-blue-600">
                                        {journey.firstEvent?.type || 'unknown'}
                                    </span>
                                    {' '}on {journey.firstEvent?.timestamp ?
                                        new Date(journey.firstEvent.timestamp).toLocaleDateString() : 'unknown'}
                                    {journey.lastEvent && journey.lastEvent.type !== journey.firstEvent?.type && (
                                        <span>, last action: <span className="font-medium text-green-600">
                                            {journey.lastEvent.type}
                                        </span></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* User Behavior Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Engagement Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Average Events per User</span>
                                <Badge variant="secondary">
                                    {behaviorData.userJourneys.length > 0 ?
                                        (behaviorData.userJourneys.reduce((sum, user) => sum + user.eventCount, 0) / behaviorData.userJourneys.length).toFixed(1) : 0}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Average Sessions per User</span>
                                <Badge variant="secondary">
                                    {behaviorData.userJourneys.length > 0 ?
                                        (behaviorData.userJourneys.reduce((sum, user) => sum + user.sessionCount, 0) / behaviorData.userJourneys.length).toFixed(1) : 0}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Most Active Users</span>
                                <Badge variant="secondary">
                                    {behaviorData.userJourneys.filter(user => user.eventCount > 10).length}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Rates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Search to View Rate</span>
                                <Badge variant="secondary">
                                    {behaviorData.conversionFunnel.searches > 0 ?
                                        ((behaviorData.conversionFunnel.views / behaviorData.conversionFunnel.searches) * 100).toFixed(1) : 0}%
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">View to Click Rate</span>
                                <Badge variant="secondary">
                                    {behaviorData.conversionFunnel.views > 0 ?
                                        ((behaviorData.conversionFunnel.clicks / behaviorData.conversionFunnel.views) * 100).toFixed(1) : 0}%
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Click to Enquiry Rate</span>
                                <Badge variant="secondary">
                                    {behaviorData.conversionFunnel.clicks > 0 ?
                                        ((behaviorData.conversionFunnel.enquiries / behaviorData.conversionFunnel.clicks) * 100).toFixed(1) : 0}%
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Overall Conversion Rate</span>
                                <Badge variant="secondary">
                                    {behaviorData.conversionFunnel.searches > 0 ?
                                        ((behaviorData.conversionFunnel.enquiries / behaviorData.conversionFunnel.searches) * 100).toFixed(1) : 0}%
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Journey Patterns */}
            <Card>
                <CardHeader>
                    <CardTitle>Common User Journey Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Search → View → Click</h4>
                            <p className="text-sm text-gray-600 mb-2">Most common successful journey</p>
                            <div className="text-2xl font-bold text-green-600">
                                {behaviorData.userJourneys.filter(user =>
                                    user.topEventTypes.some(et => et.type === 'search') &&
                                    user.topEventTypes.some(et => et.type === 'business_listing_view') &&
                                    user.topEventTypes.some(et => et.type.includes('click'))
                                ).length}
                            </div>
                            <p className="text-xs text-gray-500">users followed this pattern</p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Direct Business View</h4>
                            <p className="text-sm text-gray-600 mb-2">Users who went directly to business pages</p>
                            <div className="text-2xl font-bold text-blue-600">
                                {behaviorData.userJourneys.filter(user =>
                                    user.topEventTypes.some(et => et.type === 'business_listing_view') &&
                                    !user.topEventTypes.some(et => et.type === 'search')
                                ).length}
                            </div>
                            <p className="text-xs text-gray-500">users bypassed search</p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">High Engagement</h4>
                            <p className="text-sm text-gray-600 mb-2">Users with 5+ different event types</p>
                            <div className="text-2xl font-bold text-purple-600">
                                {behaviorData.userJourneys.filter(user =>
                                    user.topEventTypes.length >= 5
                                ).length}
                            </div>
                            <p className="text-xs text-gray-500">highly engaged users</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export { UserBehavior };