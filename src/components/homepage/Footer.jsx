import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

export default function Footer() {
    const { settings } = useTheme();

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
                            <p className="text-sm leading-relaxed">
                                Your trusted business directory platform for discovering and listing services.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                                <li><Link to="/free-listing" className="hover:text-white transition-colors">List Business</Link></li>
                                <li><Link to="/search" className="hover:text-white transition-colors">Search Businesses</Link></li>
                                <li><Link to="/advertise" className="hover:text-white transition-colors">Advertise With Us</Link></li>
                            </ul>
                        </div>

                        {/* Popular */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Popular</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>Industrial Products</li>
                                <li>Machine Tools</li>
                                <li>Automation & Robotics</li>
                                <li>Construction Machinery</li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>About Us</li>
                                <li>Contact Us</li>
                                <li>Terms of Service</li>
                                <li>Privacy Policy</li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Contact</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <a href="mailto:info@engitechexpo.com" className="hover:text-orange-400 transition-colors">
                                        info@engitechexpo.com
                                    </a>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <a href="tel:+919601945255" className="hover:text-orange-400 transition-colors">
                                        +91 96019 45255
                                    </a>
                                </li>
                                <li className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <span>Delhi, India</span>
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
                            Copyright © 2026 All rights reserved by Engitech | Designed & Developed by Fuerte Developers |
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                                title="Instagram"
                            >
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                                title="Facebook"
                            >
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                                title="Linkedin"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                                title="Youtube"
                            >
                                <Youtube className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

