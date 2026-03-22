import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, moveAsync } from 'expo-file-system';
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

  const {
    monto,
    tasaInteres,
    esAnual,
    plazoMeses,
    tipoTasa,
    seguroDesgravamenRateMensual,
    moneda,
    amortizationTable,
    updateParameter,
    setMoneda,
    calculateLoan,
    resetStore,
  } = useLoanStore();

  const [isCalculated, setIsCalculated] = useState(false);
  const [montoText, setMontoText]             = useState(monto.toString());
  const [tasaText,  setTasaText]               = useState(tasaInteres.toString());
  const [desgravamenText, setDesgravamenText]  = useState(seguroDesgravamenRateMensual.toString());
  const [plazoText, setPlazoText]             = useState(plazoMeses.toString());

  // Sincronizar inputs locales cuando el store cambia (ej: botón Reset)
  React.useEffect(() => {
    setMontoText(monto.toString());
    setTasaText(tasaInteres.toString());
    setDesgravamenText(seguroDesgravamenRateMensual.toString());
    setPlazoText(plazoMeses.toString());
    if (amortizationTable.length === 0) setIsCalculated(false);
  }, [monto, tasaInteres, seguroDesgravamenRateMensual, plazoMeses, amortizationTable]);

  /* ── Handlers ─────────────────────────────────────────────────────────────── */

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

  const handleDesgravamen = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setDesgravamenText(clean);
    const num = parseFloat(clean);
    if (!isNaN(num)) updateParameter('seguroDesgravamenRateMensual', num);
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

  /* ── PDF ──────────────────────────────────────────────────────────────────── */

  const generatePDF = async () => {
    try {
      const formatNum = (value: number) =>
        value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const tableRows = amortizationTable.map((row) => `
        <tr>
          <td style="text-align:center;">${row.mes}</td>
          <td style="text-align:center;">${row.fecha}</td>
          <td style="text-align:right;">${row.mes === 0 ? '-' : `${moneda} ${formatNum(row.capitalAmortizado)}`}</td>
          <td style="text-align:right;">${row.mes === 0 ? '-' : `${moneda} ${formatNum(row.interesPagado)}`}</td>
          <td style="text-align:right;">${row.mes === 0 ? '-' : `${moneda} ${formatNum(row.seguroDesgravamen)}`}</td>
          <td style="text-align:right; font-weight:bold;">${row.mes === 0 ? '-' : `${moneda} ${formatNum(row.cuotaTotal)}`}</td>
          <td style="text-align:right; color:#0f766e; font-weight:bold;">${moneda} ${formatNum(row.saldoRemanente)}</td>
        </tr>
      `).join('');

      const safeMoneda = moneda === 'S/' ? 'Soles' : moneda === '$' ? 'Dolares' : 'Euros';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width,initial-scale=1.0" />
            <style>
              body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; padding:20px; color:#333; }
              h1   { color:#0f766e; text-align:center; margin-bottom:5px; font-size:24px; }
              .summary-box { background:#f1f5f9; padding:15px; border-radius:8px; margin-bottom:20px; text-align:center; }
              .summary-box p { margin:6px 0; font-size:14px; }
              table { width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
              th, td { padding:10px 5px; border-bottom:1px solid #e2e8f0; }
              th { background-color:#0f766e; color:#fff; text-transform:uppercase; font-size:10px; }
              tr:nth-child(even) { background:#f8fafc; }
            </style>
          </head>
          <body>
            <h1>Plan de Amortización</h1>
            <div class="summary-box">
              <p><strong>Monto Prestado:</strong> ${moneda} ${formatNum(monto)}</p>
              <p>
                <strong>Plazo:</strong> ${plazoMeses} meses &nbsp;|&nbsp;
                <strong>Tasa (${tipoTasa}):</strong> ${tasaInteres}% ${esAnual ? 'Anual' : 'Mensual'} &nbsp;|&nbsp;
                <strong>Desgravamen:</strong> ${seguroDesgravamenRateMensual}% mensual
              </p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Fecha</th>
                  <th style="text-align:right;">Capital</th>
                  <th style="text-align:right;">Interés</th>
                  <th style="text-align:right;">S. Desgr.</th>
                  <th style="text-align:right;">Cuota Total</th>
                  <th style="text-align:right;">Saldo</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const pdfName = `${Paths.cache.uri}Simulacion_${monto}_${safeMoneda}.pdf`;
      await moveAsync({ from: uri, to: pdfName });
      await Sharing.shareAsync(pdfName, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  /* ── Totales (useMemo) ────────────────────────────────────────────────────── */

  const { cuotaMensualEstimada, totalPagar, totalInteres, totalSeguro } = useMemo(() => {
    if (amortizationTable.length === 0)
      return { cuotaMensualEstimada: 0, totalPagar: 0, totalInteres: 0, totalSeguro: 0 };

    const primeraCuota = amortizationTable.find((r) => r.mes === 1)?.cuotaTotal ?? 0;
    let tPagar = 0, tInteres = 0, tSeguro = 0;
    for (const row of amortizationTable) {
      if (row.mes === 0) continue; // ignorar fila de desembolso
      tPagar   += row.cuotaTotal;
      tInteres += row.interesPagado;
      tSeguro  += row.seguroDesgravamen;
    }
    return { cuotaMensualEstimada: primeraCuota, totalPagar: tPagar, totalInteres: tInteres, totalSeguro: tSeguro };
  }, [amortizationTable]);

  const isDark = colorScheme === 'dark';

  /* ── Render ───────────────────────────────────────────────────────────────── */
  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950" style={{ paddingTop: insets.top }}>

      <ScrollView
        className="flex-1 px-5 pt-6 pb-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── ENCABEZADO ─────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-6 mt-2">
          <View>
            <Text className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Simulador de Préstamo
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Ingresa los datos para calcular tu cuota
            </Text>
          </View>
          <Pressable
            onPress={resetStore}
            className="rounded-full p-2.5 bg-slate-200 dark:bg-slate-800"
          >
            <Ionicons name="refresh" size={20} color={isDark ? '#94a3b8' : '#334155'} />
          </Pressable>
        </View>

        {/* ── FORMULARIO ─────────────────────────────────────────────────── */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md dark:shadow-none shadow-slate-200/60 mb-5">

          {/* Moneda */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3">MONEDA</Text>
          <View className="flex-row mb-6" style={{ gap: 8 }}>
            {CURRENCIES.map((cur) => {
              const isActive = moneda === cur;
              return (
                <Pressable
                  key={cur}
                  onPress={() => setMoneda(cur)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999,
                    backgroundColor: isActive ? (isDark ? '#0f766e' : '#0f172a') : (isDark ? '#1e293b' : '#f1f5f9'),
                  }}
                >
                  <Text style={{
                    fontWeight: 'bold', fontSize: 14,
                    color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  }}>{cur}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Monto */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">MONTO DEL PRÉSTAMO</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-5">
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 mr-2">{moneda}</Text>
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" value={montoText} onChangeText={handleMonto}
              placeholder="0.00" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          {/* Tasa de Interés */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">TASA DE INTERÉS</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-4">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" value={tasaText} onChangeText={handleTasa}
              placeholder="0.00" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 ml-2">%</Text>
          </View>

          {/* Tipo Tasa: Efectiva / Nominal */}
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            {(['efectiva', 'nominal'] as const).map((tipo) => (
              <Pressable
                key={tipo}
                onPress={() => updateParameter('tipoTasa', tipo)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: tipoTasa === tipo
                    ? (isDark ? '#0f766e' : '#0f172a')
                    : (isDark ? '#1e293b' : '#f1f5f9'),
                }}
              >
                <Text style={{
                  fontWeight: 'bold', fontSize: 13,
                  color: tipoTasa === tipo ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                }}>
                  T. {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Toggle Mensual / Anual */}
          <View className="flex-row items-center justify-center mb-5" style={{ gap: 12 }}>
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Mensual</Text>
            <Switch value={esAnual} onValueChange={handleSwitchTasa}
              trackColor={{ false: '#94a3b8', true: '#0f766e' }}
              thumbColor={esAnual ? '#ccfbf1' : '#f8fafc'}
            />
            <Text className="text-sm font-bold text-slate-950 dark:text-white">Anual</Text>
          </View>

          {/* Seguro de Desgravamen */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">
            SEGURO DESGRAVAMEN (% MENSUAL)
          </Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-5">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" value={desgravamenText} onChangeText={handleDesgravamen}
              placeholder="0.05" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 ml-2">%</Text>
          </View>

          {/* Plazo */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">PLAZO</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" maxLength={3} value={plazoText} onChangeText={handlePlazo}
              placeholder="0" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-lg font-bold text-slate-400 dark:text-slate-500 ml-2">meses</Text>
          </View>
        </View>

        {/* ── BOTÓN CALCULAR ─────────────────────────────────────────────── */}
        <Pressable
          onPress={handleCalcular}
          className="rounded-full py-5 items-center justify-center mb-5 shadow-lg shadow-teal-900/30"
          style={{ backgroundColor: '#0f766e' }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
            CALCULAR PRÉSTAMO
          </Text>
        </Pressable>

        {/* ── RESULTADOS ─────────────────────────────────────────────────── */}
        {isCalculated && (
          <View className="bg-teal-950 rounded-3xl p-7 mb-8 shadow-xl shadow-teal-900/40">
            <Text className="text-xs font-bold text-teal-300 tracking-widest mb-1 text-center">
              CUOTA MENSUAL FIJA
            </Text>
            <Text className="text-[52px] font-black text-white text-center leading-tight mb-1">
              {formatCurrency(cuotaMensualEstimada, moneda)}
            </Text>
            <Text className="text-teal-400 text-center text-sm font-medium mb-6">
              por {plazoMeses} meses · incluye seguro desgravamen
            </Text>

            <View className="flex-row justify-between mb-8">
              <View className="flex-1 items-center">
                <Text className="text-xs text-teal-400 font-bold tracking-widest mb-1">TOTAL PAGO</Text>
                <Text className="text-white font-extrabold text-lg" numberOfLines={1}>
                  {formatCurrency(totalPagar, moneda)}
                </Text>
              </View>
              <View className="w-px bg-teal-800" />
              <View className="flex-1 items-center">
                <Text className="text-xs text-teal-400 font-bold tracking-widest mb-1">INTS. Y SEGURO</Text>
                <Text className="text-teal-300 font-extrabold text-lg" numberOfLines={1}>
                  {formatCurrency(totalInteres + totalSeguro, moneda)}
                </Text>
              </View>
            </View>

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

      {/* Botón Modo Oscuro */}
      <Pressable
        onPress={toggleColorScheme}
        className="absolute right-6 rounded-full p-2.5 bg-slate-200/60 dark:bg-slate-800"
        style={{ top: insets.top + 12, zIndex: 999, elevation: 5 }}
      >
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={20} color={isDark ? '#fef08a' : '#334155'}
        />
      </Pressable>
    </View>
  );
}