import { NextResponse } from 'next/server';
import {
  validateBomToPr,
  validatePrToPo,
  validatePoToGr,
  validateGrToPi,
  validatePiToPp,
  validateAndSaveRelationInDb,
  BomToPrValidationParams,
  PrToPoValidationParams,
  PoToGrValidationParams,
  GrToPiValidationParams,
  PiToPpValidationParams,
  TransitionValidationResult,
} from '@/lib/validators/p2p-validator';
import { z } from 'zod';

const validateTransitionSchema = z.object({
  transition: z.enum(['BOM_TO_PR', 'PR_TO_PO', 'PO_TO_GR', 'GR_TO_PI', 'PI_TO_PP']),
  saveToDb: z.boolean().default(false),
  sourceDocumentId: z.string().optional(),
  targetDocumentId: z.string().optional(),
  payload: z.record(z.unknown()),
});

/**
 * POST /api/references/validate
 * Menjalankan uji validasi bisnis modular P2P (BOM->PR, PR->PO, PO->GR, GR->PI, PI->PP).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateTransitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format data validasi tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { transition, saveToDb, sourceDocumentId, targetDocumentId, payload } = parsed.data;

    let result: TransitionValidationResult;

    switch (transition) {
      case 'BOM_TO_PR':
        result = validateBomToPr(payload as unknown as BomToPrValidationParams);
        break;
      case 'PR_TO_PO':
        result = validatePrToPo(payload as unknown as PrToPoValidationParams);
        break;
      case 'PO_TO_GR':
        result = validatePoToGr(payload as unknown as PoToGrValidationParams);
        break;
      case 'GR_TO_PI':
        result = validateGrToPi(payload as unknown as GrToPiValidationParams);
        break;
      case 'PI_TO_PP':
        result = validatePiToPp(payload as unknown as PiToPpValidationParams);
        break;
      default:
        return NextResponse.json({ success: false, message: 'Tipe transisi tidak didukung' }, { status: 400 });
    }

    let savedRelation = null;
    if (saveToDb && sourceDocumentId && targetDocumentId) {
      savedRelation = await validateAndSaveRelationInDb({
        sourceDocumentId,
        targetDocumentId,
        performedBy: 'API Validation Endpoint',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        validation: result,
        savedRelation: savedRelation?.relation || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memvalidasi transisi';
    console.error('[API /api/references/validate POST error]:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
