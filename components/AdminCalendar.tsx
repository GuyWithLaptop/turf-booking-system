'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Booking } from '@prisma/client';
import BookingModal from '@/components/BookingModal';
import { Button } from '@/components/ui/button';

type BookingEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  className: string;
  extendedProps: Booking;
};

export default function AdminCalendar() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const bookings: Booking[] = await response.json();

      const calendarEvents: BookingEvent[] = bookings.map((booking) => ({
        id: booking.id,
        title: `${booking.customerName} - ${booking.status}`,
        start: new Date(booking.startTime).toISOString(),
        end: new Date(booking.endTime).toISOString(),
        className: `status-${booking.status.toLowerCase()}`,
        extendedProps: booking,
      }));

      setEvents(calendarEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    info.jsEvent.preventDefault();
    setSelectedBooking(info.event.extendedProps as Booking);
    setModalOpen(true);
  };

  const handleNewBooking = () => {
    setSelectedBooking(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBooking(null);
  };

  const handleModalSave = () => {
    fetchBookings();
    handleModalClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading bookings...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-calendar">
        <div className="mb-4 flex justify-end">
          <Button onClick={handleNewBooking}>New Booking</Button>
        </div>
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
          eventClick={handleEventClick}
          eventContent={(eventInfo) => {
            const booking = eventInfo.event.extendedProps as Booking;
            return (
              <div className="p-1 overflow-hidden cursor-pointer">
                <div className="font-semibold text-xs">
                  {booking.customerName}
                </div>
              </div>
            );
          }}
        />
      </div>

      <BookingModal
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        booking={selectedBooking}
      />
    </>
  );
}
