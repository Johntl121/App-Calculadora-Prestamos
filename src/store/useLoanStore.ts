import { create } from 'zustand';
import { AmortizationRow, LoanParameters } from '../types';
import { generateAmortizationTable } from '../utils/loanMath';

interface LoanStore extends LoanParameters {
  moneda: string;
  amortizationTable: AmortizationRow[];
  bancoSeleccionado: string | null;
  updateParameter: <K extends keyof LoanParameters>(key: K, value: LoanParameters[K]) => void;
  setMoneda: (moneda: string) => void;
  calculateLoan: () => void;
  resetStore: () => void;
  newSimulation: () => void;
  applyBankPreset: (bancoId: string) => void;
}

const BANK_PRESETS: Record<string, string> = {
  'BCP': '0.122',
  'BBVA': '0.085',
  'Interbank': '0.090',
  'Scotiabank': '0.105',
};

const initialState: LoanParameters & { moneda: string; bancoSeleccionado: string | null } = {
  monto: '',
  tasaInteres: '',
  tipoTasaFija: 'TEA',
  tipoCalendario: 'real',
  plazoMeses: '',
  seguroDesgravamenRateMensual: '',
  fechaDesembolso: new Date(),
  moneda: 'S/',
  bancoSeleccionado: null,
};

export const useLoanStore = create<LoanStore>((set, get) => ({
  ...initialState,
  amortizationTable: [],

  updateParameter: (key, value) => {
    set((state) => {
      const updates: any = { [key]: value };
      if (key === 'seguroDesgravamenRateMensual') {
        updates.bancoSeleccionado = null;
      }
      return { ...state, ...updates };
    });
  },

  setMoneda: (moneda) => set({ moneda }),

  calculateLoan: () => {
    const {
      monto,
      tasaInteres,
      tipoTasaFija,
      tipoCalendario,
      plazoMeses,
      seguroDesgravamenRateMensual,
      fechaDesembolso,
    } = get();

    const result = generateAmortizationTable({
      monto,
      tasaInteres,
      tipoTasaFija,
      tipoCalendario,
      plazoMeses,
      seguroDesgravamenRateMensual,
      fechaDesembolso,
    });

    set({ amortizationTable: result });
  },

  resetStore: () => {
    set({ ...initialState, fechaDesembolso: new Date(), amortizationTable: [] });
  },

  newSimulation: () => {
    set({
      monto: '',
      plazoMeses: '',
      amortizationTable: [],
    });
  },

  applyBankPreset: (bancoId) => {
    const rate = BANK_PRESETS[bancoId];
    if (rate) {
      set({ bancoSeleccionado: bancoId, seguroDesgravamenRateMensual: rate });
    }
  },
}));
