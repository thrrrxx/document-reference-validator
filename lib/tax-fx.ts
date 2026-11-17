export interface TaxFxInput {
  amount: number;
  discountAmount?: number;
  taxRate?: number;              // PPN dalam persen (mis. 11 atau 12)
  withholdingTaxRate?: number;   // PPh 22/23 dalam persen (mis. 1.5 atau 2)
  isTaxInclusive?: boolean;      // Apakah `amount` sudah termasuk PPN
  currency?: string;
  exchangeRate?: number;         // Kurs terhadap mata uang dasar (IDR)
}

export interface TaxFxResult {
  dppAmount: number;             // Dasar Pengenaan Pajak
  taxAmount: number;             // Nilai PPN (+)
  withholdingTax: number;        // Nilai PPh (-)
  discountAmount: number;        // Potongan (-)
  grossTotal: number;            // DPP + PPN
  netPayable: number;            // DPP + PPN - PPh
  currency: string;
  exchangeRate: number;
  baseCurrencyAmount: number;    // Nilai netPayable dalam IDR
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Menghitung DPP, PPN, PPh (Withholding Tax), serta konversi Multi-Currency ke IDR.
 * Mendukung skema harga Exclude PPN maupun Include PPN.
 */
export function calculateTaxAndFx(input: TaxFxInput): TaxFxResult {
  const rawAmount = Math.max(0, Number(input.amount) || 0);
  const discountAmount = Math.max(0, Number(input.discountAmount) || 0);
  const taxRate = Math.max(0, Number(input.taxRate) || 0);
  const whtRate = Math.max(0, Number(input.withholdingTaxRate) || 0);
  const currency = (input.currency || 'IDR').toUpperCase();
  const exchangeRate = currency === 'IDR' ? 1 : Math.max(0.000001, Number(input.exchangeRate) || 1);

  const afterDiscount = Math.max(0, rawAmount - discountAmount);

  let dppAmount: number;
  let taxAmount: number;

  if (input.isTaxInclusive && taxRate > 0) {
    dppAmount = round2(afterDiscount / (1 + taxRate / 100));
    taxAmount = round2(afterDiscount - dppAmount);
  } else {
    dppAmount = round2(afterDiscount);
    taxAmount = round2((dppAmount * taxRate) / 100);
  }

  // PPh dihitung dari DPP (sebelum PPN) sesuai regulasi perpajakan Indonesia
  const withholdingTax = round2((dppAmount * whtRate) / 100);
  const grossTotal = round2(dppAmount + taxAmount);
  const netPayable = round2(Math.max(0, grossTotal - withholdingTax));
  const baseCurrencyAmount = round2(netPayable * exchangeRate);

  return {
    dppAmount,
    taxAmount,
    withholdingTax,
    discountAmount: round2(discountAmount),
    grossTotal,
    netPayable,
    currency,
    exchangeRate,
    baseCurrencyAmount,
  };
}

export interface FxVarianceParams {
  invoiceNetForeign: number;
  invoiceExchangeRate: number;
  paymentForeign: number;
  paymentExchangeRate: number;
}

export interface FxVarianceResult {
  invoiceIdr: number;
  paymentIdr: number;
  fxDifferenceIdr: number;
  fxStatus: 'GAIN' | 'LOSS' | 'NEUTRAL';
}

/**
 * Menghitung selisih kurs terealisasi (FX Gain/Loss) antara kurs saat faktur (PI) terbit
 * dan kurs saat pembayaran (PP) dilakukan.
 */
export function calculateFxVariance(params: FxVarianceParams): FxVarianceResult {
  const invoiceIdr = round2(params.invoiceNetForeign * params.invoiceExchangeRate);
  const paymentIdr = round2(params.paymentForeign * params.paymentExchangeRate);
  // Jika bayar IDR lebih kecil dari nilai buku hutang IDR -> Gain, jika lebih besar -> Loss
  const fxDifferenceIdr = round2(invoiceIdr - paymentIdr);

  return {
    invoiceIdr,
    paymentIdr,
    fxDifferenceIdr,
    fxStatus:
      fxDifferenceIdr > 0 ? 'GAIN' : fxDifferenceIdr < 0 ? 'LOSS' : 'NEUTRAL',
  };
}
