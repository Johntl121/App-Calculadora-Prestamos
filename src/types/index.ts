/**
 * Parámetros de entrada del préstamo ingresados por el usuario.
 */
export interface LoanParameters {
  monto: string;
  tasaInteres: string;
  tipoTasaFija: 'TEA' | 'TEM' | 'TNA';
  plazoMeses: string;
  seguroDesgravamenRateMensual: string;
  fechaDesembolso: Date;
}

/**
 * Una fila de la tabla de amortización (Cronograma de Pagos).
 */
export interface AmortizationRow {
  mes: number;
  fecha: string;            // Formato DD/MM/YYYY
  cuotaTotal: number;       // Cuota TOTAL (interés + amortización + seguro)
  interesPagado: number;    // Porción de intereses
  seguroDesgravamen: number;// Costo mensual del seguro
  capitalAmortizado: number;// Porción que reduce la deuda
  saldoRemanente: number;   // Saldo pendiente tras la cuota
}
