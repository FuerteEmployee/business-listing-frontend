// Owner accounts created by the listing importer without a real address got a generated
// placeholder such as `owner-<id>@engitechexpo.local`; deleted accounts get `@removed.local`.
// Those are internal only and must never be shown as a contact email.
export const isPlaceholderEmail = (email) => /@[^@]+\.local$/i.test(String(email || '').trim());

// The email to display for a listing: the company's own email first, then a real owner email.
export const listingContactEmail = (company) => {
    if (company?.email && !isPlaceholderEmail(company.email)) return company.email;
    const ownerEmail = company?.owner?.email;
    if (ownerEmail && !isPlaceholderEmail(ownerEmail)) return ownerEmail;
    return '';
};
