import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { addDays, addWeeks, startOfDay, isBefore, isAfter, isSameDay } from 'date-fns';

// Validation schema for recurring bookings
const recurringBookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100).trim(),
  customerPhone: z.string().min(10, 'Valid phone number required').max(15).trim(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  recurringDays: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day'),
  recurringEndDate: z.string().datetime(),
  charge: z.number().min(0).max(50000).optional(),
  notes: z.string().max(1000).trim().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    const body = await req.json();
    const validatedData = recurringBookingSchema.parse(body);

    // If no session, get default owner user for public bookings
    let userId = session?.user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'OWNER' },
        select: { id: true },
      });
      if (!defaultUser) {
        return NextResponse.json(
          { error: 'System configuration error: No admin user found' },
          { status: 500 }
        );
      }
      userId = defaultUser.id;
    }

    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);
    const recurringEndDate = new Date(validatedData.recurringEndDate);

    // Validation checks
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    if (recurringEndDate <= startTime) {
      return NextResponse.json({ error: 'Recurring end date must be after start time' }, { status: 400 });
    }

    // Limit to 6 months max
    const sixMonthsLater = addWeeks(startTime, 26);
    if (isAfter(recurringEndDate, sixMonthsLater)) {
      return NextResponse.json({ error: 'Recurring bookings limited to 6 months' }, { status: 400 });
    }

    // Calculate the time duration (hours)
    const durationMs = endTime.getTime() - startTime.getTime();
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();

    // Generate all booking dates based on selected days
    const bookingDates: Date[] = [];
    let currentDate = startOfDay(startTime);
    const endDate = startOfDay(recurringEndDate);

    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
      const dayOfWeek = currentDate.getDay();
      if (validatedData.recurringDays.includes(dayOfWeek)) {
        // Create start time for this date
        const bookingStart = new Date(currentDate);
        bookingStart.setHours(startHour, startMinute, 0, 0);
        
        // Only include future dates
        if (isAfter(bookingStart, new Date())) {
          bookingDates.push(bookingStart);
        }
      }
      currentDate = addDays(currentDate, 1);
    }

    if (bookingDates.length === 0) {
      return NextResponse.json({ error: 'No valid future dates found for selected days' }, { status: 400 });
    }

    // Limit max bookings per request
    if (bookingDates.length > 100) {
      return NextResponse.json({ error: 'Too many bookings. Maximum 100 bookings per request' }, { status: 400 });
    }

    // Check for conflicts with existing bookings
    const conflictCheck = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: bookingDates.map(date => {
          const bookingEnd = new Date(date.getTime() + durationMs);
          return {
            AND: [
              { startTime: { lt: bookingEnd } },
              { endTime: { gt: date } },
            ],
          };
        }),
      },
      select: { startTime: true, endTime: true },
    });

    if (conflictCheck.length > 0) {
      return NextResponse.json({ 
        error: `Found ${conflictCheck.length} time slot conflict(s). Please check existing bookings.`,
        conflicts: conflictCheck.length 
      }, { status: 409 });
    }

    // Create parent booking ID for grouping
    const parentId = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create all bookings in a transaction
    const bookings = await prisma.$transaction(
      bookingDates.map((date, index) => {
        const bookingEnd = new Date(date.getTime() + durationMs);
        
        return prisma.booking.create({
          data: {
            customerName: validatedData.customerName,
            customerPhone: validatedData.customerPhone,
            startTime: date,
            endTime: bookingEnd,
            charge: validatedData.charge || 500,
            notes: validatedData.notes || '',
            isRecurring: true,
            recurringDays: JSON.stringify(validatedData.recurringDays),
            recurringEndDate: recurringEndDate,
            parentBookingId: parentId,
            createdById: userId,
            status: 'CONFIRMED',
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully created ${bookings.length} recurring bookings`,
      bookings: bookings.length,
      parentBookingId: parentId,
      dates: bookingDates.map(d => d.toISOString()),
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Recurring booking error:', error);
    return NextResponse.json({ error: 'Failed to create recurring bookings' }, { status: 500 });
  }
}

// Get all bookings in a recurring group
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentBookingId = searchParams.get('parentBookingId');

    if (!parentBookingId) {
      return NextResponse.json({ error: 'Parent booking ID required' }, { status: 400 });
    }

    const bookings = await prisma.booking.findMany({
      where: { parentBookingId },
      orderBy: { startTime: 'asc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });

  } catch (error) {
    console.error('Get recurring bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring bookings' }, { status: 500 });
  }
}

// Delete all bookings in a recurring group
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentBookingId = searchParams.get('parentBookingId');
    const deleteType = searchParams.get('type') || 'future'; // 'all' or 'future'

    if (!parentBookingId) {
      return NextResponse.json({ error: 'Parent booking ID required' }, { status: 400 });
    }

    let whereClause: any = { parentBookingId };

    // Only delete future bookings by default
    if (deleteType === 'future') {
      whereClause.startTime = { gte: new Date() };
    }

    const result = await prisma.booking.updateMany({
      where: whereClause,
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      message: `Cancelled ${result.count} booking(s)`,
      cancelled: result.count,
    }, { status: 200 });

  } catch (error) {
    console.error('Delete recurring bookings error:', error);
    return NextResponse.json({ error: 'Failed to cancel recurring bookings' }, { status: 500 });
  }
}
