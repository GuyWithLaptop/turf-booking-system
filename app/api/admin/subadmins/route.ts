import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Fetch all sub-admins
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subadmins = await prisma.user.findMany({
      where: {
        role: 'SUBADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ subadmins });
  } catch (error) {
    console.error('Error fetching sub-admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new sub-admin
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create sub-admin
    const subadmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUBADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(subadmin, { status: 201 });
  } catch (error) {
    console.error('Error creating sub-admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a sub-admin
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Verify user is a sub-admin
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role !== 'SUBADMIN') {
      return NextResponse.json({ error: 'User not found or not a sub-admin' }, { status: 404 });
    }

    // Delete the sub-admin
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sub-admin removed successfully' });
  } catch (error) {
    console.error('Error removing sub-admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
