import { useState, useEffect } from 'react';
import { 
    Ticket, Plus, Edit, Trash2, Check, X, 
    Loader2, Save, Calendar, Tag, Percent, DollarSign, AlertCircle, Trash
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui/button";
import AdminHeader from "../../components/admin/AdminHeader";

export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        usageLimit: 0,
        expiryDate: ""
    });

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const res = await fetchWithAuth(`${API_BASE_URL}/coupons`);
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            }
        } catch (err) {
            console.error("Failed to fetch coupons:", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                usageLimit: coupon.usageLimit,
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ""
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: "",
                discountType: "percentage",
                discountValue: 0,
                usageLimit: 0,
                expiryDate: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const url = editingCoupon 
                ? `${API_BASE_URL}/coupons/${editingCoupon._id}` 
                : `${API_BASE_URL}/coupons`;
            
            const method = editingCoupon ? "PUT" : "POST";

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchCoupons();
                setIsModalOpen(false);
            } else {
                alert("Failed to save coupon");
            }
        } catch (err) {
            console.error("Save coupon error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/coupons/${id}/toggle`, {
                method: "PATCH"
            });
            if (res.ok) {
                await fetchCoupons();
            }
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    const confirmDelete = (coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!couponToDelete) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/coupons/${couponToDelete._id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await fetchCoupons();
                setIsDeleteModalOpen(false);
                setCouponToDelete(null);
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Discount Coupons"
                subtitle="Generate and manage promotional codes for merchants."
                actions={
                    <Button 
                        onClick={() => handleOpenModal()} 
                        variant="primary" 
                        leftIcon={Plus}
                    >
                        Create New Coupon
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="h-48 bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
                    ))
                ) : coupons.map((coupon) => (
                    <div key={coupon._id} className={`bg-white rounded-[32px] border ${!coupon.isActive ? 'border-slate-100 opacity-60' : 'border-slate-200'} shadow-sm hover:shadow-xl transition-all group overflow-hidden`}>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 inline-block mb-3">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{coupon.code}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleOpenModal(coupon)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleStatus(coupon._id)}
                                        className={`p-3 rounded-2xl transition-all ${coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}
                                        title={coupon.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {coupon.isActive ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    </button>
                                    <button 
                                        onClick={() => confirmDelete(coupon)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Usage</span>
                                    <span className="text-sm font-black text-slate-700">
                                        {coupon.usageCount} / {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Expiry</span>
                                    <span className="text-sm font-bold text-slate-700">
                                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Coupon Creator Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                subtitle="Promotional Campaign Management"
                icon={Tag}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="coupon-form" isLoading={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                            {editingCoupon ? 'Update Coupon' : 'Generate Coupon'}
                        </Button>
                    </>
                }
            >
                <form id="coupon-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Coupon Code</label>
                        <input 
                            required
                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[24px] text-sm font-black text-slate-700 focus:ring-4 focus:ring-emerald-500/10 transition-all uppercase"
                            placeholder="e.g. SUMMER50"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Type</label>
                            <select 
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[24px] text-sm font-black text-slate-700 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                            >
                                <option value="percentage">Percentage</option>
                                <option value="flat">Flat Amount</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Value</label>
                            <input 
                                type="number"
                                required
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[24px] text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Usage Limit</label>
                            <input 
                                type="number"
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                placeholder="0 for unlimited"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Expiry Date</label>
                            <input 
                                type="date"
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Coupon"
                subtitle="This action will permanently invalidate this code"
                icon={Trash}
                size="sm"
                footer={
                    <>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={executeDelete}
                            className="flex-1"
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <div className="text-center text-slate-600">
                    <p className="text-sm font-medium">Are you sure you want to delete <span className="font-bold text-slate-900">"{couponToDelete?.code}"</span>?</p>
                    <p className="text-xs mt-2 leading-relaxed tracking-tight font-medium">Any merchants currently using this code in their checkout flow will find it invalid.</p>
                </div>
            </Modal>
        </div>
    );
}
