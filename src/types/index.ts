export interface LoanParameters {
  monto: number;
  tasaInteres: number; // Expresado en porcentaje (ej: 10 para 10%)
  esAnual: boolean;
  plazoMeses: number;
  tipoTasa: 'efectiva' | 'nominal';
  tasaDesgravamen: number; // Porcentaje de desgravamen (ej. 0.05)
}

export interface AmortizationRow {
  mes: number;
  fecha: string; // Formato DD/MM/YYYY
  cuotaFija: number; // Base de la cuota según sistema Francés
  interesPagado: number;
  capitalAmortizado: number;
  seguroDesgravamen: number;
  cuotaTotal: number; // Cuota Fija + Seguro
  saldoRemanente: number;
}
