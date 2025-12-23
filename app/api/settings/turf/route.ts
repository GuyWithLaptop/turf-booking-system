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

    // Try to update or create app settings with turf info
    try {
      const settings = await prisma.$executeRaw`
        INSERT INTO app_settings (id, "defaultPrice", "turfName", "turfAddress", "turfNotes", "turfPhone", "updatedAt")
        VALUES (1, 500, ${turfName || 'FS Sports Club'}, ${turfAddress || ''}, ${turfNotes || ''}, ${turfPhone || ''}, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
          "turfName" = COALESCE(EXCLUDED."turfName", app_settings."turfName"),
          "turfAddress" = COALESCE(EXCLUDED."turfAddress", app_settings."turfAddress"),
          "turfNotes" = COALESCE(EXCLUDED."turfNotes", app_settings."turfNotes"),
          "turfPhone" = COALESCE(EXCLUDED."turfPhone", app_settings."turfPhone"),
          "updatedAt" = NOW()
      `;

      return NextResponse.json({
        success: true,
        turfName: turfName || 'FS Sports Club',
        turfAddress: turfAddress || '',
        turfNotes: turfNotes || '',
        turfPhone: turfPhone || '',
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      
      // If columns don't exist, return helpful error
      if (dbError.message?.includes('column') && dbError.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Database migration required. Please run fix-database.sql in Supabase SQL editor.',
          details: dbError.message
        }, { status: 500 });
      }
      
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error updating turf info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update turf info',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
