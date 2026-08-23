import { generateAmortizationTable } from './loanMath';
import { LoanParameters } from '../types';

describe('generateAmortizationTable', () => {
  it('calculates a 12-month loan accurately with TEA (commercial calendar)', () => {
    const params: LoanParameters = {
      monto: '10000',
      tasaInteres: '15', // 15% TEA
      tipoTasaFija: 'TEA',
      tipoCalendario: 'comercial', // 30 days every month
      plazoMeses: '12',
      seguroDesgravamenRateMensual: '0.08', // 0.08% monthly
      fechaDesembolso: new Date(2024, 0, 1), // Jan 1, 2024
    };

    const table = generateAmortizationTable(params);
    
    // Deberían haber 13 filas (mes 0 al 12)
    expect(table.length).toBe(13);

    // Fila 0: desembolso
    expect(table[0].saldoRemanente).toBeCloseTo(10000, 2);

    // Saldo en última fila debe ser 0
    expect(table[12].saldoRemanente).toBeCloseTo(0, 2);

    // Snapshot general para validar que decimal.js no altere los resultados
    expect(table).toMatchSnapshot();
  });

  it('calculates a 24-month loan accurately with TEM (real calendar)', () => {
    const params: LoanParameters = {
      monto: '25000',
      tasaInteres: '1.2', // 1.2% TEM
      tipoTasaFija: 'TEM',
      tipoCalendario: 'real',
      plazoMeses: '24',
      seguroDesgravamenRateMensual: '0.05', 
      fechaDesembolso: new Date(2024, 5, 15), // June 15, 2024
    };

    const table = generateAmortizationTable(params);
    expect(table.length).toBe(25);
    expect(table[24].saldoRemanente).toBeCloseTo(0, 2);

    expect(table).toMatchSnapshot();
  });

  it('calculates a 6-month loan accurately with TNA (commercial calendar)', () => {
    const params: LoanParameters = {
      monto: '5000',
      tasaInteres: '18', // 18% TNA
      tipoTasaFija: 'TNA',
      tipoCalendario: 'comercial',
      plazoMeses: '6',
      seguroDesgravamenRateMensual: '0', // sin seguro
      fechaDesembolso: new Date(2024, 2, 10),
    };

    const table = generateAmortizationTable(params);
    expect(table.length).toBe(7);
    expect(table[6].saldoRemanente).toBeCloseTo(0, 2);

    expect(table).toMatchSnapshot();
  });
});
