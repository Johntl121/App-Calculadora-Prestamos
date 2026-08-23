import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AmortizationRow, LoanParameters } from '../types';
import { generateAmortizationTable, calculateTCEA } from '../utils/loanMath';

interface LoanStore extends LoanParameters {
  moneda: string;
  amortizationTable: AmortizationRow[];
  tcea: number;
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
  prepago: undefined,
};

export const useLoanStore = create<LoanStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      amortizationTable: [],
      tcea: 0,

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
      prepago,
    } = get();

    const result = generateAmortizationTable({
      monto,
      tasaInteres,
      tipoTasaFija,
      tipoCalendario,
      plazoMeses,
      seguroDesgravamenRateMensual,
      fechaDesembolso,
      prepago,
    });

    const tcea = calculateTCEA(parseFloat(monto) || 0, result);

    set({ amortizationTable: result, tcea });
  },

  resetStore: () => {
    set({ ...initialState, fechaDesembolso: new Date(), amortizationTable: [], tcea: 0 });
  },

  newSimulation: () => {
    set({
      monto: '',
      plazoMeses: '',
      amortizationTable: [],
      tcea: 0,
    });
  },

  applyBankPreset: (bancoId) => {
    const rate = BANK_PRESETS[bancoId];
    if (rate) {
      set({ bancoSeleccionado: bancoId, seguroDesgravamenRateMensual: rate });
    }
  },
}),
    {
      name: 'loan-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        monto: state.monto,
        tasaInteres: state.tasaInteres,
        tipoTasaFija: state.tipoTasaFija,
        tipoCalendario: state.tipoCalendario,
        plazoMeses: state.plazoMeses,
        seguroDesgravamenRateMensual: state.seguroDesgravamenRateMensual,
        moneda: state.moneda,
        bancoSeleccionado: state.bancoSeleccionado,
        prepago: state.prepago,
      }),
    }
  )
);
