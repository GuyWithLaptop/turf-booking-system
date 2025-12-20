'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { format, startOfDay, isSameDay } from 'date-fns';

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  charge: number;
  notes?: string;
};

type DailyRevenue = {
  date: string;
  advance: number;
  paid: number;
  total: number;
};

export default function MobileRevenue() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate last 7 days revenue grouped by date
  const last7DaysRevenue: DailyRevenue[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.startTime);
    return bookingDate >= sevenDaysAgo && b.status !== 'CANCELLED';
  });

  // Group by date
  const bookingsByDate = recentBookings.reduce((acc, booking) => {
    const dateKey = format(new Date(booking.startTime), 'dd/MM');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  Object.entries(bookingsByDate).forEach(([date, dayBookings]) => {
    const advance = dayBookings.reduce((sum, b) => {
      const advanceMatch = b.notes?.match(/Advance: (\d+)/);
      return sum + (advanceMatch ? parseInt(advanceMatch[1]) : 0);
    }, 0);
    
    const total = dayBookings.reduce((sum, b) => sum + b.charge, 0);
    const paid = total - advance;

    last7DaysRevenue.push({
      date,
      advance,
      paid,
      total,
    });
  });

  const grandTotal = last7DaysRevenue.reduce((sum, day) => sum + day.total, 0);
  const totalAdvance = last7DaysRevenue.reduce((sum, day) => sum + day.advance, 0);
  const totalPaid = last7DaysRevenue.reduce((sum, day) => sum + day.paid, 0);

  // Assume cash vs online split (you can enhance this with actual payment method tracking)
  const cashTotal = Math.floor(grandTotal * 0.6); // Example: 60% cash
  const onlineTotal = grandTotal - cashTotal;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Revenue</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white">
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            <span className="text-emerald-600">PDF</span>
          </Button>
          <Button variant="outline" size="sm" className="p-2 bg-white">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-emerald-600 mb-4">Last 7 day's revenue</h2>

        <Card className="bg-white overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-gray-50 border-b">
            <div className="p-3 text-sm font-semibold text-emerald-700">Date</div>
            <div className="p-3 text-sm font-semibold text-emerald-700 text-right">Adv. ₹</div>
            <div className="p-3 text-sm font-semibold text-emerald-700 text-right">Paid ₹</div>
            <div className="p-3 text-sm font-semibold text-emerald-700 text-right">Total ₹</div>
          </div>

          {/* Table Rows */}
          {last7DaysRevenue.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No revenue data for the last 7 days
            </div>
          ) : (
            last7DaysRevenue.map((day, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="p-3 text-sm font-medium text-gray-900">{day.date}</div>
                <div className="p-3 text-sm text-gray-700 text-right">{day.advance.toFixed(1)}</div>
                <div className="p-3 text-sm text-gray-700 text-right">{day.paid.toFixed(1)}</div>
                <div className="p-3 text-sm font-semibold text-gray-900 text-right">{day.total.toFixed(1)}</div>
              </div>
            ))
          )}

          {/* Total Row */}
          {last7DaysRevenue.length > 0 && (
            <div className="grid grid-cols-4 bg-emerald-50 border-t-2 border-emerald-200">
              <div className="p-3 text-sm font-bold text-emerald-800">{last7DaysRevenue.length}</div>
              <div className="p-3 text-sm font-bold text-emerald-800 text-right">{totalAdvance} ₹</div>
              <div className="p-3 text-sm font-bold text-emerald-800 text-right">{totalPaid} ₹</div>
              <div className="p-3 text-sm font-bold text-emerald-800 text-right">{grandTotal} ₹</div>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Method Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-white">
          <div className="text-sm text-gray-600 mb-2">Cash</div>
          <div className="text-2xl font-bold text-gray-900">{cashTotal} ₹</div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-sm text-gray-600 mb-2">Online</div>
          <div className="text-2xl font-bold text-gray-900">{onlineTotal} ₹</div>
        </Card>
      </div>
    </div>
  );
}
