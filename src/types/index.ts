export interface LoanParameters {
  monto: number;
  tasaInteres: number; // Expresado en porcentaje (ej: 10 para 10%)
  esAnual: boolean;
  plazoMeses: number;
  tipoTasa: 'efectiva' | 'nominal';
}

export interface AmortizationRow {
  mes: number;
  fecha: string; // Formato DD/MM/YYYY
  cuotaFija: number;
  interesPagado: number;
  capitalAmortizado: number;
  saldoRemanente: number;
}
