import { NextResponse } from 'next/server';
import {
  listAccurateItems,
  getAccurateItemDetail,
  saveAccurateItem,
} from '@/lib/accurate';
import { db } from '@/lib/db';
import { DocumentType, DocumentStatus, ValidationStatus } from '@prisma/client';
import { z } from 'zod';

const saveItemSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi'),
  itemType: z.enum(['INVENTORY', 'NON_INVENTORY', 'SERVICE', 'GROUP']).default('INVENTORY'),
  no: z.string().optional(),
  unitPrice: z.number().optional(),
  notes: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  saveToPostgre: z.boolean().default(true),
});

/**
 * GET /api/accurate/items
 * Membaca data item dari Accurate Online (List atau Detail).
 * Query params:
 * - id: jika diisi, mengambil detail item (GET /accurate/api/item/detail.do)
 * - page: halaman (default 1)
 * - pageSize: jumlah item per halaman (default 20)
 * - itemType: INVENTORY | NON_INVENTORY | SERVICE | GROUP
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (itemId) {
      const detail = await getAccurateItemDetail(itemId);
      return NextResponse.json({
        success: true,
        data: detail.d,
      });
    }

    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const itemType = searchParams.get('itemType') || undefined;

    const listResult = await listAccurateItems({
      page,
      pageSize,
      itemType,
    });

    return NextResponse.json({
      success: true,
      data: listResult.d,
      pagination: listResult.sp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data item dari Accurate';
    console.error('[API /api/accurate/items GET error]:', error);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accurate/items
 * Menyimpan data barang/jasa ke Accurate Online (POST /accurate/api/item/save.do)
 * dan mencatat hasilnya ke database PostgreSQL Document Reference.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format data item tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, itemType, no, unitPrice, notes, id, saveToPostgre } = parsed.data;

    // 1. Kirim ke Accurate Online API
    const accurateResponse = await saveAccurateItem({
      name,
      itemType,
      no,
      unitPrice,
      notes,
      id,
    });

    let postgreDoc = null;

    // 2. Jika diminta simpan ke PostgreSQL database
    if (saveToPostgre) {
      const generatedNo = no || (accurateResponse.r?.no as string) || `ITM-${Date.now()}`;
      try {
        postgreDoc = await db.document.upsert({
          where: { documentNumber: generatedNo },
          update: {
            description: `Item AOL: ${name} (${itemType})`,
            amount: unitPrice || 0,
            notes: notes || undefined,
            updatedAt: new Date(),
          },
          create: {
            documentType: DocumentType.BOM,
            documentNumber: generatedNo,
            documentDate: new Date(),
            vendor: 'Accurate Item Catalog',
            amount: unitPrice || 0,
            currency: 'IDR',
            status: DocumentStatus.APPROVED,
            validationStatus: ValidationStatus.VALID,
            description: `Item AOL: ${name} (${itemType})`,
            notes: notes || undefined,
            createdBy: 'Accurate API Sync',
          },
        });

        // Catat ke Audit Log PostgreSQL
        await db.auditLog.create({
          data: {
            documentId: postgreDoc.id,
            action: id ? 'UPDATE_FROM_ACCURATE' : 'CREATE_FROM_ACCURATE',
            performedBy: 'Accurate API Integration',
            details: JSON.stringify({ accurateResponse: accurateResponse.d }),
          },
        });
      } catch (dbErr) {
        console.warn('[PostgreSQL Save Warning]: Gagal menyimpan item ke PostgreSQL:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Item berhasil disimpan ke Accurate Online',
      accurate: accurateResponse,
      postgreDocument: postgreDoc,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan item ke Accurate';
    console.error('[API /api/accurate/items POST error]:', error);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
