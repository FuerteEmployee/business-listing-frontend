const DRAFT_KEY = 'merchant_onboarding_draft';

export const saveDraft = (data) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
};

export const getDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return null;
    
    try {
        const parsed = JSON.parse(draft);
        // Expire draft after 7 days
        if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(DRAFT_KEY);
            return null;
        }
        return parsed.data;
    } catch (e) {
        return null;
    }
};

export const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
};
