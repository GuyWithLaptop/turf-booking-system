'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastBookingDetails, setLastBookingDetails] = useState<any>(null);
  const [turfInfo, setTurfInfo] = useState<any>(null);

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

  // Update price when turfInfo is loaded
  useEffect(() => {
    if (turfInfo?.defaultPrice) {
      setFormData(prev => ({ ...prev, price: turfInfo.defaultPrice.toString() }));
    }
  }, [turfInfo]);

  useEffect(() => {
    fetchBookings();
    fetchSports();
    fetchTurfInfo();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, bookings]);

  const fetchSports = async () => {
    // Check cache first
    const cached = sessionStorage.getItem('availableSports');
    if (cached) {
      try {
        const sports = JSON.parse(cached);
        setAvailableSports(sports);
        setSelectedSport(sports[0]);
        return;
      } catch (e) {
        // Invalid cache, fetch fresh
      }
    }

    try {
      const response = await fetch('/api/settings/sports');
      if (response.ok) {
        const data = await response.json();
        if (data.sports && data.sports.length > 0) {
          setAvailableSports(data.sports);
          setSelectedSport(data.sports[0]);
          // Cache for session
          sessionStorage.setItem('availableSports', JSON.stringify(data.sports));
        }
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const fetchTurfInfo = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setTurfInfo(data);
      }
    } catch (error) {
      console.error('Error fetching turf info:', error);
    }
  };

  const sendWhatsAppMessage = (bookingDetails: any) => {
    const { customerName, customerPhone, startTime, endTime, charge, advance, discount, sport } = bookingDetails;
    
    const bookingDate = format(new Date(startTime), 'dd MMMM yyyy');
    const bookingTimeStart = format(new Date(startTime), 'hh:mm a');
    const bookingTimeEnd = format(new Date(endTime), 'hh:mm a');
    const hours = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60));
    const totalAmount = charge;
    const advancePayment = parseInt(advance) || 0;
    const remaining = totalAmount - advancePayment;
    
    const message = `🎉 *Booking Confirmed!*

*Booking Details*

Name: ${customerName}
Booking Date: ${bookingDate}
Booking Time: ${bookingTimeStart} to ${bookingTimeEnd}
Booking Hours: ${hours} hr${hours > 1 ? 's' : ''}
Sport: ${sport}
Mobile No: ${customerPhone}

Booking Sub-total: ₹${totalAmount}
Total Amount: ₹${totalAmount}

Advance Payment: ₹${advancePayment}
Remaining Amount to be Paid: ₹${remaining}

Thank you for your booking!
*${turfInfo?.turfName || 'FS SPORTS CLUB'}*

${turfInfo?.turfNotes ? `Notes:\n${turfInfo.turfNotes}` : ''}

${turfInfo?.turfAddress ? `\n📍 ${turfInfo.turfAddress}` : ''}
${turfInfo?.turfPhone ? `\n📞 ${turfInfo.turfPhone}` : ''}`;

    // Remove + and any spaces from phone number
    const cleanPhone = customerPhone.replace(/[+\s-]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      const now = new Date();
      
      // Generate 1-hour slots for selected day (12:00 AM to 11:00 PM)
      const dayStart = startOfDay(selectedDate);
      const isToday = isSameDay(selectedDate, now);
      
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(dayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = addHours(slotStart, 1);

        // Skip past time slots for today
        if (isToday && slotEnd <= now) {
          continue;
        }

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
      const isNextDayToday = isSameDay(nextDay, now);
      
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(nextDayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = addHours(slotStart, 1);

        // Skip past time slots if next day is today
        if (isNextDayToday && slotEnd <= now) {
          continue;
        }

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
      // Handle multi-slot or single booking
      let createdBookings = [];
      for (const slot of selectedSlots) {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            startTime: slot.startTime.toISOString(),
            endTime: slot.endTime.toISOString(),
            charge: parseFloat(formData.price) - parseFloat(formData.discount || '0'),
            status: 'CONFIRMED',
              notes: `Sport: ${selectedSport} | Advance: ${formData.advance}${formData.notes ? ' | ' + formData.notes : ''}`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create booking');
          }
          
          const bookingData = await response.json();
          createdBookings.push(bookingData);
        }

      // Store last booking details and show success dialog
      if (createdBookings.length > 0) {
        // Calculate total hours (each slot is 1 hour)
        const totalHours = selectedSlots.length;
        
        setLastBookingDetails({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          startTime: selectedSlots[0].startTime,
          endTime: selectedSlots[selectedSlots.length - 1].endTime,
          charge: (parseFloat(formData.price) - parseFloat(formData.discount || '0')) * selectedSlots.length,
          advance: formData.advance,
          discount: formData.discount,
          sport: selectedSport,
          totalHours: totalHours,
        });
        setShowSuccessDialog(true);
      }
      
      resetForm();
      fetchBookings();
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
    setFormData({ customerName: '', customerPhone: '', price: '500', advance: '0', discount: '0', notes: '' });
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
                      step="0.01"
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
                        <span className="font-medium">1 hr</span>
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
                        <span className="font-medium">{selectedSlots.length} hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total charge</span>
                        <span className="font-medium">Rs. {(parseFloat(formData.price || '0') - parseFloat(formData.discount || '0')) * selectedSlots.length}</span>
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <div className="text-center py-6 px-6">
              {/* Celebration Icon */}
              <div className="relative mx-auto w-24 h-24 mb-4">
              {/* Confetti background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-full">
                  <div className="absolute top-1 left-6 w-2 h-2 bg-yellow-400 rounded-sm rotate-12"></div>
                  <div className="absolute top-4 right-8 w-1.5 h-1.5 bg-pink-500 rounded-sm -rotate-12"></div>
                  <div className="absolute top-6 left-10 w-1.5 h-1.5 bg-blue-400 rounded-sm rotate-45"></div>
                  <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-sm -rotate-45"></div>
                  <div className="absolute bottom-6 left-3 w-1.5 h-1.5 bg-green-400 rounded-sm rotate-12"></div>
                  <div className="absolute bottom-6 right-6 w-2 h-2 bg-purple-500 rounded-sm -rotate-12"></div>
                  <div className="absolute bottom-3 left-8 w-1.5 h-1.5 bg-yellow-500 rounded-sm rotate-45"></div>
                  <div className="absolute bottom-4 right-3 w-1.5 h-1.5 bg-pink-400 rounded-sm -rotate-45"></div>
                  {/* More confetti */}
                  <div className="absolute top-1 left-14 w-1 h-1 bg-orange-400 rounded-sm rotate-12"></div>
                  <div className="absolute top-5 right-14 w-1 h-1 bg-cyan-500 rounded-sm -rotate-12"></div>
                  <div className="absolute bottom-8 left-16 w-1 h-1 bg-lime-400 rounded-sm rotate-45"></div>
                  <div className="absolute bottom-1 right-12 w-1.5 h-1.5 bg-indigo-500 rounded-sm -rotate-45"></div>
                  {/* Rays */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-gray-300 -translate-x-1/2 origin-bottom rotate-0"></div>
                  <div className="absolute top-1 left-1/2 w-0.5 h-7 bg-gray-300 -translate-x-1/2 origin-bottom rotate-45"></div>
                  <div className="absolute top-1 left-1/2 w-0.5 h-7 bg-gray-300 -translate-x-1/2 origin-bottom -rotate-45"></div>
                  <div className="absolute top-2 left-1/2 w-0.5 h-8 bg-gray-300 -translate-x-1/2 origin-bottom rotate-90"></div>
                  <div className="absolute top-2 left-1/2 w-0.5 h-8 bg-gray-300 -translate-x-1/2 origin-bottom -rotate-90"></div>
                </div>
              </div>
              {/* Calendar Icon with checkmark */}
              <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                  <path d="M9 14l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-emerald-600 mb-4">Slot successfully booked !</h2>
            
            {lastBookingDetails && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-left">
                <h3 className="text-base font-semibold text-emerald-600 mb-4 text-center">Booking details</h3>
                
                {/* Two column layout for date/time and name/phone */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {format(new Date(lastBookingDetails.startTime), 'dd MMM., yyyy')} | {format(new Date(lastBookingDetails.startTime), 'EEEE')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(lastBookingDetails.startTime), 'hh:mm a')} - {format(new Date(lastBookingDetails.endTime), 'hh:mm a')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 mb-1">{lastBookingDetails.customerName}</div>
                    <div className="text-sm text-gray-600">+{lastBookingDetails.customerPhone}</div>
                  </div>
                </div>
                
                {/* Payment details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Booking Hours</span>
                    <span className="font-medium text-gray-900">{lastBookingDetails.totalHours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking sub-total</span>
                    <span className="font-medium text-gray-900">Rs. {lastBookingDetails.charge + (parseInt(lastBookingDetails.discount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance payment</span>
                    <span className="font-medium text-gray-900">Rs. {lastBookingDetails.advance || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="font-medium text-gray-900">Rs. {lastBookingDetails.discount || 0}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>Rs. {lastBookingDetails.charge}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowSuccessDialog(false)}
                  variant="outline"
                  className="w-full mt-4 py-4 text-sm font-semibold"
                >
                  Edit Booking
                </Button>
              </div>
            )}

            {/* Share Booking Details */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Share Booking Details</h4>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    sendWhatsAppMessage(lastBookingDetails);
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3" strokeWidth="2"/>
                      <circle cx="6" cy="12" r="3" strokeWidth="2"/>
                      <circle cx="18" cy="19" r="3" strokeWidth="2"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="2"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="2"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <Button
              onClick={() => setShowSuccessDialog(false)}
              variant="outline"
              className="w-full mt-4 py-4 text-sm font-semibold"
            >
              Go to dashboard
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
