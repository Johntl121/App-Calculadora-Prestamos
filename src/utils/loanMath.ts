import { AmortizationRow, LoanParameters } from '../types';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calcula la fecha estimada basada en los meses a sumar.
 * Por lo general, el primer pago (mes 1) se realiza 1 mes después del mes actual.
 */
function getEstimatedDate(monthsToAdd: number): string {
  const date = new Date();
  // Establecer el día en 1 evita problemas al saltos de meses con distintas cantidades de días (ej. 31 Ene -> Mar)
  date.setDate(1);
  date.setMonth(date.getMonth() + monthsToAdd);
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${monthName} ${year}`;
}

/**
 * Genera la tabla de amortización utilizando el Sistema Francés (cuotas fijas).
 * 
 * @param params Parámetros del préstamo (monto, tasa de interés, etc.)
 * @returns Un arreglo con todas las filas de la tabla de amortización
 */
export function generateAmortizationTable(params: LoanParameters): AmortizationRow[] {
  const { monto, tasaInteres, esAnual, plazoMeses } = params;

  // Asumimos que tasaInteres viene en formato porcentaje (ej: 12 para 12%)
  const rateAsDecimal = tasaInteres / 100;

  // Tasa de interés mensual pura para los cálculos
  const montlyRate = esAnual ? rateAsDecimal / 12 : rateAsDecimal;

  let balance = monto;

  // Cálculo de la cuota fija base, según sistema de amortización francés
  let fixedQuota = 0;
  if (montlyRate === 0) {
    fixedQuota = monto / plazoMeses;
  } else {
    const factor = Math.pow(1 + montlyRate, plazoMeses);
    fixedQuota = (monto * montlyRate * factor) / (factor - 1);
  }

  const result: AmortizationRow[] = [];

  for (let i = 1; i <= plazoMeses; i++) {
    // Intereses correspondientes al período sobre el saldo restante
    const interesPagado = balance * montlyRate;

    // Capital que se abona en esta cuota
    let capitalAmortizado = fixedQuota - interesPagado;

    // Ajuste en el último período para corregir posibles desviaciones por redondeo de JS
    if (i === plazoMeses) {
      capitalAmortizado = balance;
      fixedQuota = capitalAmortizado + interesPagado;
    }

    balance -= capitalAmortizado;

    // Evita pequeños números negativos flotantes (ej. -0.000000001) truncando a 0
    if (balance < 0) balance = 0;

    result.push({
      mes: i,
      fechaEstimada: getEstimatedDate(i), // i - 1 para que el mes 1 sea el mes actual (o bien usa i para empezar el mes siguiente)
      cuotaFija: fixedQuota,
      interesPagado: interesPagado,
      capitalAmortizado: capitalAmortizado,
      saldoRemanente: balance,
    });
  }

  return result;
}
