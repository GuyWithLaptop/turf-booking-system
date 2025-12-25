'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

type GroupBookingProps = {
  onBack: () => void;
};

export default function GroupBooking({ onBack }: GroupBookingProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [showSlots, setShowSlots] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [availableSports, setAvailableSports] = useState<string[]>(['Cricket', 'Football', 'Basketball', 'Badminton']);
  const [turfInfo, setTurfInfo] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pricePerSlot, setPricePerSlot] = useState('500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    totalBookings: number;
    customerName: string;
    customerPhone: string;
    sport: string;
    startDate: string;
    endDate: string;
    timeSlots: string[];
    days: number[];
  } | null>(null);

  useEffect(() => {
    fetchSports();
    fetchTurfInfo();
  }, []);

  // Update price when turfInfo is loaded
  useEffect(() => {
    if (turfInfo?.defaultPrice) {
      setPricePerSlot(turfInfo.defaultPrice.toString());
    }
  }, [turfInfo]);

  const fetchSports = async () => {
    // Check cache first
    const cached = sessionStorage.getItem('availableSports');
    if (cached) {
      try {
        const sports = JSON.parse(cached);
        setAvailableSports(sports);
        if (sports.length > 0) setSelectedSport(sports[0]);
        return;
      } catch (e) {
        // Invalid cache
      }
    }

    try {
      const response = await fetch('/api/settings/sports');
      if (response.ok) {
        const data = await response.json();
        if (data.sports && data.sports.length > 0) {
          setAvailableSports(data.sports);
          setSelectedSport(data.sports[0]);
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

  const days = [
    { name: 'Monday', value: 1 },
    { name: 'Tuesday', value: 2 },
    { name: 'Wednesday', value: 3 },
    { name: 'Thursday', value: 4 },
    { name: 'Friday', value: 5 },
    { name: 'Saturday', value: 6 },
    { name: 'Sunday', value: 0 },
  ];

  const timeSlots = [
    '12:00 AM - 01:00 AM',
    '01:00 AM - 02:00 AM',
    '02:00 AM - 03:00 AM',
    '03:00 AM - 04:00 AM',
    '04:00 AM - 05:00 AM',
    '05:00 AM - 06:00 AM',
    '06:00 AM - 07:00 AM',
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM',
    '09:00 PM - 10:00 PM',
    '10:00 PM - 11:00 PM',
    '11:00 PM - 12:00 AM',
  ];

  const toggleDay = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const toggleTimeSlot = (slot: string) => {
    if (selectedTimeSlots.includes(slot)) {
      setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slot]);
    }
  };

  const parseTimeSlot = (dateStr: string, timeStr: string): Date => {
    // Parse time string like "09:00 AM" or "02:00 PM"
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Create date object
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleCheckAvailability = async () => {
    if (!startDate || !endDate || selectedDays.length === 0 || selectedTimeSlots.length === 0) {
      alert('Please fill all required fields: date range, days, and time slots');
      return;
    }

    if (!customerName || !customerPhone) {
      alert('Please enter customer name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      // Sort time slots to get earliest start and latest end
      const parsedSlots = selectedTimeSlots.map(timeSlot => {
        const [startTimeStr, endTimeStr] = timeSlot.split(' - ');
        const startDateTime = parseTimeSlot(startDate, startTimeStr);
        const endDateTime = parseTimeSlot(startDate, endTimeStr);
        
        // If end time is before start time, it's next day
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }
        
        return { start: startDateTime, end: endDateTime };
      }).sort((a, b) => a.start.getTime() - b.start.getTime());
      
      // Use earliest start time and latest end time to create ONE recurring series
      const startDateTime = parsedSlots[0].start;
      const endDateTime = parsedSlots[parsedSlots.length - 1].end;
      
      const response = await fetch('/api/bookings/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          recurringDays: selectedDays,
          recurringEndDate: new Date(endDate).toISOString(),
          charge: (parseFloat(pricePerSlot) || 500) * selectedTimeSlots.length,
          notes: `Sport: ${selectedSport} | Permanent Booking (${selectedTimeSlots.length} slot${selectedTimeSlots.length > 1 ? 's' : ''})`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create permanent bookings');
      }

      const result = await response.json();
      const totalBookings = result.bookings || 0;

      // Store booking details for success dialog
      setBookingResult({
        totalBookings,
        customerName,
        customerPhone,
        sport: selectedSport,
        startDate,
        endDate,
        timeSlots: selectedTimeSlots,
        days: selectedDays,
      });
      
      // Show success dialog
      setShowSuccessDialog(true);
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setSelectedDays([]);
      setSelectedTimeSlots([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowSlots(false);
      
    } catch (error: any) {
      console.error('Error creating permanent bookings:', error);
      alert(`Failed to create permanent bookings: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Cricket': '🏏',
      'Football': '⚽',
      'Basketball': '🏀',
      'Badminton': '🏸',
      'Tennis': '🎾',
    };
    return icons[sport] || '🏆';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Group Booking</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Customer Details */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Customer Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full p-4 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full p-4 text-base"
              />
            </div>

            {/* Price per slot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per Slot (₹)</label>
              <Input
                type="number"
                step="0.01"
                value={pricePerSlot}
                onChange={(e) => setPricePerSlot(e.target.value)}
                placeholder="Enter price per slot"
                className="w-full p-4 text-base"
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Date Range</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-3 pr-10 py-6 text-base"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-3 pr-10 py-6 text-base"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Select Days */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Select Days</h2>
          <div className="flex flex-wrap gap-3">
            {days.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`px-6 py-3 rounded-lg font-medium text-base transition-all ${
                  selectedDays.includes(day.value)
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-500'
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>
        </div>

        {/* Choose Sport */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Choose Sport</h2>
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full p-4 pl-16 pr-10 border-2 border-gray-300 rounded-lg text-base font-medium appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {availableSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {/* Show selected sport icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
              {getSportIcon(selectedSport)}
            </div>
          </div>
        </div>

        {/* Select Time */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Select Time</h2>
          
          {!showSlots ? (
            <Button
              onClick={() => setShowSlots(true)}
              variant="outline"
              className="w-full py-8 text-lg font-semibold border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
            >
              Select Slots
            </Button>
          ) : (
            <Card className="p-4 border-2 border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">Available Time Slots</h3>
                <button
                  onClick={() => setShowSlots(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => toggleTimeSlot(slot)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeSlots.includes(slot)
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {selectedTimeSlots.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedTimeSlots.length} slot{selectedTimeSlots.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Create Booking Button */}
        <Button
          onClick={handleCheckAvailability}
          disabled={isSubmitting || !customerName || !customerPhone || !startDate || !endDate || selectedDays.length === 0 || selectedTimeSlots.length === 0}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-8 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Bookings...' : `Create Group Booking (${selectedTimeSlots.length} slots × ${selectedDays.length} days)`}
        </Button>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && bookingResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Close button */}
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  onBack();
                }}
                className="float-right text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              {/* Success Icon */}
              <div className="flex justify-center mb-4 mt-2">
                <div className="relative">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                      <path d="M9 14l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full"></div>
                  <div className="absolute bottom-2 left-0 w-4 h-4 bg-blue-400 rounded-full"></div>
                  <div className="absolute top-2 left-0 w-3 h-3 bg-pink-400 rounded-full"></div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-emerald-600 mb-4 text-center">Permanent booking created !</h2>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-base font-semibold text-emerald-600 mb-4 text-center">Booking details</h3>

                {/* Customer and Date info */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {format(new Date(bookingResult.startDate), 'dd MMM., yyyy')} - {format(new Date(bookingResult.endDate), 'dd MMM., yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bookingResult.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {getSportIcon(bookingResult.sport)} {bookingResult.sport}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 mb-1">{bookingResult.customerName}</div>
                    <div className="text-sm text-gray-600">+{bookingResult.customerPhone}</div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Bookings Created</span>
                    <span className="font-medium text-gray-900">{bookingResult.totalBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Slots per Day</span>
                    <span className="font-medium text-gray-900">{bookingResult.timeSlots.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days per Week</span>
                    <span className="font-medium text-gray-900">{bookingResult.days.length}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold">Selected Slots:</span>
                  </div>
                  <div className="pl-2 text-xs text-gray-600">
                    {bookingResult.timeSlots.map((slot, idx) => (
                      <div key={idx}>• {slot}</div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowSuccessDialog(false);
                    onBack();
                  }}
                  className="w-full mt-4 py-4 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600"
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
