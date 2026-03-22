import { create } from 'zustand';
import { AmortizationRow, LoanParameters } from '../types';
import { generateAmortizationTable } from '../utils/loanMath';

interface LoanStore extends LoanParameters {
  moneda: string;
  amortizationTable: AmortizationRow[];
  updateParameter: <K extends keyof LoanParameters>(key: K, value: LoanParameters[K]) => void;
  setMoneda: (moneda: string) => void;
  calculateLoan: () => void;
}

export const useLoanStore = create<LoanStore>((set, get) => ({
  // Estado inicial
  monto: 25000,
  tasaInteres: 12.5,
  esAnual: true,
  plazoMeses: 24,
  tipoTasa: 'efectiva',
  tasaDesgravamen: 0.05,
  moneda: 'S/',

  // Tabla de amortización vacía por defecto
  amortizationTable: [],

  // Actualizar parámetros del préstamo (incluye tipoTasa)
  updateParameter: (key, value) => {
    set({ [key]: value });
  },

  // Actualizar moneda
  setMoneda: (moneda) => {
    set({ moneda });
  },

  // Calcular tabla usando los valores actuales del store
  calculateLoan: () => {
    const { monto, tasaInteres, esAnual, plazoMeses, tipoTasa, tasaDesgravamen } = get();
    const result = generateAmortizationTable({ monto, tasaInteres, esAnual, plazoMeses, tipoTasa, tasaDesgravamen });
    set({ amortizationTable: result });
  },
}));
