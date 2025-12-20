'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ChevronRight, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function MobileBookingsList() {
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
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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

  // Get last 7 days bookings
  const last7DaysBookings = bookings
    .filter((b) => {
      const bookingDate = new Date(b.startTime);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return bookingDate >= sevenDaysAgo && b.status !== 'CANCELLED';
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

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
        <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
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

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-emerald-600 mb-4">Last 7 day's bookings</h2>

        {last7DaysBookings.length === 0 ? (
          <Card className="p-6 text-center bg-white">
            <p className="text-gray-500">No bookings in the last 7 days</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {last7DaysBookings.map((booking) => (
              <Card
                key={booking.id}
                onClick={() => handleBookingClick(booking)}
                className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {format(new Date(booking.startTime), 'dd-MM-yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{booking.customerName}</div>
                      <div className="text-sm text-gray-600">{booking.customerPhone}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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
