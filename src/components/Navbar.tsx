import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { formatCurrency } from '../lib/utils';
import { LogOut, LayoutDashboard, ShieldCheck, Wallet, Menu, X, Bell, BellOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar({ userProfile, navItems }: { userProfile: any, navItems?: any[] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(localStorage.getItem('notificationsEnabled') === 'true');

  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('notificationsEnabled', newState.toString());
    
    if (newState && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" className="text-xl sm:text-2xl font-bold text-white">
            Cheap<span className="text-blue-500">SMM</span>Team
          </Link>
        </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {userProfile?.plan_type && userProfile.plan_type !== 'free' && (
              <div className={cn(
                "hidden items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border md:flex",
                userProfile.plan_type === 'silver' ? "bg-slate-400/10 text-slate-400 border-slate-400/20" :
                userProfile.plan_type === 'gold' ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                "bg-purple-400/10 text-purple-400 border-purple-400/20"
              )}>
                <LucideIcons.Crown className="h-3 w-3" />
                {userProfile.plan_type}
              </div>
            )}
            <div className="hidden items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 border border-slate-800 md:flex">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">
                {formatCurrency(userProfile?.balance || 0)}
              </span>
            </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleNotifications}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                notificationsEnabled ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
              )}
              title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
            >
              {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </button>

            {userProfile?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && navItems && (
        <div className="border-t border-slate-800 bg-slate-950 lg:hidden">
          <div className="space-y-1 p-4">
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-900 p-3 border border-slate-800">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-500">
                Balance: {formatCurrency(userProfile?.balance || 0)}
              </span>
            </div>
            {navItems.filter(i => i.isVisible).map((item) => {
              const Icon = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
