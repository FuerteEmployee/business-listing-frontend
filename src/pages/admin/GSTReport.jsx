import { useState, useEffect, useCallback } from "react";
import { FileBarChart2, Download, Calendar, Loader2, RefreshCw, Info } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "../../config/api";
import AdminHeader from "../../components/admin/AdminHeader";

function exportCSV(report, month) {
    const rows = [["Business", "GSTIN", "Taxable Amount (₹)", "GST Amount (₹)", "Total Amount (₹)", "Invoices"]];
    report.forEach(r => {
        rows.push([r.businessName || "—", r.gstin || "—", r.taxableAmount, r.gstAmount, r.totalAmount, r.invoiceCount]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `gst_report_${month || 'all'}_${Date.now()}.csv`;
    a.click();
}

export default function GSTReport() {
    const [report, setReport] = useState([]);
    const [totals, setTotals] = useState({});
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ month });
            const res = await fetchWithAuth(`${API_BASE_URL}/revenue/gst-report?${params}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setReport(data.report);
            setTotals(data.totals);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const gstRate = 18;

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="GST Report Export"
                subtitle="Monthly GST Summary · 18% Rate"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input type="month"
                                className="border-none bg-transparent text-sm font-semibold text-slate-700 focus:ring-0 outline-none"
                                value={month} onChange={e => setMonth(e.target.value)} />
                        </div>
                        <button onClick={fetchData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => exportCSV(report, month)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                }
            />

            {/* Totals Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Taxable Amount", value: `₹${(totals.taxableAmount || 0).toLocaleString()}`, color: "text-teal-700 bg-teal-50 border-teal-100" },
                    { label: "GST Collected", value: `₹${(totals.gstAmount || 0).toLocaleString()}`, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                    { label: "Total (incl. GST)", value: `₹${(totals.totalAmount || 0).toLocaleString()}`, color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
                    { label: "Invoices", value: totals.invoiceCount || 0, color: "text-violet-700 bg-violet-50 border-violet-100" },
                ].map(s => (
                    <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                        <p className="text-3xl font-black mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                GST amounts shown are sourced from Invoice <code>taxAmount</code> field. Ensure invoices are created with correct tax values for compliance.
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                    </div>
                ) : report.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                        <FileBarChart2 className="w-10 h-10" />
                        <p className="text-sm font-semibold">No invoice data for {month}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["Business", "GSTIN", "Taxable Amt.", `GST (${gstRate}%)`, "Total", "Invoices"].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{r.businessName || "—"}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {r.gstin || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-700">₹{r.taxableAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 font-semibold text-teal-700">₹{r.gstAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 font-black text-slate-900">₹{r.totalAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black">
                                                {r.invoiceCount}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {/* Totals row */}
                                <tr className="bg-slate-50 border-t-2 border-slate-200">
                                    <td className="px-5 py-3.5 font-black text-slate-900" colSpan={2}>TOTAL</td>
                                    <td className="px-5 py-3.5 font-black text-slate-800">₹{(totals.taxableAmount || 0).toLocaleString()}</td>
                                    <td className="px-5 py-3.5 font-black text-teal-700">₹{(totals.gstAmount || 0).toLocaleString()}</td>
                                    <td className="px-5 py-3.5 font-black text-slate-900">₹{(totals.totalAmount || 0).toLocaleString()}</td>
                                    <td className="px-5 py-3.5 text-center font-black text-slate-800">{totals.invoiceCount || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
