import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const settings = await prisma.appSettings.findFirst();
      return NextResponse.json({ 
        defaultPrice: settings?.defaultPrice || 500 
      });
    } catch (dbError: any) {
      // Table doesn't exist yet, return defaults
      if (dbError.code === 'P2021') {
        return NextResponse.json({ defaultPrice: 500 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ defaultPrice: 500 }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { defaultPrice } = body;

    if (typeof defaultPrice !== 'number' || defaultPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Upsert settings (create or update)
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { defaultPrice },
      create: { id: 1, defaultPrice }
    });

    return NextResponse.json({ defaultPrice: settings.defaultPrice });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
