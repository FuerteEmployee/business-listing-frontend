import React, { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    Download, 
    Bell, 
    ExternalLink, 
    MoreVertical, 
    LogOut, 
    Settings, 
    User,
    Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Loading, { Spinner, Skeleton } from '../components/ui/Loading';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';

export default function ComponentGallery() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
    };

    const dropdownItems = [
        { label: 'Profile', icon: User, onClick: () => alert('Profile clicked') },
        { label: 'Settings', icon: Settings, onClick: () => alert('Settings clicked') },
        { divider: true },
        { label: 'Logout', icon: LogOut, danger: true, onClick: () => alert('Logout clicked') }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-16 pb-24">
            <header className="space-y-4">
                <Badge variant="premium">UI Design System</Badge>
                <h1 className="text-5xl font-black text-slate-800 tracking-tight">Component Gallery</h1>
                <p className="text-lg text-slate-500 font-medium">Standardized premium UI building blocks for the Business Listing Platform.</p>
            </header>

            {/* Buttons */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800">Buttons</h2>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Variants</p>
                        <div className="flex flex-wrap gap-4">
                            <Button>Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="gradient">Gradient</Button>
                            <Button variant="success">Success</Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sizes</p>
                        <div className="flex flex-wrap items-end gap-4">
                            <Button size="sm">Small</Button>
                            <Button>Default</Button>
                            <Button size="lg">Large</Button>
                            <Button size="xl">Extra Large</Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Icons & States</p>
                        <div className="flex flex-wrap gap-4">
                            <Button leftIcon={Plus}>Add New</Button>
                            <Button variant="outline" rightIcon={ExternalLink}>View Details</Button>
                            <Button variant="secondary" size="icon"><Bell className="w-5 h-5" /></Button>
                            <Button isLoading={isLoading} onClick={handleAction}>
                                Click to Load
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Badges */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800">Status Badges</h2>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="flex flex-wrap gap-6 items-center">
                    <Badge dot>Active</Badge>
                    <Badge variant="success" dot>Approved</Badge>
                    <Badge variant="warning" dot>Pending</Badge>
                    <Badge variant="danger" dot>Terminated</Badge>
                    <Badge variant="info">New Update</Badge>
                    <Badge variant="secondary">Draft</Badge>
                    <Badge variant="premium">Featured</Badge>
                    <Badge variant="outline">Enterprise</Badge>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <Badge size="xs">XS Tag</Badge>
                    <Badge size="sm">Small Tag</Badge>
                    <Badge>Default Badge</Badge>
                    <Badge size="lg">Large Badge</Badge>
                </div>
            </section>

            {/* Loading & Skeletons */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800">Loading States</h2>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Spinners</p>
                        <div className="flex flex-wrap gap-8 items-center justify-center">
                            <Spinner size="sm" label="Small" />
                            <Spinner label="Default" />
                            <Spinner size="lg" label="Strategic Sync" />
                        </div>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Skeletons</p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Skeleton variant="avatar" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton width="40%" height="3" />
                                    <Skeleton width="20%" height="2" />
                                </div>
                            </div>
                            <Skeleton variant="card" />
                            <div className="grid grid-cols-3 gap-4">
                                <Skeleton height="8" />
                                <Skeleton height="8" />
                                <Skeleton height="8" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Alerts & Overlays */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800">Alerts & Overlays</h2>
                    <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Alert type="success" title="Changes Saved">
                            The business listing has been successfully updated in the database.
                        </Alert>
                        <Alert type="info" title="Pro Tip">
                            Use high-quality images to increase listing conversion by up to 40%.
                        </Alert>
                        <Alert type="warning" title="Moderation Pending">
                            Your recent changes are waiting for administrative approval.
                        </Alert>
                        <Alert type="error" title="Critical Failure" onClose={() => {}}>
                            Could not connect to the authentication server. Please try again.
                        </Alert>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-8">
                         <div className="space-y-4 w-full">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Interactive Overlays</p>
                            <div className="flex justify-center gap-4">
                                <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                                    Launch Modal
                                </Button>
                                <Dropdown 
                                    items={dropdownItems}
                                    trigger={
                                        <Button variant="outline" rightIcon={ChevronDown}>
                                            Account Actions
                                        </Button>
                                    }
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </section>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title="System Configuration"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => setIsModalOpen(false)}>Save Changes</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <Alert type="info">Review your preferences before confirming the final deployment.</Alert>
                    <div className="space-y-4">
                        <h4 className="font-black text-slate-800">Security Settings</h4>
                        <p className="text-sm text-slate-500 font-medium">Any changes made here will be logged in the global audit trail and may require multi-factor authentication for verification.</p>
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge variant="success">Enabled</Badge>
                                <span className="text-sm font-bold text-slate-700">Two-Factor Authentication</span>
                            </div>
                            <Button size="sm" variant="outline">Configure</Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

const ChevronDown = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m6 9 6 6 6-6"/>
    </svg>
);
