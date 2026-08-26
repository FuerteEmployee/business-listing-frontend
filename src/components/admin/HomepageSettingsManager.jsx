import React, { useState, useEffect } from 'react';
import { 
    Layout, Search, TrendingUp, Sparkles, 
    Image as ImageIcon, Plus, Trash2, Edit2, 
    Save, Eye, EyeOff, GripVertical, CheckCircle, Zap,
    Utensils, Hotel, HeartPulse, Dumbbell, BookOpen, CreditCard, ShoppingBag, ShoppingCart,
    Facebook, Twitter, Instagram, Linkedin, Youtube
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import SliderManagement from './SliderManagement';
import Modal from '../ui/Modal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const ICON_OPTIONS = [
    { label: 'Restaurant', value: 'Utensils', icon: Utensils },
    { label: 'Hotel', value: 'Hotel', icon: Hotel },
    { label: 'Health', value: 'HeartPulse', icon: HeartPulse },
    { label: 'Gym', value: 'Dumbbell', icon: Dumbbell },
    { label: 'Education', value: 'BookOpen', icon: BookOpen },
    { label: 'Payment', value: 'CreditCard', icon: CreditCard },
    { label: 'Beauty', value: 'Sparkles', icon: Sparkles },
    { label: 'Shopping', value: 'ShoppingBag', icon: ShoppingBag },
    { label: 'Cart', value: 'ShoppingCart', icon: ShoppingCart },
];

const COLOR_OPTIONS = [
    { label: 'Blue', value: 'border-blue-100 text-blue-600 bg-blue-50/30' },
    { label: 'Indigo', value: 'border-indigo-100 text-indigo-600 bg-indigo-50/30' },
    { label: 'Rose', value: 'border-rose-100 text-rose-600 bg-rose-50/30' },
    { label: 'Emerald', value: 'border-emerald-100 text-emerald-600 bg-emerald-50/30' },
    { label: 'Amber', value: 'border-amber-100 text-amber-600 bg-amber-50/30' },
    { label: 'Purple', value: 'border-purple-100 text-purple-600 bg-purple-50/30' },
    { label: 'Sky', value: 'border-sky-100 text-sky-600 bg-sky-50/30' },
];

