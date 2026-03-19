export interface LoanParameters {
  monto: number;
  tasaInteres: number; // Expresado en porcentaje (ej: 10 para 10%)
  esAnual: boolean;
  plazoMeses: number;
}

export interface AmortizationRow {
  mes: number;
  fechaEstimada: string;
  cuotaFija: number;
  interesPagado: number;
  capitalAmortizado: number;
  saldoRemanente: number;
}
