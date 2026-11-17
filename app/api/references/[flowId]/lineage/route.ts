import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFlowLineageGraph } from '@/lib/analytics-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/references/[flowId]/lineage
 * Mengembalikan graf DAG relasi dokumen & audit trail untuk suatu Flow ID.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ flowId: string }> }
) {
  const auth = await requireAuth(request, ['FLOW_READ']);
  if (auth.error) return auth.error;

  try {
    const { flowId } = await context.params;
    const graph = await getFlowLineageGraph(decodeURIComponent(flowId));
    return NextResponse.json({ success: true, data: graph });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat graf lineage dokumen';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
