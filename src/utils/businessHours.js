export const isBusinessOpen = (businessHours) => {
    if (!businessHours) return { status: 'Open Now', color: 'text-emerald-600' }; // Default if no hours set

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const hours = businessHours[today];

    if (!hours || hours.closed) {
        return { status: 'Closed Now', color: 'text-rose-600' };
    }

    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    if (currentTime >= openTime && currentTime < closeTime) {
        return { status: 'Open Now', color: 'text-emerald-600' };
    }

    return { status: 'Closed Now', color: 'text-rose-600' };
};
