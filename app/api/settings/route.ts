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
      // Use raw query to handle potentially missing columns
      const settings = await prisma.$queryRaw`
        SELECT 
          COALESCE("defaultPrice", 500) as "defaultPrice",
          COALESCE("turfName", 'FS Sports Club') as "turfName",
          COALESCE("turfAddress", '') as "turfAddress",
          COALESCE("turfNotes", '') as "turfNotes",
          COALESCE("turfPhone", '') as "turfPhone"
        FROM app_settings 
        WHERE id = 1 
        LIMIT 1
      ` as any[];
      
      if (settings && settings.length > 0) {
        return NextResponse.json(settings[0]);
      }
      
      // No settings found, return defaults
      return NextResponse.json({ 
        defaultPrice: 500,
        turfName: 'FS Sports Club',
        turfAddress: '',
        turfNotes: '',
        turfPhone: ''
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // Table doesn't exist or columns missing, return defaults
      return NextResponse.json({ 
        defaultPrice: 500,
        turfName: 'FS Sports Club',
        turfAddress: '',
        turfNotes: '',
        turfPhone: ''
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      defaultPrice: 500,
      turfName: 'FS Sports Club',
      turfAddress: '',
      turfNotes: '',
      turfPhone: ''
    }, { status: 200 });
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
