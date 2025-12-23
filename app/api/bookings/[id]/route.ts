import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').optional(),
  customerPhone: z.string().min(1, 'Customer phone is required').optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  notes: z.string().optional(),
});

// PATCH - Update booking (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only check for overlapping if time is being changed
    if (validatedData.startTime || validatedData.endTime) {
      const startTime = validatedData.startTime ? new Date(validatedData.startTime) : existingBooking.startTime;
      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : existingBooking.endTime;

      // Check for overlapping bookings (excluding current booking)
      const overlapping = await prisma.booking.findFirst({
        where: {
          AND: [
            {
              id: {
                not: id,
              },
            },
            {
              startTime: {
                lt: endTime,
              },
            },
            {
              endTime: {
                gt: startTime,
              },
            },
            {
              status: {
                notIn: ['CANCELLED'],
              },
            },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          { error: 'Time slot is already booked' },
          { status: 409 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (validatedData.customerName !== undefined) updateData.customerName = validatedData.customerName;
    if (validatedData.customerPhone !== undefined) updateData.customerPhone = validatedData.customerPhone;
    if (validatedData.startTime !== undefined) updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime !== undefined) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE - Delete booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