export default function HomepageSettingsManager({ settings, onSave }) {
    const [localSettings, setLocalSettings] = useState(settings?.homepage || {
        showHero: true,
        showRecentlyViewed: true,
        showBanners: true,
        showCategories: true,
        showDiscovery: true,
        showAds: true,
        showFeatured: true,
        showPopular: true,
        showLatest: true,
        showReviews: true,
        showCTA: true,
        showMobileApp: true,
        showFooter: true,
        footerText: "",
        footerSections: [],
        heroTaglinePrefix: "",
        heroTaglineSuffix: "",
        countSource: "dynamic",
        fixedCount: "",
        searchPlaceholder: "",
        trendingSearches: [],
        discoveryChips: [],
        socialLinks: [
            { platform: 'Instagram', url: '', icon: 'Instagram' },
            { platform: 'Facebook', url: '', icon: 'Facebook' },
            { platform: 'Linkedin', url: '', icon: 'Linkedin' },
            { platform: 'Youtube', url: '', icon: 'Youtube' }
        ]
    });

    const [isSaving, setIsSaving] = useState(false);
    const [subTab, setSubTab] = useState('layout'); // 'layout', 'search', 'discovery', 'sliders'
    
    // Quick Search Input State
    const [newTrending, setNewTrending] = useState('');
    
    // Discovery Chip Modal State
    const [isChipModalOpen, setIsChipModalOpen] = useState(false);
    const [editingChip, setEditingChip] = useState(null);
    const [chipForm, setChipForm] = useState({
        name: '',
        slug: '',
        icon: 'ShoppingCart',
        color: COLOR_OPTIONS[0].value
    });

    // Footer Edit Modal State
    const [isFooterEditOpen, setIsFooterEditOpen] = useState(false);
    const [editingFooterSectionId, setEditingFooterSectionId] = useState(null);
    const [editingLinkIdx, setEditingLinkIdx] = useState(null);
    const [footerEditForm, setFooterEditForm] = useState({
        sectionTitle: '',
        linkLabel: '',
        linkUrl: ''
    });

    useEffect(() => {
        if (settings?.homepage) {
            setLocalSettings(prev => {
                const sectionsFromAPI = settings.homepage.footerSections;
                const hasAPISections = Array.isArray(sectionsFromAPI) && sectionsFromAPI.length > 0;
                const socialLinksFromAPI = settings.homepage.socialLinks;
                const hasSocialLinks = Array.isArray(socialLinksFromAPI) && socialLinksFromAPI.length > 0;
                
                const updated = {
                    ...prev,
                    ...settings.homepage,
                    showFooter: settings.homepage.showFooter ?? settings.showFooter ?? prev.showFooter,
                    footerText: settings.homepage.footerText ?? settings.footerText ?? prev.footerText,
                    footerSections: hasAPISections ? sectionsFromAPI : (prev.footerSections || []),
                    // discoveryChipSchema sets `_id: false` and identifies chips by `id`, so chips
                    // saved before that was honoured come back with no identifier at all - and an
                    // undefined-vs-undefined comparison made a single delete match every chip.
                    // Backfill a stable id on load so each chip is individually addressable.
                    discoveryChips: (settings.homepage.discoveryChips || prev.discoveryChips || [])
                        .map((chip, idx) => ({ ...chip, id: chip.id || `chip-${idx}-${chip.slug || 'unnamed'}` })),
                    socialLinks: hasSocialLinks ? socialLinksFromAPI : (prev.socialLinks || [
                        { platform: 'Instagram', url: '', icon: 'Instagram' },
                        { platform: 'Facebook', url: '', icon: 'Facebook' },
                        { platform: 'Linkedin', url: '', icon: 'Linkedin' },
                        { platform: 'Youtube', url: '', icon: 'Youtube' }
                    ])
                };
                return updated;
            });
        }
    }, [settings]);

    const handleToggle = (key) => {
        setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const addTrending = () => {
        if (newTrending.trim()) {
            setLocalSettings(prev => ({
                ...prev,
                trendingSearches: [...(prev.trendingSearches || []), newTrending.trim()]
            }));
            setNewTrending('');
        }
    };

    const removeTrending = (index) => {
        setLocalSettings(prev => ({
            ...prev,
            trendingSearches: prev.trendingSearches.filter((_, i) => i !== index)
        }));
    };

    const openChipModal = (chip = null) => {
        if (chip) {
            setEditingChip(chip);
            setChipForm({ ...chip });
        } else {
            setEditingChip(null);
            setChipForm({
                name: '',
                slug: '',
                icon: 'ShoppingCart',
                color: COLOR_OPTIONS[0].value
            });
        }
        setIsChipModalOpen(true);
    };

    const saveChip = () => {
        if (!chipForm.name || !chipForm.slug) {
            toast.error("Name and Slug are required");
            return;
        }

        const chips = [...(localSettings.discoveryChips || [])];
        if (editingChip) {
            const index = chips.findIndex(c => c.id === editingChip.id);
            if (index !== -1) {
                chips[index] = { ...chipForm, id: editingChip.id };
            }
        } else {
            chips.push({ ...chipForm, id: Date.now().toString() });
        }

        setLocalSettings(prev => ({ ...prev, discoveryChips: chips }));
        setIsChipModalOpen(false);
    };

    const removeChip = (id) => {
        if (!id) return;
        setLocalSettings(prev => ({
            ...prev,
            discoveryChips: (prev.discoveryChips || []).filter(c => c.id !== id)
        }));
    };

    // Footer Section Edit Handlers
    const openFooterEditModal = (sectionId, linkIdx = null) => {
        const section = localSettings.footerSections.find(s => s.id === sectionId);
        if (!section) return;

        if (linkIdx !== null) {
            // Edit link
            const link = section.links[linkIdx];
            setFooterEditForm({
                sectionTitle: '',
                linkLabel: link.label,
                linkUrl: link.url
            });
        } else {
            // Edit section title
            setFooterEditForm({
                sectionTitle: section.title,
                linkLabel: '',
                linkUrl: ''
            });
        }
        setEditingFooterSectionId(sectionId);
        setEditingLinkIdx(linkIdx);
        setIsFooterEditOpen(true);
    };

    const saveFooterEdit = () => {
        const newSections = [...localSettings.footerSections];
        const sectionIdx = newSections.findIndex(s => s.id === editingFooterSectionId);
        
        if (editingLinkIdx !== null) {
            // Save/Add link edit
            if (!footerEditForm.linkLabel.trim() || !footerEditForm.linkUrl.trim()) {
                toast.error("Link label and URL are required");
                return;
            }

            const linkData = {
                label: footerEditForm.linkLabel,
                url: footerEditForm.linkUrl,
                type: footerEditForm.linkUrl.startsWith('/') ? 'internal' : 'external'
            };

            if (editingLinkIdx === -1) {
                // ADDING NEW LINK
                newSections[sectionIdx].links = [...(newSections[sectionIdx].links || []), linkData];
            } else {
                // EDITING EXISTING LINK
                newSections[sectionIdx].links[editingLinkIdx] = linkData;
            }
        } else {
            // Save section title edit
            if (!footerEditForm.sectionTitle.trim()) {
                toast.error("Section title is required");
                return;
            }
            newSections[sectionIdx].title = footerEditForm.sectionTitle;
        }

        setLocalSettings(prev => ({ ...prev, footerSections: newSections }));
        setIsFooterEditOpen(false);
        toast.success(editingLinkIdx === -1 ? "Link added" : "Footer updated");
    };

    const addFooterSection = () => {
        const id = `section-${Date.now()}`;
        const newSection = {
            id,
            title: 'New Section',
            links: []
        };
        setLocalSettings(prev => ({
            ...prev,
            footerSections: [...(prev.footerSections || []), newSection]
        }));
        toast.success("Section added");
    };

    const openAddLinkModal = (sectionId) => {
        setEditingFooterSectionId(sectionId);
        setEditingLinkIdx(-1); // -1 means adding a new link
        setFooterEditForm({
            sectionTitle: '',
            linkLabel: '',
            linkUrl: ''
        });
        setIsFooterEditOpen(true);
    };

    const handleGlobalSave = async () => {
        setIsSaving(true);
        try {
            // Validate social links before saving
            const validSocialLinks = (localSettings.socialLinks || []).filter(link => {
                // Allow empty URLs (user may not have all platforms)
                if (!link.url) return true;
                
                // Validate URL format if URL is provided
                try {
                    new URL(link.url);
                    console.log(`✅ Valid URL for ${link.platform}:`, link.url);
                    return true;
                } catch (e) {
                    console.warn(`⚠️ Invalid URL for ${link.platform}:`, link.url);
                    toast.error(`Invalid URL for ${link.platform}`);
                    return false;
                }
            });

            // Show warning if any links were invalid
            if (validSocialLinks.length < (localSettings.socialLinks || []).length) {
                setIsSaving(false);
                return;
            }

            const dataToSave = { 
                ...settings, 
                homepage: {
                    ...localSettings,
                    socialLinks: validSocialLinks
                }
            };
            
            console.log("📤 Sending to API:", JSON.stringify(dataToSave, null, 2));
            
            // Backup to localStorage
            localStorage.setItem('homepage_settings_backup', JSON.stringify(localSettings));
            console.log("💾 Backed up to localStorage:", localSettings);
            
            await onSave(dataToSave);
            toast.success("✓ Homepage settings saved successfully!");
        } catch (err) {
            console.error("❌ Save error:", err);
            toast.error("Failed to save settings: " + (err.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSocialLinkChange = (index, field, value) => {
        const newSocialLinks = [...(localSettings.socialLinks || [])];
        newSocialLinks[index][field] = value;
        console.log(`🔗 Social link change [${index}].${field}:`, value);
        console.log("🔗 Updated social links array:", newSocialLinks);
        setLocalSettings(prev => ({
            ...prev,
            socialLinks: newSocialLinks
        }));
    };

    const sections = [
        { key: 'showHero', label: 'Primary Hero Search', icon: Search },
        { key: 'showRecentlyViewed', label: 'Recently Viewed History', icon: Sparkles },
        { key: 'showBanners', label: 'Hero Promotion Sliders', icon: ImageIcon },
        { key: 'showCategories', label: 'Main Category Taxonomy', icon: Layout },
        { key: 'showDiscovery', label: 'Quick Discovery Chips', icon: Zap },
        { key: 'showAds', label: 'Dynamic Ad Placements', icon: ImageIcon },
        { key: 'showFeatured', label: 'Featured Business Cluster', icon: Sparkles },
        { key: 'showPopular', label: 'Popular Search Tags', icon: TrendingUp },
        { key: 'showLatest', label: 'Recent Market Entries', icon: Plus },
        { key: 'showReviews', label: 'Public Review Feed', icon: Sparkles },
        { key: 'showCTA', label: 'Merchant Onboarding CTA', icon: Layout },
        { key: 'showMobileApp', label: 'Application Ecosystem Promotion', icon: Layout },
        { key: 'showFooter', label: 'Footer Section', icon: Layout },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
                    <div className="flex min-w-max">
                        {[
                            { id: 'layout', label: 'Section Visibility', icon: Layout },
                            { id: 'search', label: 'Search & Tagline', icon: Search },
                            { id: 'discovery', label: 'Discovery Chips', icon: Zap },
                            { id: 'sliders', label: 'Hero Banners', icon: ImageIcon },
                            { id: 'footer', label: 'Footer Content', icon: Layout },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSubTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                    subTab === tab.id 
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <Button 
                    variant="primary" 
                    icon={Save} 
                    isLoading={isSaving}
                    onClick={handleGlobalSave}
                    className="w-full sm:w-auto px-8"
                >
                    Deploy Config
                </Button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {/* 1. SECTION VISIBILITY */}
                {subTab === 'layout' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {sections.map(section => (
                                <div 
                                    key={section.key}
                                className={`group p-5 rounded-[2rem] border transition-all cursor-pointer ${
                                    localSettings[section.key] 
                                    ? 'bg-white border-slate-200 shadow-md hover:shadow-lg' 
                                    : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60 grayscale'
                                }`}
                                onClick={() => handleToggle(section.key)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                        localSettings[section.key] ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'
                                    }`}>
                                        <section.icon className="w-6 h-6" />
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-colors ${
                                        localSettings[section.key] ? 'bg-indigo-500' : 'bg-slate-300'
                                    }`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                            localSettings[section.key] ? 'left-7 shadow-md' : 'left-1'
                                        }`} />
                                    </div>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">{section.label}</h4>
                                <p className="text-[10px] font-bold text-slate-400 italic">
                                    {localSettings[section.key] ? 'VISIBLE ON HOMEPAGE' : 'HIDDEN FROM PUBLIC'}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">Footer Content</h3>
                        <p className="text-xs text-slate-500 mb-4">Customize the footer text that appears across the public UI.</p>
                        <textarea
                            name="footerText"
                            value={localSettings.footerText || ''}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, footerText: e.target.value }))}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="© 2026 Your Company. All rights reserved."
                        />
                    </div>
                    </>
                )}

                {/* 2. SEARCH & TAGLINE */}
                {subTab === 'search' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-3xl">
                        {/* Hero Tagline Section */}
                        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Search className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Hero Tagline Protocol</h3>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Configure the primary resonance headline</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput 
                                    label="Prefix Text"
                                    name="heroTaglinePrefix"
                                    value={localSettings.heroTaglinePrefix}
                                    onChange={handleInputChange}
                                />
                                <FormInput 
                                    label="Suffix Text"
                                    name="heroTaglineSuffix"
                                    value={localSettings.heroTaglineSuffix}
                                    onChange={handleInputChange}
                                />
                                <FormSelect 
                                    label="Business Count Source"
                                    name="countSource"
                                    value={localSettings.countSource}
                                    onChange={handleInputChange}
                                    options={[
                                        { label: 'Dynamic (Live DB Total)', value: 'dynamic' },
                                        { label: 'Fixed (Manual Override)', value: 'fixed' }
                                    ]}
                                />
                                {localSettings.countSource === 'fixed' && (
                                    <FormInput 
                                        label="Manual Count Text"
                                        name="fixedCount"
                                        value={localSettings.fixedCount}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 5.9 Crore+"
                                    />
                                )}
                            </div>
                            
                            <div className="pt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-hidden">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Live Preview:</div>
                                <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate">
                                    {localSettings.heroTaglinePrefix}
                                    <span className="text-blue-600 mx-1">{localSettings.countSource === 'dynamic' ? 'Loading...' : localSettings.fixedCount || 'N/A'}</span>
                                    {localSettings.heroTaglineSuffix}
                                </h1>
                            </div>
                        </div>

                        {/* Search Input Customization */}
                        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Layout className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Search Box Interface</h3>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Customize input placeholder and trending tags</p>
                                </div>
                            </div>

                            <FormInput 
                                label="Placeholder Text"
                                name="searchPlaceholder"
                                value={localSettings.searchPlaceholder}
                                onChange={handleInputChange}
                                placeholder="Search for Spa & Salons..."
                            />

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex justify-between">
                                    Trending Suggestions <span>{(localSettings.trendingSearches || []).length} items</span>
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newTrending}
                                        onChange={(e) => setNewTrending(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTrending()}
                                        placeholder="Add suggested keyword..."
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    />
                                    <button 
                                        onClick={addTrending}
                                        className="bg-indigo-600 text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-colors"
                                    >
                                        Inject
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {(localSettings.trendingSearches || []).map((term, i) => (
                                        <Badge 
                                            key={i} 
                                            variant="secondary" 
                                            className="px-3 py-1.5 flex items-center gap-2 group"
                                        >
                                            <TrendingUp className="w-3 h-3 text-orange-500" />
                                            {term}
                                            <button 
                                                onClick={() => removeTrending(i)}
                                                className="hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {(!localSettings.trendingSearches || localSettings.trendingSearches.length === 0) && (
                                        <div className="w-full text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                            Zero suggested keywords active
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. DISCOVERY CHIPS */}
                {subTab === 'discovery' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl">
                                        <Zap className="w-5 h-5 transition-transform group-hover:scale-125" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Quick Discovery Hub</h3>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Manage manual shortcut chips shown in the 'Near Me' cluster</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="primary" 
                                    icon={Plus} 
                                    onClick={() => openChipModal()}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    Initialize Chip
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(localSettings.discoveryChips || []).map(chip => {
                                    const IconComp = ICON_MAP[chip.icon] || ShoppingCart;
                                    return (
                                        <div
                                            key={chip.id}
                                            className="group flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${chip.color} shadow-sm shrink-0`}>
                                                    <IconComp className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{chip.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 italic truncate opacity-70">via /{chip.slug}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openChipModal(chip)}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => removeChip(chip.id)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!localSettings.discoveryChips || localSettings.discoveryChips.length === 0) && (
                                    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                        <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Manual Discovery Sequence Null</h3>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Initialize your first shortcut chip to customize the homepage interface</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. HERO BANNERS */}
                {subTab === 'sliders' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <SliderManagement />
                    </div>
                )}

                {/* 5. FOOTER CONTENT */}
                {subTab === 'footer' && (
                    <div className="space-y-6 max-w-4xl animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Footer Sections</h3>
                                    <p className="text-xs text-slate-500">Manage the navigation columns displayed in the footer.</p>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    icon={Plus}
                                    onClick={addFooterSection}
                                    className="w-full sm:w-auto"
                                >
                                    Add Section
                                </Button>
                            </div>
                            
                            <div className="space-y-6">
                                {(localSettings.footerSections || []).map((section) => (
                                    <div key={section.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-800">{section.title}</h4>
                                                    <button 
                                                        onClick={() => openFooterEditModal(section.id)}
                                                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                                        title="Edit section title"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{section.links?.length || 0} links</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setLocalSettings(prev => ({
                                                        ...prev,
                                                        footerSections: prev.footerSections.filter(s => s.id !== section.id)
                                                    }));
                                                }}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                title="Delete section"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {section.links?.map((link, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                        <span className="text-xs font-bold text-slate-500 shrink-0">{link.label}</span>
                                                        <span className="text-xs text-slate-400 hidden sm:inline">→</span>
                                                        <span className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[170px] sm:max-w-[280px] block" title={link.url}>
                                                            {link.url}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => openFooterEditModal(section.id, idx)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                            title="Edit link"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const newSections = [...localSettings.footerSections];
                                                                const sectionIdx = newSections.findIndex(s => s.id === section.id);
                                                                newSections[sectionIdx].links = newSections[sectionIdx].links.filter((l, i) => i !== idx);
                                                                setLocalSettings(prev => ({ ...prev, footerSections: newSections }));
                                                            }}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                                            title="Delete link"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                onClick={() => openAddLinkModal(section.id)}
                                                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-black text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-3 h-3" />
                                                ADD NEW LINK
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Social Media Links</h3>
                                    <p className="text-xs text-slate-500">Manage social media profile URLs displayed in the footer.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {(localSettings.socialLinks || []).map((social, idx) => {
                                    // Validate URL for visual feedback
                                    let urlStatus = 'empty';
                                    if (social.url) {
                                        try {
                                            new URL(social.url);
                                            urlStatus = 'valid';
                                        } catch (e) {
                                            urlStatus = 'invalid';
                                        }
                                    }
                                    
                                    return (
                                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                                            urlStatus === 'valid' 
                                                ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' 
                                                : urlStatus === 'invalid'
                                                ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                                                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                                        }`}>
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                {social.icon === 'Facebook' && <Facebook className="w-5 h-5" />}
                                                {social.icon === 'Instagram' && <Instagram className="w-5 h-5" />}
                                                {social.icon === 'Linkedin' && <Linkedin className="w-5 h-5" />}
                                                {social.icon === 'Youtube' && <Youtube className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{social.platform}</label>
                                                <input 
                                                    type="url"
                                                    value={social.url}
                                                    onChange={(e) => handleSocialLinkChange(idx, 'url', e.target.value)}
                                                    placeholder={`https://www.${social.platform.toLowerCase()}.com/yourprofile`}
                                                    className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 transition-all outline-none ${
                                                        urlStatus === 'valid'
                                                            ? 'bg-white border-emerald-300 text-emerald-900 focus:ring-emerald-500'
                                                            : urlStatus === 'invalid'
                                                            ? 'bg-white border-rose-300 text-rose-900 focus:ring-rose-500'
                                                            : 'bg-white border-slate-100 focus:ring-indigo-500'
                                                    }`}
                                                />
                                                {urlStatus === 'invalid' && (
                                                    <p className="text-[10px] text-rose-600 mt-1 font-medium">⚠️ Invalid URL format</p>
                                                )}
                                                {urlStatus === 'valid' && (
                                                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">✓ Valid URL</p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setLocalSettings(prev => ({
                                                        ...prev,
                                                        socialLinks: prev.socialLinks.filter((_, i) => i !== idx)
                                                    }));
                                                    toast.success("Social link removed");
                                                }}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                                title="Delete social link"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                                {(!localSettings.socialLinks || localSettings.socialLinks.length === 0) && (
                                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No social links configured</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chip Management Modal */}
            <Modal
                isOpen={isChipModalOpen}
                onClose={() => setIsChipModalOpen(false)}
                title={editingChip ? "Refine Discovery Chip" : "Initialize Shortcut Chip"}
                subtitle="Specify category mapping and visual aesthetic"
                icon={Zap}
                footer={
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setIsChipModalOpen(false)} className="w-full sm:w-auto">Cancel Protocol</Button>
                        <Button variant="primary" onClick={saveChip} icon={CheckCircle} className="w-full sm:w-auto">Confirm Chip</Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput 
                            label="Visible Label"
                            value={chipForm.name}
                            onChange={(e) => setChipForm({...chipForm, name: e.target.value})}
                            placeholder="e.g. Restaurants"
                        />
                        <FormInput 
                            label="Category Slug"
                            value={chipForm.slug}
                            onChange={(e) => setChipForm({...chipForm, slug: e.target.value})}
                            placeholder="e.g. restaurants"
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Vector Integration (Icon)</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {ICON_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setChipForm({...chipForm, icon: opt.value})}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                                        chipForm.icon === opt.value 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' 
                                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <opt.icon className="w-5 h-5" />
                                    <span className="text-[9px] font-black uppercase tracking-tight">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aesthetic Palette (Color Scheme)</label>
                        <div className="flex flex-wrap gap-3">
                            {COLOR_OPTIONS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => setChipForm({...chipForm, color: color.value})}
                                    className={`group relative w-10 h-10 rounded-full border-2 transition-all ${
                                        chipForm.color === color.value 
                                        ? 'scale-110 border-slate-900 shadow-md' 
                                        : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ background: color.value.split(' ')[2].replace('bg-', '') }} // Simple hack to preview color
                                >
                                    <div className={`absolute inset-0.5 rounded-full ${color.value}`} />
                                    {chipForm.color === color.value && (
                                        <CheckCircle className="absolute -top-1.5 -right-1.5 w-4 h-4 text-slate-900 fill-white" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Preview:</div>
                        <div className={`flex items-center gap-2 px-6 py-3 rounded-full border font-black text-xs ${chipForm.color}`}>
                            {React.createElement(ICON_MAP[chipForm.icon] || ShoppingCart, { className: 'w-4 h-4' })}
                            {chipForm.name || 'Undefined Entity'} Near Me
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Footer Edit Modal */}
            <Modal
                isOpen={isFooterEditOpen}
                onClose={() => setIsFooterEditOpen(false)}
                title={editingLinkIdx !== null ? "Edit Footer Link" : "Edit Section Title"}
                subtitle={editingLinkIdx !== null ? "Update the link label and URL" : "Update the section header"}
                icon={Edit2}
                footer={
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setIsFooterEditOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                        <Button variant="primary" onClick={saveFooterEdit} icon={CheckCircle} className="w-full sm:w-auto">Save Changes</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {editingLinkIdx !== null ? (
                        <>
                            <FormInput 
                                label="Link Label"
                                value={footerEditForm.linkLabel}
                                onChange={(e) => setFooterEditForm({...footerEditForm, linkLabel: e.target.value})}
                                placeholder="e.g. Home"
                            />
                            <FormInput 
                                label="Link URL"
                                value={footerEditForm.linkUrl}
                                onChange={(e) => setFooterEditForm({...footerEditForm, linkUrl: e.target.value})}
                                placeholder="e.g. / or https://example.com"
                            />
                        </>
                    ) : (
                        <FormInput 
                            label="Section Title"
                            value={footerEditForm.sectionTitle}
                            onChange={(e) => setFooterEditForm({...footerEditForm, sectionTitle: e.target.value})}
                            placeholder="e.g. Quick Links"
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}

const ICON_MAP = {
    'Utensils': Utensils,
    'Hotel': Hotel,
    'HeartPulse': HeartPulse,
    'Dumbbell': Dumbbell,
    'BookOpen': BookOpen,
    'CreditCard': CreditCard,
    'Sparkles': Sparkles,
    'ShoppingBag': ShoppingBag,
    'ShoppingCart': ShoppingCart
};
