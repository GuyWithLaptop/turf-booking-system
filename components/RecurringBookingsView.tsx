'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Calendar, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type RecurringGroup = {
  parentBookingId: string;
  bookings: Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
    endTime: string;
    status: string;
    charge: number;
  }>;
  recurringDays: number[];
  totalBookings: number;
  futureBookings: number;
  completedBookings: number;
  cancelledBookings: number;
};

export default function RecurringBookingsView() {
  const [recurringGroups, setRecurringGroups] = useState<RecurringGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchRecurringBookings();
  }, []);

  const fetchRecurringBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const allBookings = await response.json();

      // Group by parentBookingId
      const grouped = allBookings
        .filter((b: any) => b.isRecurring && b.parentBookingId)
        .reduce((acc: any, booking: any) => {
          const parentId = booking.parentBookingId;
          if (!acc[parentId]) {
            acc[parentId] = {
              parentBookingId: parentId,
              bookings: [],
              recurringDays: booking.recurringDays ? JSON.parse(booking.recurringDays) : [],
              totalBookings: 0,
              futureBookings: 0,
              completedBookings: 0,
              cancelledBookings: 0,
            };
          }
          acc[parentId].bookings.push(booking);
          acc[parentId].totalBookings++;
          
          const now = new Date();
          const bookingStart = new Date(booking.startTime);
          
          if (bookingStart > now) {
            acc[parentId].futureBookings++;
          }
          if (booking.status === 'COMPLETED') {
            acc[parentId].completedBookings++;
          }
          if (booking.status === 'CANCELLED') {
            acc[parentId].cancelledBookings++;
          }
          
          return acc;
        }, {});

      const groupsArray = Object.values(grouped).sort((a: any, b: any) => {
        const aFirstBooking = new Date(a.bookings[0]?.startTime || 0);
        const bFirstBooking = new Date(b.bookings[0]?.startTime || 0);
        return bFirstBooking.getTime() - aFirstBooking.getTime();
      }) as RecurringGroup[];

      setRecurringGroups(groupsArray);
    } catch (error) {
      console.error('Error fetching recurring bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSeries = async (parentBookingId: string, deleteType: 'future' | 'all') => {
    const confirmMessage = deleteType === 'all' 
      ? 'Cancel ALL bookings in this series (including past)?' 
      : 'Cancel all FUTURE bookings in this series?';
      
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `/api/bookings/recurring?parentBookingId=${parentBookingId}&type=${deleteType}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to cancel bookings');

      const result = await response.json();
      alert(`Successfully cancelled ${result.cancelled} booking(s)`);
      fetchRecurringBookings();
    } catch (error) {
      alert('Failed to cancel bookings');
      console.error(error);
    }
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recurring bookings...</p>
        </div>
      </div>
    );
  }

  if (recurringGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Repeat className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recurring Bookings</h3>
          <p className="text-gray-500">
            Create a recurring booking from the booking modal to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Recurring Bookings</h2>
          <p className="text-sm text-gray-600">Manage booking series</p>
        </div>
        <Badge variant="secondary" className="text-base sm:text-lg px-3 py-1 sm:px-4 sm:py-2 w-fit">
          {recurringGroups.length} Series
        </Badge>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {recurringGroups.map((group) => {
          const firstBooking = group.bookings[0];
          const isExpanded = selectedGroup === group.parentBookingId;

          return (
            <Card key={group.parentBookingId} className="border-2 border-gray-200 hover:border-emerald-300 transition-all overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
                      <CardTitle className="text-lg sm:text-xl truncate">{firstBooking?.customerName}</CardTitle>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Every {getDayNames(group.recurringDays)}</span>
                      </div>
                      <div className="text-xs sm:text-sm">
                        {firstBooking && (
                          <>
                            {format(new Date(firstBooking.startTime), 'h:mm a')} - {format(new Date(firstBooking.endTime), 'h:mm a')}
                          </>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm truncate">
                        📞 {firstBooking?.customerPhone}
                      </div>
                    </CardDescription>
                  </div>

                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <Badge className="bg-emerald-600 text-xs sm:text-sm whitespace-nowrap">
                      ₹{firstBooking?.charge}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-700">{group.totalBookings}</div>
                    <div className="text-[10px] sm:text-xs text-blue-600">Total</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-700">{group.futureBookings}</div>
                    <div className="text-[10px] sm:text-xs text-emerald-600">Upcoming</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-gray-700">{group.completedBookings}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">Done</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-red-700">{group.cancelledBookings}</div>
                    <div className="text-[10px] sm:text-xs text-red-600">Cancelled</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroup(isExpanded ? null : group.parentBookingId)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    {isExpanded ? 'Hide Details' : 'View All Dates'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSeries(group.parentBookingId, 'future')}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs sm:text-sm"
                  >
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Cancel Future
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSeries(group.parentBookingId, 'all')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Cancel All
                  </Button>
                </div>

                {/* Expanded Booking List */}
                {isExpanded && (
                  <div className="mt-3 border-t pt-3 max-h-64 sm:max-h-96 overflow-y-auto">
                    <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-2">All Bookings in Series:</h4>
                    <div className="space-y-2">
                      {group.bookings
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg text-xs sm:text-sm gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {format(new Date(booking.startTime), 'EEE, MMM dd, yyyy')}
                              </div>
                              <div className="text-[10px] sm:text-xs text-gray-600">
                                {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                              </div>
                            </div>
                            <Badge className={`${getStatusBadge(booking.status)} text-[10px] sm:text-xs flex-shrink-0`}>
                              {booking.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
