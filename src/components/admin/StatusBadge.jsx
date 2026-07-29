/**
 * Status Badge Component - Display status with color coding
 */
export default function StatusBadge({ status, variant = 'default' }) {
    void variant;

    const colors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-slate-100 text-slate-800',
        pending: 'bg-yellow-100 text-yellow-800',
        banned: 'bg-red-100 text-red-800',
        suspended: 'bg-red-100 text-red-800',
        rejected: 'bg-red-100 text-red-800',
        unverified: 'bg-orange-100 text-orange-800',
        verified: 'bg-green-100 text-green-800',
        approved: 'bg-green-100 text-green-800',
        flagged: 'bg-red-100 text-red-800',
        sent: 'bg-blue-100 text-blue-800',
        viewed: 'bg-blue-100 text-blue-800',
        responded: 'bg-green-100 text-green-800',
        resolved: 'bg-green-100 text-green-800',
        closed: 'bg-slate-100 text-slate-800',
        investigating: 'bg-indigo-100 text-indigo-800',
        confirmed: 'bg-emerald-100 text-emerald-800',
        dismissed: 'bg-slate-100 text-slate-800',
        awaitingreview: 'bg-amber-100 text-amber-800',
        underreview: 'bg-indigo-100 text-indigo-800',
        moreinforequested: 'bg-blue-100 text-blue-800'
    };

    const rawStatus = typeof status === 'string' ? status.trim() : '';
    const normalizedStatus = rawStatus.toLowerCase();
    const badgeLabel = rawStatus
        ? rawStatus
            .replace(/[_-]+/g, ' ')
            .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        : 'Pending';

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[normalizedStatus] || colors.pending}`}>
            {badgeLabel}
        </span>
    );
}
