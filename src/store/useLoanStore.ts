import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AmortizationRow, LoanParameters } from '../types';
import { generateAmortizationTable, calculateTCEA } from '../utils/loanMath';

interface LoanStore extends LoanParameters {
  moneda: string;
  amortizationTable: AmortizationRow[];
  tcea: number;
  updateParameter: <K extends keyof LoanParameters>(key: K, value: LoanParameters[K]) => void;
  setMoneda: (moneda: string) => void;
  calculateLoan: () => void;
  resetStore: () => void;
  newSimulation: () => void;
}

const initialState: LoanParameters & { moneda: string } = {
  monto: '',
  tasaInteres: '',
  tipoTasaFija: 'TEA',
  tipoCalendario: 'real',
  plazoMeses: '',
  seguroDesgravamenRateMensual: '',
  fechaDesembolso: new Date(),
  moneda: 'S/',
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
        prepago: state.prepago,
      }),
    }
  )
);
