import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { turfName, turfAddress, turfNotes, turfPhone } = await request.json();

    // Update or create app settings with turf info
    // Using type assertion since schema hasn't been migrated yet
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {
        ...(turfName !== undefined && { turfName: turfName || 'FS Sports Club' }),
        ...(turfAddress !== undefined && { turfAddress: turfAddress || '' }),
        ...(turfNotes !== undefined && { turfNotes: turfNotes || '' }),
        ...(turfPhone !== undefined && { turfPhone: turfPhone || '' }),
        updatedAt: new Date(),
      } as any,
      create: {
        id: 1,
        turfName: turfName || 'FS Sports Club',
        turfAddress: turfAddress || '',
        turfNotes: turfNotes || '',
        turfPhone: turfPhone || '',
        defaultPrice: 500,
        sports: ['Football', 'Cricket', 'Basketball'],
      } as any,
    });

    return NextResponse.json({
      success: true,
      turfName: (settings as any).turfName || 'FS Sports Club',
      turfAddress: (settings as any).turfAddress || '',
      turfNotes: (settings as any).turfNotes || '',
      turfPhone: (settings as any).turfPhone || '',
    });
  } catch (error) {
    console.error('Error updating turf info:', error);
    return NextResponse.json(
      { error: 'Failed to update turf info' },
      { status: 500 }
    );
  }
}
