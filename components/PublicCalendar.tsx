'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Booking } from '@prisma/client';

type BookingEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    customerName: string;
    customerPhone: string;
    status: string;
  };
};

export default function PublicCalendar() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const bookings: Booking[] = await response.json();

      const calendarEvents: BookingEvent[] = bookings
        .filter((booking) => booking.status !== 'CANCELLED')
        .map((booking) => ({
          id: booking.id,
          title: `${booking.customerName}`,
          start: new Date(booking.startTime).toISOString(),
          end: new Date(booking.endTime).toISOString(),
          backgroundColor: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status),
          extendedProps: {
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            status: booking.status,
          },
        }));

      setEvents(calendarEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#22c55e';
      case 'PENDING':
        return '#eab308';
      case 'CANCELLED':
        return '#ef4444';
      case 'COMPLETED':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="public-calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        height="auto"
        events={events}
        eventContent={(eventInfo) => {
          return (
            <div className="p-1 overflow-hidden">
              <div className="font-semibold text-xs">
                Booked
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
