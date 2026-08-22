export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Blank by default — an unset day renders as "Not specified" on the public page
// rather than inventing a timing.
export const emptyBusinessHours = () => DAYS.reduce((acc, day) => {
    acc[day] = { open: '', close: '', closed: false };
    return acc;
}, {});

// Turns whatever the API returned into a complete, controlled 7-day map.
export const normalizeBusinessHours = (businessHours) => DAYS.reduce((acc, day) => {
    const h = businessHours?.[day];
    acc[day] = {
        open: h?.open || '',
        close: h?.close || '',
        closed: Boolean(h?.closed)
    };
    return acc;
}, {});

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
    // Indexed by Date#getDay(), which is Sunday-first — not the same order as DAYS.
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
    if (closeTime > openTime) {
        return currentTime >= openTime && currentTime < closeTime ? OPEN : CLOSED;
    } else {
        // Spans across midnight (e.g. 10:00 PM to 02:00 AM)
        return currentTime >= openTime || currentTime < closeTime ? OPEN : CLOSED;
    }
};

const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    // Handle cases where AM/PM is already present
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        return timeStr;
    }
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (Number.isNaN(hours)) return timeStr;
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
};

// Renders a single day's entry without inventing a timing.
export const formatDayHours = (dayHours) => {
    if (!dayHours) return 'Not specified';
    if (dayHours.closed) return 'Closed';
    if (!dayHours.open || !dayHours.close) return 'Not specified';
    return `${formatTime12h(dayHours.open)} - ${formatTime12h(dayHours.close)}`;
};
