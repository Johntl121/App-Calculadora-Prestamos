import { differenceInDays } from 'date-fns';
import { AmortizationRow, LoanParameters } from '../types';

/**
 * Formatea una fecha JavaScript como DD/MM/YYYY
 */
function formatDate(date: Date): string {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Devuelve la fecha exacta de vencimiento del mes N.
 * Usa el mismo día del mes que la fecha de desembolso.
 * Ej: desembolso 10/03 → vcto. mes 1: 10/04, mes 2: 10/05, etc.
 */
function fechaVencimiento(base: Date, mesesAgregar: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + mesesAgregar);
  return d;
}

/**
 * Genera la tabla de amortización con precisión bancaria real (BCP-style).
 *
 * METODOLOGÍA:
 *   1. TEA → TED (Tasa Efectiva Diaria) usando base 360.
 *   2. Los días entre fechas de vencimiento se calculan con date-fns exactos.
 *   3. El interés de cada período usa los días reales: Saldo × ((1+TED)^días - 1)
 *   4. El seguro usa: Saldo × TSD_mensual × (días / 30)  →  proporción exacta de días.
 *   5. La cuota se recalcula con Tasa Combinada Mensual estándar, y el último
 *      período cierra el saldo exactamente a 0 (ajuste de redondeo).
 *
 * @param params - Parámetros del préstamo
 * @returns Cronograma de pagos (fila 0 = desembolso, filas 1..n = cuotas)
 */
export function generateAmortizationTable(params: LoanParameters): AmortizationRow[] {
  const {
    monto,
    tasaInteres,
    esAnual,
    plazoMeses,
    tipoTasa,
    seguroDesgravamenRateMensual,
    fechaDesembolso,
  } = params;

  const numMonto      = parseFloat(monto) || 0;
  const numTasa       = parseFloat(tasaInteres) || 0;
  const numPlazo      = parseInt(plazoMeses, 10) || 0;
  const numDesgravamen = parseFloat(seguroDesgravamenRateMensual) || 0;

  if (numMonto <= 0 || numPlazo <= 0) return [];

  // ── 1. Tasa Efectiva Mensual (TEM) para la fórmula de cuota ────────────────
  //       (usada en la fórmula de anualidad, como siempre)
  let TEM: number;
  if (!esAnual) {
    // El usuario ingresó una tasa mensual directamente
    TEM = numTasa / 100;
  } else {
    if (tipoTasa === 'nominal') {
      TEM = (numTasa / 100) / 12;
    } else {
      // TEA → TEM compuesta
      TEM = Math.pow(1 + (numTasa / 100), 1 / 12) - 1;
    }
  }

  // ── 2. Tasa Efectiva Diaria (TED) — base 360 (estándar bancario peruano) ───
  //       La TED se deriva SIEMPRE de una tasa anual efectiva (TEA).
  //       Si el usuario ingresó nominal o mensual, la convertimos primero a TEA.
  let TEA: number;
  if (!esAnual) {
    // Mensual → anual efectiva
    TEA = Math.pow(1 + numTasa / 100, 12) - 1;
  } else if (tipoTasa === 'nominal') {
    // TNA → TEA
    TEA = Math.pow(1 + (numTasa / 100) / 12, 12) - 1;
  } else {
    TEA = numTasa / 100;
  }
  const TED = Math.pow(1 + TEA, 1 / 360) - 1;

  // ── 3. Tasa Seguro Desgravamen Mensual (TSD) — expresada como decimal ──────
  const TSD = numDesgravamen / 100; // ej: 0.05% → 0.0005

  // ── 4. Cuota fija teórica usando Tasa Combinada (para que la cuota base
  //       sea estable) ─────────────────────────────────────────────────────────
  //       J = TEM + TSD  (Técnica Ninja bancaria)
  const J = TEM + TSD;
  let cuotaTotalFija: number;
  if (J === 0) {
    cuotaTotalFija = numMonto / numPlazo;
  } else {
    const factor = Math.pow(1 + J, numPlazo);
    cuotaTotalFija = (numMonto * J * factor) / (factor - 1);
  }

  // ── 5. Generar el cronograma mes a mes con días exactos ────────────────────
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

    // Días exactos entre el período anterior y el actual
    const dias = differenceInDays(fechaActual, fechaAnterior);

    // Interés del período con días exactos: Saldo × ((1 + TED)^días - 1)
    const interesMes = saldo * (Math.pow(1 + TED, dias) - 1);

    // Seguro proporcional por días: Saldo × TSD_mensual × (días / 30)
    const seguroMes = saldo * TSD * (dias / 30);

    // Amortización = Cuota fija teórica – Interés real – Seguro real
    let amortMes = cuotaTotalFija - interesMes - seguroMes;

    // Último período: cancela exactamente el saldo restante
    if (i === numPlazo) {
      amortMes = saldo;
    }

    // Actualizar saldo
    saldo = saldo - amortMes;
    if (Math.abs(saldo) < 0.005) saldo = 0; // eliminar residuo de centavos

    const cuotaRealMes = interesMes + seguroMes + amortMes;

    result.push({
      mes: i,
      fecha: formatDate(fechaActual),
      cuotaTotal: cuotaRealMes,
      interesPagado: interesMes,
      seguroDesgravamen: seguroMes,
      capitalAmortizado: amortMes,
      saldoRemanente: saldo,
    });
  }

  return result;
}
