import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const days = parseInt(searchParams.get('days') || '30');

    const stats = await AnalyticsService.getMessageStats(chatId || undefined, days);

    if (!stats) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: stats,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching message stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}