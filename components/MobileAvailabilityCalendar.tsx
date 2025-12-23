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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSport, setSelectedSport] = useState('Football');
  const [availableSports, setAvailableSports] = useState<string[]>(['Football', 'Cricket', 'Other']);
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
    fetchSports();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, bookings]);

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/settings/sports');
      if (response.ok) {
        const data = await response.json();
        if (data.sports && data.sports.length > 0) {
          setAvailableSports(data.sports);
          setSelectedSport(data.sports[0]); // Set first sport as default
        }
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

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
      
      // Generate 1-hour slots for selected day (12:00 AM to 11:00 PM)
      const dayStart = startOfDay(selectedDate);
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(dayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = addHours(slotStart, 1);

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
          dayLabel: format(selectedDate, 'MMMM dd, yyyy'),
        });
      }

      // Generate 1-hour slots for next day (12:00 AM to 11:00 PM)
      const nextDay = addDays(selectedDate, 1);
      const nextDayStart = startOfDay(nextDay);
      
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(nextDayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = addHours(slotStart, 1);

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
          dayLabel: format(nextDay, 'MMMM dd, yyyy'),
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
      // Prevent selecting past dates
      const today = startOfDay(new Date());
      const selectedDay = startOfDay(date);
      
      if (selectedDay < today) {
        alert('Cannot select past dates');
        return;
      }
      
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
    if (isSubmitting) {
      return; // Prevent duplicate submissions
    }

    if (selectedSlots.length === 0 || !formData.customerName || !formData.customerPhone || !formData.price) {
      alert('Please fill all required fields and select at least one slot');
      return;
    }

    setIsSubmitting(true);
    try {
      // Handle recurring booking
      if (isRecurring) {
        if (recurringDays.length === 0 || !recurringEndDate) {
          alert('Please select recurring days and end date');
          return;
        }

        // For each selected slot, create a recurring series
        let totalBookings = 0;
        for (const slot of selectedSlots) {
          const response = await fetch('/api/bookings/recurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: formData.customerName,
              customerPhone: formData.customerPhone,
              startTime: slot.startTime.toISOString(),
              endTime: slot.endTime.toISOString(),
              recurringDays: recurringDays,
              recurringEndDate: new Date(recurringEndDate).toISOString(),
              charge: parseInt(formData.price) - parseInt(formData.discount || '0'),
              notes: `Sport: ${selectedSport} | Advance: ${formData.advance}${formData.notes ? ' | ' + formData.notes : ''}`,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            totalBookings += result.bookings;
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create recurring bookings');
          }
        }
        
        alert(`Successfully created ${totalBookings} recurring bookings across ${selectedSlots.length} time slot(s)!`);
        resetForm();
        fetchBookings();
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
              notes: `Sport: ${selectedSport} | Advance: ${formData.advance}${formData.notes ? ' | ' + formData.notes : ''}`,
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
    } finally {
      setIsSubmitting(false);
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
            const isPast = isBefore(day, startOfDay(new Date()));
            
            return (
              <button
                key={idx}
                onClick={() => handleDateSelect(day)}
                disabled={isPast}
                className={`aspect-square p-2 rounded-full text-center transition-all ${
                  isPast
                    ? 'text-gray-300 cursor-not-allowed'
                    : selected
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogTitle className="sr-only">Available Time Slots</DialogTitle>
          <DialogDescription className="sr-only">Select time slots for booking</DialogDescription>
          
          {/* Fixed Header */}
          <div className="p-6 pb-4 border-b bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Available slots</h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                <span className="text-xl">⚽</span>
              </div>
            </div>

            {/* Selected slots indicator */}
            {selectedSlots.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <span className="font-semibold text-emerald-700">
                  {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Selected
                </span>
                <button
                  onClick={() => setSelectedSlots([])}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Slots Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {/* Render slots grouped by date */}
            {(() => {
              const day1Slots = timeSlots.filter(slot => 
                isSameDay(slot.startTime, selectedDate)
              );
              const day2Slots = timeSlots.filter(slot => 
                isSameDay(slot.startTime, addDays(selectedDate, 1))
              );

              return (
                <>
                  {/* First Day */}
                  {day1Slots.length > 0 && (
                    <div className="mb-6">
                      <div className="bg-emerald-100 text-emerald-800 text-center py-2 rounded-lg font-semibold mb-4">
                        {format(selectedDate, 'MMMM dd, yyyy')}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {day1Slots.map((slot, idx) => {
                          const hour = slot.startTime.getHours();
                          const isDaytime = hour >= 6 && hour < 18;
                          const selected = isSlotSelected(slot);
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleSlotSelection(slot)}
                              disabled={!slot.isAvailable}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                selected
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : slot.isAvailable
                                  ? 'border-gray-200 bg-white hover:border-emerald-300'
                                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {isDaytime ? (
                                  <Sun className="w-5 h-5 text-amber-500 mt-1" />
                                ) : (
                                  <Moon className="w-5 h-5 text-blue-500 mt-1" />
                                )}
                                <div className="flex-1">
                                  <div className={`text-base font-semibold ${
                                    slot.isAvailable ? 'text-emerald-700' : 'text-gray-400'
                                  }`}>
                                    {format(slot.startTime, 'hh:mm a')} - {format(slot.endTime, 'hh:mm a')}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Second Day */}
                  {day2Slots.length > 0 && (
                    <div className="mb-6">
                      <div className="bg-emerald-100 text-emerald-800 text-center py-2 rounded-lg font-semibold mb-4">
                        {format(addDays(selectedDate, 1), 'MMMM dd, yyyy')}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {day2Slots.map((slot, idx) => {
                          const hour = slot.startTime.getHours();
                          const isDaytime = hour >= 6 && hour < 18;
                          const selected = isSlotSelected(slot);
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleSlotSelection(slot)}
                              disabled={!slot.isAvailable}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                selected
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : slot.isAvailable
                                  ? 'border-gray-200 bg-white hover:border-emerald-300'
                                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {isDaytime ? (
                                  <Sun className="w-5 h-5 text-amber-500 mt-1" />
                                ) : (
                                  <Moon className="w-5 h-5 text-blue-500 mt-1" />
                                )}
                                <div className="flex-1">
                                  <div className={`text-base font-semibold ${
                                    slot.isAvailable ? 'text-emerald-700' : 'text-gray-400'
                                  }`}>
                                    {format(slot.startTime, 'hh:mm a')} - {format(slot.endTime, 'hh:mm a')}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="border-t bg-white p-6 pt-4">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowSlots(false);
                  setSelectedSlots([]);
                }}
                variant="outline"
                className="flex-1 py-6 text-lg font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookNow}
                disabled={selectedSlots.length === 0}
                className="flex-1 py-6 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
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
          <DialogTitle className="text-lg font-semibold">Confirm booking</DialogTitle>
          <DialogDescription className="sr-only">Enter customer details to confirm the booking</DialogDescription>
          <div className="p-4">

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Recurring Booking Option */}
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
                        {selectedSlots.length === 1 
                          ? 'This will create bookings for all selected days from now until the end date.'
                          : `This will create recurring bookings for all ${selectedSlots.length} selected time slots on the selected days until the end date.`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
