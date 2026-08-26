import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Globe, Map, MapPin, Navigation } from 'lucide-react';
import CountriesAdmin from './location/CountriesAdmin';
import StatesAdmin from './location/StatesAdmin';
import CitiesAdmin from './location/CitiesAdmin';
import AreasAdmin from './location/AreasAdmin';
import AdminHeader from '../../components/admin/AdminHeader';

export default function Locations() {
    const navItems = [
        { label: "Countries", path: "countries", icon: Globe },
        { label: "States", path: "states", icon: Map },
        { label: "Cities", path: "cities", icon: MapPin },
        { label: "Areas", path: "areas", icon: Navigation },
    ];

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Location Management"
                subtitle="Manage countries, states, cities, and local areas for your business directory."
            />

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 overflow-x-auto custom-scrollbar">
                <nav className="-mb-px flex space-x-8 min-w-max pb-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={`/admin/locations/${item.path}`}
                            className={({ isActive }) =>
                                `flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Sub-page Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Routes>
                    <Route index element={<Navigate to="countries" replace />} />
                    <Route path="countries" element={<CountriesAdmin />} />
                    <Route path="states" element={<StatesAdmin />} />
                    <Route path="cities" element={<CitiesAdmin />} />
                    <Route path="areas" element={<AreasAdmin />} />
                </Routes>
            </div>
        </div>
    );
}
