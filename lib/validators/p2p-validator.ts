import { DocumentType, ValidationStatus } from '@prisma/client';
import { db } from '@/lib/db';

export type ValidationStatusType = 'VALID' | 'INVALID' | 'WARNING';

export type P2PTransitionType =
  | 'BOM_TO_PR'
  | 'PR_TO_PO'
  | 'PO_TO_GR'
  | 'GR_TO_PI'
  | 'PI_TO_PP';

export interface TransitionValidationResult {
  transition: P2PTransitionType;
  passed: boolean;
  status: ValidationStatusType;
  ruleName: string;
  ruleDescription: string;
  summary: string;
  discrepancy: string | null;
  calculation: {
    sourceValue: number;
    targetValue: number;
    difference: number;
    limitValue?: number;
    details?: Record<string, unknown>;
  };
}

// -------------------------------------------------------------
// 1. BOM ke PR Validator (Kardinalitas: 1 : N)
// Aturan: Total kuantitas barang di PR tidak boleh melebihi formula
// kebutuhan rasio BOM dikalikan dengan target kuantitas batch produksi.
// -------------------------------------------------------------
export interface BomToPrValidationParams {
  bomDoc: {
    documentNumber: string;
    batchQuantity: number; // Target kuantitas batch output produksi
    bomRatio: number;      // Rasio kebutuhan raw material per 1 unit output
  };
  prDoc: {
    documentNumber: string;
    quantity: number;      // Kuantitas yang diminta pada PR ini
  };
  existingPrQuantity?: number; // Akumulasi kuantitas PR lain yang sudah terbit dari BOM ini
}

