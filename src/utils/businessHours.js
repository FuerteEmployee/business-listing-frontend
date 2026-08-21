// Open/closed state for a listing's businessHours map.
// Hours the merchant never filled in report as unknown — we don't assume a window.
const UNKNOWN = { status: 'Timings not specified', color: 'text-slate-500', tone: 'unknown' };
const CLOSED = { status: 'Closed Now', color: 'text-rose-600', tone: 'closed' };
const OPEN = { status: 'Open Now', color: 'text-emerald-600', tone: 'open' };

// Accepts both "9:00 AM" and 24h "09:00".
const parseTime = (timeStr) => {
    const [time, modifier] = String(timeStr).trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours)) return null;
    const mod = (modifier || '').toUpperCase();
    if (mod === 'PM' && hours < 12) hours += 12;
    if (mod === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
};

export const isBusinessOpen = (businessHours) => {
    if (!businessHours) return UNKNOWN;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const hours = businessHours[today];

    if (!hours) return UNKNOWN;
    if (hours.closed) return CLOSED;
    if (!hours.open || !hours.close) return UNKNOWN;

    const openTime = parseTime(hours.open);
    const closeTime = parseTime(hours.close);
    if (openTime === null || closeTime === null) return UNKNOWN;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    return currentTime >= openTime && currentTime < closeTime ? OPEN : CLOSED;
};

// Renders a single day's entry without inventing a timing.
export const formatDayHours = (dayHours) => {
    if (!dayHours) return 'Not specified';
    if (dayHours.closed) return 'Closed';
    if (!dayHours.open || !dayHours.close) return 'Not specified';
    return `${dayHours.open} - ${dayHours.close}`;
};
