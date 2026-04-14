import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isVisible: boolean;
  badge?: string;
}

export default function Sidebar({ navItems }: { navItems: NavItem[] }) {
  const visibleItems = navItems.filter(item => item.isVisible);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-1">
        {visibleItems.map((item) => {
          const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => cn(
                "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <IconComponent className={cn(
                  "h-5 w-5 transition-colors",
                  "group-hover:text-blue-400"
                )} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
