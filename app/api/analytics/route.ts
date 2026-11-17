import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExecutiveAnalytics } from '@/lib/analytics-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/analytics
 * Mengembalikan metrik analitik eksekutif: Lead-Time Bottleneck, Open PO Aging, GRNI, dan Exception Queue.
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['FLOW_READ']);
  if (auth.error) return auth.error;

  try {
    const data = await getExecutiveAnalytics();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat data analitik';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
