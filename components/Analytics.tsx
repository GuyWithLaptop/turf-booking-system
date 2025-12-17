'use client';

import { useEffect, useState } from 'react';
import { Booking } from '@prisma/client';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

export default function Analytics() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data: Booking[] = await response.json();
      setBookings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const getWeeklyStats = () => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => {
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.startTime);
        return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && b.status !== 'CANCELLED';
      });

      return {
        day: format(day, 'EEE'),
        count: dayBookings.length,
        revenue: dayBookings.length * 500,
      };
    });
  };

  const getTimeSlotPopularity = () => {
    const slots = Array.from({ length: 12 }, (_, i) => {
      const hour = i * 2;
      const slotBookings = bookings.filter(b => {
        const bookingHour = new Date(b.startTime).getHours();
        return bookingHour === hour && b.status !== 'CANCELLED';
      });

      return {
        time: `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}${hour < 12 ? 'AM' : 'PM'}`,
        count: slotBookings.length,
        percentage: (slotBookings.length / bookings.filter(b => b.status !== 'CANCELLED').length) * 100 || 0,
      };
    });

    return slots.sort((a, b) => b.count - a.count);
  };

  const getStatusBreakdown = () => {
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pending = bookings.filter(b => b.status === 'PENDING').length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const total = bookings.length || 1;

    return [
      { status: 'Confirmed', count: confirmed, percentage: (confirmed / total) * 100, color: 'bg-emerald-500' },
      { status: 'Pending', count: pending, percentage: (pending / total) * 100, color: 'bg-amber-500' },
      { status: 'Completed', count: completed, percentage: (completed / total) * 100, color: 'bg-blue-500' },
      { status: 'Cancelled', count: cancelled, percentage: (cancelled / total) * 100, color: 'bg-red-500' },
    ];
  };

  const getTopCustomers = () => {
    const customerBookings = new Map<string, { name: string; phone: string; count: number }>();

    bookings.forEach(booking => {
      if (booking.status !== 'CANCELLED') {
        const key = booking.customerPhone;
        if (customerBookings.has(key)) {
          customerBookings.get(key)!.count++;
        } else {
          customerBookings.set(key, {
            name: booking.customerName,
            phone: booking.customerPhone,
            count: 1,
          });
        }
      }
    });

    return Array.from(customerBookings.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  const weeklyStats = getWeeklyStats();
  const slotPopularity = getTimeSlotPopularity();
  const statusBreakdown = getStatusBreakdown();
  const topCustomers = getTopCustomers();

  return (
    <div className="space-y-6">
      {/* Weekly Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-800">Weekly Performance</h3>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {weeklyStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2">
                <div
                  className="bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-lg mx-auto"
                  style={{
                    width: '60px',
                    height: `${Math.max((stat.count / 12) * 100, 10)}px`,
                    maxHeight: '200px',
                  }}
                />
              </div>
              <p className="font-bold text-lg text-gray-800">{stat.count}</p>
              <p className="text-sm text-gray-600">{stat.day}</p>
              <p className="text-xs text-emerald-600 font-medium">₹{stat.revenue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-800">Status Breakdown</h3>
        </div>
        <div className="space-y-4">
          {statusBreakdown.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">{item.status}</span>
                <span className="text-sm text-gray-600">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${item.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slot Popularity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Most Popular Time Slots</h3>
        </div>
        <div className="space-y-3">
          {slotPopularity.slice(0, 6).map((slot, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold rounded-lg">
                #{index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">{slot.time}</span>
                  <span className="text-sm text-gray-600">{slot.count} bookings</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${slot.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">{slot.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Top Customers</h3>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold rounded-full">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">{customer.count}</p>
                <p className="text-xs text-gray-600">bookings</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
