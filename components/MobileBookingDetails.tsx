'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Edit, Phone, Share2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  charge: number;
  notes?: string;
};

type MobileBookingDetailsProps = {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function MobileBookingDetails({
  booking,
  open,
  onClose,
  onUpdate,
}: MobileBookingDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customerName: '',
    customerPhone: '',
    startTime: '',
    charge: 0,
    advance: 0,
    discount: 0,
  });

  if (!booking) return null;

  const handleEdit = () => {
    setEditData({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      startTime: booking.startTime,
      charge: booking.charge,
      advance: 0,
      discount: 0,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editData.customerName,
          customerPhone: editData.customerPhone,
          charge: editData.charge,
        }),
      });

      if (response.ok) {
        alert('Booking updated successfully!');
        setIsEditing(false);
        onUpdate?.();
        onClose();
      } else {
        alert('Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Booking deleted successfully!');
        onUpdate?.();
        onClose();
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const handleShare = () => {
    const bookingDetails = `
Booking Details
Date: ${format(new Date(booking.startTime), 'dd MMM yyyy')}
Time: ${format(new Date(booking.startTime), 'h:mm a')} - ${format(new Date(booking.endTime), 'h:mm a')}
Customer: ${booking.customerName}
Phone: ${booking.customerPhone}
Total Amount: Rs. ${booking.charge}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'Booking Details',
        text: bookingDetails,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(bookingDetails);
      alert('Booking details copied to clipboard!');
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${booking.customerPhone}`;
  };

  // Calculate booking hours
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const hours = Math.abs(endDate.getTime() - startDate.getTime()) / 36e5;

  // Parse notes for advance payment
  const advanceMatch = booking.notes?.match(/Advance:\s*(\d+)/);
  const advance = advanceMatch ? parseInt(advanceMatch[1]) : 0;
  const discount = 0; // Can be enhanced later
  const paid = booking.charge;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 bg-gray-50">
        <DialogTitle className="sr-only">
          {isEditing ? 'Edit Booking' : 'Booking Details'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing ? 'Edit the booking information' : 'View detailed information about this booking'}
        </DialogDescription>
        {isEditing ? (
          // Edit Mode
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setIsEditing(false)} className="p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Edit Booking</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={editData.customerName}
                  onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                  placeholder="Customer Name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={editData.customerPhone}
                  onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                  placeholder="Phone Number"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Total Charge</Label>
                <Input
                  type="number"
                  value={editData.charge}
                  onChange={(e) => setEditData({ ...editData, charge: parseInt(e.target.value) })}
                  placeholder="Total Charge"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSaveEdit}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6"
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div>
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold">Booking Details</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Date and Time */}
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {format(new Date(booking.startTime), 'dd MMM yyyy')}
                  </h3>
                  <button onClick={handleEdit} className="p-2">
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <p className="text-gray-600 font-medium text-lg">
                  {booking.customerName}
                </p>
                <p className="text-gray-700 text-xl font-semibold mt-2">
                  {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                </p>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-semibold text-lg">{booking.customerName}</p>
                  <p className="text-gray-600">{booking.customerPhone}</p>
                </div>
                <button
                  onClick={handleCall}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>

              {/* Booking Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-emerald-600 text-center mb-6">
                  Booking Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Booking Hours</span>
                    <span className="font-semibold text-gray-900">{hours} hrs</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Booking sub-total</span>
                    <span className="font-semibold text-gray-900">Rs. {booking.charge}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Advance payment</span>
                    <span className="font-semibold text-gray-900">Rs. {advance}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Discount payment</span>
                    <span className="font-semibold text-gray-900">Rs. {discount}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">Rs. {booking.charge}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-gray-600">Paid</span>
                    <span className="font-semibold text-gray-900">Rs. {paid}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="flex-1 py-6 text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete Booking
                </Button>
                <Button
                  onClick={handleEdit}
                  className="flex-1 py-6 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                >
                  Edit Booking
                </Button>
              </div>

              {/* Share Section */}
              <div className="pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share Booking Details
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg py-4 flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-4 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
