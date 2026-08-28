import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AmortizationRow, LoanParameters } from '../types';
import { generateAmortizationTable, calculateTCEA } from '../utils/loanMath';

export interface OriginalMetrics {
  totalInteres: number;
  totalSeguro: number;
  totalPagar: number;
  plazo: number;
  cuotaMes1: number;
}

interface LoanStore extends LoanParameters {
  moneda: string;
  amortizationTable: AmortizationRow[];
  tcea: number;
  originalMetrics: OriginalMetrics | null;
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
      originalMetrics: null,

  updateParameter: (key, value) => {
    set((state) => {
      const updates: any = { [key]: value };
      // FIX PUNTO 3: Limpiar el prepago activo si cambian los parámetros base
      if (key !== 'prepago') {
        updates.prepago = undefined;
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
      originalMetrics,
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

    // Solo guardar métricas originales cuando NO hay prepago activo
    if (!prepago) {
      let tInteres = 0, tSeguro = 0, tPagar = 0;
      const cuotaMes1 = result.find(r => r.mes === 1)?.cuotaTotal ?? 0;
      for (const row of result) {
        if (row.mes === 0) continue;
        tInteres += row.interesPagado;
        tSeguro += row.seguroDesgravamen;
        tPagar += row.cuotaTotal;
      }
      const plazo = result[result.length - 1]?.mes || 0;
      set({
        amortizationTable: result,
        tcea,
        originalMetrics: { totalInteres: tInteres, totalSeguro: tSeguro, totalPagar: tPagar, plazo, cuotaMes1 },
      });
    } else {
      // Prepago activo: preservar originalMetrics existentes
      set({ amortizationTable: result, tcea });
    }
  },

  resetStore: () => {
    set({ ...initialState, fechaDesembolso: new Date(), amortizationTable: [], tcea: 0, originalMetrics: null });
  },

  newSimulation: () => {
    set({
      monto: '',
      plazoMeses: '',
      amortizationTable: [],
      tcea: 0,
      originalMetrics: null,
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
        originalMetrics: state.originalMetrics,
      }),
    }
  )
);
