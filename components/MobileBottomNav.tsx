'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Calendar, BookOpen, DollarSign, Settings } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'dashboard';
  const { data: session } = useSession();

  const isSubAdmin = session?.user?.role === 'SUBADMIN';

  const navItems = [
    { icon: Home, label: 'Home', view: 'dashboard' },
    { icon: Calendar, label: 'Availability', view: 'slots' },
    { icon: BookOpen, label: 'Bookings', view: 'list' },
    ...(!isSubAdmin ? [
      { icon: DollarSign, label: 'Revenue', view: 'revenue' },
      { icon: Settings, label: 'Settings', view: 'settings' },
    ] : []),
  ];

  if (pathname !== '/admin') return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex items-center justify-around h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.view;
          
          return (
            <Link
              key={item.view}
              href={`/admin?view=${item.view}`}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <div
                className={`flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div
                  className={`p-2 rounded-full transition-all ${
                    isActive ? 'bg-emerald-500/20' : ''
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
