import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoanStore } from '../../src/store/useLoanStore';

const formatCurrency = (value: number, symbol: string) => {
  return `${symbol} ${(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CURRENCIES = ['S/', '$', '€'];

export default function LoanCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { monto, tasaInteres, esAnual, plazoMeses, tipoTasa, moneda, amortizationTable, updateParameter, setMoneda, calculateLoan } =
    useLoanStore();

  const [isCalculated, setIsCalculated] = useState(false);
  const [montoText, setMontoText] = useState(monto.toString());
  const [tasaText, setTasaText] = useState(tasaInteres.toString());
  const [plazoText, setPlazoText] = useState(plazoMeses.toString());

  const handleMonto = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setMontoText(clean);
    const num = parseFloat(clean);
    if (!isNaN(num)) updateParameter('monto', num);
    setIsCalculated(false);
  };

  const handleTasa = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setTasaText(clean);
    const num = parseFloat(clean);
    if (!isNaN(num)) updateParameter('tasaInteres', num);
    setIsCalculated(false);
  };

  const handlePlazo = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setPlazoText(clean);
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > 0) updateParameter('plazoMeses', num);
    setIsCalculated(false);
  };

  const handleSwitchTasa = (val: boolean) => {
    updateParameter('esAnual', val);
    setIsCalculated(false);
  };

  const handleCalcular = () => {
    calculateLoan();
    setIsCalculated(true);
  };

  const generatePDF = async () => {
    try {
      const formatNum = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      const tableRows = amortizationTable.map((row) => `
        <tr>
          <td style="text-align: center;">${row.mes}</td>
          <td style="text-align: center;">${row.fecha}</td>
          <td style="text-align: right;">${moneda} ${formatNum(row.cuotaFija)}</td>
          <td style="text-align: right;">${moneda} ${formatNum(row.capitalAmortizado)}</td>
          <td style="text-align: right;">${moneda} ${formatNum(row.interesPagado)}</td>
          <td style="text-align: right; color: #0f766e; font-weight: bold;">${moneda} ${formatNum(row.saldoRemanente)}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #0f766e; text-align: center; margin-bottom: 5px; font-size: 24px; }
              .summary-box { background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .summary-box p { margin: 6px 0; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              th, td { padding: 10px 5px; border-bottom: 1px solid #e2e8f0; }
              th { background-color: #0f766e; color: #ffffff; text-transform: uppercase; font-size: 10px; }
              tr:nth-child(even) { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>Plan de Amortización</h1>
            <div class="summary-box">
              <p><strong>Monto Prestado:</strong> ${moneda} ${formatNum(monto)}</p>
              <p><strong>Plazo:</strong> ${plazoMeses} meses &nbsp; | &nbsp; <strong>Tasa (${tipoTasa}):</strong> ${tasaInteres}% ${esAnual ? 'Anual' : 'Mensual'}</p>
              <p><strong>Cuota Mensual:</strong> ${formatCurrency(cuotaFija, moneda)}</p>
              <p><strong>Total a Pagar:</strong> ${formatCurrency(totalPagar, moneda)} &nbsp; | &nbsp; <strong>Total Interés:</strong> ${formatCurrency(totalInteres, moneda)}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Fecha</th>
                  <th style="text-align: right;">Cuota</th>
                  <th style="text-align: right;">Capital</th>
                  <th style="text-align: right;">Interés</th>
                  <th style="text-align: right;">Saldo</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const { cuotaFija, totalPagar, totalInteres } = useMemo(() => {
    if (!plazoMeses || plazoMeses <= 0) {
      return { cuotaFija: 0, totalPagar: 0, totalInteres: 0 };
    }
    const rateAsDecimal = tasaInteres / 100;
    const monthlyRate = esAnual ? rateAsDecimal / 12 : rateAsDecimal;
    let cuota = 0;
    if (monthlyRate === 0) {
      cuota = monto / plazoMeses;
    } else {
      const factor = Math.pow(1 + monthlyRate, plazoMeses);
      cuota = (monto * monthlyRate * factor) / (factor - 1);
    }
    if (!Number.isFinite(cuota) || cuota < 0) cuota = 0;
    const total = cuota * plazoMeses;
    const interes = Math.max(0, total - monto);
    return { cuotaFija: cuota, totalPagar: total, totalInteres: interes };
  }, [monto, tasaInteres, esAnual, plazoMeses]);

  const isDark = colorScheme === 'dark';

  return (
    <View
      className="flex-1 bg-slate-100 dark:bg-slate-950"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1 px-5 pt-6 pb-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* === ENCABEZADO === */}
        <View className="mb-6 mt-2">
          <Text className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
            Simulador de Préstamo
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Ingresa los datos para calcular tu cuota
          </Text>
        </View>

        {/* === SECCIÓN 1: FORMULARIO === */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md dark:shadow-none shadow-slate-200/60 mb-5">

          {/* Selector de Moneda */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3">
            MONEDA
          </Text>
          <View className="flex-row mb-6" style={{ gap: 8 }}>
            {CURRENCIES.map((cur) => {
              const isActive = moneda === cur;
              return (
                <Pressable
                  key={cur}
                  onPress={() => setMoneda(cur)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 999,
                    backgroundColor: isActive
                      ? (isDark ? '#0f766e' : '#0f172a')
                      : (isDark ? '#1e293b' : '#f1f5f9'),
                  }}
                >
                  <Text style={{
                    fontWeight: 'bold',
                    fontSize: 14,
                    color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  }}>
                    {cur}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Monto */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">
            MONTO DEL PRÉSTAMO
          </Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-5">
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 mr-2">{moneda}</Text>
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric"
              value={montoText}
              onChangeText={handleMonto}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          {/* Tasa de Interés */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">
            TASA DE INTERÉS
          </Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-4">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric"
              value={tasaText}
              onChangeText={handleTasa}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 ml-2">%</Text>
          </View>

          {/* Selector Efectiva / Nominal */}
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            <Pressable
              onPress={() => updateParameter('tipoTasa', 'efectiva')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: tipoTasa === 'efectiva'
                  ? (isDark ? '#0f766e' : '#0f172a')
                  : (isDark ? '#1e293b' : '#f1f5f9'),
              }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: tipoTasa === 'efectiva' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b') }}>
                T. Efectiva
              </Text>
            </Pressable>
            <Pressable
              onPress={() => updateParameter('tipoTasa', 'nominal')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: tipoTasa === 'nominal'
                  ? (isDark ? '#0f766e' : '#0f172a')
                  : (isDark ? '#1e293b' : '#f1f5f9'),
              }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: tipoTasa === 'nominal' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b') }}>
                T. Nominal
              </Text>
            </Pressable>
          </View>

          {/* Toggle Mensual / Anual */}
          <View className="flex-row items-center justify-center mb-5" style={{ gap: 12 }}>
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Mensual</Text>
            <Switch
              value={esAnual}
              onValueChange={handleSwitchTasa}
              trackColor={{ false: '#94a3b8', true: '#0f766e' }}
              thumbColor={esAnual ? '#ccfbf1' : '#f8fafc'}
            />
            <Text className="text-sm font-bold text-slate-950 dark:text-white">Anual</Text>
          </View>

          {/* Plazo */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">
            PLAZO
          </Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric"
              maxLength={3}
              value={plazoText}
              onChangeText={handlePlazo}
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-lg font-bold text-slate-400 dark:text-slate-500 ml-2">meses</Text>
          </View>
        </View>

        {/* === SECCIÓN 2: BOTÓN CALCULAR === */}
        <Pressable
          onPress={handleCalcular}
          className="rounded-full py-5 items-center justify-center mb-5 shadow-lg shadow-teal-900/30"
          style={{ backgroundColor: '#0f766e' }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
            CALCULAR PRÉSTAMO
          </Text>
        </Pressable>

        {/* === SECCIÓN 3: RESULTADOS (solo si isCalculated) === */}
        {isCalculated && (
          <View className="bg-teal-950 rounded-3xl p-7 mb-8 shadow-xl shadow-teal-900/40">
            {/* Cuota Principal */}
            <Text className="text-xs font-bold text-teal-300 tracking-widest mb-1 text-center">
              CUOTA MENSUAL ESTIMADA
            </Text>
            <Text className="text-[52px] font-black text-white text-center leading-tight mb-1">
              {formatCurrency(cuotaFija, moneda)}
            </Text>
            <Text className="text-teal-400 text-center text-sm font-medium mb-6">
              por {plazoMeses} meses · tasa {esAnual ? 'anual' : 'mensual'} {tasaInteres}%
            </Text>

            {/* Subresumen */}
            <View className="flex-row justify-between mb-8">
              <View className="flex-1 items-center">
                <Text className="text-xs text-teal-400 font-bold tracking-widest mb-1">TOTAL A PAGAR</Text>
                <Text className="text-white font-extrabold text-lg" numberOfLines={1}>
                  {formatCurrency(totalPagar, moneda)}
                </Text>
              </View>
              <View className="w-px bg-teal-800" />
              <View className="flex-1 items-center">
                <Text className="text-xs text-teal-400 font-bold tracking-widest mb-1">TOTAL INTERÉS</Text>
                <Text className="text-teal-300 font-extrabold text-lg" numberOfLines={1}>
                  {formatCurrency(totalInteres, moneda)}
                </Text>
              </View>
            </View>

            {/* Botones de Acción */}
            <Link href="/explore" asChild onPress={() => {}}>
              <Pressable
                className="rounded-2xl py-4 items-center justify-center flex-row mb-3"
                style={{ backgroundColor: '#115e59' }}
              >
                <Ionicons name="list-outline" size={20} color="#ccfbf1" style={{ marginRight: 8 }} />
                <Text style={{ color: '#ccfbf1', fontWeight: '700', fontSize: 15 }}>
                  Ver Tabla de Amortización
                </Text>
              </Pressable>
            </Link>

            <Pressable
              className="rounded-2xl py-4 items-center justify-center flex-row"
              style={{ backgroundColor: '#1e293b' }}
              onPress={generatePDF}
            >
              <Ionicons name="document-text-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 15 }}>
                Exportar a PDF
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Botón de Modo Oscuro */}
      <Pressable
        onPress={toggleColorScheme}
        className="absolute right-6 rounded-full p-2.5 bg-slate-200/60 dark:bg-slate-800"
        style={{ top: insets.top + 12, zIndex: 999, elevation: 5 }}
      >
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={20}
          color={isDark ? '#fef08a' : '#334155'}
        />
      </Pressable>
    </View>
  );
}