import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID format (cuid format)
    if (!params.id || typeof params.id !== 'string' || params.id.length < 20) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
    }

    // Check if expense exists and user has permission
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Authorization check - only allow creator or admin to delete
    if (expense.createdById !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id: params.id },
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
