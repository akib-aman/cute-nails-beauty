import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addMonths } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneMonthAgo = addMonths(now, -1);

    const { count } = await prisma.booking.deleteMany({
      where: {
        end: {
          lt: oneMonthAgo,
        },
      },
    });

    console.log(`Cron Job: Deleted ${count} bookings older than one month from their end date.`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count} old bookings.`,
    });
  } catch (error) {
    console.error('Cron Job Error: Failed to delete old bookings:', error);

    // --- FIX STARTS HERE ---
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // --- FIX ENDS HERE ---

    return NextResponse.json(
      { success: false, message: 'Failed to delete old bookings', error: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}