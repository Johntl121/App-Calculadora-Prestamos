import { differenceInDays } from 'date-fns';
import Decimal from 'decimal.js';
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
    tipoCalendario,
    plazoMeses,
    seguroDesgravamenRateMensual,
    fechaDesembolso,
  } = params;

  const numMonto       = new Decimal(parseFloat(monto) || 0);
  const numTasa        = new Decimal(parseFloat(tasaInteres) || 0);
  const numPlazo       = parseInt(plazoMeses, 10) || 0;
  const numDesgravamen = new Decimal(parseFloat(seguroDesgravamenRateMensual) || 0);

  if (numMonto.lte(0) || numPlazo <= 0) return [];

  const cien = new Decimal(100);
  const doce = new Decimal(12);
  const tresSesenta = new Decimal(360);

  // ── 1. TEM para fórmula de cuota (anualidad francesa) ─────────────────────
  let TEM: Decimal;
  switch (tipoTasaFija) {
    case 'TEM':
      TEM = numTasa.div(cien);
      break;
    case 'TNA':
      TEM = numTasa.div(cien).div(doce);
      break;
    case 'TEA':
    default:
      TEM = new Decimal(1).plus(numTasa.div(cien)).pow(new Decimal(1).div(doce)).minus(1);
      break;
  }

  // ── 2. TEA → TED base 360 para interés con días exactos ───────────────────
  let TEA: Decimal;
  switch (tipoTasaFija) {
    case 'TEM':
      TEA = new Decimal(1).plus(numTasa.div(cien)).pow(doce).minus(1);
      break;
    case 'TNA':
      TEA = new Decimal(1).plus(numTasa.div(cien).div(doce)).pow(doce).minus(1);
      break;
    case 'TEA':
    default:
      TEA = numTasa.div(cien);
      break;
  }
  const TED = new Decimal(1).plus(TEA).pow(new Decimal(1).div(tresSesenta)).minus(1);

  // ── 3. Tasa Seguro Desgravamen Mensual ────────────────────────────────────
  const TSD = numDesgravamen.div(cien);

  // ── 4. Cuota fija teórica ──────────────────────────────────────────────────
  let J: Decimal;
  if (tipoCalendario === 'comercial') {
    J = TEM.plus(TSD);
  } else {
    const diasPromedioMes = new Decimal(365).div(doce);
    const TEM_Ajustada = new Decimal(1).plus(TED).pow(diasPromedioMes).minus(1);
    const Seguro_Ajustado = TSD.times(diasPromedioMes.div(30));
    J = TEM_Ajustada.plus(Seguro_Ajustado);
  }

  let cuotaTotalFija: Decimal;
  if (J.isZero()) {
    cuotaTotalFija = numMonto.div(numPlazo);
  } else {
    const factor = new Decimal(1).plus(J).pow(numPlazo);
    cuotaTotalFija = numMonto.times(J).times(factor).div(factor.minus(1));
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
    saldoRemanente: numMonto.toNumber(),
  });

  for (let i = 1; i <= numPlazo; i++) {
    const fechaAnterior = fechaVencimiento(fechaDesembolso, i - 1);
    const fechaActual   = fechaVencimiento(fechaDesembolso, i);
    // Días del período según el tipo de calendario elegido
    const dias = tipoCalendario === 'comercial'
      ? 30
      : differenceInDays(fechaActual, fechaAnterior);

    const interesMes = saldo.times(new Decimal(1).plus(TED).pow(dias).minus(1));
    const seguroMes  = saldo.times(TSD).times(new Decimal(dias).div(30));
    let   amortMes   = cuotaTotalFija.minus(interesMes).minus(seguroMes);

    // Último período: cierra el saldo exactamente a 0
    if (i === numPlazo) amortMes = saldo;

    saldo = saldo.minus(amortMes);
    if (saldo.abs().lt(0.005)) saldo = new Decimal(0);

    result.push({
      mes: i,
      fecha: formatDate(fechaActual),
      cuotaTotal: interesMes.plus(seguroMes).plus(amortMes).toNumber(),
      interesPagado: interesMes.toNumber(),
      seguroDesgravamen: seguroMes.toNumber(),
      capitalAmortizado: amortMes.toNumber(),
      saldoRemanente: saldo.toNumber(),
    });
  }

  return result;
}
