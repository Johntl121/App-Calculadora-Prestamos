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

  const numMonto = parseFloat(monto) || 0;
  const numTasa = parseFloat(tasaInteres) || 0;
  const numPlazo = parseInt(plazoMeses, 10) || 0;
  const numDesgravamen = parseFloat(seguroDesgravamenRateMensual) || 0;

  if (numMonto <= 0 || numPlazo <= 0) return []; // Seguro contra inputs incompletos.

  // 1. Calcular TEM
  let TEM: number;
  if (!esAnual) {
    TEM = numTasa / 100;
  } else {
    if (tipoTasa === 'nominal') {
      TEM = (numTasa / 100) / 12;
    } else {
      TEM = Math.pow(1 + (numTasa / 100), 1 / 12) - 1;
    }
  }

  // 2. Tasa Seguro Desgravamen Mensual
  const TSD = numDesgravamen / 100;

  // 3. Tasa Combinada J = TEM + TSD
  const J = TEM + TSD;

  // 4. Cuota Total Fija (Sistema Francés con Tasa Combinada)
  let cuotaTotalFija: number;
  if (J === 0) {
    cuotaTotalFija = numMonto / numPlazo;
  } else {
    const factor = Math.pow(1 + J, numPlazo);
    cuotaTotalFija = (numMonto * J * factor) / (factor - 1);
  }

  // 5. Cronograma
  let saldo = numMonto;
  const result: AmortizationRow[] = [];

  result.push({
    mes: 0,
    fecha: getPaymentDate(fechaDesembolso, 0),
    cuotaTotal: 0,
    interesPagado: 0,
    seguroDesgravamen: 0,
    capitalAmortizado: 0,
    saldoRemanente: numMonto,
  });

  for (let i = 1; i <= numPlazo; i++) {
    const interesMes  = saldo * TEM;
    const seguroMes   = saldo * TSD;
    let   amortMes    = cuotaTotalFija - interesMes - seguroMes;

    if (i === numPlazo) {
      amortMes = saldo; 
    }

    saldo -= amortMes;
    if (saldo < 0) saldo = 0; 

    const cuotaRealMes = i === numPlazo
      ? amortMes + interesMes + seguroMes 
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
