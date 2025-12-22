import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '100'))); // Max 100 items
    const category = searchParams.get('category');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (category) {
      const validCategories = ['MAINTENANCE', 'ELECTRICITY', 'WATER', 'STAFF_SALARY', 'EQUIPMENT', 'OTHER'];
      if (validCategories.includes(category)) {
        where.category = category;
      }
    }

    // Fetch expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          createdBy: {
            select: { 
              name: true, 
              email: true,
              // Don't expose sensitive user data
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { title, description, amount, category, date } = body;

    // Input validation - title is now optional, but at least one of title or description is required
    const hasTitle = title && typeof title === 'string' && title.trim().length > 0;
    const hasDescription = description && typeof description === 'string' && String(description).trim().length > 0;
    
    if (!hasTitle && !hasDescription) {
      return NextResponse.json({ error: 'Title or description is required' }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid positive amount is required' }, { status: 400 });
    }

    // Validate category against allowed values
    const validCategories = ['MAINTENANCE', 'ELECTRICITY', 'WATER', 'STAFF_SALARY', 'EQUIPMENT', 'OTHER'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedTitle = hasTitle ? title.trim().slice(0, 255) : null;
    const sanitizedDescription = hasDescription ? String(description).trim().slice(0, 1000) : null;
    const sanitizedAmount = parseFloat(amount);

    // Validate amount limits (prevent extreme values)
    if (sanitizedAmount > 10000000) {
      return NextResponse.json({ error: 'Amount exceeds maximum limit' }, { status: 400 });
    }

    // Validate and parse date
    let expenseDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      // Prevent future dates beyond 1 day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (parsedDate > tomorrow) {
        return NextResponse.json({ error: 'Date cannot be in the future' }, { status: 400 });
      }
      expenseDate = parsedDate;
    }

    // Verify user exists in database, or get a default owner user
    let userId = session.user.id;
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      // If session user doesn't exist, find the first OWNER user
      const ownerUser = await prisma.user.findFirst({
        where: { role: 'OWNER' },
        select: { id: true },
      });

      if (!ownerUser) {
        return NextResponse.json(
          { error: 'No valid user found. Please ensure at least one admin user exists.' },
          { status: 500 }
        );
      }
      userId = ownerUser.id;
    }

    // Create expense with sanitized data
    const expense = await prisma.expense.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        amount: sanitizedAmount,
        category,
        date: expenseDate,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if it's a Prisma error
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Foreign key constraint error. User reference invalid.' },
          { status: 500 }
        );
      }
      
      // Check if it's a database schema error
      if (error.message.includes('column') || error.message.includes('field')) {
        return NextResponse.json(
          { error: 'Database schema mismatch. Please run database migrations.' },
          { status: 500 }
        );
      }
    }
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
}
