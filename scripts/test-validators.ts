import {
  validateBomToPr,
  validatePrToPo,
  validatePoToGr,
  validateGrToPi,
  validatePiToPp,
} from '../lib/validators/p2p-validator';

console.log('=== MENJALANKAN PENGUJIAN ATURAN VALIDASI BISNIS P2P ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
  }
}

// -------------------------------------------------------------
// 1. Uji BOM ke PR (Kardinalitas 1 : N)
// Formula: Max Allowed = bomRatio * batchQuantity
// -------------------------------------------------------------
console.log('--- 1. Uji Validasi BOM -> PR ---');
// Kasus A: Kuantitas PR melebihi formula rasio BOM (INVALID)
const bomFail = validateBomToPr({
  bomDoc: { documentNumber: 'BOM-001', batchQuantity: 100, bomRatio: 2.5 }, // Max = 250
  prDoc: { documentNumber: 'PR-001', quantity: 280 },
});
assert(bomFail.status === 'INVALID' && !bomFail.passed, 'BOM->PR Over Quota terdeteksi INVALID');
assert(bomFail.discrepancy !== null && bomFail.discrepancy.includes('selisih lebih sebesar 30.00 unit'), 'Discrepancy BOM->PR memuat angka selisih');

// Kasus B: Kuantitas PR tepat sesuai formula rasio (VALID)
const bomPass = validateBomToPr({
  bomDoc: { documentNumber: 'BOM-002', batchQuantity: 100, bomRatio: 2.5 },
  prDoc: { documentNumber: 'PR-002', quantity: 250 },
});
assert(bomPass.status === 'VALID' && bomPass.passed, 'BOM->PR Sesuai Formula terdeteksi VALID');

// Kasus C: Kuantitas PR parsial (VALID)
const bomPartial = validateBomToPr({
  bomDoc: { documentNumber: 'BOM-003', batchQuantity: 100, bomRatio: 2.5 },
  prDoc: { documentNumber: 'PR-003', quantity: 150 },
  existingPrQuantity: 50, // total = 200 <= 250
});
assert(bomPartial.status === 'VALID' && bomPartial.passed, 'BOM->PR Parsial terdeteksi VALID');

// -------------------------------------------------------------
// 2. Uji PR ke PO (Kardinalitas N : 1 atau 1 : 1)
// Aturan: PO Qty <= Total Open PR Qty
// -------------------------------------------------------------
console.log('\n--- 2. Uji Validasi PR -> PO ---');
// Kasus A: PO melebihi sisa PR open (INVALID)
const prFail = validatePrToPo({
  prDocs: [
    { documentNumber: 'PR-101', totalQuantity: 100, orderedQuantity: 60 }, // sisa 40
    { documentNumber: 'PR-102', totalQuantity: 50, orderedQuantity: 20 },  // sisa 30 -> total sisa = 70
  ],
  poDoc: { documentNumber: 'PO-001', quantity: 90 }, // minta 90 > 70
});
assert(prFail.status === 'INVALID' && !prFail.passed, 'PR->PO Over Open Balance terdeteksi INVALID');
assert(prFail.discrepancy !== null && prFail.discrepancy.includes('over-request sebesar 20.00 unit'), 'Discrepancy PR->PO memuat over-request');

// Kasus B: PO sesuai sisa PR open (VALID)
const prPass = validatePrToPo({
  prDocs: [
    { documentNumber: 'PR-101', totalQuantity: 100, orderedQuantity: 60 },
    { documentNumber: 'PR-102', totalQuantity: 50, orderedQuantity: 20 },
  ],
  poDoc: { documentNumber: 'PO-002', quantity: 70 },
});
assert(prPass.status === 'VALID' && prPass.passed, 'PR->PO Tepat Sisa Open terdeteksi VALID');

// -------------------------------------------------------------
// 3. Uji PO ke GR (Kardinalitas 1 : N - Partial Delivery & Over Delivery)
// Aturan: Total Received GR <= PO Qty
// -------------------------------------------------------------
console.log('\n--- 3. Uji Validasi PO -> GR ---');
// Kasus A: Over-Delivery (INVALID)
const grOver = validatePoToGr({
  poDoc: { documentNumber: 'PO-201', totalOrderedQuantity: 100 },
  currentGrDoc: { documentNumber: 'GRN-002', receivedQuantity: 60 },
  previousGrReceivedQuantity: 50, // total = 110 > 100
});
assert(grOver.status === 'INVALID' && !grOver.passed, 'PO->GR Over-Delivery terdeteksi INVALID');
assert(grOver.discrepancy !== null && grOver.discrepancy.includes('Over-Delivery'), 'Discrepancy PO->GR memuat status Over-Delivery');

