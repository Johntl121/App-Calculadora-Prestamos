import { differenceInDays } from 'date-fns';
import { AmortizationRow, LoanParameters } from '../types';

function formatDate(date: Date): string {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function fechaVencimiento(base: Date, mesesAgregar: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + mesesAgregar);
  return d;
}

/**
 * Genera la tabla de amortización con precisión bancaria real (BCP-style).
 *
 * METODOLOGÍA:
 *   1. tipoTasaFija (TEA/TEM/TNA) → TEM y TEA para cálculos.
 *   2. TEA → TED (base 360) para interés con días exactos.
 *   3. Cuota fija usando Tasa Combinada J = TEM + TSD.
 *   4. Seguro proporcional a días reales del período.
 *   5. Último período cierra el saldo exactamente a 0.
 */
export function generateAmortizationTable(params: LoanParameters): AmortizationRow[] {
  const {
    monto,
    tasaInteres,
    tipoTasaFija,
    plazoMeses,
    seguroDesgravamenRateMensual,
    fechaDesembolso,
  } = params;

  const numMonto       = parseFloat(monto) || 0;
  const numTasa        = parseFloat(tasaInteres) || 0;
  const numPlazo       = parseInt(plazoMeses, 10) || 0;
  const numDesgravamen = parseFloat(seguroDesgravamenRateMensual) || 0;

  if (numMonto <= 0 || numPlazo <= 0) return [];

  // ── 1. TEM para fórmula de cuota (anualidad francesa) ─────────────────────
  let TEM: number;
  switch (tipoTasaFija) {
    case 'TEM':
      TEM = numTasa / 100;
      break;
    case 'TNA':
      TEM = (numTasa / 100) / 12;
      break;
    case 'TEA':
    default:
      TEM = Math.pow(1 + (numTasa / 100), 1 / 12) - 1;
      break;
  }

  // ── 2. TEA → TED base 360 para interés con días exactos ───────────────────
  let TEA: number;
  switch (tipoTasaFija) {
    case 'TEM':
      TEA = Math.pow(1 + numTasa / 100, 12) - 1;
      break;
    case 'TNA':
      TEA = Math.pow(1 + (numTasa / 100) / 12, 12) - 1;
      break;
    case 'TEA':
    default:
      TEA = numTasa / 100;
      break;
  }
  const TED = Math.pow(1 + TEA, 1 / 360) - 1;

  // ── 3. Tasa Seguro Desgravamen Mensual ────────────────────────────────────
  const TSD = numDesgravamen / 100;

  // ── 4. Cuota fija teórica — Tasa Combinada J = TEM + TSD ─────────────────
  const J = TEM + TSD;
  let cuotaTotalFija: number;
  if (J === 0) {
    cuotaTotalFija = numMonto / numPlazo;
  } else {
    const factor = Math.pow(1 + J, numPlazo);
    cuotaTotalFija = (numMonto * J * factor) / (factor - 1);
  }

  // ── 5. Cronograma mes a mes con días exactos ──────────────────────────────
  let saldo = numMonto;
  const result: AmortizationRow[] = [];

  // Fila 0: Desembolso
  result.push({
    mes: 0,
    fecha: formatDate(fechaDesembolso),
    cuotaTotal: 0,
    interesPagado: 0,
    seguroDesgravamen: 0,
    capitalAmortizado: 0,
    saldoRemanente: numMonto,
  });

  for (let i = 1; i <= numPlazo; i++) {
    const fechaAnterior = fechaVencimiento(fechaDesembolso, i - 1);
    const fechaActual   = fechaVencimiento(fechaDesembolso, i);
    const dias          = differenceInDays(fechaActual, fechaAnterior);

    const interesMes = saldo * (Math.pow(1 + TED, dias) - 1);
    const seguroMes  = saldo * TSD * (dias / 30);
    let   amortMes   = cuotaTotalFija - interesMes - seguroMes;

    // Último período: cierra el saldo exactamente a 0
    if (i === numPlazo) amortMes = saldo;

    saldo = saldo - amortMes;
    if (Math.abs(saldo) < 0.005) saldo = 0;

    result.push({
      mes: i,
      fecha: formatDate(fechaActual),
      cuotaTotal: interesMes + seguroMes + amortMes,
      interesPagado: interesMes,
      seguroDesgravamen: seguroMes,
      capitalAmortizado: amortMes,
      saldoRemanente: saldo,
    });
  }

  return result;
}
