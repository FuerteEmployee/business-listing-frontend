import { Clock } from "lucide-react";
import { DAYS, emptyBusinessHours } from "../../utils/businessHours";

/**
 * Per-day opening hours editor, shared by the admin listing editor and the
 * merchant profile editor so the two can't drift apart.
 *
 * `value` is the full 7-day map ({ monday: { open, close, closed }, ... });
 * pass it through normalizeBusinessHours() when loading from the API so every
 * day is present and controlled. Nothing is defaulted — a day left blank shows
 * as "Not specified" publicly rather than an invented timing.
 */
export default function BusinessHoursEditor({ value, onChange, title = "Business Hours" }) {
    const hoursMap = value || emptyBusinessHours();

    const updateDay = (day, patch) => {
        onChange({
            ...hoursMap,
            [day]: { ...hoursMap[day], ...patch }
        });
    };

    const copyMondayToAllDays = () => {
        const monday = hoursMap.monday;
        onChange(DAYS.reduce((acc, day) => {
            acc[day] = { ...monday };
            return acc;
        }, {}));
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">{title}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={copyMondayToAllDays}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                    >
                        Copy Monday to all
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(emptyBusinessHours())}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            <p className="text-xs text-slate-500">
                Set the opening and closing time for each day. Leave a day blank to show
                &ldquo;Not specified&rdquo; on your public page, or tick <span className="font-semibold">Closed</span> to mark it a day off.
            </p>

            <div className="space-y-2">
                {DAYS.map(day => {
                    const hours = hoursMap[day] || { open: "", close: "", closed: false };
                    return (
                        <div
                            key={day}
                            className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                        >
                            <span className="w-24 text-sm font-bold text-slate-700 capitalize">{day}</span>

                            <input
                                type="time"
                                value={hours.open}
                                disabled={hours.closed}
                                onChange={e => updateDay(day, { open: e.target.value })}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                            />
                            <span className="text-slate-400 text-sm">to</span>
                            <input
                                type="time"
                                value={hours.close}
                                disabled={hours.closed}
                                onChange={e => updateDay(day, { close: e.target.value })}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                            />

                            <label className="flex items-center gap-2 ml-auto cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hours.closed}
                                    onChange={e => updateDay(day, { closed: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
                                />
                                <span className="text-xs font-bold text-slate-500">Closed</span>
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