// Kasus B: Partial Delivery (WARNING & PASSED)
const grPartial = validatePoToGr({
  poDoc: { documentNumber: 'PO-201', totalOrderedQuantity: 100 },
  currentGrDoc: { documentNumber: 'GRN-001', receivedQuantity: 40 },
  previousGrReceivedQuantity: 0,
});
assert(grPartial.status === 'WARNING' && grPartial.passed, 'PO->GR Partial Delivery terdeteksi WARNING');
assert(grPartial.discrepancy !== null && grPartial.discrepancy.includes('sisa 60.00 unit'), 'Discrepancy PO->GR memuat sisa kirim');

// Kasus C: Full Delivery 100% (VALID)
const grFull = validatePoToGr({
  poDoc: { documentNumber: 'PO-201', totalOrderedQuantity: 100 },
  currentGrDoc: { documentNumber: 'GRN-002', receivedQuantity: 60 },
  previousGrReceivedQuantity: 40,
});
assert(grFull.status === 'VALID' && grFull.passed, 'PO->GR 100% Selesai terdeteksi VALID');

// -------------------------------------------------------------
// 4. Uji GR ke PI (Kardinalitas N : 1 atau 1 : 1 - Quantity Matching)
// Aturan: PI Invoiced Qty == GR Verified Qty
// -------------------------------------------------------------
console.log('\n--- 4. Uji Validasi GR -> PI ---');
// Kasus A: Quantity Mismatch (INVALID)
const piMismatch = validateGrToPi({
  grDocs: [
    { documentNumber: 'GRN-301', verifiedPhysicalQuantity: 30 },
    { documentNumber: 'GRN-302', verifiedPhysicalQuantity: 20 }, // total GR = 50
  ],
  piDoc: { documentNumber: 'PI-001', invoicedQuantity: 55 },    // Faktur tagih 55 != 50
});
assert(piMismatch.status === 'INVALID' && !piMismatch.passed, 'GR->PI Quantity Mismatch terdeteksi INVALID');
assert(piMismatch.discrepancy !== null && piMismatch.discrepancy.includes('kelebihan tagihan sebesar 5.00 unit'), 'Discrepancy GR->PI memuat rincian mismatch');

// Kasus B: 3-Way Quantity Match Cocok (VALID)
const piMatch = validateGrToPi({
  grDocs: [
    { documentNumber: 'GRN-301', verifiedPhysicalQuantity: 30 },
    { documentNumber: 'GRN-302', verifiedPhysicalQuantity: 20 },
  ],
  piDoc: { documentNumber: 'PI-002', invoicedQuantity: 50 },
});
assert(piMatch.status === 'VALID' && piMatch.passed, 'GR->PI 3-Way Match Cocok terdeteksi VALID');

// -------------------------------------------------------------
// 5. Uji PI ke PP (Kardinalitas 1 : N atau N : 1 - Balance Check)
// Net Invoice = Base + PPN - PPh - Diskon
// -------------------------------------------------------------
console.log('\n--- 5. Uji Validasi PI -> PP ---');
// Tagihan: Base 100.000.000 + PPN 11.000.000 - PPh 2.000.000 - Diskon 1.000.000 = 108.000.000
const invoiceMeta = {
  documentNumber: 'PI-401',
  baseAmount: 100000000,
  taxAmount: 11000000,
  withholdingTax: 2000000,
  discountAmount: 1000000,
};

// Kasus A: Overpayment (INVALID)
const ppOver = validatePiToPp({
  piDocs: [invoiceMeta],
  currentPayment: { documentNumber: 'PP-001', amount: 115000000 },
  previousTotalPaid: 0,
});
assert(ppOver.status === 'INVALID' && !ppOver.passed, 'PI->PP Overpayment terdeteksi INVALID');
assert(ppOver.discrepancy !== null && ppOver.discrepancy.includes('Kelebihan Bayar'), 'Discrepancy PI->PP memuat info kelebihan transfer');

// Kasus B: Partial Payment / Cicilan Termin (WARNING & PASSED)
const ppTermin = validatePiToPp({
  piDocs: [invoiceMeta],
  currentPayment: { documentNumber: 'PP-002', amount: 50000000 },
  previousTotalPaid: 0,
});
assert(ppTermin.status === 'WARNING' && ppTermin.passed, 'PI->PP Termin Parsial terdeteksi WARNING');
assert(ppTermin.discrepancy !== null && ppTermin.discrepancy.includes('Sisa Rp 58.000.000') || ppTermin.summary.includes('Sisa Rp 58.000.000'), 'Summary PI->PP memuat sisa saldo kewajiban');

// Kasus C: Full Settlement Pelunasan Sempurna (VALID)
const ppFull = validatePiToPp({
  piDocs: [invoiceMeta],
  currentPayment: { documentNumber: 'PP-003', amount: 58000000 },
  previousTotalPaid: 50000000, // total = 108.000.000 == net invoice
});
assert(ppFull.status === 'VALID' && ppFull.passed, 'PI->PP Lunas 100% terdeteksi VALID');

console.log(`\n========================================`);
console.log(`HASIL: ${passedTests} / ${totalTests} PENGUJIAN BERHASIL.`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