export function validateBomToPr(params: BomToPrValidationParams): TransitionValidationResult {
  const { bomDoc, prDoc, existingPrQuantity = 0 } = params;
  const maxAllowedQty = bomDoc.bomRatio * bomDoc.batchQuantity;
  const totalRequestedQty = existingPrQuantity + prDoc.quantity;
  const difference = totalRequestedQty - maxAllowedQty;

  const ruleName = 'RULE_BOM_PR_QUANTITY_RATIO';
  const ruleDescription = 'Total kuantitas PR tidak boleh melebihi formula rasio BOM x target batch produksi';

  if (totalRequestedQty > maxAllowedQty) {
    return {
      transition: 'BOM_TO_PR',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Pelanggaran Rasio BOM: Total PR (${totalRequestedQty}) melebihi kuota formula BOM (${maxAllowedQty})`,
      discrepancy: `Kuantitas PR (${prDoc.quantity} unit${existingPrQuantity > 0 ? ` + riwayat PR sebelumnya ${existingPrQuantity} unit` : ''}) melampaui batas kebutuhan BOM (${bomDoc.bomRatio} rasio x ${bomDoc.batchQuantity} target batch = ${maxAllowedQty} unit). Terjadi selisih lebih sebesar ${difference.toFixed(2)} unit.`,
      calculation: {
        sourceValue: maxAllowedQty,
        targetValue: totalRequestedQty,
        difference,
        limitValue: maxAllowedQty,
        details: {
          bomRatio: bomDoc.bomRatio,
          batchQuantity: bomDoc.batchQuantity,
          currentPrQty: prDoc.quantity,
          previousPrQty: existingPrQuantity,
        },
      },
    };
  }

  const isPartial = totalRequestedQty < maxAllowedQty;
  return {
    transition: 'BOM_TO_PR',
    passed: true,
    status: 'VALID',
    ruleName,
    ruleDescription,
    summary: isPartial
      ? `Valid (Parsial): PR menyerap ${totalRequestedQty} dari total ${maxAllowedQty} unit alokasi BOM (tersisa ${(maxAllowedQty - totalRequestedQty).toFixed(2)} unit)`
      : `Valid: Total kuantitas PR memenuhi 100% kuota formula BOM (${maxAllowedQty} unit)`,
    discrepancy: null,
    calculation: {
      sourceValue: maxAllowedQty,
      targetValue: totalRequestedQty,
      difference: 0,
      limitValue: maxAllowedQty,
      details: {
        remainingQuota: maxAllowedQty - totalRequestedQty,
      },
    },
  };
}

// -------------------------------------------------------------
// 2. PR ke PO Validator (Kardinalitas: N : 1 atau 1 : 1)
// Aturan: Akumulasi quantity item di PO tidak boleh melampaui
// sisa kebutuhan PR yang statusnya masih OPEN / belum dipesan.
// -------------------------------------------------------------
export interface PrToPoValidationParams {
  prDocs: Array<{
    documentNumber: string;
    totalQuantity: number;
    orderedQuantity?: number; // Kuantitas yang sudah pernah dibuatkan PO
    status?: string;          // Status PR (misal 'APPROVED', 'OPEN', 'REJECTED')
  }>;
  poDoc: {
    documentNumber: string;
    quantity: number;        // Kuantitas yang dipesan pada lembar PO ini
  };
}

export function validatePrToPo(params: PrToPoValidationParams): TransitionValidationResult {
  const { prDocs, poDoc } = params;

  // Hitung total sisa kuantitas terbuka (open) dari seluruh PR yang digabungkan
  let totalOpenPrQty = 0;
  const prBreakdown: Record<string, { total: number; ordered: number; remaining: number }> = {};

  for (const pr of prDocs) {
    if (pr.status === 'REJECTED' || pr.status === 'ARCHIVED') {
      continue;
    }
    const ordered = pr.orderedQuantity || 0;
    const remaining = Math.max(0, pr.totalQuantity - ordered);
    totalOpenPrQty += remaining;
    prBreakdown[pr.documentNumber] = {
      total: pr.totalQuantity,
      ordered,
      remaining,
    };
  }

  const difference = poDoc.quantity - totalOpenPrQty;
  const ruleName = 'RULE_PR_PO_OPEN_BALANCE';
  const ruleDescription = 'Kuantitas PO tidak boleh melampaui akumulasi sisa kuantitas PR yang berstatus OPEN';

  if (poDoc.quantity > totalOpenPrQty) {
    return {
      transition: 'PR_TO_PO',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Pelanggaran Sisa PR: PO (${poDoc.quantity}) melebihi total kuantitas PR terbuka (${totalOpenPrQty})`,
      discrepancy: `Kuantitas pada PO (${poDoc.quantity} unit) melampaui sisa kebutuhan PR terbuka (${totalOpenPrQty} unit dari ${prDocs.length} dokumen PR rujukan). Terjadi over-request sebesar ${difference.toFixed(2)} unit.`,
      calculation: {
        sourceValue: totalOpenPrQty,
        targetValue: poDoc.quantity,
        difference,
        limitValue: totalOpenPrQty,
        details: { prBreakdown },
      },
    };
  }

  return {
    transition: 'PR_TO_PO',
    passed: true,
    status: 'VALID',
    ruleName,
    ruleDescription,
    summary: `Valid: Kuantitas PO (${poDoc.quantity} unit) sesuai alokasi sisa PR terbuka (${totalOpenPrQty} unit). Sisa saldo PR: ${(totalOpenPrQty - poDoc.quantity).toFixed(2)} unit`,
    discrepancy: null,
    calculation: {
      sourceValue: totalOpenPrQty,
      targetValue: poDoc.quantity,
      difference: 0,
      limitValue: totalOpenPrQty,
      details: {
        remainingOpenPr: totalOpenPrQty - poDoc.quantity,
        prBreakdown,
      },
    },
  };
}

// -------------------------------------------------------------
// 3. PO ke GR Validator (Kardinalitas: 1 : N - Partial Delivery)
// Aturan: Akumulasi quantity barang masuk pada seluruh dokumen GR
// yang terhubung tidak boleh melebihi total pesanan di PO.
// -------------------------------------------------------------
export interface PoToGrValidationParams {
  poDoc: {
    documentNumber: string;
    totalOrderedQuantity: number;
  };
  currentGrDoc: {
    documentNumber: string;
    receivedQuantity: number;
  };
  previousGrReceivedQuantity?: number; // Akumulasi penerimaan barang pada GR terdahulu untuk PO ini
}

