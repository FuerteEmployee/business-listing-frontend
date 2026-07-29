import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Download, Upload, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import FormInput from "../../components/ui/FormInput";
import FormSelect from "../../components/ui/FormSelect";
import AdminHeader from "../../components/admin/AdminHeader";

const BlacklistManager = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        search: ''
    });
    const [newEntry, setNewEntry] = useState({
        type: 'ip',
        value: '',
        reason: '',
        severity: 'medium',
        expiresAt: ''
    });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchBlacklist();
    }, [filters]);

    const fetchBlacklist = async () => {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/blacklist?${queryParams}`);

            if (!response.ok) throw new Error('Failed to fetch blacklist');

            const data = await response.json();
            setEntries(data.entries);
        } catch (error) {
            console.error('Error fetching blacklist:', error);
            toast.error('Failed to load blacklist');
        } finally {
            setLoading(false);
        }
    };

    const addToBlacklist = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/blacklist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newEntry)
            });

            if (!response.ok) throw new Error('Failed to add to blacklist');

            toast.success('Entry added to blacklist');
            setShowAddModal(false);
            setNewEntry({
                type: 'ip',
                value: '',
                reason: '',
                severity: 'medium',
                expiresAt: ''
            });
            fetchBlacklist();
        } catch (error) {
            console.error('Error adding to blacklist:', error);
            toast.error('Failed to add entry');
        }
    };

    const removeFromBlacklist = async () => {
        const id = confirmModal.id;
        if (!id) return;

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/blacklist/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to remove from blacklist');

            toast.success('Entry removed from blacklist');
            setConfirmModal({ isOpen: false, id: null });
            fetchBlacklist();
        } catch (error) {
            console.error('Error removing from blacklist:', error);
            toast.error('Failed to remove entry');
        }
    };

    const exportToCSV = async () => {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/fraud/blacklist/export-csv`);

            if (!response.ok) throw new Error('Failed to export blacklist');

            const data = await response.json();

            // Convert to CSV
            const headers = ['Type', 'Value', 'Reason', 'Severity', 'Added By', 'Created At'];
            const csvContent = [
                headers.join(','),
                ...data.data.map(row => [
                    row.type,
                    `"${row.value}"`,
                    `"${row.reason}"`,
                    row.severity,
                    `"${row.addedBy}"`,
                    row.createdAt
                ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blacklist.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Blacklist exported successfully');
        } catch (error) {
            console.error('Error exporting blacklist:', error);
            toast.error('Failed to export blacklist');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'ip': return '🌐';
            case 'phone': return '📱';
            case 'email': return '📧';
            case 'domain': return '🌍';
            default: return '🚫';
        }
    };

    const filteredEntries = entries.filter(entry => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            if (!entry.value.toLowerCase().includes(searchLower) &&
                !entry.reason.toLowerCase().includes(searchLower)) {
                return false;
            }
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Blacklist Manager"
                subtitle="Manage blocked IPs, phones, emails, and domains"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={exportToCSV}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Entry
                        </button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Entries</p>
                            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
                        </div>
                        <Shield className="w-8 h-8 text-gray-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Entries</p>
                            <p className="text-2xl font-bold text-green-600">
                                {entries.filter(e => e.isActive).length}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">IP Addresses</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {entries.filter(e => e.type === 'ip').length}
                            </p>
                        </div>
                        <span className="text-2xl">🌐</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Email Domains</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {entries.filter(e => e.type === 'domain').length}
                            </p>
                        </div>
                        <span className="text-2xl">📧</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search entries..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                            />
                        </div>
                    </div>

                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="">All Types</option>
                        <option value="ip">IP Address</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="domain">Domain</option>
                    </select>
                </div>
            </div>

            {/* Blacklist Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Value
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Added By
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEntries.map((entry) => (
                                <tr key={entry._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getTypeIcon(entry.type)}</span>
                                            <span className="text-sm font-medium text-gray-900 capitalize">
                                                {entry.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono text-gray-900 max-w-xs truncate">
                                            {entry.value}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {entry.reason}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(entry.severity)}`}>
                                            {entry.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            entry.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {entry.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.addedBy?.name || 'System'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(entry.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        {entry.isActive && (
                                            <button
                                                onClick={() => setConfirmModal({ isOpen: true, id: entry._id })}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredEntries.length === 0 && (
                    <div className="text-center py-12">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No blacklist entries</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filters.search || filters.type ? 'No entries match your filters.' : 'Add entries to start blocking suspicious activity.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Entry Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Blacklist Protocol"
                subtitle="Add security restriction entry"
                icon={Shield}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Discard</Button>
                        <Button variant="primary" onClick={addToBlacklist}>Initialize Block</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <FormSelect
                        label="Restriction Type"
                        value={newEntry.type}
                        onChange={(e) => setNewEntry({...newEntry, type: e.target.value})}
                        options={[
                            { value: 'ip', label: 'IP Address' },
                            { value: 'phone', label: 'Phone Number' },
                            { value: 'email', label: 'Email Address' },
                            { value: 'domain', label: 'Domain Name' }
                        ]}
                    />

                    <FormInput
                        label="Identifier Value"
                        placeholder={`Enter ${newEntry.type} to block`}
                        value={newEntry.value}
                        onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                    />

                    <FormInput
                        label="Security Reason"
                        placeholder="Why is this being blocked?"
                        value={newEntry.reason}
                        onChange={(e) => setNewEntry({...newEntry, reason: e.target.value})}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                            label="Threat Severity"
                            value={newEntry.severity}
                            onChange={(e) => setNewEntry({...newEntry, severity: e.target.value})}
                            options={[
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'critical', label: 'Critical' }
                            ]}
                        />

                        <FormInput
                            label="Expiration (Optional)"
                            type="datetime-local"
                            value={newEntry.expiresAt}
                            onChange={(e) => setNewEntry({...newEntry, expiresAt: e.target.value})}
                        />
                    </div>
                </div>
            </Modal>

            {/* Confirm Removal Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                title="Restrictive Access Reversal"
                subtitle="Security Override Confirmation"
                icon={Shield}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, id: null })}>Keep Restricted</Button>
                        <Button variant="danger" onClick={removeFromBlacklist}>Confirm Removal</Button>
                    </div>
                }
            >
                <p className="text-slate-600 font-bold leading-relaxed">
                    Are you sure you want to remove this entry from the blacklist? This will restore access for the previously restricted identifier.
                </p>
            </Modal>
        </div>
    );
};

export default BlacklistManager;