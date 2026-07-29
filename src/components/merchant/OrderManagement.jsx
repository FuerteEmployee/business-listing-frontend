import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
    Search, Filter, Clock, CheckCircle2, Truck, Package, 
    XCircle, MoreVertical, Calendar, User, Mail, Phone, 
    MapPin, CreditCard, ExternalLink, RefreshCw, ChevronRight,
    AlertCircle, IndianRupee
} from 'lucide-react';

const OrderManagement = ({ listingId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [listingId, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const url = `/merchant/orders?listingId=${listingId}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
            const response = await api.get(url);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/merchant/orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending': return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' };
            case 'confirmed': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2, label: 'Confirmed' };
            case 'processing': return { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: RefreshCw, label: 'Processing' };
            case 'shipped': return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck, label: 'Shipped' };
            case 'delivered': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package, label: 'Delivered' };
            case 'cancelled': return { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle, label: 'Cancelled' };
            default: return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle, label: status };
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-6 text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                        <Package className="w-6 h-6 text-indigo-600" />
                        Orders Manager
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Monitor and manage your customer transactions</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search by order #, name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all opacity-80 hover:opacity-100 focus:opacity-100"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                        >
                            <option value="all">ALL STATUS</option>
                            <option value="pending">PENDING</option>
                            <option value="confirmed">CONFIRMED</option>
                            <option value="processing">PROCESSING</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="delivered">DELIVERED</option>
                            <option value="cancelled">CANCELLED</option>
                        </select>
                    </div>

                    <button 
                        onClick={fetchOrders}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Orders Grid/Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Orders Found</h3>
                        <p className="text-slate-500 max-w-xs mt-2 text-sm font-medium">We couldn't find any orders matching your current filters or search query.</p>
                        {statusFilter !== 'all' && (
                            <button 
                                onClick={() => setStatusFilter('all')}
                                className="mt-6 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Info</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => {
                                    const { color, icon: StatusIcon, label } = getStatusConfig(order.status);
                                    return (
                                        <tr key={order._id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                                                        #{order.orderNumber?.slice(-4)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900">#{order.orderNumber}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{order.items?.length || 0} ITEMS</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{order.customerName}</div>
                                                        <div className="text-xs text-slate-500">{order.customerEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-slate-900 flex items-center gap-1">
                                                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                                                    {order.totalAmount?.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{order.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                                <div className="text-[10px] font-medium text-slate-400 uppercase">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
                                                >
                                                    Details <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Premium Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                                    <Package className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Order #{selectedOrder.orderNumber}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                        <Calendar className="w-3.5 h-3.5" /> {new Date(selectedOrder.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Customer & Items */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Items List */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Order Items</h4>
                                        <div className="space-y-3">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-slate-50/30 group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-900">{item.name}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QTY: {item.quantity} × ₹{item.price?.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action History / Notes etc would go here */}
                                </div>

                                {/* Right Column: Summary & Actions */}
                                <div className="space-y-8">
                                    {/* Customer Info Card */}
                                    <div className="p-6 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                                        <User className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                                        <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-4">Customer info</h4>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
                                                <div className="font-bold text-sm tracking-tight">{selectedOrder.customerName}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
                                                <div className="text-xs font-medium opacity-90 break-all">{selectedOrder.customerEmail}</div>
                                            </div>
                                            {selectedOrder.customerPhone && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Phone className="w-5 h-5 text-white" /></div>
                                                    <div className="text-xs font-medium opacity-90">{selectedOrder.customerPhone}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Totals Card */}
                                    <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-xl">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Payment Summary</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm font-medium text-slate-400">
                                                <span>Subtotal</span>
                                                <span className="text-white">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-medium text-slate-400">
                                                <span>Tax</span>
                                                <span className="text-white">₹0</span>
                                            </div>
                                            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                                                <span className="text-xs font-black uppercase text-indigo-400">Total</span>
                                                <span className="text-2xl font-black text-white italic tracking-tighter">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                                <CreditCard className="w-3.5 h-3.5" /> {selectedOrder.paymentStatus?.toUpperCase() || 'UNPAID'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Controls */}
                                    <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">Update Order Status</h4>
                                        
                                        {selectedOrder.status === 'pending' && (
                                            <button 
                                                onClick={() => updateOrderStatus(selectedOrder._id, 'confirmed')}
                                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Confirm Order
                                            </button>
                                        )}
                                        {selectedOrder.status === 'confirmed' && (
                                            <button 
                                                onClick={() => updateOrderStatus(selectedOrder._id, 'processing')}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Start Processing
                                            </button>
                                        )}
                                        {selectedOrder.status === 'processing' && (
                                            <button 
                                                onClick={() => updateOrderStatus(selectedOrder._id, 'shipped')}
                                                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Truck className="w-4 h-4" /> Ship Order
                                            </button>
                                        )}
                                        {selectedOrder.status === 'shipped' && (
                                            <button 
                                                onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Package className="w-4 h-4" /> Deliver Order
                                            </button>
                                        )}
                                        
                                        {(selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered') && (
                                            <button 
                                                onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                                                className="w-full py-3 bg-white border border-rose-100 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;