import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Home, Briefcase, Map, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, fetchWithAuth } from '../../config/api';

export default function AddressBook() {
    const { user, login } = useAuth();
    const [addresses, setAddresses] = useState(user?.addressBook || []);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: 'Home', address: '', isDefault: false });

    useEffect(() => {
        if (user?.addressBook) {
            setAddresses(user.addressBook);
        }
    }, [user]);

    const handleAction = async (action, data = {}) => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(getApiUrl('me/addresses'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...data })
            });
            const result = await res.json();
            if (res.ok) {
                // Update local auth context to reflect new address book
                const updatedUser = { ...user, addressBook: result.data };
                login(updatedUser, localStorage.getItem('token'));
                setAddresses(result.data);
                setIsAdding(false);
                setNewAddress({ label: 'Home', address: '', isDefault: false });
            }
        } catch (err) {
            console.error('Address action error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (label) => {
        switch (label.toLowerCase()) {
            case 'home': return Home;
            case 'work': return Briefcase;
            default: return Map;
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Address Book</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage your saved delivery and home addresses.</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-orange-100"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Address
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-12 p-8 bg-slate-50 rounded-[2rem] border border-orange-100 animate-in zoom-in duration-300">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Create New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                            <select 
                                value={newAddress.label}
                                onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option>Home</option>
                                <option>Work</option>
                                <option>Office</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Set as Default</label>
                             <div className="flex items-center h-[54px]">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={newAddress.isDefault}
                                        onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                    <span className="ms-3 text-sm font-bold text-slate-500">Default Address</span>
                                </label>
                             </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Complete Address</label>
                            <textarea 
                                required
                                value={newAddress.address}
                                onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                                placeholder="House No, Street Name, Area, Landmarks..."
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 resize-none h-24"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-8">
                        <button 
                            onClick={() => handleAction('add', newAddress)}
                            disabled={loading || !newAddress.address}
                            className="flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Address
                        </button>
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="px-8 py-4 text-slate-500 font-black text-sm hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {addresses.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <MapPin className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">Your address book is empty</h3>
                        <p className="text-slate-400 text-sm font-bold mt-2">Add your addresses for faster checkout and better service.</p>
                    </div>
                ) : (
                    addresses.map((item) => {
                        const Icon = getIcon(item.label);
                        return (
                            <div key={item._id} className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-8 rounded-[2.5rem] border transition-all ${item.isDefault ? 'bg-orange-50/50 border-orange-200 ring-4 ring-orange-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-start gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.isDefault ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-lg text-slate-900">{item.label}</h4>
                                            {item.isDefault && <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase tracking-widest">Default</span>}
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium mt-1 leading-relaxed max-w-lg">{item.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-6 md:mt-0">
                                    {!item.isDefault && (
                                        <button 
                                            onClick={() => handleAction('update', { addressId: item._id, isDefault: true })}
                                            className="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleAction('remove', { addressId: item._id })}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
