'use client';

import { useEffect, useState } from 'react';
import { Booking } from '@prisma/client';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday } from 'date-fns';

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  todayBookings: number;
  thisWeekBookings: number;
  thisMonthBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    todayBookings: 0,
    thisWeekBookings: 0,
    thisMonthBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, expensesRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/expenses?limit=1000'),
      ]);
      const bookingsData: Booking[] = await bookingsRes.json();
      const expensesData = await expensesRes.json();
      setBookings(bookingsData);
      // Handle both old and new API response formats
      if (expensesData.expenses && Array.isArray(expensesData.expenses)) {
        setExpenses(expensesData.expenses);
      } else if (Array.isArray(expensesData)) {
        setExpenses(expensesData);
      } else {
        setExpenses([]);
      }
      calculateStats(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setExpenses([]);
      setLoading(false);
    }
  };

  const calculateStats = (bookings: Booking[]) => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;

    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.startTime);
      return bookingDate >= todayStart && bookingDate <= todayEnd;
    }).length;

    const thisWeekBookings = bookings.filter(b => {
      const bookingDate = new Date(b.startTime);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;

    const thisMonthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.startTime);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    }).length;

    // Calculate revenue from actual booking charges
    const totalRevenue = bookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + ((b as any).charge || 500), 0);

    // Calculate occupancy rate (total slots per month = 30 days * 12 slots = 360)
    const totalSlotsThisMonth = 360;
    const occupancyRate = (thisMonthBookings / totalSlotsThisMonth) * 100;

    setStats({
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      todayBookings,
      thisWeekBookings,
      thisMonthBookings,
      totalRevenue,
      occupancyRate,
    });
  };

  const getRecentBookings = () => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getTodayUpcoming = () => {
    const now = new Date();
    return bookings
      .filter(b => {
        const bookingStart = new Date(b.startTime);
        return isToday(bookingStart) && bookingStart > now && b.status !== 'CANCELLED';
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Bookings</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBookings}</p>
              <p className="text-blue-100 text-xs mt-2">All time</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Confirmed</p>
              <p className="text-3xl font-bold mt-2">{stats.confirmedBookings}</p>
              <p className="text-emerald-100 text-xs mt-2">Active bookings</p>
            </div>
            <CheckCircle className="w-12 h-12 text-emerald-200" />
          </div>
        </div>

        {/* Pending Bookings */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-2">{stats.pendingBookings}</p>
              <p className="text-amber-100 text-xs mt-2">Needs attention</p>
            </div>
            <AlertCircle className="w-12 h-12 text-amber-200" />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Revenue</p>
              <p className="text-3xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-purple-100 text-xs mt-2">From confirmed bookings</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Expenses</p>
          <p className="text-3xl font-bold text-red-600">₹{(expenses || []).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
          <p className="text-gray-600 text-sm font-medium mb-2">Net Profit</p>
          <p className="text-3xl font-bold text-emerald-600">
            ₹{(stats.totalRevenue - (expenses || []).reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Today</p>
              <p className="text-2xl font-bold text-gray-800">{stats.todayBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">This Week</p>
              <p className="text-2xl font-bold text-gray-800">{stats.thisWeekBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">This Month</p>
              <p className="text-2xl font-bold text-gray-800">{stats.thisMonthBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Occupancy Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-6 rounded-full transition-all duration-500 flex items-center justify-center text-white text-sm font-bold"
                style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
              >
                {stats.occupancyRate.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">{stats.thisMonthBookings}</p>
            <p className="text-sm text-gray-600">/ 360 slots</p>
          </div>
        </div>
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {getRecentBookings().length > 0 ? (
              getRecentBookings().map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {format(new Date(booking.startTime), 'MMM dd, h:mm a')}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : booking.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Today's Upcoming */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Upcoming</h3>
          <div className="space-y-3">
            {getTodayUpcoming().length > 0 ? (
              getTodayUpcoming().map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">
                      {format(new Date(booking.startTime), 'h:mm a')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(booking.endTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming bookings today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
