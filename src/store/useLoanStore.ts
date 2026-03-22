import { create } from 'zustand';
import { AmortizationRow, LoanParameters } from '../types';
import { generateAmortizationTable } from '../utils/loanMath';

interface LoanStore extends LoanParameters {
  moneda: string;
  amortizationTable: AmortizationRow[];
  updateParameter: <K extends keyof LoanParameters>(key: K, value: LoanParameters[K]) => void;
  setMoneda: (moneda: string) => void;
  calculateLoan: () => void;
  resetStore: () => void;
}

// Variables inicialmente vacías para que el TextInput actúe con placeholder.
const initialState: LoanParameters & { moneda: string } = {
  monto: '',
  tasaInteres: '',
  esAnual: true,
  plazoMeses: '',
  tipoTasa: 'efectiva',
  seguroDesgravamenRateMensual: '',
  fechaDesembolso: new Date(),
  moneda: 'S/',
};

export const useLoanStore = create<LoanStore>((set, get) => ({
  ...initialState,
  amortizationTable: [],

  updateParameter: (key, value) => {
    set((state) => ({ ...state, [key]: value }));
  },

  setMoneda: (moneda) => {
    set({ moneda });
  },

  calculateLoan: () => {
    const {
      monto,
      tasaInteres,
      esAnual,
      plazoMeses,
      tipoTasa,
      seguroDesgravamenRateMensual,
      fechaDesembolso,
    } = get();

    const result = generateAmortizationTable({
      monto,
      tasaInteres,
      esAnual,
      plazoMeses,
      tipoTasa,
      seguroDesgravamenRateMensual,
      fechaDesembolso,
    });

    set({ amortizationTable: result });
  },

  resetStore: () => {
    set({ ...initialState, fechaDesembolso: new Date(), amortizationTable: [] });
  },
}));
