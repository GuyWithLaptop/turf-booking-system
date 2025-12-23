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
    endTime: '',
    pricePerHour: 0,
    advance: 0,
    discount: 0,
    onlinePayment: 0,
    cashPayment: 0,
  });

  if (!booking) return null;

  // Helper function to get display status
  const getDisplayStatus = () => {
    const now = new Date();
    const endTime = new Date(booking.endTime);
    
    // If booking time has passed, show as COMPLETED
    if (endTime < now && booking.status !== 'CANCELLED') {
      return 'COMPLETED';
    }
    
    return booking.status;
  };

  const displayStatus = getDisplayStatus();

  const handleEdit = () => {
    // Parse notes for advance payment and discount
    const advanceMatch = booking.notes?.match(/Advance:\s*(\d+)/);
    const discountMatch = booking.notes?.match(/Discount:\s*(\d+)/);
    const advance = advanceMatch ? parseInt(advanceMatch[1]) : 0;
    const discount = discountMatch ? parseInt(discountMatch[1]) : 0;
    
    // Calculate price per hour
    const hours = Math.abs(new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 36e5;
    const pricePerHour = hours > 0 ? Math.round(booking.charge / hours) : 0;
    
    setEditData({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      startTime: booking.startTime,
      endTime: booking.endTime,
      pricePerHour: pricePerHour,
      advance: advance,
      discount: discount,
      onlinePayment: 0,
      cashPayment: 0,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Calculate total charge based on hours and price per hour
      const hours = Math.abs(new Date(editData.endTime).getTime() - new Date(editData.startTime).getTime()) / 36e5;
      const totalCharge = Math.round(hours * editData.pricePerHour);
      
      // Build notes with payment details
      const notes = `Advance: ${editData.advance}, Discount: ${editData.discount}, Online: ${editData.onlinePayment}, Cash: ${editData.cashPayment}`;
      
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editData.customerName,
          customerPhone: editData.customerPhone,
          startTime: editData.startTime,
          endTime: editData.endTime,
          charge: totalCharge,
          notes: notes,
          status: booking.status,
        }),
      });

      if (response.ok) {
        alert('Booking updated successfully!');
        setIsEditing(false);
        onUpdate?.();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update booking');
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
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b flex items-center gap-4">
              <button onClick={() => setIsEditing(false)} className="p-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Update booking</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="customerName" className="text-base font-semibold">Full Name</Label>
                <div className="relative mt-2">
                  <Input
                    id="customerName"
                    value={editData.customerName}
                    onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                    placeholder="Enter full name"
                    className="pr-10 py-6 text-base"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mobile no. */}
              <div>
                <Label htmlFor="customerPhone" className="text-base font-semibold">Mobile no.</Label>
                <div className="relative mt-2">
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={editData.customerPhone}
                    onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                    placeholder="Enter mobile number"
                    className="pr-10 py-6 text-base"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Price per Hours and Advance payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerHour" className="text-base font-semibold">Price per Hours</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                    <Input
                      id="pricePerHour"
                      type="number"
                      value={editData.pricePerHour}
                      onChange={(e) => setEditData({ ...editData, pricePerHour: parseInt(e.target.value) || 0 })}
                      className="pl-8 py-6 text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="advance" className="text-base font-semibold">Advance payment</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                    <Input
                      id="advance"
                      type="number"
                      value={editData.advance}
                      onChange={(e) => setEditData({ ...editData, advance: parseInt(e.target.value) || 0 })}
                      className="pl-8 py-6 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Discount price */}
              <div>
                <Label htmlFor="discount" className="text-base font-semibold">Discount price</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                  <Input
                    id="discount"
                    type="number"
                    value={editData.discount}
                    onChange={(e) => setEditData({ ...editData, discount: parseInt(e.target.value) || 0 })}
                    className="pl-8 py-6 text-base"
                  />
                </div>
              </div>

              {/* Online Payment and Cash Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="onlinePayment" className="text-base font-semibold">Online Payment</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                    <Input
                      id="onlinePayment"
                      type="number"
                      value={editData.onlinePayment}
                      onChange={(e) => setEditData({ ...editData, onlinePayment: parseInt(e.target.value) || 0 })}
                      className="pl-8 py-6 text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cashPayment" className="text-base font-semibold">Cash Payment</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                    <Input
                      id="cashPayment"
                      type="number"
                      value={editData.cashPayment}
                      onChange={(e) => setEditData({ ...editData, cashPayment: parseInt(e.target.value) || 0 })}
                      className="pl-8 py-6 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="bg-white rounded-xl p-6 mt-6 border-2 border-gray-200">
                <h3 className="text-xl font-semibold text-emerald-600 text-center mb-4">
                  Booking Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {format(new Date(editData.startTime), 'dd MMM yyyy')} | {editData.customerName || 'Name'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(editData.startTime), 'h:mm a')} - {format(new Date(editData.endTime), 'h:mm a')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{editData.customerName || 'shnssshhshhs'}</div>
                      <div className="text-sm text-gray-600">+91 {editData.customerPhone}</div>
                    </div>
                  </div>

                  <div className="border-t pt-3 text-sm text-gray-600">
                    <div className="text-right">
                      Booking hours: <span className="font-semibold text-gray-900">
                        {Math.abs(new Date(editData.endTime).getTime() - new Date(editData.startTime).getTime()) / 36e5} hrs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Booking Button */}
              <Button
                onClick={handleSaveEdit}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-semibold mt-6"
              >
                Update Booking
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
                <div className={`inline-block text-xs px-3 py-1 rounded-full mt-3 font-medium ${
                  displayStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                  displayStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                  displayStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                  displayStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {displayStatus === 'COMPLETED' ? 'PLAYED' : displayStatus}
                </div>
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
