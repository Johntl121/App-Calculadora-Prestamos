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

  it('calculates a 300-month loan accurately with TEA 25% (real calendar)', () => {
    const params: LoanParameters = {
      monto: '2500000',
      tasaInteres: '25', // 25% TEA
      tipoTasaFija: 'TEA',
      tipoCalendario: 'real',
      plazoMeses: '300',
      seguroDesgravamenRateMensual: '0', 
      fechaDesembolso: new Date(2026, 7, 23),
    };

    const table = generateAmortizationTable(params);
    expect(table.length).toBe(301);
    
    // Verificamos que el saldo convergió exactamente a 0
    expect(table[300].saldoRemanente).toBeCloseTo(0, 2);

    // Verificamos que la última cuota no sea astronómica (menor a un 1% de desviación respecto a la cuota 1)
    const cuota1 = table[1].cuotaTotal;
    const cuotaFinal = table[300].cuotaTotal;
    const variacion = Math.abs((cuotaFinal - cuota1) / cuota1);
    
    console.log(`Test 300 Meses TEA 25%:`);
    console.log(`- Cuota 1: ${cuota1}`);
    console.log(`- Cuota 300 (Final): ${cuotaFinal}`);
    console.log(`- Saldo Final: ${table[300].saldoRemanente}`);
    console.log(`- Variación: ${(variacion * 100).toFixed(2)}%`);

    // La variación puede existir por los días del mes, pero no debe ser extrema
    expect(variacion).toBeLessThan(0.05); // Menor al 5%
  });

  it('calculates a prepago reducir_cuota accurately in a 300-month real calendar loan', () => {
    const params: LoanParameters = {
      monto: '2500000',
      tasaInteres: '25', // 25% TEA
      tipoTasaFija: 'TEA',
      tipoCalendario: 'real',
      plazoMeses: '300',
      seguroDesgravamenRateMensual: '0', 
      fechaDesembolso: new Date(2026, 7, 23),
      prepago: {
        mes: 150, // Prepago a la mitad del crédito
        monto: 1000000,
        tipo: 'reducir_cuota'
      }
    };

    const table = generateAmortizationTable(params);
    
    // Verificamos que convergió a 0
    expect(table[300].saldoRemanente).toBeCloseTo(0, 2);

    // La cuota en el mes 150 debe ser enorme por el prepago, pero la 151 (ya reducida)
    // debe ser mucho menor que la cuota 1
    const cuota1 = table[1].cuotaTotal;
    const cuota151 = table[151].cuotaTotal;
    expect(cuota151).toBeLessThan(cuota1);

    // Y la cuota final (300) debe ser cercana a la nueva cuota reducida (151)
    const cuotaFinal = table[300].cuotaTotal;
    const variacion = Math.abs((cuotaFinal - cuota151) / cuota151);
    
    console.log(`Test Prepago Reducir Cuota en Mes 150:`);
    console.log(`- Cuota 1 (Original): ${cuota1}`);
    console.log(`- Cuota 151 (Reducida post-prepago): ${cuota151}`);
    console.log(`- Cuota 300 (Final): ${cuotaFinal}`);
    console.log(`- Saldo Final: ${table[300].saldoRemanente}`);
    console.log(`- Variación (respecto a cuota reducida): ${(variacion * 100).toFixed(2)}%`);

    expect(variacion).toBeLessThan(0.05); 
  });

  it('calculates a 300-month loan accurately with TEA 100% (real calendar) without hitting the bisection ceiling', () => {
    const params: LoanParameters = {
      monto: '2500000',
      tasaInteres: '100', // 100% TEA (CASO ASTRONOMICO)
      tipoTasaFija: 'TEA',
      tipoCalendario: 'real',
      plazoMeses: '300',
      seguroDesgravamenRateMensual: '0', 
      fechaDesembolso: new Date(2026, 7, 23),
    };

    // La cuota teórica con calendario comercial (Tasa Combinada J)
    // Nos permite saber cuál fue el límite superior 5x del que partió el motor
    const numMonto = 2500000;
    const numPlazo = 300;
    const TEA = 100 / 100;
    const TEM = Math.pow(1 + TEA, 1 / 12) - 1;
    const J = TEM;
    const factor = Math.pow(1 + J, numPlazo);
    const cuotaTeorica = numMonto * J * factor / (factor - 1);
    const bisectionCeiling = cuotaTeorica * 5.0;

    const table = generateAmortizationTable(params);
    expect(table.length).toBe(301);
    
    expect(table[300].saldoRemanente).toBeCloseTo(0, 2);

    const cuota1 = table[1].cuotaTotal;
    const cuotaFinal = table[300].cuotaTotal;
    const variacion = Math.abs((cuotaFinal - cuota1) / cuota1);
    
    console.log(`Test 300 Meses TEA 100% (Caso Astronómico Extremo):`);
    console.log(`- Límite de Búsqueda 5x: ${bisectionCeiling}`);
    console.log(`- Cuota 1 (Encontrada): ${cuota1}`);
    console.log(`- Cuota 300 (Final): ${cuotaFinal}`);
    console.log(`- Saldo Final: ${table[300].saldoRemanente}`);
    console.log(`- Variación (Inicio vs Fin): ${(variacion * 100).toFixed(2)}%`);
    console.log(`- Distancia al Techo: ${((bisectionCeiling - cuota1) / bisectionCeiling * 100).toFixed(2)}% lejos del techo`);

    // Validar que la cuota encontrada esté LEJOS del techo 5x (no se pegó al límite)
    expect(cuota1).toBeLessThan(bisectionCeiling * 0.9);
    
    // Y validar que la variación sea pequeña
    expect(variacion).toBeLessThan(0.05); 
  });
});
