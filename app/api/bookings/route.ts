import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for booking validation
const bookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  notes: z.string().optional(),
  charge: z.number().positive().optional().default(500),
});

// GET - Fetch all bookings (public + admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const where: any = {};

    // Filter by date range if provided
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Filter by status if provided
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST - Create new booking (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

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

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        AND: [
          {
            startTime: {
              lt: new Date(validatedData.endTime),
            },
          },
          {
            endTime: {
              gt: new Date(validatedData.startTime),
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

    const booking = await prisma.booking.create({
      data: {
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        status: validatedData.status,
        notes: validatedData.notes,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
