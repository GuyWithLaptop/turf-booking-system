import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { title, description, amount, category, date, paymentMethod } = body;

    // Build update data object
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title && typeof title === 'string' ? title.trim().slice(0, 255) : null;
    }

    if (description !== undefined) {
      updateData.description = description && typeof description === 'string' ? String(description).trim().slice(0, 1000) : null;
    }

    if (amount !== undefined) {
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: 'Valid positive amount is required' }, { status: 400 });
      }
      if (parseFloat(amount) > 10000000) {
        return NextResponse.json({ error: 'Amount exceeds maximum limit' }, { status: 400 });
      }
      updateData.amount = parseFloat(amount);
    }

    if (category !== undefined) {
      const validCategories = ['MAINTENANCE', 'ELECTRICITY', 'WATER', 'STAFF_SALARY', 'EQUIPMENT', 'OTHER'];
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
      }
      updateData.category = category;
    }

    if (paymentMethod !== undefined) {
      const validPaymentMethods = ['Cash', 'Online', 'Card'];
      updateData.paymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'Cash';
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (parsedDate > tomorrow) {
        return NextResponse.json({ error: 'Date cannot be in the future' }, { status: 400 });
      }
      updateData.date = parsedDate;
    }

    // Update expense
    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error('Error updating expense:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Authentication check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID format (cuid format)
    if (!id || typeof id !== 'string' || id.length < 20) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    // Check if expense exists and user has permission
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Authorization check - only allow creator or owner to delete
    if (expense.createdById !== session.user.id && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
