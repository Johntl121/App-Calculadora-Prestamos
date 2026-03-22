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
 * Retorna la fecha de pago del mes N a partir de la fecha de desembolso.
 * El mes 0 = fecha de desembolso.
 * El mes 1 = desembolso + 1 mes, etc.
 */
function getPaymentDate(baseDate: Date, monthsToAdd: number): string {
  const d = new Date(baseDate);
  d.setMonth(d.getMonth() + monthsToAdd);
  return formatDate(d);
}

/**
 * Genera la tabla de amortización (Cronograma de Pagos) según la metodología
 * bancaria peruana (BCP, Interbank, etc.) usando Tasa Combinada (Técnica Ninja).
 *
 * LÓGICA CLAVE:
 *   - Se crea una TasaCombinadaJ = TEM + TSD para calcular la cuota con la fórmula
 *     de anualidad. Esto garantiza que la CUOTA TOTAL sea perfectamente fija
 *     cada mes, porque el seguro también está "dentro" de la tasa.
 *   - Cada mes se desglosa: Interés = Saldo × TEM, Seguro = Saldo × TSD,
 *     Amortización = Cuota − Interés − Seguro.
 *
 * @param params - Parámetros del préstamo
 * @returns Array de filas del cronograma (incluyendo fila 0 = desembolso)
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

  // ── 1. Calcular TEM (Tasa Efectiva Mensual de Interés) ─────────────────────
  let TEM: number;
  if (!esAnual) {
    // Usuario ingresó tasa mensual directamente
    TEM = tasaInteres / 100;
  } else {
    if (tipoTasa === 'nominal') {
      // TNA → TEM por división simple (capitalización mensual)
      TEM = (tasaInteres / 100) / 12;
    } else {
      // TEA → TEM por fórmula compuesta (estándar bancario peruano)
      TEM = Math.pow(1 + (tasaInteres / 100), 1 / 12) - 1;
    }
  }

  // ── 2. Tasa Seguro Desgravamen Mensual (TSD) ───────────────────────────────
  const TSD = seguroDesgravamenRateMensual / 100;

  // ── 3. Tasa Combinada J = TEM + TSD ────────────────────────────────────────
  // Esta es la "Técnica Ninja": al incluir el seguro en la tasa de la fórmula
  // de anualidad, la CUOTA TOTAL resultante es perfectamente fija cada mes.
  const J = TEM + TSD;

  // ── 4. Cuota Total Fija (Sistema Francés con Tasa Combinada) ───────────────
  let cuotaTotalFija: number;
  if (J === 0) {
    cuotaTotalFija = monto / plazoMeses;
  } else {
    const factor = Math.pow(1 + J, plazoMeses);
    cuotaTotalFija = (monto * J * factor) / (factor - 1);
  }

  // ── 5. Generar el cronograma mes a mes ─────────────────────────────────────
  let saldo = monto;
  const result: AmortizationRow[] = [];

  // Fila 0: Desembolso (fecha de hoy, sin pago)
  result.push({
    mes: 0,
    fecha: getPaymentDate(fechaDesembolso, 0),
    cuotaTotal: 0,
    interesPagado: 0,
    seguroDesgravamen: 0,
    capitalAmortizado: 0,
    saldoRemanente: monto,
  });

  for (let i = 1; i <= plazoMeses; i++) {
    // Desglose mensual sobre el saldo pendiente
    const interesMes  = saldo * TEM;
    const seguroMes   = saldo * TSD;
    let   amortMes    = cuotaTotalFija - interesMes - seguroMes;

    // Corrección del último período para cerrar la deuda exactamente en 0
    if (i === plazoMeses) {
      amortMes = saldo; // cancela lo que quede, sin importar decimales
    }

    saldo -= amortMes;
    if (saldo < 0) saldo = 0; // guardia de seguridad

    const cuotaRealMes = i === plazoMeses
      ? amortMes + interesMes + seguroMes // ajustada para el último mes
      : cuotaTotalFija;

    result.push({
      mes: i,
      fecha: getPaymentDate(fechaDesembolso, i),
      cuotaTotal: cuotaRealMes,
      interesPagado: interesMes,
      seguroDesgravamen: seguroMes,
      capitalAmortizado: amortMes,
      saldoRemanente: saldo,
    });
  }

  return result;
}