export function validatePoToGr(params: PoToGrValidationParams): TransitionValidationResult {
  const { poDoc, currentGrDoc, previousGrReceivedQuantity = 0 } = params;
  const totalReceivedSoFar = previousGrReceivedQuantity + currentGrDoc.receivedQuantity;
  const difference = totalReceivedSoFar - poDoc.totalOrderedQuantity;

  const ruleName = 'RULE_PO_GR_OVER_DELIVERY_CHECK';
  const ruleDescription = 'Akumulasi kuantitas barang masuk pada dokumen GR tidak boleh melebihi total pesanan PO';

  // 1. Over-Delivery (Pelanggaran)
  if (totalReceivedSoFar > poDoc.totalOrderedQuantity) {
    return {
      transition: 'PO_TO_GR',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Over-Delivery Terdeteksi: Total penerimaan fisik (${totalReceivedSoFar}) melampaui PO (${poDoc.totalOrderedQuantity})`,
      discrepancy: `Kelebihan Pengiriman (Over-Delivery): Akumulasi penerimaan barang (${totalReceivedSoFar} unit) melampaui pesanan PO (${poDoc.totalOrderedQuantity} unit) sebesar ${difference.toFixed(2)} unit. GR saat ini: ${currentGrDoc.receivedQuantity} unit, riwayat GR terdahulu: ${previousGrReceivedQuantity} unit.`,
      calculation: {
        sourceValue: poDoc.totalOrderedQuantity,
        targetValue: totalReceivedSoFar,
        difference,
        limitValue: poDoc.totalOrderedQuantity,
        details: {
          currentGrReceived: currentGrDoc.receivedQuantity,
          previousGrReceived: previousGrReceivedQuantity,
        },
      },
    };
  }

  // 2. Partial Delivery (Penerimaan Parsial yang Sah tapi Belum Selesai)
  if (totalReceivedSoFar < poDoc.totalOrderedQuantity) {
    const remainingToDeliver = poDoc.totalOrderedQuantity - totalReceivedSoFar;
    return {
      transition: 'PO_TO_GR',
      passed: true,
      status: 'WARNING',
      ruleName,
      ruleDescription,
      summary: `Penerimaan Parsial (Partial Delivery): Diterima ${totalReceivedSoFar} dari total ${poDoc.totalOrderedQuantity} unit (sisa ${remainingToDeliver.toFixed(2)} unit)`,
      discrepancy: `Pengiriman parsial: Penerimaan bertahap telah mencapai ${((totalReceivedSoFar / poDoc.totalOrderedQuantity) * 100).toFixed(1)}%. Masih ada sisa ${remainingToDeliver.toFixed(2)} unit yang belum dikirim oleh vendor.`,
      calculation: {
        sourceValue: poDoc.totalOrderedQuantity,
        targetValue: totalReceivedSoFar,
        difference: 0,
        limitValue: poDoc.totalOrderedQuantity,
        details: {
          completionRatePercent: Number(((totalReceivedSoFar / poDoc.totalOrderedQuantity) * 100).toFixed(1)),
          remainingToDeliver,
        },
      },
    };
  }

  // 3. Full Delivery (Tepat 100%)
  return {
    transition: 'PO_TO_GR',
    passed: true,
    status: 'VALID',
    ruleName,
    ruleDescription,
    summary: `Valid: Seluruh pesanan PO (${poDoc.totalOrderedQuantity} unit) telah diterima lengkap 100% di gudang`,
    discrepancy: null,
    calculation: {
      sourceValue: poDoc.totalOrderedQuantity,
      targetValue: totalReceivedSoFar,
      difference: 0,
      limitValue: poDoc.totalOrderedQuantity,
      details: {
        completionRatePercent: 100,
        remainingToDeliver: 0,
      },
    },
  };
}

// -------------------------------------------------------------
// 4. GR ke PI Validator (Kardinalitas: N : 1 atau 1 : 1)
// Aturan: Kuantitas unit yang ditagihkan di faktur (PI) wajib sama
// persis dengan kuantitas fisik yang sudah divalidasi tim gudang pada GR.
// -------------------------------------------------------------
export interface GrToPiValidationParams {
  grDocs: Array<{
    documentNumber: string;
    verifiedPhysicalQuantity: number;
  }>;
  piDoc: {
    documentNumber: string;
    invoicedQuantity: number;
  };
}

export function validateGrToPi(params: GrToPiValidationParams): TransitionValidationResult {
  const { grDocs, piDoc } = params;
  const totalVerifiedPhysicalQty = grDocs.reduce((acc, curr) => acc + curr.verifiedPhysicalQuantity, 0);
  const difference = Math.abs(piDoc.invoicedQuantity - totalVerifiedPhysicalQty);

  const ruleName = 'RULE_GR_PI_QUANTITY_MATCHING';
  const ruleDescription = 'Kuantitas faktur (PI) wajib sama persis dengan kuantitas fisik yang diterima di GR';

  if (piDoc.invoicedQuantity !== totalVerifiedPhysicalQty) {
    const isOverBilled = piDoc.invoicedQuantity > totalVerifiedPhysicalQty;
    return {
      transition: 'GR_TO_PI',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Quantity Mismatch 3-Way Match: Faktur (${piDoc.invoicedQuantity}) ${isOverBilled ? 'melebihi' : 'kurang dari'} fisik GR (${totalVerifiedPhysicalQty})`,
      discrepancy: `Selisih Fisik vs Faktur (Quantity Discrepancy): Kuantitas ditagihkan pada PI (${piDoc.invoicedQuantity} unit) tidak sesuai dengan total barang fisik yang diterima gudang pada dokumen GR (${totalVerifiedPhysicalQty} unit). Selisih ${isOverBilled ? 'kelebihan tagihan' : 'kekurangan tagihan'} sebesar ${difference.toFixed(2)} unit.`,
      calculation: {
        sourceValue: totalVerifiedPhysicalQty,
        targetValue: piDoc.invoicedQuantity,
        difference: piDoc.invoicedQuantity - totalVerifiedPhysicalQty,
        details: {
          grBreakdown: grDocs.map((g) => ({ docNumber: g.documentNumber, qty: g.verifiedPhysicalQuantity })),
        },
      },
    };
  }

  return {
    transition: 'GR_TO_PI',
    passed: true,
    status: 'VALID',
    ruleName,
    ruleDescription,
    summary: `Valid: Kuantitas faktur PI (${piDoc.invoicedQuantity} unit) cocok sempurna dengan kuantitas fisik GR (${totalVerifiedPhysicalQty} unit)`,
    discrepancy: null,
    calculation: {
      sourceValue: totalVerifiedPhysicalQty,
      targetValue: piDoc.invoicedQuantity,
      difference: 0,
      details: {
        matchedGrCount: grDocs.length,
      },
    },
  };
}

