import React from 'react';

export default function Logo({ 
    settings, 
    className = "h-8", 
    imgClassName = "object-contain", 
    fallbackClassName = "font-bold text-xl tracking-tight"
}) {
    const isVideo = (url) => {
        if (!url) return false;
        const lowercaseUrl = url.toLowerCase();
        return lowercaseUrl.includes('/video/upload/') || 
               lowercaseUrl.endsWith('.mp4') || 
               lowercaseUrl.endsWith('.mov');
    };

    if (settings?.logoUrl) {
        if (isVideo(settings.logoUrl)) {
            return (
                <video 
                    src={settings.logoUrl} 
                    className={`${className} ${imgClassName}`}
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                />
            );
        }
        return (
            <img 
                src={settings.logoUrl} 
                alt={settings?.siteName} 
                className={`${className} ${imgClassName}`} 
            />
        );
    }

    return (
        <span 
            className={fallbackClassName} 
            style={{ color: settings?.primaryColor || '#4f46e5' }}
        >
            {settings?.siteName || 'Fuerte Developers'}
        </span>
    );
}
