'use client';

import { useEffect, useState } from 'react';
import { Booking } from '@prisma/client';
import BookingModal from '@/components/BookingModal';
import { Button } from '@/components/ui/button';
import { format, addHours, startOfDay, isSameDay, isAfter, isBefore, addDays } from 'date-fns';
import { Sun, Moon, Repeat } from 'lucide-react';

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  booking?: Booking;
  isAvailable: boolean;
  dayLabel: string;
};

export default function TimeSlotBooking() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([]);
  const [tomorrowSlots, setTomorrowSlots] = useState<TimeSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    generateTimeSlots();
  }, [selectedDate, bookings]);

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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setLoading(false);
    }
  };

  const generateTimeSlotsForDay = (date: Date, dayLabel: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayStart = startOfDay(date);
    
    // Generate slots with odd hours (1-3, 3-5, 5-7, etc.)
    for (let hour = 1; hour < 24; hour += 2) {
      const slotStart = new Date(dayStart);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = addHours(slotStart, 2);

      // Check if this slot has a booking
      const booking = bookings.find((b) => {
        const bookingStart = new Date(b.startTime);
        const bookingEnd = new Date(b.endTime);
        return (
          isSameDay(bookingStart, date) &&
          ((isAfter(bookingStart, slotStart) || bookingStart.getTime() === slotStart.getTime()) &&
            (isBefore(bookingEnd, slotEnd) || bookingEnd.getTime() === slotEnd.getTime()))
        );
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        booking,
        isAvailable: !booking || booking.status === 'CANCELLED',
        dayLabel,
      });
    }

    return slots;
  };

  const generateTimeSlots = () => {
    const today = generateTimeSlotsForDay(selectedDate, 'Today');
    const tomorrow = generateTimeSlotsForDay(addDays(selectedDate, 1), 'Tomorrow');
    setTodaySlots(today);
    setTomorrowSlots(tomorrow);
  };

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 18) {
      return <Sun className="w-5 h-5 text-amber-500" />;
    }
    return <Moon className="w-5 h-5 text-indigo-400" />;
  };

  const toggleSlotSelection = (slot: TimeSlot) => {
    if (!slot.isAvailable) {
      // If slot is booked, open modal to view/edit
      setSelectedSlot(slot);
      setModalOpen(true);
      return;
    }

    // Toggle selection for available slots
    const isSelected = selectedSlots.some(
      s => s.startTime.getTime() === slot.startTime.getTime()
    );

    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(
        s => s.startTime.getTime() !== slot.startTime.getTime()
      ));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const openBookingModal = () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }
    setModalOpen(true);
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some(
      s => s.startTime.getTime() === slot.startTime.getTime()
    );
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setSelectedSlots([]);
  };

  const handleModalSave = () => {
    fetchBookings();
    handleModalClose();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Date Navigation */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold">
                {format(selectedDate, 'EEEE')}
              </h2>
              <p className="text-xl text-white/90 mt-1">
                {format(selectedDate, 'MMMM dd, yyyy')}
              </p>
            </div>
            
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-center mt-4">
            <button
              onClick={goToToday}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              Today
            </button>
          </div>
        </div>

        {/* Selection Summary & Book Button */}
        {selectedSlots.length > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Selected
                </h3>
                <p className="text-white/80 text-sm">
                  Click "Book Selected Slots" to continue
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedSlots([])}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                >
                  Clear All
                </Button>
                <Button
                  onClick={openBookingModal}
                  className="bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
                >
                  Book Selected Slots
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Today's Slots */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-6 h-6 text-amber-500" />
            <h3 className="text-2xl font-bold text-gray-800">Today - {format(selectedDate, 'MMM dd')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {todaySlots.map((slot, index) => (
              <div
                key={`today-${index}`}
                onClick={() => toggleSlotSelection(slot)}
                className={`
                  relative overflow-hidden rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                  ${isSlotSelected(slot)
                    ? 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-500 border-4 shadow-2xl ring-4 ring-purple-200'
                    : slot.isAvailable
                    ? 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                  }
                `}
              >
                {/* Time Display with Icon */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getTimeIcon(slot.startTime.getHours())}
                    <span className="text-xs font-semibold text-gray-500 uppercase">{slot.dayLabel}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {format(slot.startTime, 'h:mm a')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">to</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {format(slot.endTime, 'h:mm a')}
                  </div>
                </div>

              {/* Status Indicator */}
              <div className="text-center">
                {slot.isAvailable ? (
                  isSlotSelected(slot) ? (
                    <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full font-semibold text-sm shadow-lg">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Selected
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-full font-semibold text-sm">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Available
                    </div>
                  )
                ) : slot.booking ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs border ${getStatusBadge(slot.booking.status)}`}>
                        {slot.booking.status}
                      </div>
                      {slot.booking.isRecurring && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold border border-purple-300">
                          <Repeat className="w-3 h-3" />
                          Recurring
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mt-2">
                      {slot.booking.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {slot.booking.customerPhone}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Decorative Corner */}
              {slot.isAvailable && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-bl-full" />
              )}
            </div>
          ))}
          </div>
        </div>

        {/* Tomorrow's Slots */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-6 h-6 text-indigo-400" />
            <h3 className="text-2xl font-bold text-gray-800">Tomorrow - {format(addDays(selectedDate, 1), 'MMM dd')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tomorrowSlots.map((slot, index) => (
              <div
                key={`tomorrow-${index}`}
                onClick={() => toggleSlotSelection(slot)}
                className={`
                  relative overflow-hidden rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                  ${isSlotSelected(slot)
                    ? 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-500 border-4 shadow-2xl ring-4 ring-purple-200'
                    : slot.isAvailable
                    ? 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                  }
                `}
              >
                {/* Time Display with Icon */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getTimeIcon(slot.startTime.getHours())}
                    <span className="text-xs font-semibold text-gray-500 uppercase">{slot.dayLabel}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {format(slot.startTime, 'h:mm a')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">to</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {format(slot.endTime, 'h:mm a')}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="text-center">
                  {slot.isAvailable ? (
                    isSlotSelected(slot) ? (
                      <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full font-semibold text-sm shadow-lg">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Selected
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-full font-semibold text-sm">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Available
                      </div>
                    )
                  ) : slot.booking ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs border ${getStatusBadge(slot.booking.status)}`}>
                          {slot.booking.status}
                        </div>
                        {slot.booking.isRecurring && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold border border-purple-300">
                            <Repeat className="w-3 h-3" />
                            Recurring
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mt-2">
                        {slot.booking.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.booking.customerPhone}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Decorative Corner */}
                {slot.isAvailable && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-400/10 rounded-bl-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BookingModal
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        booking={selectedSlot?.booking || null}
        initialStartTime={selectedSlots.length > 0 ? selectedSlots[0].startTime : selectedSlot?.startTime}
        initialEndTime={selectedSlots.length > 0 ? selectedSlots[selectedSlots.length - 1].endTime : selectedSlot?.endTime}
        selectedSlots={selectedSlots}
      />
    </>
  );
}
