import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Search, TrendingUp, Filter } from 'lucide-react';
import { api } from '@/services/api';

const SearchAnalytics = ({ dateRange }) => {
    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSearchData();
    }, [dateRange]);

    const fetchSearchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/analytics/search', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString()
                }
            });
            setSearchData(response.data.search);
        } catch (error) {
            console.error('Error fetching search data:', error);
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

    if (!searchData) return null;

    return (
        <div className="space-y-6">
            {/* Top Search Queries */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Top Search Queries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {searchData.topSearches.map((query, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                        {index + 1}
                                    </Badge>
                                    <div>
                                        <p className="font-medium text-gray-900">{query.query}</p>
                                        <p className="text-sm text-gray-500">
                                            {query.searchCount} searches • {query.uniqueUsers} unique users
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-blue-600">
                                        {query.conversionRate}%
                                    </div>
                                    <div className="text-xs text-gray-500">conversion</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Search Trends */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Search Trends Over Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={searchData.trends}>
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
                                    value.toLocaleString(),
                                    name === 'searches' ? 'Total Searches' : 'Unique Queries'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="searches"
                                stroke="#8884d8"
                                strokeWidth={2}
                                name="searches"
                            />
                            <Line
                                type="monotone"
                                dataKey="uniqueQueries"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                name="uniqueQueries"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Search Filters Usage */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Search Filters Usage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {searchData.filterUsage.categoryFilters}
                            </div>
                            <div className="text-sm text-gray-600">Category Filters</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {searchData.filterUsage.locationFilters}
                            </div>
                            <div className="text-sm text-gray-600">Location Filters</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {searchData.filterUsage.priceFilters}
                            </div>
                            <div className="text-sm text-gray-600">Price Filters</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                                {searchData.filterUsage.ratingFilters}
                            </div>
                            <div className="text-sm text-gray-600">Rating Filters</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Search Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Total Searches</span>
                                <Badge variant="secondary">
                                    {searchData.trends.reduce((sum, day) => sum + day.searches, 0).toLocaleString()}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Unique Search Terms</span>
                                <Badge variant="secondary">
                                    {searchData.trends.reduce((sum, day) => sum + day.uniqueQueries, 0).toLocaleString()}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Avg Searches per Day</span>
                                <Badge variant="secondary">
                                    {Math.round(searchData.trends.reduce((sum, day) => sum + day.searches, 0) / searchData.trends.length).toLocaleString()}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Popular Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {searchData.topSearches
                                .filter(query => query.category)
                                .slice(0, 5)
                                .map((query, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{query.category}</span>
                                        <Badge variant="outline">{query.searchCount} searches</Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export { SearchAnalytics };