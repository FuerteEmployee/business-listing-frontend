// Human-readable size for a byte count, e.g. 2.4 MB / 850 KB. Returns "" for 0/unknown.
export const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
