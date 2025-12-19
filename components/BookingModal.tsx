'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Booking } from '@prisma/client';
import { addDays, addWeeks, format } from 'date-fns';
import { Repeat } from 'lucide-react';

type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  booking?: Booking | null;
  initialStartTime?: Date;
  initialEndTime?: Date;
};

export default function BookingModal({
  open,
  onClose,
  onSave,
  booking,
  initialStartTime,
  initialEndTime,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    startTime: '',
    endTime: '',
    status: 'PENDING',
    charge: '500',
    notes: '',
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      // Editing existing booking
      setFormData({
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        startTime: formatDateTimeLocal(new Date(booking.startTime)),
        endTime: formatDateTimeLocal(new Date(booking.endTime)),
        status: booking.status,
        charge: String(booking.charge || 500),
        notes: booking.notes || '',
      });
    } else if (initialStartTime && initialEndTime) {
      // New booking with initial times
      setFormData({
        customerName: '',
        customerPhone: '',
        startTime: formatDateTimeLocal(initialStartTime),
        endTime: formatDateTimeLocal(initialEndTime),
        status: 'PENDING',
        charge: '500',
        notes: '',
      });
    } else {
      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        startTime: '',
        endTime: '',
        status: 'PENDING',
        charge: '500',
        notes: '',
      });
    }
    setError('');
  }, [booking, initialStartTime, initialEndTime, open]);

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toggleRecurringDay = (day: number) => {
    setRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation for recurring bookings
      if (isRecurring && !booking) {
        if (recurringDays.length === 0) {
          throw new Error('Please select at least one day for recurring booking');
        }
        if (!recurringEndDate) {
          throw new Error('Please select an end date for recurring booking');
        }
      }

      const payload = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        status: formData.status,
        charge: parseFloat(formData.charge),
        notes: formData.notes,
      };

      // Use recurring endpoint for new recurring bookings
      let url = booking ? `/api/bookings/${booking.id}` : '/api/bookings';
      let method = booking ? 'PATCH' : 'POST';

      if (isRecurring && !booking) {
        url = '/api/bookings/recurring';
        Object.assign(payload, {
          recurringDays,
          recurringEndDate: new Date(recurringEndDate).toISOString(),
        });
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save booking');
      }

      const result = await response.json();
      
      if (isRecurring && result.bookings) {
        alert(`Successfully created ${result.bookings} recurring bookings!`);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;

    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete booking');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-gradient-to-br from-white to-gray-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {booking ? 'Edit Booking' : 'New Booking'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="customerName">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                required
                placeholder="Enter customer name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerPhone">
                Customer Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                required
                placeholder="+91 9876543210"
              />
            </div>

            {/* Time Slot Display */}
            {(initialStartTime && initialEndTime) || booking ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-4">
                <Label className="text-sm font-semibold text-emerald-800 mb-2 block">
                  Selected Time Slot
                </Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="text-lg font-bold text-gray-800">
                      {format(new Date(formData.startTime), 'EEE, MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-3xl text-emerald-600 font-bold">→</div>
                  <div className="space-y-1 text-right">
                    <div className="text-sm text-gray-600">Time</div>
                    <div className="text-lg font-bold text-gray-800">
                      {format(new Date(formData.startTime), 'h:mm a')} - {format(new Date(formData.endTime), 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-emerald-700 text-center">
                  📅 2 hour slot selected
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-800">
                  ⚠️ Please select a time slot from the calendar to create a booking
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="charge">
                Charge Amount (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="charge"
                type="number"
                step="0.01"
                min="0"
                value={formData.charge}
                onChange={(e) =>
                  setFormData({ ...formData, charge: e.target.value })
                }
                required
                placeholder="500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* Recurring Booking Options - Only for new bookings */}
            {!booking && (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(checked as boolean);
                      if (!checked) {
                        setRecurringDays([]);
                        setRecurringEndDate('');
                      }
                    }}
                  />
                  <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                    <Repeat className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Recurring Booking (Multiple Days)</span>
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-4 pl-6 border-l-2 border-emerald-200">
                    <div className="grid gap-2">
                      <Label>Select Days to Repeat</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <Button
                            key={day}
                            type="button"
                            variant={recurringDays.includes(index) ? 'default' : 'outline'}
                            className={`text-xs ${
                              recurringDays.includes(index)
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : ''
                            }`}
                            onClick={() => toggleRecurringDay(index)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {recurringDays.length > 0 && (
                        <p className="text-xs text-gray-600">
                          Selected: {recurringDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="recurringEndDate">
                        Repeat Until <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="recurringEndDate"
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        min={formData.startTime ? format(addDays(new Date(formData.startTime), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                        max={format(addWeeks(new Date(), 26), 'yyyy-MM-dd')}
                        required={isRecurring}
                      />
                      <p className="text-xs text-gray-500">
                        Maximum 6 months from start date
                      </p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm text-emerald-800">
                      <p className="font-semibold mb-1">📅 Recurring Booking Info:</p>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>This will create multiple bookings for selected days</li>
                        <li>Same time slot will be reserved on each selected day</li>
                        <li>All bookings will be auto-confirmed if slots are available</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 pt-4">
            {booking && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="font-semibold"
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="font-semibold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold px-6"
            >
              {loading ? 'Saving...' : 'Save Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
