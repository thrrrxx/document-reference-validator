import { DocumentType, ValidationStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

export type ValidationStatusType = 'VALID' | 'INVALID' | 'WARNING';

export type P2PTransitionType =
  | 'BOM_TO_PR'
  | 'PR_TO_PO'
  | 'PO_TO_GR'
  | 'GR_TO_PI'
  | 'PI_TO_PP';

export interface ToleranceConfig {
  qtyTolerancePercent?: number;
  priceTolerancePercent?: number;
  amountToleranceAbsolute?: number;
}

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
  returnedDocs?: Array<{
    documentNumber: string;
    returnedQuantity: number;
  }>;
  piDoc: {
    documentNumber: string;
    invoicedQuantity: number;
  };
  tolerance?: ToleranceConfig;
}

export function validateGrToPi(params: GrToPiValidationParams): TransitionValidationResult {
  const { grDocs, returnedDocs = [], piDoc, tolerance } = params;
  const grossPhysicalQty = grDocs.reduce((acc, curr) => acc + curr.verifiedPhysicalQuantity, 0);
  const totalReturnedQty = returnedDocs.reduce((acc, curr) => acc + curr.returnedQuantity, 0);
  const netBillableQty = Math.max(0, grossPhysicalQty - totalReturnedQty);

  const signedDiff = piDoc.invoicedQuantity - netBillableQty;
  const absDiff = Math.abs(signedDiff);
  const qtyTolerancePct = Math.max(0, Number(tolerance?.qtyTolerancePercent) || 0);
  const allowedDelta = (netBillableQty * qtyTolerancePct) / 100;

  const ruleName = 'RULE_GR_PI_QUANTITY_MATCHING';
  const ruleDescription =
    'Kuantitas faktur (PI) wajib sesuai dengan kuantitas fisik bersih GR (GR dikurangi Purchase Return) dalam batas toleransi';

  if (absDiff > 0) {
    const isWithinTolerance = qtyTolerancePct > 0 && absDiff <= allowedDelta;
    const isOverBilled = signedDiff > 0;

    if (isWithinTolerance) {
      return {
        transition: 'GR_TO_PI',
        passed: true,
        status: 'WARNING',
        ruleName,
        ruleDescription,
        summary: `Valid (Dalam Batas Toleransi ±${qtyTolerancePct}%): Faktur (${piDoc.invoicedQuantity}) selisih ${absDiff.toFixed(2)} unit dari fisik bersih GR (${netBillableQty})`,
        discrepancy: `Selisih kuantitas (${absDiff.toFixed(2)} unit) masih berada dalam batas toleransi ${qtyTolerancePct}% (maks ±${allowedDelta.toFixed(2)} unit).`,
        calculation: {
          sourceValue: netBillableQty,
          targetValue: piDoc.invoicedQuantity,
          difference: signedDiff,
          limitValue: allowedDelta,
          details: {
            grossPhysicalQty,
            totalReturnedQty,
            netBillableQty,
            qtyTolerancePercent: qtyTolerancePct,
            grBreakdown: grDocs.map((g) => ({ docNumber: g.documentNumber, qty: g.verifiedPhysicalQuantity })),
            returnBreakdown: returnedDocs,
          },
        },
      };
    }

    return {
      transition: 'GR_TO_PI',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Quantity Mismatch 3-Way Match: Faktur (${piDoc.invoicedQuantity}) ${isOverBilled ? 'melebihi' : 'kurang dari'} fisik bersih GR (${netBillableQty})`,
      discrepancy: `Selisih Fisik vs Faktur (Quantity Discrepancy): Kuantitas ditagihkan pada PI (${piDoc.invoicedQuantity} unit) tidak sesuai dengan total barang fisik bersih GR (${netBillableQty} unit${totalReturnedQty > 0 ? `, setelah dikurangi retur ${totalReturnedQty} unit` : ''}). Selisih ${isOverBilled ? 'kelebihan tagihan' : 'kekurangan tagihan'} sebesar ${absDiff.toFixed(2)} unit.`,
      calculation: {
        sourceValue: netBillableQty,
        targetValue: piDoc.invoicedQuantity,
        difference: signedDiff,
        details: {
          grossPhysicalQty,
          totalReturnedQty,
          netBillableQty,
          grBreakdown: grDocs.map((g) => ({ docNumber: g.documentNumber, qty: g.verifiedPhysicalQuantity })),
          returnBreakdown: returnedDocs,
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
    summary: `Valid: Kuantitas faktur PI (${piDoc.invoicedQuantity} unit) cocok sempurna dengan kuantitas fisik bersih GR (${netBillableQty} unit)`,
    discrepancy: null,
    calculation: {
      sourceValue: netBillableQty,
      targetValue: piDoc.invoicedQuantity,
      difference: 0,
      details: {
        grossPhysicalQty,
        totalReturnedQty,
        matchedGrCount: grDocs.length,
        returnCount: returnedDocs.length,
      },
    },
  };
}

// -------------------------------------------------------------
// 5. PI ke PP Validator (Kardinalitas: 1 : N atau N : 1)
// Aturan: Akumulasi nominal bayar di PP tidak boleh melebihi total
// nilai tagihan akhir di PI (setelah PPN, PPh, potongan, & Credit Note).
// -------------------------------------------------------------
export interface PiToPpValidationParams {
  piDocs: Array<{
    documentNumber: string;
    baseAmount: number;
    taxAmount?: number;        // PPN (+)
    withholdingTax?: number;   // PPh (-)
    discountAmount?: number;   // Potongan/diskon (-)
  }>;
  creditNoteDocs?: Array<{
    documentNumber: string;
    amount: number;
  }>;
  currentPayment: {
    documentNumber: string;
    amount: number;
  };
  previousTotalPaid?: number;  // Nominal yang sudah dibayar pada termin-termin sebelumnya
  tolerance?: ToleranceConfig;
}

export function validatePiToPp(params: PiToPpValidationParams): TransitionValidationResult {
  const { piDocs, creditNoteDocs = [], currentPayment, previousTotalPaid = 0, tolerance } = params;

  // Hitung total nilai tagihan bersih (Net Invoiced Amount) dari seluruh faktur yang dilunasi
  let grossNetInvoiceAmount = 0;
  const invoiceBreakdown: Record<string, { base: number; tax: number; wht: number; discount: number; net: number }> = {};

  for (const inv of piDocs) {
    const base = Number(inv.baseAmount) || 0;
    const tax = Number(inv.taxAmount) || 0;
    const wht = Number(inv.withholdingTax) || 0;
    const discount = Number(inv.discountAmount) || 0;
    const net = base + tax - wht - discount;

    grossNetInvoiceAmount += net;
    invoiceBreakdown[inv.documentNumber] = {
      base,
      tax,
      wht,
      discount,
      net,
    };
  }

  const totalCreditNotes = creditNoteDocs.reduce((acc, cn) => acc + (Number(cn.amount) || 0), 0);
  const totalNetInvoiceAmount = Math.max(0, grossNetInvoiceAmount - totalCreditNotes);

  const totalPaid = previousTotalPaid + currentPayment.amount;
  const difference = totalPaid - totalNetInvoiceAmount;
  const absAllowance = Math.max(0, Number(tolerance?.amountToleranceAbsolute) || 0);

  const ruleName = 'RULE_PI_PP_BALANCE_MATCHING';
  const ruleDescription = 'Akumulasi pembayaran PP tidak boleh melebihi nilai tagihan akhir PI (setelah pajak, diskon, & Credit Note)';

  // 1. Overpayment (di luar toleransi)
  if (totalPaid > totalNetInvoiceAmount + absAllowance) {
    return {
      transition: 'PI_TO_PP',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `Overpayment: Total pembayaran (Rp ${totalPaid.toLocaleString('id-ID')}) melebihi tagihan bersih PI (Rp ${totalNetInvoiceAmount.toLocaleString('id-ID')})`,
      discrepancy: `Kelebihan Bayar (Overpayment): Akumulasi pembayaran pada PP (Rp ${totalPaid.toLocaleString('id-ID')}) melampaui total nilai tagihan bersih PI (Rp ${totalNetInvoiceAmount.toLocaleString('id-ID')}${totalCreditNotes > 0 ? `, setelah dikurangi Credit Note Rp ${totalCreditNotes.toLocaleString('id-ID')}` : ''}). Terjadi kelebihan transfer sebesar Rp ${difference.toLocaleString('id-ID')}.`,
      calculation: {
        sourceValue: totalNetInvoiceAmount,
        targetValue: totalPaid,
        difference,
        limitValue: totalNetInvoiceAmount,
        details: {
          currentPayment: currentPayment.amount,
          previousTotalPaid,
          totalCreditNotes,
          invoiceBreakdown,
          creditNoteDocs,
        },
      },
    };
  }

  // 1b. Selisih kecil dalam toleransi pembulatan
  if (totalPaid > totalNetInvoiceAmount && absAllowance > 0) {
    return {
      transition: 'PI_TO_PP',
      passed: true,
      status: 'WARNING',
      ruleName,
      ruleDescription,
      summary: `Valid (Toleransi Pembulatan): Selisih lebih bayar Rp ${difference.toLocaleString('id-ID')} masih dalam batas toleransi Rp ${absAllowance.toLocaleString('id-ID')}`,
      discrepancy: `Pembayaran melebihi tagihan bersih sebesar Rp ${difference.toLocaleString('id-ID')}, masih dalam toleransi pembulatan.`,
      calculation: {
        sourceValue: totalNetInvoiceAmount,
        targetValue: totalPaid,
        difference,
        limitValue: totalNetInvoiceAmount + absAllowance,
        details: { totalCreditNotes, invoiceBreakdown, creditNoteDocs },
      },
    };
  }

  // 2. Partial Payment / Installment (Termin Parsial)
  if (totalPaid < totalNetInvoiceAmount - absAllowance) {
    const remainingBalance = totalNetInvoiceAmount - totalPaid;
    return {
      transition: 'PI_TO_PP',
      passed: true,
      status: 'WARNING',
      ruleName,
      ruleDescription,
      summary: `Pembayaran Parsial (Termin): Terbayar Rp ${totalPaid.toLocaleString('id-ID')} dari Rp ${totalNetInvoiceAmount.toLocaleString('id-ID')} (Sisa Rp ${remainingBalance.toLocaleString('id-ID')})`,
      discrepancy: `Pembayaran termin/cicilan: Tagihan belum lunas penuh. Terbayar ${totalNetInvoiceAmount > 0 ? ((totalPaid / totalNetInvoiceAmount) * 100).toFixed(1) : '100.0'}%, sisa saldo kewajiban: Rp ${remainingBalance.toLocaleString('id-ID')}.`,
      calculation: {
        sourceValue: totalNetInvoiceAmount,
        targetValue: totalPaid,
        difference: 0,
        limitValue: totalNetInvoiceAmount,
        details: {
          settlementRatePercent: totalNetInvoiceAmount > 0 ? Number(((totalPaid / totalNetInvoiceAmount) * 100).toFixed(1)) : 100,
          remainingBalance,
          totalCreditNotes,
          invoiceBreakdown,
          creditNoteDocs,
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
        totalCreditNotes,
        invoiceBreakdown,
        creditNoteDocs,
      },
    },
  };
}

// -------------------------------------------------------------
// 5B. Item-Level 3-Way Matching (PO vs GR - Return vs PI)
// Memeriksa kuantitas & unitPrice per SKU itemCode dengan tolerance
// -------------------------------------------------------------
export interface ItemLineInput {
  itemCode: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
}

export interface ItemThreeWayMatchParams {
  poItems?: ItemLineInput[];
  grItems: ItemLineInput[];
  returnedItems?: ItemLineInput[];
  piItems: ItemLineInput[];
  tolerance?: ToleranceConfig;
}

export interface ItemMatchDetail {
  itemCode: string;
  itemName: string;
  poQty: number | null;
  poUnitPrice: number | null;
  grGrossQty: number;
  returnedQty: number;
  netBillableQty: number;
  piQty: number;
  piUnitPrice: number;
  qtyDiff: number;
  priceDiffPercent: number | null;
  status: ValidationStatusType;
  reason: string | null;
}

export function validateItemLevelThreeWayMatch(
  params: ItemThreeWayMatchParams
): TransitionValidationResult {
  const { poItems = [], grItems, returnedItems = [], piItems, tolerance } = params;
  const qtyTolPct = Math.max(0, Number(tolerance?.qtyTolerancePercent) || 0);
  const priceTolPct = Math.max(0, Number(tolerance?.priceTolerancePercent) || 0);

  const aggregateByCode = (lines: ItemLineInput[]) => {
    const map = new Map<string, { itemName: string; qty: number; unitPrice: number }>();
    for (const line of lines) {
      const code = line.itemCode.trim().toUpperCase();
      const existing = map.get(code);
      if (existing) {
        existing.qty += Number(line.quantity) || 0;
        if (line.unitPrice > 0) existing.unitPrice = Number(line.unitPrice);
      } else {
        map.set(code, {
          itemName: line.itemName || code,
          qty: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
        });
      }
    }
    return map;
  };

  const poMap = aggregateByCode(poItems);
  const grMap = aggregateByCode(grItems);
  const retMap = aggregateByCode(returnedItems);
  const piMap = aggregateByCode(piItems);

  const allCodes = new Set<string>([
    ...poMap.keys(),
    ...grMap.keys(),
    ...piMap.keys(),
  ]);

  const itemDetails: ItemMatchDetail[] = [];
  const invalidReasons: string[] = [];
  const warningReasons: string[] = [];

  for (const code of allCodes) {
    const po = poMap.get(code);
    const gr = grMap.get(code);
    const ret = retMap.get(code);
    const pi = piMap.get(code);

    const grGrossQty = gr?.qty ?? 0;
    const returnedQty = ret?.qty ?? 0;
    const netBillableQty = Math.max(0, grGrossQty - returnedQty);
    const piQty = pi?.qty ?? 0;
    const piUnitPrice = pi?.unitPrice ?? 0;
    const poUnitPrice = po?.unitPrice ?? null;

    const qtyDiff = piQty - netBillableQty;
    const absQtyDiff = Math.abs(qtyDiff);
    const allowedQtyDelta = (netBillableQty * qtyTolPct) / 100;

    let priceDiffPercent: number | null = null;
    if (poUnitPrice !== null && poUnitPrice > 0 && piUnitPrice > 0) {
      priceDiffPercent = Number((((piUnitPrice - poUnitPrice) / poUnitPrice) * 100).toFixed(2));
    }

    let status: ValidationStatusType = 'VALID';
    const reasons: string[] = [];

    if (pi && !gr) {
      status = 'INVALID';
      reasons.push(`SKU ${code} ditagih (${piQty}) tanpa bukti penerimaan GR`);
    } else if (absQtyDiff > 0) {
      if (qtyTolPct > 0 && absQtyDiff <= allowedQtyDelta) {
        status = 'WARNING';
        reasons.push(`SKU ${code} selisih qty ${qtyDiff.toFixed(2)} dalam toleransi ±${qtyTolPct}%`);
      } else {
        status = 'INVALID';
        reasons.push(`SKU ${code} selisih qty: PI=${piQty} vs GR Bersih=${netBillableQty}`);
      }
    }

    if (priceDiffPercent !== null && Math.abs(priceDiffPercent) > 0) {
      if (priceTolPct > 0 && Math.abs(priceDiffPercent) <= priceTolPct) {
        if (status !== 'INVALID') status = 'WARNING';
        reasons.push(`SKU ${code} selisih harga ${priceDiffPercent}% dalam toleransi ±${priceTolPct}%`);
      } else {
        status = 'INVALID';
        reasons.push(`SKU ${code} selisih harga ${priceDiffPercent}% (PO=${poUnitPrice}, PI=${piUnitPrice})`);
      }
    }

    if (status === 'INVALID') invalidReasons.push(...reasons);
    else if (status === 'WARNING') warningReasons.push(...reasons);

    itemDetails.push({
      itemCode: code,
      itemName: pi?.itemName || gr?.itemName || po?.itemName || code,
      poQty: po?.qty ?? null,
      poUnitPrice,
      grGrossQty,
      returnedQty,
      netBillableQty,
      piQty,
      piUnitPrice,
      qtyDiff,
      priceDiffPercent,
      status,
      reason: reasons.length > 0 ? reasons.join('; ') : null,
    });
  }

  const ruleName = 'RULE_ITEM_3WAY_MATCH_QTY_PRICE';
  const ruleDescription = 'Validasi 3-Way Match level item (SKU): kesesuaian kuantitas GR bersih & harga satuan PO vs Faktur (PI)';

  const totalNetGrQty = itemDetails.reduce((s, d) => s + d.netBillableQty, 0);
  const totalPiQty = itemDetails.reduce((s, d) => s + d.piQty, 0);

  if (invalidReasons.length > 0) {
    return {
      transition: 'GR_TO_PI',
      passed: false,
      status: 'INVALID',
      ruleName,
      ruleDescription,
      summary: `3-Way Match Item Mismatch (${invalidReasons.length} pelanggaran SKU)`,
      discrepancy: invalidReasons.join(' | '),
      calculation: {
        sourceValue: totalNetGrQty,
        targetValue: totalPiQty,
        difference: totalPiQty - totalNetGrQty,
        details: { itemDetails },
      },
    };
  }

  if (warningReasons.length > 0) {
    return {
      transition: 'GR_TO_PI',
      passed: true,
      status: 'WARNING',
      ruleName,
      ruleDescription,
      summary: `3-Way Match Item Valid dalam Toleransi (${warningReasons.length} catatan SKU)`,
      discrepancy: warningReasons.join(' | '),
      calculation: {
        sourceValue: totalNetGrQty,
        targetValue: totalPiQty,
        difference: totalPiQty - totalNetGrQty,
        details: { itemDetails },
      },
    };
  }

  return {
    transition: 'GR_TO_PI',
    passed: true,
    status: 'VALID',
    ruleName,
    ruleDescription,
    summary: `Valid: Seluruh ${itemDetails.length} SKU pada faktur PI cocok 100% (Qty & Harga) dengan PO/GR`,
    discrepancy: null,
    calculation: {
      sourceValue: totalNetGrQty,
      targetValue: totalPiQty,
      difference: 0,
      details: { itemDetails },
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
    tolerance?: ToleranceConfig;
    returnedDocs?: Array<{
      documentNumber: string;
      returnedQuantity: number;
    }>;
    creditNoteDocs?: Array<{
      documentNumber: string;
      amount: number;
    }>;
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
      returnedDocs: context?.returnedDocs,
      piDoc: {
        documentNumber: targetDoc.number,
        invoicedQuantity: Number(targetDoc.quantity) || 0,
      },
      tolerance: context?.tolerance,
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
      creditNoteDocs: context?.creditNoteDocs,
      currentPayment: {
        documentNumber: targetDoc.number,
        amount: Number(targetDoc.amount) || 0,
      },
      previousTotalPaid: context?.previousAmount || 0,
      tolerance: context?.tolerance,
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
  actorUserId?: string;
  ipAddress?: string;
}) {
  const sourceDoc = await db.document.findUnique({
    where: { id: params.sourceDocumentId },
    include: { items: true },
  });
  const targetDoc = await db.document.findUnique({
    where: { id: params.targetDocumentId },
    include: { items: true },
  });

  if (!sourceDoc || !targetDoc) {
    throw new Error('Dokumen sumber atau target tidak ditemukan');
  }

  if (sourceDoc.status === 'VOID' || targetDoc.status === 'VOID') {
    throw new Error('Tidak dapat menautkan atau memvalidasi dokumen yang berstatus VOID.');
  }

  // Ambil konfigurasi toleransi aktif (jika tersedia di DB)
  const activeTolerance = await db.validationTolerance.findFirst({
    where: { category: 'GLOBAL', isActive: true },
  });

  const tolerance: ToleranceConfig | undefined = activeTolerance
    ? {
        qtyTolerancePercent: Number(activeTolerance.qtyTolerancePercent) || 0,
        priceTolerancePercent: Number(activeTolerance.priceTolerancePercent) || 0,
        amountToleranceAbsolute: Number(activeTolerance.amountToleranceAbsolute) || 0,
      }
    : undefined;

  // Ambil Purchase Return & Credit Note dalam alur yang sama (jika ada)
  const flowRef = targetDoc.referenceNumber || sourceDoc.referenceNumber;
  const adjustmentDocs = flowRef
    ? await db.document.findMany({
        where: {
          referenceNumber: flowRef,
          status: { notIn: ['VOID', 'REJECTED'] },
          documentType: { in: [DocumentType.PURCHASE_RETURN, DocumentType.CREDIT_NOTE, DocumentType.PO] },
        },
        include: { items: true },
      })
    : [];

  const returnedDocs = adjustmentDocs
    .filter((d) => d.documentType === DocumentType.PURCHASE_RETURN)
    .map((d) => ({
      documentNumber: d.documentNumber,
      returnedQuantity: Number(d.quantity) || 0,
    }));

  const creditNoteDocs = adjustmentDocs
    .filter((d) => d.documentType === DocumentType.CREDIT_NOTE)
    .map((d) => ({
      documentNumber: d.documentNumber,
      amount: Number(d.amount) || 0,
    }));

  // Jalankan item-level 3-Way Matching jika kedua dokumen (GR -> PI) memiliki detail item SKU
  const isGrToPi =
    sourceDoc.documentType === DocumentType.GR &&
    (targetDoc.documentType === DocumentType.PI || targetDoc.documentType === DocumentType.INVOICE);

  let validation: TransitionValidationResult;

  if (isGrToPi && sourceDoc.items.length > 0 && targetDoc.items.length > 0) {
    const poInFlow = adjustmentDocs.find((d) => d.documentType === DocumentType.PO);
    const returnedItems = adjustmentDocs
      .filter((d) => d.documentType === DocumentType.PURCHASE_RETURN)
      .flatMap((d) =>
        d.items.map((it) => ({
          itemCode: it.itemCode,
          itemName: it.itemName,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        }))
      );

    validation = validateItemLevelThreeWayMatch({
      poItems: poInFlow?.items.map((it) => ({
        itemCode: it.itemCode,
        itemName: it.itemName,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
      grItems: sourceDoc.items.map((it) => ({
        itemCode: it.itemCode,
        itemName: it.itemName,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
      returnedItems,
      piItems: targetDoc.items.map((it) => ({
        itemCode: it.itemCode,
        itemName: it.itemName,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
      tolerance,
    });
  } else {
    // Jalankan validator level header (mendukung Purchase Return, Credit Note, & Tolerance)
    validation = evaluateTransition(
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
      },
      {
        returnedDocs,
        creditNoteDocs,
        tolerance,
      }
    );
  }

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

  // Catat ke AuditLog secara append-only
  await recordAuditLog({
    documentId: targetDoc.id,
    entityType: 'DOCUMENT_RELATION',
    entityId: relation.id,
    action: 'VALIDATE_TRANSITION',
    performedBy: params.performedBy || 'System Business Validator',
    actorUserId: params.actorUserId,
    ipAddress: params.ipAddress,
    newValues: {
      sourceDocumentId: sourceDoc.id,
      targetDocumentId: targetDoc.id,
      validationStatus: prismaStatus,
      ruleName: validation.ruleName,
    },
    details: {
      transition: validation.transition,
      status: validation.status,
      passed: validation.passed,
      discrepancy: validation.discrepancy,
    },
  });

  return { relation, validation };
}
