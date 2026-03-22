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

const initialState: LoanParameters & { moneda: string } = {
  monto: 25000,
  tasaInteres: 21.5,        // TEA referencial (~BCP consumo)
  esAnual: true,
  plazoMeses: 24,
  tipoTasa: 'efectiva',
  /** 0.05% mensual = estándar desgravamen bancos peruanos */
  seguroDesgravamenRateMensual: 0.05,
  fechaDesembolso: new Date(),
  moneda: 'S/',
};

export const useLoanStore = create<LoanStore>((set, get) => ({
  // ── Estado inicial ──────────────────────────────────────────────────────────
  ...initialState,
  amortizationTable: [],

  // ── Actualizar un parámetro del préstamo ────────────────────────────────────
  updateParameter: (key, value) => {
    set((state) => ({ ...state, [key]: value }));
  },

  // ── Actualizar moneda ───────────────────────────────────────────────────────
  setMoneda: (moneda) => {
    set({ moneda });
  },

  // ── Calcular con los valores actuales del store ─────────────────────────────
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

  // ── Resetear todo a valores iniciales ──────────────────────────────────────
  resetStore: () => {
    set({ ...initialState, fechaDesembolso: new Date(), amortizationTable: [] });
  },
}));
