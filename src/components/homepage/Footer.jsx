import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

export default function Footer() {
    const { settings } = useTheme();
    const currentYear = new Date().getFullYear();
    
    console.log("🔗 Footer received settings:", settings);
    console.log("🔗 Social links from API:", settings?.homepage?.socialLinks);
    
    // Fallback to localStorage if API doesn't have social links
    let socialLinks = settings?.homepage?.socialLinks;
    if (!socialLinks || socialLinks.length === 0) {
        const backup = localStorage.getItem('homepage_settings_backup');
        if (backup) {
            try {
                const parsed = JSON.parse(backup);
                socialLinks = parsed.socialLinks;
                console.log("🔗 Using social links from localStorage:", socialLinks);
            } catch(e) {
                console.error("Error parsing localStorage backup:", e);
            }
        }
    }

    const showFooter = settings?.homepage?.showFooter ?? settings?.showFooter ?? true;
    if (!showFooter) {
        return null;
    }

    const footerSections = settings?.homepage?.footerSections || [];
    const brandDescription = settings?.homepage?.brandDescription || 'Your trusted business directory platform for discovering and listing services.';

    return (
        <footer className="bg-slate-900 text-slate-300">
            {/* Main Footer */}
            <div className="border-b border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
                        {/* Brand */}
                        <div className="space-y-4">
                            <Link to="/" className="flex items-center gap-2 inline-block">
                                <Logo 
                                    settings={settings} 
                                    className="h-8" 
                                    imgClassName="max-w-[150px] object-contain opacity-90 hover:opacity-100 transition-opacity"
                                    fallbackClassName="font-bold text-lg text-white"
                                />
                            </Link>
                            <p className="text-sm">
                                {brandDescription}
                            </p>
                        </div>

                        {/* Dynamic Footer Sections */}
                        {footerSections.map(section => (
                            <div key={section.id}>
                                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                                <ul className="space-y-2 text-sm">
                                    {section.links && section.links.map((link, idx) => (
                                        <li key={idx}>
                                            {link.type === 'internal' ? (
                                                <Link to={link.url} className="hover:text-orange-400 transition-colors">
                                                    {link.label}
                                                </Link>
                                            ) : (
                                                <a href={link.url} className="hover:text-orange-400 transition-colors">
                                                    {link.label}
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Contact Section (Always Show) */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Contact</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <a href={`mailto:${settings?.contactEmail || 'support@fuerte.com'}`} className="hover:text-orange-400 transition-colors">
                                        {settings?.contactEmail || 'support@fuerte.com'}
                                    </a>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <a href={`tel:${settings?.contactPhone || '+91-1234567890'}`} className="hover:text-orange-400 transition-colors">
                                        {settings?.contactPhone || '+91-1234567890'}
                                    </a>
                                </li>
                                <li className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <span>{settings?.addressLocation || 'Delhi, India'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Copyright */}
                        <p className="text-sm text-slate-400">
                            {settings?.homepage?.footerText
                                ? settings.homepage.footerText.replace(/\d{4}/, currentYear)
                                : settings?.footerText
                                ? settings.footerText.replace(/\d{4}/, currentYear)
                                : `© ${currentYear} ${settings?.siteName || 'Fuerte Developers'}. All rights reserved. | Built with ❤️ for businesses and customers`}
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4">
                            {(socialLinks || []).map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url || "#"}
                                    target={social.url ? "_blank" : "_self"}
                                    rel={social.url ? "noopener noreferrer" : ""}
                                    className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                                    title={social.platform}
                                >
                                    {social.icon === 'Facebook' && <Facebook className="w-4 h-4" />}
                                    {social.icon === 'Instagram' && <Instagram className="w-4 h-4" />}
                                    {social.icon === 'Linkedin' && <Linkedin className="w-4 h-4" />}
                                    {social.icon === 'Youtube' && <Youtube className="w-4 h-4" />}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
