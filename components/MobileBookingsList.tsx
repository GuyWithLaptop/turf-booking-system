'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ChevronRight, FileText, Filter } from 'lucide-react';
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
  sport?: string;
};

export default function MobileBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSport, setFilterSport] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

  // Helper function to get display status
  const getDisplayStatus = (booking: Booking) => {
    const now = new Date();
    const endTime = new Date(booking.endTime);
    
    // If booking time has passed, show as COMPLETED
    if (endTime < now && booking.status !== 'CANCELLED') {
      return 'COMPLETED';
    }
    
    return booking.status;
  };

  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterSport('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Get filtered bookings
  const filteredBookings = bookings.filter((b) => {
    // Status filter
    const displayStatus = getDisplayStatus(b);
    if (filterStatus !== 'ALL' && displayStatus !== filterStatus) return false;
    
    // Sport filter
    if (filterSport !== 'ALL' && b.sport !== filterSport) return false;
    
    // Date range filter
    if (startDate && endDate) {
      const bookingDate = new Date(b.startTime);
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      if (bookingDate < start || bookingDate > end) return false;
    } else if (!startDate && !endDate) {
      // Default: last 7 days if no date filter
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (new Date(b.startTime) < sevenDaysAgo) return false;
    }
    
    return b.status !== 'CANCELLED';
  });

  // Sort bookings by date
  const sortedBookings = filteredBookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const sports = ['ALL', ...Array.from(new Set(bookings.map(b => b.sport).filter((s): s is string => !!s)))];
  const statuses = ['ALL', 'PENDING', 'COMPLETED', 'CONFIRMED'];

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className="bg-white"
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-white">
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            <span className="text-emerald-600">PDF</span>
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      {showFilter && (
        <div className="bg-white rounded-lg p-4 mb-4 space-y-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="grid grid-cols-4 gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`p-2 rounded-lg text-xs ${
                    filterStatus === status
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Sport Filter */}
          {sports.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
              <div className="grid grid-cols-3 gap-2">
                {sports.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setFilterSport(sport)}
                    className={`p-2 rounded-lg text-xs ${
                      filterSport === sport
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="w-full p-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-emerald-600 mb-4">
          {startDate && endDate ? 'Filtered Bookings' : "Last 7 day's bookings"}
        </h2>

        {sortedBookings.length === 0 ? (
          <Card className="p-6 text-center bg-white">
            <p className="text-gray-500">No bookings found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedBookings.map((booking) => {
              const displayStatus = getDisplayStatus(booking);
              return (
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
                      <div className="text-xs text-gray-500 mt-1">
                        Status: <span className={`font-medium ${
                          displayStatus === 'COMPLETED' ? 'text-blue-600' :
                          displayStatus === 'CONFIRMED' ? 'text-green-600' :
                          displayStatus === 'PENDING' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>{displayStatus}</span>
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
              );
            })}
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
