import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = ({
    mode = 'single',
    selected,
    onSelect,
    numberOfMonths = 1,
    initialFocus
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const isSelected = (date) => {
        if (!selected) return false;
        if (mode === 'range') {
            return selected.from && selected.to &&
                   date >= selected.from && date <= selected.to;
        }
        return selected.getTime() === date.getTime();
    };

    const isInRange = (date) => {
        if (!selected || mode !== 'range') return false;
        return selected.from && selected.to &&
               date > selected.from && date < selected.to;
    };

    const handleDateClick = (date) => {
        if (mode === 'range') {
            if (!selected?.from || (selected.from && selected.to)) {
                onSelect({ from: date, to: undefined });
            } else {
                if (date < selected.from) {
                    onSelect({ from: date, to: selected.from });
                } else {
                    onSelect({ from: selected.from, to: date });
                }
            }
        } else {
            onSelect(date);
        }
    };

    const renderMonth = (monthOffset = 0) => {
        const month = new Date(currentMonth);
        month.setMonth(month.getMonth() + monthOffset);

        const days = daysInMonth(month);
        const firstDay = firstDayOfMonth(month);
        const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        return (
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">{monthName}</h3>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the first day of the month */}
                    {Array.from({ length: firstDay }, (_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: days }, (_, i) => {
                        const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const selected = isSelected(date);
                        const inRange = isInRange(date);

                        return (
                            <button
                                key={i}
                                onClick={() => handleDateClick(date)}
                                className={`h-8 w-8 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    selected ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                    inRange ? 'bg-blue-100 text-blue-900' :
                                    isToday ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                }`}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex">
            {Array.from({ length: numberOfMonths }, (_, i) => (
                <div key={i}>
                    {renderMonth(i)}
                </div>
            ))}
        </div>
    );
};

export { Calendar };