'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  charge: number;
  notes?: string;
  cashPayment?: number;
  onlinePayment?: number;
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
      // Ensure data is an array before setting it
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error('Invalid data format:', data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
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

  // Calculate total cash and online payments
  const totalCash = recentBookings.reduce((sum, b) => sum + (b.cashPayment || 0), 0);
  const totalOnline = recentBookings.reduce((sum, b) => sum + (b.onlinePayment || 0), 0);

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
        <h1 className="text-3xl font-bold text-gray-800">Revenue</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white p-3">
            <FileText className="w-6 h-6 text-emerald-600" />
          </Button>
          <Button variant="outline" size="sm" className="bg-white p-3">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-emerald-600 mb-4">Last 7 day's revenue</h2>

        <Card className="bg-white overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-white border-b">
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
                className="grid grid-cols-4 border-b last:border-b-0"
              >
                <div className="p-3 text-base font-medium text-gray-900">{day.date}</div>
                <div className="p-3 text-base text-gray-700 text-right">{day.advance.toFixed(1)}</div>
                <div className="p-3 text-base text-gray-700 text-right">{day.paid.toFixed(1)}</div>
                <div className="p-3 text-base font-bold text-gray-900 text-right">{day.total.toFixed(1)}</div>
              </div>
            ))
          )}

          {/* Total Row */}
          {last7DaysRevenue.length > 0 && (
            <div className="grid grid-cols-4 bg-white border-t-2 border-gray-300">
              <div className="p-3 text-base font-bold text-gray-900">{last7DaysRevenue.length}</div>
              <div className="p-3 text-base font-bold text-gray-900 text-right">{totalAdvance} ₹</div>
              <div className="p-3 text-base font-bold text-gray-900 text-right">{totalPaid} ₹</div>
              <div className="p-3 text-base font-bold text-gray-900 text-right">{grandTotal} ₹</div>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Method Summary */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center text-base">
          <span className="text-gray-700">Cash : {totalCash} ₹</span>
          <span className="text-gray-700">Online : {totalOnline} ₹</span>
        </div>
      </div>
    </div>
  );
}
