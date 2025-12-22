'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, TrendingUp, Clock, IndianRupee } from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, isFuture } from 'date-fns';
import MobileBookingDetails from './MobileBookingDetails';

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

export default function MobileDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedBooking(null);
  };

  const handleUpdateBooking = () => {
    fetchBookings();
  };

  const todayBookings = bookings.filter((b) =>
    isToday(new Date(b.startTime)) && b.status !== 'CANCELLED'
  );

  const upcomingBookings = bookings.filter((b) =>
    isFuture(new Date(b.startTime)) && !isToday(new Date(b.startTime)) && b.status !== 'CANCELLED'
  ).slice(0, 5);

  const last7DaysRevenue = bookings
    .filter((b) => {
      const bookingDate = new Date(b.startTime);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return bookingDate >= sevenDaysAgo && b.status !== 'CANCELLED';
    })
    .reduce((sum, b) => sum + b.charge, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-400 to-emerald-500 p-6 border-0 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-5xl font-bold text-white mb-1">{todayBookings.length}</div>
          <div className="text-sm text-emerald-50 font-medium">Today's bookings</div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-400 to-emerald-500 p-6 border-0 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <IndianRupee className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-5xl font-bold text-white mb-1">{last7DaysRevenue}</div>
          <div className="text-sm text-emerald-50 font-medium">Last 7 days revenue</div>
        </Card>
      </div>

      {/* Today's Bookings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Today's bookings</h2>
          <div className="text-sm text-gray-600 font-medium">
            {format(new Date(), 'dd MMM yyyy').toUpperCase()}
          </div>
        </div>

        {todayBookings.length === 0 ? (
          <Card className="p-6 text-center bg-white">
            <p className="text-gray-500">No Bookings Available Today</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <Card 
                key={booking.id} 
                onClick={() => handleBookingClick(booking)}
                className="p-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{booking.customerName}</div>
                    <div className="text-sm text-gray-600">{booking.customerPhone}</div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600">₹{booking.charge}</div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Bookings</h2>

        {upcomingBookings.length === 0 ? (
          <Card className="p-6 text-center bg-white">
            <p className="text-gray-500">No upcoming Bookings</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Card 
                key={booking.id} 
                onClick={() => handleBookingClick(booking)}
                className="p-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{booking.customerName}</div>
                    <div className="text-sm text-gray-600">{booking.customerPhone}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {format(new Date(booking.startTime), 'dd MMM yyyy, h:mm a')}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-emerald-600">₹{booking.charge}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue</h2>
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="text-sm text-gray-600">Last 7 days</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{bookings.filter(b => {
                const bookingDate = new Date(b.startTime);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return bookingDate >= sevenDaysAgo && b.status !== 'CANCELLED';
              }).length} Bookings</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">Rs. {last7DaysRevenue}</div>
              <div className="text-sm text-gray-600">Earnings</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Booking Details Modal */}
      <MobileBookingDetails
        booking={selectedBooking}
        open={showDetails}
        onClose={handleCloseDetails}
        onUpdate={handleUpdateBooking}
      />
    </div>
  );
}
