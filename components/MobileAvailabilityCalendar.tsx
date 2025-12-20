'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Sun, Moon, X } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay, addHours, isToday } from 'date-fns';

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  booking?: any;
};

export default function MobileAvailabilityCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSlots, setShowSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    price: '',
    advance: '0',
    discount: '0',
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, bookings]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const dayStart = startOfDay(selectedDate);

    // Generate slots with odd hours (1-3, 3-5, etc.)
    for (let hour = 1; hour < 24; hour += 2) {
      const slotStart = new Date(dayStart);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = addHours(slotStart, 2);

      const booking = bookings.find((b) => {
        const bookingStart = new Date(b.startTime);
        return (
          isSameDay(bookingStart, selectedDate) &&
          bookingStart.getHours() === hour &&
          b.status !== 'CANCELLED'
        );
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: !booking,
        booking,
      });
    }

    setTimeSlots(slots);
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowSlots(true);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setShowBookingForm(true);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !formData.customerName || !formData.customerPhone || !formData.price) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          startTime: selectedSlot.startTime.toISOString(),
          endTime: selectedSlot.endTime.toISOString(),
          charge: parseInt(formData.price) - parseInt(formData.discount || '0'),
          status: 'CONFIRMED',
          notes: `Advance: ${formData.advance}`,
        }),
      });

      if (response.ok) {
        alert('Booking confirmed successfully!');
        setShowBookingForm(false);
        setShowSlots(false);
        setFormData({ customerName: '', customerPhone: '', price: '', advance: '0', discount: '0' });
        fetchBookings();
      }
    } catch (error) {
      alert('Failed to create booking');
    }
  };

  return (
    <div className="pb-24 px-4 pt-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Availability Calendar</h1>

      {/* Calendar */}
      <Card className="p-6 bg-white mb-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-emerald-600">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, idx) => {
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateSelect(day)}
                className={`aspect-square p-2 rounded-full text-center transition-all ${
                  selected
                    ? 'bg-emerald-500 text-white font-bold shadow-lg'
                    : today
                    ? 'bg-emerald-100 text-emerald-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </Card>

      <p className="text-sm text-gray-600 text-center">
        Tap on date to view and book available slots.
      </p>

      {/* Time Slots Modal */}
      <Dialog open={showSlots} onOpenChange={setShowSlots}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Available slots</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSlots(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-emerald-500 text-white text-center py-3 rounded-lg mb-6 font-semibold">
              {format(selectedDate, 'MMMM dd, yyyy')}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {timeSlots.map((slot, idx) => {
                const hour = slot.startTime.getHours();
                const isDaytime = hour >= 6 && hour < 18;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.isAvailable}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      slot.isAvailable
                        ? 'border-gray-200 bg-white hover:border-emerald-500 hover:bg-emerald-50'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isDaytime ? (
                        <Sun className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Moon className="w-5 h-5 text-indigo-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        slot.isAvailable ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {format(slot.startTime, 'hh:mm a')} - {format(slot.endTime, 'hh:mm a')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSlots(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled
              >
                Book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Confirm booking</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Full name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile no.
                </label>
                <input
                  type="tel"
                  placeholder="Add mobile number"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Hours
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="Price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full p-3 pl-8 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance payment
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.advance}
                      onChange={(e) => setFormData({ ...formData, advance: e.target.value })}
                      className="w-full p-3 pl-8 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full p-3 pl-8 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            {selectedSlot && (
              <Card className="p-4 bg-gray-50 mb-6">
                <h4 className="text-emerald-600 font-semibold mb-4 text-center">
                  Booking Summary
                </h4>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {format(selectedSlot.startTime, 'dd MMM yyyy')} | {formData.customerName || 'Name'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(selectedSlot.startTime, 'hh:mm a')} - {format(selectedSlot.endTime, 'hh:mm a')}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking hours</span>
                    <span className="font-medium">2 hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking sub-total</span>
                    <span className="font-medium">Rs. {formData.price || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance payment</span>
                    <span className="font-medium">Rs. {formData.advance || 0}</span>
                  </div>
                </div>
              </Card>
            )}

            <Button
              onClick={handleBooking}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-semibold"
            >
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
