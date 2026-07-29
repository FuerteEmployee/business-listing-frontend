import { NavLink, Outlet } from 'react-router-dom';
import { User, Heart, Settings, Bell, MapPin, ShieldCheck, LogOut, ChevronRight, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/homepage/Header';
import Footer from '../../components/homepage/Footer';

const menuItems = [
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Saved Listings', path: '/profile/saved', icon: Heart },
    { name: 'My Enquiries', path: '/profile/enquiries', icon: Bell },
    { name: 'Address Book', path: '/profile/addresses', icon: MapPin },
    { name: 'Account Settings', path: '/profile/settings', icon: Settings },
    { name: 'Security & Privacy', path: '/profile/security', icon: ShieldCheck },
    { name: 'Active Sessions', path: '/profile/sessions', icon: Monitor },
];

export default function ProfileLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-10">
                    
                    {/* Sidebar */}
                    <aside className="w-full lg:w-80 shrink-0">
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm sticky top-28">
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden border-2 border-orange-50">
                                        {user?.profilePhoto ? (
                                            <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-8 h-8" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.name}</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">{user?.role || 'Member'}</p>
                                    </div>
                                </div>

                                <nav className="space-y-1">
                                    {menuItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end
                                            className={({ isActive }) => 
                                                `flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all group ${
                                                    isActive 
                                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }`
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className="w-5 h-5" />
                                                {item.name}
                                            </div>
                                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 opacity-40" />
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-8 pt-0 mt-4 border-t border-slate-50">
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout Account
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-sm min-h-[600px]">
                            <Outlet />
                        </div>
                    </main>

                </div>
            </div>

            <Footer />
        </div>
    );
}