// -------------------------------------------------------------
// 5. PI ke PP Validator (Kardinalitas: 1 : N atau N : 1)
// Aturan: Akumulasi nominal bayar di PP tidak boleh melebihi total
// nilai tagihan akhir di PI (setelah memperhitungkan PPN, PPh, dan potongan).
// -------------------------------------------------------------
export interface PiToPpValidationParams {
  piDocs: Array<{
    documentNumber: string;
    baseAmount: number;
    taxAmount?: number;        // PPN (+)
    withholdingTax?: number;   // PPh (-)
    discountAmount?: number;   // Potongan/diskon (-)
  }>;
  currentPayment: {
    documentNumber: string;
    amount: number;
  };
  previousTotalPaid?: number;  // Nominal yang sudah dibayar pada termin-termin sebelumnya
}

export function validatePiToPp(params: PiToPpValidationParams): TransitionValidationResult {
  const { piDocs, currentPayment, previousTotalPaid = 0 } = params;

  // Hitung total nilai tagihan bersih (Net Invoiced Amount) dari seluruh faktur yang dilunasi
  let totalNetInvoiceAmount = 0;
  const invoiceBreakdown: Record<string, { base: number; tax: number; wht: number; discount: number; net: number }> = {};

  for (const inv of piDocs) {
    const base = Number(inv.baseAmount) || 0;
    const tax = Number(inv.taxAmount) || 0;
    const wht = Number(inv.withholdingTax) || 0;
    const discount = Number(inv.discountAmount) || 0;
    const net = base + tax - wht - discount;

    totalNetInvoiceAmount += net;
    invoiceBreakdown[inv.documentNumber] = {
      base,
      tax,
      wht,
      discount,
      net,
    };
  }

  const totalPaid = previousTotalPaid + currentPayment.amount;
  const difference = totalPaid - totalNetInvoiceAmount;

  const ruleName = 'RULE_PI_PP_BALANCE_MATCHING';
  const ruleDescription = 'Akumulasi pembayaran PP tidak boleh melebihi nilai tagihan akhir PI (setelah pajak & diskon)';

  // 1. Overpayment (Pelanggaran)
  if (totalPaid > totalNetInvoiceAmount) {
    return {
      transition: 'PI_TO_PP',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Overpayment: Total pembayaran (Rp ${totalPaid.toLocaleString('id-ID')}) melebihi tagihan bersih PI (Rp ${totalNetInvoiceAmount.toLocaleString('id-ID')})`,
      discrepancy: `Kelebihan Bayar (Overpayment): Akumulasi pembayaran pada PP (Rp ${totalPaid.toLocaleString('id-ID')}) melampaui total nilai tagihan bersih PI (Rp ${totalNetInvoiceAmount.toLocaleString('id-ID')}). Terjadi kelebihan transfer sebesar Rp ${difference.toLocaleString('id-ID')}.`,
      calculation: {
        sourceValue: totalNetInvoiceAmount,
        targetValue: totalPaid,
        difference,
        limitValue: totalNetInvoiceAmount,
        details: {
          currentPayment: currentPayment.amount,
          previousTotalPaid,
          invoiceBreakdown,
        },
      },
    };
  }

  // 2. Partial Payment / Installment (Termin Parsial)
  if (totalPaid < totalNetInvoiceAmount) {
    const remainingBalance = totalNetInvoiceAmount - totalPaid;
    return {
      transition: 'PI_TO_PP',
      passed: true,
      status: 'WARNING',
      ruleName,
      ruleDescription,
      summary: `Pembayaran Parsial (Termin): Terbayar Rp ${totalPaid.toLocaleString('id-ID')} dari Rp ${totalNetInvoiceAmount.toLocaleString('id-ID')} (Sisa Rp ${remainingBalance.toLocaleString('id-ID')})`,
      discrepancy: `Pembayaran termin/cicilan: Tagihan belum lunas penuh. Terbayar ${((totalPaid / totalNetInvoiceAmount) * 100).toFixed(1)}%, sisa saldo kewajiban: Rp ${remainingBalance.toLocaleString('id-ID')}.`,
      calculation: {
        sourceValue: totalNetInvoiceAmount,
        targetValue: totalPaid,
        difference: 0,
        limitValue: totalNetInvoiceAmount,
        details: {
          settlementRatePercent: Number(((totalPaid / totalNetInvoiceAmount) * 100).toFixed(1)),
          remainingBalance,
          invoiceBreakdown,
        },
      },
    };
  }

  // 3. Full Settlement (Lunas Tepat 100%)
  return {
    transition: 'PI_TO_PP',
    passed: true,
    status: 'VALID',
    ruleName,
    ruleDescription,
    summary: `Valid (Lunas): Pembayaran PP (Rp ${totalPaid.toLocaleString('id-ID')}) melunasi tagihan bersih PI secara penuh (100%)`,
    discrepancy: null,
    calculation: {
      sourceValue: totalNetInvoiceAmount,
      targetValue: totalPaid,
      difference: 0,
      limitValue: totalNetInvoiceAmount,
      details: {
        settlementRatePercent: 100,
        remainingBalance: 0,
        invoiceBreakdown,
      },
    },
  };
}

// -------------------------------------------------------------
// 6. Router / Orchestrator: Validasi Transisi Antara Dua Dokumen
// -------------------------------------------------------------
export function evaluateTransition(
  sourceDoc: {
    type: DocumentType;
    number: string;
    amount?: number;
    quantity?: number;
    batchQuantity?: number;
    bomRatio?: number;
    taxAmount?: number;
    withholdingTax?: number;
    discountAmount?: number;
    status?: string;
  },
  targetDoc: {
    type: DocumentType;
    number: string;
    amount?: number;
    quantity?: number;
  },
  context?: {
    previousQuantity?: number;
    previousAmount?: number;
    additionalSources?: Array<{
      number: string;
      quantity?: number;
      amount?: number;
      taxAmount?: number;
      withholdingTax?: number;
      discountAmount?: number;
    }>;
  }
): TransitionValidationResult {
  const sourceType = sourceDoc.type;
  const targetType = targetDoc.type;

  // A. BOM -> PR
  if (sourceType === DocumentType.BOM && targetType === DocumentType.PR) {
    return validateBomToPr({
      bomDoc: {
        documentNumber: sourceDoc.number,
        batchQuantity: sourceDoc.batchQuantity || 1,
        bomRatio: sourceDoc.bomRatio || Number(sourceDoc.quantity) || 1,
      },
      prDoc: {
        documentNumber: targetDoc.number,
        quantity: Number(targetDoc.quantity) || 1,
      },
      existingPrQuantity: context?.previousQuantity || 0,
    });
  }

  // B. PR -> PO
  if (sourceType === DocumentType.PR && targetType === DocumentType.PO) {
    const prs = [
      {
        documentNumber: sourceDoc.number,
        totalQuantity: Number(sourceDoc.quantity) || Number(sourceDoc.amount) || 0,
        orderedQuantity: context?.previousQuantity || 0,
        status: sourceDoc.status,
      },
      ...(context?.additionalSources || []).map((s) => ({
        documentNumber: s.number,
        totalQuantity: Number(s.quantity) || 0,
        orderedQuantity: 0,
      })),
    ];

    return validatePrToPo({
      prDocs: prs,
      poDoc: {
        documentNumber: targetDoc.number,
        quantity: Number(targetDoc.quantity) || Number(targetDoc.amount) || 0,
      },
    });
  }

  // C. PO -> GR
  if (sourceType === DocumentType.PO && targetType === DocumentType.GR) {
    return validatePoToGr({
      poDoc: {
        documentNumber: sourceDoc.number,
        totalOrderedQuantity: Number(sourceDoc.quantity) || Number(sourceDoc.amount) || 0,
      },
      currentGrDoc: {
        documentNumber: targetDoc.number,
        receivedQuantity: Number(targetDoc.quantity) || 0,
      },
      previousGrReceivedQuantity: context?.previousQuantity || 0,
    });
  }

  // D. GR -> PI (atau INVOICE)
  if (sourceType === DocumentType.GR && (targetType === DocumentType.PI || targetType === DocumentType.INVOICE)) {
    const grs = [
      {
        documentNumber: sourceDoc.number,
        verifiedPhysicalQuantity: Number(sourceDoc.quantity) || 0,
      },
      ...(context?.additionalSources || []).map((g) => ({
        documentNumber: g.number,
        verifiedPhysicalQuantity: Number(g.quantity) || 0,
      })),
    ];

    return validateGrToPi({
      grDocs: grs,
      piDoc: {
        documentNumber: targetDoc.number,
        invoicedQuantity: Number(targetDoc.quantity) || 0,
      },
    });
  }

  // E. PI (atau INVOICE) -> PP
  if ((sourceType === DocumentType.PI || sourceType === DocumentType.INVOICE) && targetType === DocumentType.PP) {
    const pis = [
      {
        documentNumber: sourceDoc.number,
        baseAmount: Number(sourceDoc.amount) || 0,
        taxAmount: Number(sourceDoc.taxAmount) || 0,
        withholdingTax: Number(sourceDoc.withholdingTax) || 0,
        discountAmount: Number(sourceDoc.discountAmount) || 0,
      },
      ...(context?.additionalSources || []).map((p) => ({
        documentNumber: p.number,
        baseAmount: Number(p.amount) || 0,
        taxAmount: Number(p.taxAmount) || 0,
        withholdingTax: Number(p.withholdingTax) || 0,
        discountAmount: Number(p.discountAmount) || 0,
      })),
    ];

    return validatePiToPp({
      piDocs: pis,
      currentPayment: {
        documentNumber: targetDoc.number,
        amount: Number(targetDoc.amount) || 0,
      },
      previousTotalPaid: context?.previousAmount || 0,
    });
  }

  // Default Fallback jika bukan transisi standar di atas
  return {
    transition: 'BOM_TO_PR',
    passed: true,
    status: 'VALID',
    ruleName: 'RULE_GENERIC_REFERENCE_CHECK',
    ruleDescription: 'Pemeriksaan integritas referensi antar dokumen',
    summary: `Valid: Hubungan ${sourceType} -> ${targetType} tercatat`,
    discrepancy: null,
    calculation: {
      sourceValue: 1,
      targetValue: 1,
      difference: 0,
    },
  };
}

// -------------------------------------------------------------
// 7. Helper Database: Mengevaluasi dan Menyimpan ke DocumentRelation
// -------------------------------------------------------------
export async function validateAndSaveRelationInDb(params: {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationData?: {
    amount?: number;
    quantityOrdered?: number;
    quantityReceived?: number;
    quantityRatio?: number;
  };
  performedBy?: string;
}) {
  const sourceDoc = await db.document.findUnique({
    where: { id: params.sourceDocumentId },
  });
  const targetDoc = await db.document.findUnique({
    where: { id: params.targetDocumentId },
  });

  if (!sourceDoc || !targetDoc) {
    throw new Error('Dokumen sumber atau target tidak ditemukan');
  }

  // Jalankan validator
  const validation = evaluateTransition(
    {
      type: sourceDoc.documentType,
      number: sourceDoc.documentNumber,
      amount: Number(sourceDoc.amount),
      quantity: Number(sourceDoc.quantity) || undefined,
      batchQuantity: Number(sourceDoc.batchQuantity) || undefined,
      taxAmount: Number(sourceDoc.taxAmount) || undefined,
      withholdingTax: Number(sourceDoc.withholdingTax) || undefined,
      discountAmount: Number(sourceDoc.discountAmount) || undefined,
      status: sourceDoc.status,
    },
    {
      type: targetDoc.documentType,
      number: targetDoc.documentNumber,
      amount: Number(targetDoc.amount),
      quantity: Number(targetDoc.quantity) || undefined,
    }
  );

  const prismaStatus: ValidationStatus =
    validation.status === 'VALID'
      ? ValidationStatus.VALID
      : validation.status === 'INVALID'
        ? ValidationStatus.INVALID
        : ValidationStatus.WARNING;

  // Upsert ke tabel DocumentRelation
  const relation = await db.documentRelation.upsert({
    where: {
      sourceDocumentId_targetDocumentId: {
        sourceDocumentId: params.sourceDocumentId,
        targetDocumentId: params.targetDocumentId,
      },
    },
    update: {
      validationStatus: prismaStatus,
      discrepancy: validation.discrepancy,
      failureReason: validation.discrepancy,
      amount: params.relationData?.amount || targetDoc.amount,
      quantityOrdered: params.relationData?.quantityOrdered,
      quantityReceived: params.relationData?.quantityReceived,
      quantityRatio: params.relationData?.quantityRatio,
      metadata: validation.calculation as object,
      updatedAt: new Date(),
    },
    create: {
      sourceDocumentId: params.sourceDocumentId,
      targetDocumentId: params.targetDocumentId,
      validationStatus: prismaStatus,
      discrepancy: validation.discrepancy,
      failureReason: validation.discrepancy,
      amount: params.relationData?.amount || targetDoc.amount,
      quantityOrdered: params.relationData?.quantityOrdered,
      quantityReceived: params.relationData?.quantityReceived,
      quantityRatio: params.relationData?.quantityRatio,
      metadata: validation.calculation as object,
    },
  });

  // Catat ke ValidationResult untuk dokumen target
  await db.validationResult.create({
    data: {
      documentId: targetDoc.id,
      ruleName: validation.ruleName,
      ruleDescription: validation.ruleDescription,
      passed: validation.passed,
      message: validation.summary,
      details: validation.discrepancy || JSON.stringify(validation.calculation),
      severity: validation.status === 'INVALID' ? 'ERROR' : validation.status === 'WARNING' ? 'WARNING' : 'INFO',
    },
  });

  // Catat ke AuditLog
  await db.auditLog.create({
    data: {
      documentId: targetDoc.id,
      action: 'VALIDATE_TRANSITION',
      performedBy: params.performedBy || 'System Business Validator',
      details: JSON.stringify({
        transition: validation.transition,
        status: validation.status,
        passed: validation.passed,
        discrepancy: validation.discrepancy,
      }),
    },
  });

  return { relation, validation };
}
