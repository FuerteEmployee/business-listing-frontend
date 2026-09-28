import { Link } from "react-router-dom";
import { Download } from "lucide-react";

// "Download Brochure" CTA used on the business page and search result cards.
// Renders an <a> for a direct file download (href), a router <Link> (to), or a <button> (onClick).
export default function BrochureDownloadButton({ href, to, onClick, title = "Download Brochure", compact = false, className = "" }) {
    const classes = `w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm transition-colors active:scale-95 whitespace-nowrap ${compact ? "px-3 py-2.5 rounded-lg text-sm" : "px-3 md:px-5 h-10 md:h-11 rounded-lg md:rounded-[10px] text-[13px] md:text-[15px]"} ${className}`;

    const content = (
        <>
            <Download className="w-4 h-4" strokeWidth={2.5} />
            {title}
        </>
    );

    if (href) return <a href={href} className={classes}>{content}</a>;
    if (to) return <Link to={to} className={classes}>{content}</Link>;
    return <button type="button" onClick={onClick} className={classes}>{content}</button>;
}
