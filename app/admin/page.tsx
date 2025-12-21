'use client';

import { useEffect, useState, Suspense } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import TimeSlotBooking from '@/components/TimeSlotBooking';
import BookingsList from '@/components/BookingsList';
import Dashboard from '@/components/Dashboard';
import Analytics from '@/components/Analytics';
import ExpensesManagement from '@/components/ExpensesManagement';
import RecurringBookingsView from '@/components/RecurringBookingsView';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileDashboard from '@/components/MobileDashboard';
import MobileAvailabilityCalendar from '@/components/MobileAvailabilityCalendar';
import MobileBookingsList from '@/components/MobileBookingsList';
import MobileRevenue from '@/components/MobileRevenue';
import MobileSettings from '@/components/MobileSettings';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, List, LayoutDashboard, BarChart3, Receipt, Repeat } from 'lucide-react';

function AdminContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const [view, setView] = useState<'dashboard' | 'slots' | 'list' | 'analytics' | 'expenses' | 'recurring' | 'revenue' | 'settings'>(
    (viewParam as any) || 'dashboard'
  );

  useEffect(() => {
    if (viewParam) {
      setView(viewParam as any);
    }
  }, [viewParam]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Desktop Only */}
      <header className="hidden lg:block bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-700">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {session.user?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={view === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('dashboard')}
                  className="gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button
                  variant={view === 'slots' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('slots')}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Slots
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
                <Button
                  variant={view === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('analytics')}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
                <Button
                  variant={view === 'expenses' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('expenses')}
                  className="gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Expenses
                </Button>
                <Button
                  variant={view === 'recurring' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('recurring')}
                  className="gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  Recurring
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Desktop Content */}
        <div className="hidden lg:block">
          {view === 'dashboard' ? (
            <Dashboard />
          ) : view === 'slots' ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <TimeSlotBooking />
            </div>
          ) : view === 'list' ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  All Bookings
                </h2>
                <p className="text-gray-600 text-sm">
                  View and manage all bookings in a detailed list
                </p>
              </div>
              <BookingsList />
            </div>
          ) : view === 'recurring' ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <RecurringBookingsView />
            </div>
          ) : view === 'analytics' ? (
            <Analytics />
          ) : (
            <ExpensesManagement />
          )}
        </div>

        {/* Mobile Content */}
        <div className="lg:hidden">
          {view === 'dashboard' ? (
            <MobileDashboard />
          ) : view === 'slots' ? (
            <MobileAvailabilityCalendar />
          ) : view === 'list' ? (
            <MobileBookingsList />
          ) : view === 'revenue' ? (
            <MobileRevenue />
          ) : view === 'settings' ? (
            <MobileSettings />
          ) : view === 'recurring' ? (
            <div className="pb-24 px-4 pt-6">
              <RecurringBookingsView />
            </div>
          ) : view === 'analytics' ? (
            <div className="pb-24 px-4 pt-6">
              <Analytics />
            </div>
          ) : (
            <div className="pb-24 px-4 pt-6">
              <ExpensesManagement />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}
