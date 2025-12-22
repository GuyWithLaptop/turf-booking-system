'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Sun, Moon, X, Check } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay, addHours, isToday, isBefore } from 'date-fns';

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  booking?: any;
  dayLabel?: string;
};

export default function MobileAvailabilityCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSlots, setShowSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    price: '500',
    advance: '0',
    discount: '0',
    notes: '',
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
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]); // Set empty array on error to prevent crashes
    }
  };

  const generateTimeSlots = () => {
    try {
      const slots: TimeSlot[] = [];
      
      // Generate slots for selected day
      const dayStart = startOfDay(selectedDate);
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
          dayLabel: isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM dd'),
        });
      }

      // Always show next day's slots (full day)
      const nextDay = addDays(selectedDate, 1);
      const nextDayStart = startOfDay(nextDay);
      
      for (let hour = 1; hour < 24; hour += 2) {
        const slotStart = new Date(nextDayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = addHours(slotStart, 2);

        const booking = bookings.find((b) => {
          const bookingStart = new Date(b.startTime);
          return (
            isSameDay(bookingStart, nextDay) &&
            bookingStart.getHours() === hour &&
            b.status !== 'CANCELLED'
          );
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: !booking,
          booking,
          dayLabel: isToday(selectedDate) ? 'Tomorrow' : format(nextDay, 'MMM dd'),
        });
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      setTimeSlots([]);
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateSelect = (date: Date) => {
    try {
      setSelectedDate(date);
      setSelectedSlots([]);
      setShowSlots(true);
    } catch (error) {
      console.error('Error selecting date:', error);
      alert('Error loading time slots. Please try again.');
    }
  };

  const toggleSlotSelection = (slot: TimeSlot) => {
    if (!slot.isAvailable) {
      return; // Can't select booked slots
    }

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

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some(
      s => s.startTime.getTime() === slot.startTime.getTime()
    );
  };

  const handleBookNow = () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }
    setShowBookingForm(true);
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0 || !formData.customerName || !formData.customerPhone || !formData.price) {
      alert('Please fill all required fields and select at least one slot');
      return;
    }

    try {
      // Handle recurring booking
      if (isRecurring && selectedSlots.length === 1) {
        if (recurringDays.length === 0 || !recurringEndDate) {
          alert('Please select recurring days and end date');
          return;
        }

        const response = await fetch('/api/bookings/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            startTime: selectedSlots[0].startTime.toISOString(),
            endTime: selectedSlots[0].endTime.toISOString(),
            recurringDays: recurringDays,
            recurringEndDate: new Date(recurringEndDate).toISOString(),
            charge: parseInt(formData.price) - parseInt(formData.discount || '0'),
            notes: formData.notes || `Advance: ${formData.advance}`,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Successfully created ${result.bookings} recurring bookings!`);
          resetForm();
          fetchBookings();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create recurring bookings');
        }
      } else {
        // Handle multi-slot or single booking
        for (const slot of selectedSlots) {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: formData.customerName,
              customerPhone: formData.customerPhone,
              startTime: slot.startTime.toISOString(),
              endTime: slot.endTime.toISOString(),
              charge: parseInt(formData.price) - parseInt(formData.discount || '0'),
              status: 'CONFIRMED',
              notes: formData.notes || `Advance: ${formData.advance}`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create booking');
          }
        }

        alert(`Successfully created ${selectedSlots.length} booking(s)!`);
        resetForm();
        fetchBookings();
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(`Failed to create booking: ${error.message}`);
    }
  };

  const resetForm = () => {
    setShowBookingForm(false);
    setShowSlots(false);
    setSelectedSlots([]);
    setIsRecurring(false);
    setRecurringDays([]);
    setRecurringEndDate('');
    setFormData({ customerName: '', customerPhone: '', price: '500', advance: '0', discount: '0', notes: '' });
  };

  const toggleRecurringDay = (day: number) => {
    if (recurringDays.includes(day)) {
      setRecurringDays(recurringDays.filter(d => d !== day));
    } else {
      setRecurringDays([...recurringDays, day]);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Available Time Slots</DialogTitle>
          <DialogDescription className="sr-only">Select time slots for booking</DialogDescription>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available slots</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSlots(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Selected slots count */}
            {selectedSlots.length > 0 && (
              <div className="mb-4 bg-purple-50 border-2 border-purple-300 rounded-lg p-3 text-center">
                <span className="font-semibold text-purple-700">
                  {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Selected
                </span>
                <button
                  onClick={() => setSelectedSlots([])}
                  className="ml-3 text-sm text-purple-600 underline"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Today's Slots */}
            {timeSlots.filter(slot => {
              const slotDate = startOfDay(slot.startTime);
              const selected = startOfDay(selectedDate);
              return slotDate.getTime() === selected.getTime();
            }).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <h4 className="text-base font-semibold text-gray-800">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM dd')} - Dec {format(selectedDate, 'dd')}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots
                    .filter(slot => {
                      const slotDate = startOfDay(slot.startTime);
                      const selected = startOfDay(selectedDate);
                      return slotDate.getTime() === selected.getTime();
                    })
                    .map((slot, idx) => {
                      const hour = slot.startTime.getHours();
                      const isDaytime = hour >= 6 && hour < 18;
                      const selected = isSlotSelected(slot);
                      
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all ${
                            selected
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : slot.isAvailable
                              ? 'border-gray-200 bg-white'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {isDaytime ? (
                              <Sun className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Moon className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {isToday(selectedDate) ? 'TODAY' : format(selectedDate, 'MMM dd').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="text-center mb-3">
                            <div className="text-2xl font-bold text-gray-800 mb-1">
                              {format(slot.startTime, 'h:mm a')}
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                              {format(slot.endTime, 'h:mm a')}
                            </div>
                          </div>

                          {slot.isAvailable ? (
                            <button
                              onClick={() => toggleSlotSelection(slot)}
                              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                                selected
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                              }`}
                            >
                              {selected ? '✓ Selected' : 'Available'}
                            </button>
                          ) : (
                            <div className="w-full py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-500 text-center">
                              Booked
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tomorrow/Next Day's Slots */}
            {timeSlots.filter(slot => {
              const slotDate = startOfDay(slot.startTime);
              const nextDay = startOfDay(addDays(selectedDate, 1));
              return slotDate.getTime() === nextDay.getTime();
            }).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="w-5 h-5 text-blue-500" />
                  <h4 className="text-base font-semibold text-gray-800">
                    {isToday(selectedDate) ? 'Tomorrow' : format(addDays(selectedDate, 1), 'MMMM dd')} - Dec {format(addDays(selectedDate, 1), 'dd')}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots
                    .filter(slot => {
                      const slotDate = startOfDay(slot.startTime);
                      const nextDay = startOfDay(addDays(selectedDate, 1));
                      return slotDate.getTime() === nextDay.getTime();
                    })
                    .map((slot, idx) => {
                      const hour = slot.startTime.getHours();
                      const isDaytime = hour >= 6 && hour < 18;
                      const selected = isSlotSelected(slot);
                      
                      return (
                        <div
                          key={`tomorrow-${idx}`}
                          className={`p-4 rounded-xl border transition-all ${
                            selected
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : slot.isAvailable
                              ? 'border-gray-200 bg-white'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {isDaytime ? (
                              <Sun className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Moon className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {isToday(selectedDate) ? 'TOMORROW' : format(addDays(selectedDate, 1), 'MMM dd').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="text-center mb-3">
                            <div className="text-2xl font-bold text-gray-800 mb-1">
                              {format(slot.startTime, 'h:mm a')}
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                              {format(slot.endTime, 'h:mm a')}
                            </div>
                          </div>

                          {slot.isAvailable ? (
                            <button
                              onClick={() => toggleSlotSelection(slot)}
                              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                                selected
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                              }`}
                            >
                              {selected ? '✓ Selected' : 'Available'}
                            </button>
                          ) : (
                            <div className="w-full py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-500 text-center">
                              Booked
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowSlots(false); setSelectedSlots([]); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleBookNow}
                disabled={selectedSlots.length === 0}
              >
                Book {selectedSlots.length > 0 && `(${selectedSlots.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-semibold">Confirm booking</DialogTitle>
          <DialogDescription className="sr-only">Enter customer details to confirm the booking</DialogDescription>
          <div className="p-4">

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

              {/* Recurring Booking Option - Only for single slot */}
              {selectedSlots.length === 1 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                    />
                    <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
                      Make this a recurring booking
                    </Label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Select Days</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleRecurringDay(idx)}
                              className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                                recurringDays.includes(idx)
                                  ? 'bg-emerald-500 text-white shadow-lg'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:border-emerald-500'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="recurringEndDate" className="text-sm font-medium mb-2 block">
                          Repeat Until
                        </Label>
                        <Input
                          id="recurringEndDate"
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                          className="w-full"
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <p className="font-semibold mb-1">ℹ️ Recurring Booking Info:</p>
                        <p className="text-xs">
                          This will create bookings for all selected days from now until the end date.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info message for multi-slot bookings */}
              {selectedSlots.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">ℹ️ Multiple Slots Selected:</p>
                  <p className="text-xs">
                    A separate booking will be created for each selected time slot ({selectedSlots.length} slots).
                    Recurring booking is not available for multiple slots.
                  </p>
                </div>
              )}
            </div>

            {/* Booking Summary */}
            {selectedSlots.length > 0 && (
              <Card className="p-4 bg-gray-50 mb-6">
                <h4 className="text-emerald-600 font-semibold mb-4 text-center">
                  Booking Summary
                </h4>
                
                {selectedSlots.length === 1 ? (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {format(selectedSlots[0].startTime, 'dd MMM yyyy')} | {formData.customerName || 'Name'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(selectedSlots[0].startTime, 'hh:mm a')} - {format(selectedSlots[0].endTime, 'hh:mm a')}
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
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <div className="font-semibold text-gray-900 mb-2">
                        {formData.customerName || 'Name'} | {selectedSlots.length} Slots
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {selectedSlots.map((slot, idx) => (
                          <div key={idx} className="text-sm text-gray-600 bg-white p-2 rounded">
                            {format(slot.startTime, 'MMM dd, hh:mm a')} - {format(slot.endTime, 'hh:mm a')}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total hours</span>
                        <span className="font-medium">{selectedSlots.length * 2} hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total charge</span>
                        <span className="font-medium">Rs. {(parseInt(formData.price || '0') - parseInt(formData.discount || '0')) * selectedSlots.length}</span>
                      </div>
                    </div>
                  </div>
                )}
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
