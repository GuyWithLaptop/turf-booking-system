import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sports = await prisma.sport.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ sports: sports.map(s => s.name) });
  } catch (error) {
    console.error('Error fetching sports:', error);
    return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Sport name is required' }, { status: 400 });
    }

    // Check if sport already exists
    const existing = await prisma.sport.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'Sport already exists' }, { status: 400 });
    }

    const sport = await prisma.sport.create({
      data: { name: name.trim() }
    });

    return NextResponse.json({ name: sport.name });
  } catch (error) {
    console.error('Error adding sport:', error);
    return NextResponse.json({ error: 'Failed to add sport' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Sport name is required' }, { status: 400 });
    }

    await prisma.sport.delete({
      where: { name }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sport:', error);
    return NextResponse.json({ error: 'Failed to delete sport' }, { status: 500 });
  }
}
