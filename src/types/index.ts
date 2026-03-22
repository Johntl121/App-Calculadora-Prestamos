/**
 * Parámetros de entrada del préstamo ingresados por el usuario.
 */
export interface LoanParameters {
  monto: number;
  tasaInteres: number;   // TEA o TNA en porcentaje (ej: 21.5 para 21.5%)
  esAnual: boolean;       // true = tasa anual, false = tasa ya es mensual
  plazoMeses: number;
  tipoTasa: 'efectiva' | 'nominal';
  /** Tasa mensual del Seguro de Desgravamen en porcentaje (ej: 0.05 para 0.05%) */
  seguroDesgravamenRateMensual: number;
  /** Fecha de desembolso del préstamo */
  fechaDesembolso: Date;
}

/**
 * Una fila de la tabla de amortización (Cronograma de Pagos).
 */
export interface AmortizationRow {
  mes: number;
  fecha: string;           // Formato DD/MM/YYYY
  cuotaTotal: number;      // Cuota fija TOTAL (interés + amortización + seguro)
  interesPagado: number;   // Porción de intereses
  seguroDesgravamen: number; // Costo mensual del seguro
  capitalAmortizado: number; // Porción que reduce la deuda
  saldoRemanente: number;  // Saldo pendiente tras la cuota
}
