import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, User as UserIcon, LayoutDashboard, Ticket, ShieldCheck, Settings, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { dbUser, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['student', 'faculty', 'warden', 'admin', 'co_admin', 'security'] },
    { label: 'My Requests', icon: Ticket, href: '/my-requests', roles: ['student'] },
    { label: 'Clearance', icon: Ticket, href: '/clearance', roles: ['faculty', 'warden', 'admin', 'co_admin'] },
    { label: 'Gate Scan', icon: ShieldCheck, href: '/gate-scan', roles: ['security', 'admin'] },
    { label: 'Administration', icon: Settings, href: '/admin', roles: ['admin', 'co_admin'] },
    { label: 'User Directory', icon: Users, href: '/admin/users', roles: ['admin', 'co_admin'] },
    { label: 'My Profile', icon: UserIcon, href: '/profile', roles: ['student', 'faculty', 'warden', 'admin', 'co_admin', 'security'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(dbUser?.role));

  return (
    <div className="min-h-screen bg-neutral flex">
      {/* Sidebar */}
      <aside className="w-64 bg-midnight text-ivory flex flex-col border-r border-antique-gold/20 sticky top-0 h-screen">
        <div className="p-8 border-b border-ivory/10">
          <h1 className="text-2xl font-serif font-bold text-antique-gold tracking-tight leading-none">CampusGo</h1>
          <p className="text-[10px] uppercase tracking-widest text-ivory/40 mt-2">Smart Permission System</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-antique-gold text-midnight shadow-lg shadow-antique-gold/20' 
                    : 'text-ivory/60 hover:bg-ivory/5 hover:text-ivory'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ivory/10">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 mb-4 hover:bg-ivory/5 rounded-lg transition-colors group">
            <div className="w-10 h-10 rounded-full bg-antique-gold/20 flex items-center justify-center text-antique-gold font-bold overflow-hidden border border-antique-gold/30">
              {dbUser?.photoUrl ? (
                <img src={dbUser.photoUrl} alt="Me" className="w-full h-full object-cover" />
              ) : (
                dbUser?.name?.charAt(0)
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate group-hover:text-antique-gold transition-colors">{dbUser?.name}</p>
              <p className="text-[10px] text-ivory/40 uppercase truncate">{dbUser?.role.replace('_', ' ')}</p>
            </div>
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ivory/40 hover:text-crimson hover:bg-crimson/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-border-warm flex items-center justify-between px-12 sticky top-0 z-50">
          <div className="flex items-center gap-2 text-sm text-midnight/40">
            <span>Portal</span>
            <span className="text-border-warm">/</span>
            <span className="text-midnight font-semibold uppercase tracking-widest text-[10px]">{location.pathname.split('/')[1]?.replace('-', ' ')}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/profile" className="text-xs font-bold text-midnight hover:text-antique-gold transition-colors flex items-center gap-2">
               Edit Profile
               <Settings size={14} />
            </Link>
            <div className="h-8 w-px bg-border-warm"></div>

            <div className="text-right">
              <p className="text-xs font-bold text-midnight">Aditya College of Engineering</p>
              <p className="text-[10px] text-midnight/40 uppercase tracking-tighter">Madanapalle, AP</p>
            </div>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
