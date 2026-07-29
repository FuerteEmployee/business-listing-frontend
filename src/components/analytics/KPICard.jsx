import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50',
        red: 'text-red-600 bg-red-50'
    };

    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {trend !== undefined && (
                    <div className="flex items-center gap-1">
                        <TrendIcon
                            className={`h-3 w-3 ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                        />
                        <Badge
                            variant={isPositive ? 'default' : 'destructive'}
                            className="text-xs"
                        >
                            {isPositive ? '+' : ''}{trend}%
                        </Badge>
                        <span className="text-xs text-gray-500">vs last period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export { KPICard };