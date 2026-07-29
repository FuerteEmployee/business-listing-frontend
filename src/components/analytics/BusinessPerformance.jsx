import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Building2, Eye, Phone, MousePointer, TrendingUp, Search } from 'lucide-react';
import { api } from '@/services/api';

const BusinessPerformance = ({ dateRange }) => {
    const [businessData, setBusinessData] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [businessDetails, setBusinessDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        fetchBusinessPerformance();
    }, [dateRange, limit]);

    useEffect(() => {
        if (selectedBusiness) {
            fetchBusinessDetails(selectedBusiness);
        }
    }, [selectedBusiness, dateRange]);

    const fetchBusinessPerformance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics/businesses/performance', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    limit
                }
            });
            setBusinessData(response.data.businesses);
        } catch (error) {
            console.error('Error fetching business performance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBusinessDetails = async (businessId) => {
        try {
            const response = await api.get(`/analytics/business/${businessId}`, {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString()
                }
            });
            setBusinessDetails(response.data);
        } catch (error) {
            console.error('Error fetching business details:', error);
        }
    };

    const filteredBusinesses = businessData.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-4 items-center">
                    <Input
                        placeholder="Search businesses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                    <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">Top 10</SelectItem>
                            <SelectItem value="20">Top 20</SelectItem>
                            <SelectItem value="50">Top 50</SelectItem>
                            <SelectItem value="100">Top 100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Business List */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Top Performing Businesses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredBusinesses.map((business, index) => (
                                    <div
                                        key={business._id}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                            selectedBusiness === business._id
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        onClick={() => setSelectedBusiness(business._id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm truncate" title={business.name}>
                                                    {business.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{business.category}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                #{index + 1}
                                            </Badge>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-500">Views:</span>
                                                <span className="font-medium ml-1">{business.views}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Clicks:</span>
                                                <span className="font-medium ml-1">{business.clicks}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Business Details */}
                <div className="lg:col-span-2">
                    {selectedBusiness && businessDetails ? (
                        <div className="space-y-6">
                            {/* Business Header */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-6 w-6" />
                                            <div>
                                                <h3 className="text-lg font-semibold">{businessDetails.business.name}</h3>
                                                <p className="text-sm text-gray-600">{businessDetails.business.category} • {businessDetails.business.location}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            Business ID: {businessDetails.business.id}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                            </Card>

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <div className="text-2xl font-bold">{businessDetails.metrics.views}</div>
                                                <div className="text-xs text-gray-600">Views</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <MousePointer className="h-4 w-4 text-green-600" />
                                            <div>
                                                <div className="text-2xl font-bold">{businessDetails.metrics.calls + businessDetails.metrics.websiteClicks}</div>
                                                <div className="text-xs text-gray-600">Clicks</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-purple-600" />
                                            <div>
                                                <div className="text-2xl font-bold">{businessDetails.metrics.enquiries}</div>
                                                <div className="text-xs text-gray-600">Enquiries</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-orange-600" />
                                            <div>
                                                <div className="text-2xl font-bold">{businessDetails.metrics.clickThroughRate}%</div>
                                                <div className="text-xs text-gray-600">CTR</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Performance Trends */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Trends</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={businessDetails.trends}>
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
                                                    value,
                                                    name === 'views' ? 'Views' :
                                                    name === 'clicks' ? 'Clicks' : 'Enquiries'
                                                ]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="views"
                                                stroke="#8884d8"
                                                strokeWidth={2}
                                                name="views"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="clicks"
                                                stroke="#82ca9d"
                                                strokeWidth={2}
                                                name="clicks"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="enquiries"
                                                stroke="#ffc658"
                                                strokeWidth={2}
                                                name="enquiries"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Additional Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold text-gray-900">{businessDetails.metrics.calls}</div>
                                    <div className="text-xs text-gray-600">Call Clicks</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold text-gray-900">{businessDetails.metrics.websiteClicks}</div>
                                    <div className="text-xs text-gray-600">Website Clicks</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold text-gray-900">{businessDetails.metrics.directions}</div>
                                    <div className="text-xs text-gray-600">Directions</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold text-gray-900">{businessDetails.metrics.enquiryConversionRate}%</div>
                                    <div className="text-xs text-gray-600">Enquiry Rate</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Business</h3>
                                    <p className="text-gray-600">Choose a business from the list to view detailed analytics</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export { BusinessPerformance };