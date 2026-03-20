import { AmortizationRow, LoanParameters } from '../types';

/**
 * Formatea una fecha JavaScript como DD/MM/YYYY
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Genera la fecha de pago para una cuota dada.
 * El mes 1 es 1 mes después de hoy.
 */
function getPaymentDate(monthsToAdd: number): string {
  const date = new Date();
  // Fijamos el día en 1 para evitar saltos incorrectos (ej: 31 ene + 1 mes ≠ 31 feb)
  date.setDate(1);
  date.setMonth(date.getMonth() + monthsToAdd);
  return formatDate(date);
}

/**
 * Genera la tabla de amortización utilizando el Sistema Francés (cuotas fijas).
 * Soporta Tasa Efectiva y Tasa Nominal, tanto anual como mensual.
 *
 * @param params Parámetros del préstamo
 * @returns Arreglo con todas las filas de la tabla de amortización
 */
export function generateAmortizationTable(params: LoanParameters): AmortizationRow[] {
  const { monto, tasaInteres, esAnual, plazoMeses, tipoTasa } = params;

  // ── Cálculo de la Tasa Efectiva Mensual (TEM) ──────────────────────────────
  let TEM: number;

  if (!esAnual) {
    // Si el usuario ingresó una tasa mensual, se toma directamente como TEM
    TEM = tasaInteres / 100;
  } else {
    // Tasa anual → convertir a mensual según el tipo
    if (tipoTasa === 'nominal') {
      // TNA: división simple (capitalización mensual)
      TEM = (tasaInteres / 100) / 12;
    } else {
      // TEA: fórmula compuesta
      TEM = Math.pow(1 + (tasaInteres / 100), 1 / 12) - 1;
    }
  }

  // ── Cuota Fija (Sistema Francés) ───────────────────────────────────────────
  let fixedQuota = 0;
  if (TEM === 0) {
    fixedQuota = monto / plazoMeses;
  } else {
    const factor = Math.pow(1 + TEM, plazoMeses);
    fixedQuota = (monto * TEM * factor) / (factor - 1);
  }

  // ── Generación de la tabla ─────────────────────────────────────────────────
  let balance = monto;
  const result: AmortizationRow[] = [];

  for (let i = 1; i <= plazoMeses; i++) {
    const interesPagado = balance * TEM;
    let capitalAmortizado = fixedQuota - interesPagado;

    // Corrección del último período para eliminar desviaciones por redondeo
    if (i === plazoMeses) {
      capitalAmortizado = balance;
      fixedQuota = capitalAmortizado + interesPagado;
    }

    balance -= capitalAmortizado;
    if (balance < 0) balance = 0;

    result.push({
      mes: i,
      fecha: getPaymentDate(i), // mes 1 = hoy + 1 mes
      cuotaFija: fixedQuota,
      interesPagado,
      capitalAmortizado,
      saldoRemanente: balance,
    });
  }

  return result;
}
