import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { Link } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useColorScheme } from 'nativewind';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LaTeXView from '../../src/components/LaTeXView';
import PrepaymentModal from '../../src/components/PrepaymentModal';
import { useLoanStore } from '../../src/store/useLoanStore';

const formatCurrency = (value: number, symbol: string) => {
  const val = value || 0;
  if (val >= 1_000_000_000_000) {
    return `${symbol} ${(val / 1_000_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`;
  }
  if (val >= 1_000_000_000) {
    return `${symbol} ${(val / 1_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MMD`;
  }
  if (val >= 1_000_000) {
    return `${symbol} ${(val / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MM`;
  }
  return `${symbol} ${val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CURRENCIES = ['S/', '$', '€'];

import { cleanNumericText, formatWithThousandSeparators } from '../../src/utils/formatters';

export default function LoanCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const scrollRef = useRef<ScrollView>(null);

  const {
    monto,
    tasaInteres,
    tipoTasaFija,
    tipoCalendario,
    plazoMeses,
    seguroDesgravamenRateMensual,
    moneda,
    amortizationTable,
    tcea,
    prepago,
    originalMetrics,
    updateParameter,
    setMoneda,
    calculateLoan,
    resetStore,
    newSimulation,
  } = useLoanStore();

  const [isCalculated, setIsCalculated] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [prepagoModalVisible, setPrepagoModalVisible] = useState(false);
  const [incluirSeguro, setIncluirSeguro] = useState(true);

  const onToggleSeguro = (val: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIncluirSeguro(val);
    if (!val) {
      updateParameter('seguroDesgravamenRateMensual', '');
    }
  };
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Ocultar resultados si la tabla está vacía o el store cambió
  React.useEffect(() => {
    if (amortizationTable.length === 0) setIsCalculated(false);
  }, [amortizationTable]);

  /* ── Handlers ─────────────────────────────────────────────────────────────── */

  const handlePlazo = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 3);
    updateParameter('plazoMeses', clean);
  };

  const handleCalcular = () => {
    calculateLoan();
    setIsCalculated(true);
  };

  const handleNuevaSimulacion = () => {
    newSimulation();
    setIsCalculated(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleLimpiarTodo = () => {
    resetStore();
    setIsCalculated(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  /* ── PDF estilo BCP ───────────────────────────────────────────────────────── */

  const generatePDF = async () => {
    if (isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      const fn = (v: number) =>
        v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      let totalAmort = 0, totalInteres = 0, totalSeguro = 0, totalCuotas = 0;
      amortizationTable.forEach((r) => {
        if (r.mes === 0) return;
        totalAmort += r.capitalAmortizado;
        totalInteres += r.interesPagado;
        totalSeguro += r.seguroDesgravamen;
        totalCuotas += r.cuotaTotal;
      });

      const tableRows = amortizationTable.map((row) => `
        <tr class="${row.mes === 0 ? 'row-desembolso' : (row.mes % 2 === 0 ? 'row-even' : '')}">
          <td style="text-align:center;">${row.mes}</td>
          <td style="text-align:center;">${row.fecha}</td>
          <td style="text-align:right; color:#0f766e; font-weight:bold;">${moneda} ${fn(row.saldoRemanente)}</td>
          <td style="text-align:right;">${row.mes === 0 ? '-' : fn(row.capitalAmortizado)}</td>
          <td style="text-align:right;">${row.mes === 0 ? '-' : fn(row.interesPagado)}</td>
          <td style="text-align:right;">${row.mes === 0 ? '-' : fn(row.seguroDesgravamen)}</td>
          <td style="text-align:right; font-weight:bold;">${row.mes === 0 ? '<i>DESEMBOLSO</i>' : `${moneda} ${fn(row.cuotaTotal)}`}</td>
        </tr>
      `).join('');

      const safeMoneda = moneda === 'S/' ? 'Soles' : moneda === '$' ? 'Dolares' : 'Euros';
      const cuotaMes1 = amortizationTable.find((r) => r.mes === 1)?.cuotaTotal ?? 0;
      const numMonto = parseFloat(monto) || 0;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width,initial-scale=1.0" />
            <style>
              * { box-sizing:border-box; margin:0; padding:0; }
              body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; padding:24px; color:#1e293b; background:#f8fafc; }

              .header { background:linear-gradient(135deg,#0f766e,#0f172a); color:white; padding:20px 24px; border-radius:12px; margin-bottom:20px; }
              .header h1 { font-size:22px; font-weight:900; margin-bottom:4px; }
              .header p  { font-size:13px; opacity:0.8; }

              .summary { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
              .card { flex:1; min-width:110px; background:white; border-radius:10px; padding:14px 16px; border-left:4px solid #0f766e; }
              .card .lbl { font-size:10px; font-weight:bold; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
              .card .val { font-size:18px; font-weight:900; color:#0f172a; }
              .card .val.teal { color:#0f766e; }

              table { width:100%; border-collapse:collapse; background:white; border-radius:10px; overflow:hidden; font-size:11px; }
              thead tr { background:#0f766e; color:white; }
              th { padding:10px 7px; text-align:right; font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }
              th:first-child, th:nth-child(2) { text-align:center; }
              td { padding:9px 7px; text-align:right; border-bottom:1px solid #f1f5f9; color:#334155; }
              td:first-child, td:nth-child(2) { text-align:center; color:#64748b; }
              .row-even { background:#f8fafc; }
              .row-desembolso { background:#f0fdf4; }
              tfoot tr { background:#0f172a; color:white; font-weight:bold; }
              tfoot td { padding:11px 7px; border:none; color:white; }

              .doc-footer { margin-top:20px; text-align:center; font-size:10px; color:#94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Plan de Amortización</h1>
              <p>Tasa (${tipoTasaFija}): ${tasaInteres || 0}% &nbsp;&middot;&nbsp; Seguro Desgravamen: ${seguroDesgravamenRateMensual || 0}% mensual &nbsp;&middot;&nbsp; Plazo: ${plazoMeses || 0} meses &nbsp;&middot;&nbsp; Base: ${tipoCalendario === 'comercial' ? 'Mes Comercial 30/360' : 'Calendario Real'}</p>
            </div>

            <div class="summary">
              <div class="card">
                <div class="lbl">Préstamo</div>
                <div class="val">${moneda} ${fn(numMonto)}</div>
              </div>
              <div class="card">
                <div class="lbl">Cuota Mensual (Ref.)</div>
                <div class="val teal">${moneda} ${fn(cuotaMes1)}</div>
              </div>
              <div class="card">
                <div class="lbl">TCEA Estimada</div>
                <div class="val">${tcea > 0 ? tcea.toFixed(2) + '%' : 'N/A'}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Saldo Capital</th>
                  <th>Amortización</th>
                  <th>Interés</th>
                  <th>Seguro</th>
                  <th>Cuota Total</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align:right;">TOTALES:</td>
                  <td style="text-align:right;">${moneda} ${fn(totalAmort)}</td>
                  <td style="text-align:right;">${moneda} ${fn(totalInteres)}</td>
                  <td style="text-align:right;">${moneda} ${fn(totalSeguro)}</td>
                  <td style="text-align:right;">${moneda} ${fn(totalCuotas)}</td>
                </tr>
              </tfoot>
            </table>

            <div class="doc-footer">
              Generado con Simulador de Préstamos Pro &bull; ${new Date().toLocaleDateString('es-PE')}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const tempFile = new File(uri);
      const pdfFile = new File(Paths.cache, `Reporte_Simulacion_${numMonto}_${safeMoneda}.pdf`);
      tempFile.move(pdfFile);

      await Sharing.shareAsync(pdfFile.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  /* ── Totales (useMemo) ────────────────────────────────────────────────────── */

  const { cuotaMensualEstimada, totalPagar, totalInteres, totalSeguro, plazoReal } = useMemo(() => {
    if (amortizationTable.length === 0)
      return { cuotaMensualEstimada: 0, totalPagar: 0, totalInteres: 0, totalSeguro: 0, plazoReal: 0 };

    let primeraCuota = amortizationTable.find((r) => r.mes === 1)?.cuotaTotal ?? 0;

    // Si hay prepago para reducir cuota, mostrar la cuota vigente (la post-prepago)
    if (prepago && prepago.tipo === 'reducir_cuota') {
      const cuotaPostPrepago = amortizationTable.find((r) => r.mes === prepago.mes + 1);
      if (cuotaPostPrepago) {
        primeraCuota = cuotaPostPrepago.cuotaTotal;
      }
    }

    let tPagar = 0, tInteres = 0, tSeguro = 0;
    for (const row of amortizationTable) {
      if (row.mes === 0) continue;
      tPagar += row.cuotaTotal;
      tInteres += row.interesPagado;
      tSeguro += row.seguroDesgravamen;
    }

    // El plazo real es el mes de la última fila, no el string original
    const plazoRealCalc = amortizationTable[amortizationTable.length - 1]?.mes || 0;

    return { cuotaMensualEstimada: primeraCuota, totalPagar: tPagar, totalInteres: tInteres, totalSeguro: tSeguro, plazoReal: plazoRealCalc };
  }, [amortizationTable, prepago]);

  const isDark = colorScheme === 'dark';

  const isCalculateDisabled =
    !monto || parseFloat(monto) === 0 ||
    !tasaInteres || parseFloat(tasaInteres) === 0 ||
    !plazoMeses || parseInt(plazoMeses) === 0 ||
    (incluirSeguro && (!seguroDesgravamenRateMensual || parseFloat(seguroDesgravamenRateMensual) === 0));

  /* ── Render ───────────────────────────────────────────────────────────────── */
  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950" style={{ paddingTop: insets.top }}>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5 pt-6 pb-24"
        contentContainerStyle={{ paddingBottom: 20 }}
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
        </View>

        {/* ── FORMULARIO ─────────────────────────────────────────────────── */}
        <View
          pointerEvents={isCalculated ? 'none' : 'auto'}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md dark:shadow-none shadow-slate-200/60 mb-5"
          style={{ opacity: isCalculated ? 0.6 : 1 }}
        >

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
                  <Text style={{ fontWeight: 'bold', fontSize: 14, color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b') }}>
                    {cur}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Monto */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">MONTO DEL PRÉSTAMO</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-5">
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', marginRight: 8 }}>{moneda}</Text>
            <TextInput
              style={{
                flex: 1,
                fontSize: 26,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#0f172a',
                paddingVertical: 16,
                paddingHorizontal: 0,
              }}
              keyboardType="decimal-pad"
              value={formatWithThousandSeparators(monto)}
              onChangeText={(text) => {
                updateParameter('monto', cleanNumericText(text));
              }}
              placeholder="25,000.00"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          {/* Tasa de Interés */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">TASA DE INTERÉS</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-4">
            <TextInput
              style={{
                flex: 1,
                fontSize: 26,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#0f172a',
                paddingVertical: 16,
                paddingHorizontal: 0,
              }}
              keyboardType="decimal-pad"
              value={formatWithThousandSeparators(tasaInteres)}
              onChangeText={(text) => {
                updateParameter('tasaInteres', cleanNumericText(text));
              }}
              placeholder="21.50"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', marginLeft: 8 }}>%</Text>
          </View>

          {parseFloat(tasaInteres) > 100 && (
            <View className="flex-row bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 items-center mb-4">
              <Ionicons name="warning-outline" size={16} color="#d97706" style={{ marginRight: 8 }} />
              <Text className="text-amber-700 dark:text-amber-500 text-xs flex-1 leading-5">
                Una tasa mayor a 100% es inusualmente alta para un crédito personal o hipotecario (aunque es posible en tarjetas o préstamos informales). Verifica el valor.
              </Text>
            </View>
          )}

          {/* Segmented Control: TEA / TEM / TNA */}
          <View
            style={{
              flexDirection: 'row',
              marginBottom: 20,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              padding: 4,
              gap: 4,
            }}
          >
            {(['TEA', 'TEM', 'TNA'] as const).map((opcion) => {
              const isActive = tipoTasaFija === opcion;
              return (
                <Pressable
                  key={opcion}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    updateParameter('tipoTasaFija', opcion);
                    setIsCalculated(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    justifyContent: 'center',
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: isActive ? (isDark ? '#0f766e' : '#0f172a') : 'transparent',
                  }}
                >
                  <Text style={{
                    fontWeight: '800',
                    fontSize: 14,
                    letterSpacing: 0.5,
                    color: isActive ? '#ffffff' : (isDark ? '#64748b' : '#94a3b8'),
                  }}>
                    {opcion}
                  </Text>
                  {isActive && (
                    <Text style={{ fontSize: 9, color: isDark ? '#99f6e4' : '#94a3b8', marginTop: 1, opacity: 0.8 }}>
                      {opcion === 'TEA' ? 'Efectiva Anual'
                        : opcion === 'TEM' ? 'Efectiva Mensual'
                          : 'Nominal Anual'}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Seguro de Desgravamen */}
          <View className={`flex-row items-center justify-between ${incluirSeguro ? 'mb-2' : 'mb-5'}`}>
            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest">
              SEGURO DESGRAVAMEN (% MENSUAL)
            </Text>
            <Switch
              value={incluirSeguro}
              onValueChange={onToggleSeguro}
              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#0f766e' }}
              thumbColor={'#ffffff'}
            />
          </View>

          {incluirSeguro && (
            <View className="mb-5">
              <View className={`flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 ${parseFloat(seguroDesgravamenRateMensual) > 0.5 ? 'mb-3' : ''}`}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 26,
                    fontWeight: 'bold',
                    color: isDark ? '#ffffff' : '#0f172a',
                    paddingVertical: 16,
                    paddingHorizontal: 0,
                  }}
                  keyboardType="decimal-pad"
                  value={formatWithThousandSeparators(seguroDesgravamenRateMensual)}
                  onChangeText={(text) => {
                    updateParameter('seguroDesgravamenRateMensual', cleanNumericText(text));
                  }}
                  placeholder="0.05"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                />
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', marginLeft: 8 }}>%</Text>
              </View>

              {parseFloat(seguroDesgravamenRateMensual) > 0.5 && (
                <View className="flex-row bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 items-center">
                  <Ionicons name="warning-outline" size={16} color="#d97706" style={{ marginRight: 8 }} />
                  <Text className="text-amber-700 dark:text-amber-500 text-xs flex-1 leading-5">
                    El seguro real suele ser menor a 0.15% mensual. Un valor de {seguroDesgravamenRateMensual}% es inusualmente alto (posible error de tipeo).
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Plazo */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">PLAZO</Text>
          <View
            className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4"
            style={{ minHeight: 64, height: 64 }}
          >
            <TextInput
              style={{
                flex: 1,
                fontSize: 26,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#0f172a',
                paddingVertical: 0,
                paddingHorizontal: 0,
                height: '100%',
              }}
              keyboardType="number-pad"
              value={String(plazoMeses ?? '')}
              onChangeText={handlePlazo}
              placeholder="24"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#94a3b8' : '#64748b', marginLeft: 8 }}>meses</Text>
          </View>
        </View>

        {/* ── BASE DE CÁLCULO ─────────────────────────────────────────────── */}
        <View style={{ marginBottom: 16 }}>
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3">
            BASE DE CÁLCULO
          </Text>
          <View style={{
            flexDirection: 'row', gap: 8,
          }}>
            {(['real', 'comercial'] as const).map((tipo) => {
              const isActive = tipoCalendario === tipo;
              return (
                <Pressable
                  key={tipo}
                  onPress={() => {
                    updateParameter('tipoCalendario', tipo);
                    setIsCalculated(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1.5,
                    backgroundColor: isActive
                      ? (isDark ? '#134e4a' : '#0f766e')
                      : (isDark ? '#1e293b' : '#f1f5f9'),
                    borderColor: isActive ? '#0f766e' : (isDark ? '#334155' : '#e2e8f0'),
                  }}
                >
                  <Text style={{
                    fontWeight: '800', fontSize: 12,
                    color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                    marginBottom: 2,
                  }}>
                    {tipo === 'real' ? 'Días Reales' : 'Mes Comercial'}
                  </Text>
                  <Text style={{
                    fontSize: 10,
                    color: isActive ? '#99f6e4' : (isDark ? '#475569' : '#94a3b8'),
                  }}>
                    {tipo === 'real' ? 'Bancario (exact.)' : '30 días fijos'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tipoCalendario === 'real' && (parseInt(plazoMeses || '0') >= 120) && (
            <View className="flex-row bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 items-center mt-4">
              <Ionicons name="warning-outline" size={16} color="#d97706" style={{ marginRight: 8 }} />
              <Text className="text-amber-700 dark:text-amber-500 text-xs flex-1 leading-5">
                Para plazos largos (10+ años), el calendario "Días Reales" puede generar distorsiones acumulativas en la cuota final. Te recomendamos usar "Mes Comercial".
              </Text>
            </View>
          )}
        </View>

        {/* ── BOTÓN CALCULAR ─────────────────────────────────────────────── */}
        {!isCalculated && (
          <Pressable
            onPress={isCalculateDisabled ? undefined : handleCalcular}
            className={`rounded-full py-5 items-center justify-center mb-5 shadow-lg ${isCalculateDisabled ? 'opacity-70' : 'shadow-teal-900/30'}`}
            style={{ backgroundColor: isCalculateDisabled ? (isDark ? '#334155' : '#cbd5e1') : '#0f766e' }}
            disabled={isCalculateDisabled}
          >
            <Text style={{ color: isCalculateDisabled ? (isDark ? '#64748b' : '#94a3b8') : '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
              CALCULAR PRÉSTAMO
            </Text>
          </Pressable>
        )}

        {/* ── RESULTADOS ─────────────────────────────────────────────────── */}
        {isCalculated && amortizationTable.length > 0 && (
          <View>
            <View className="bg-teal-950 rounded-3xl p-7 mb-4 shadow-xl shadow-teal-900/40">
              <Text className="text-xs font-bold text-teal-300 tracking-widest mb-1 text-center">
                CUOTA MENSUAL FIJA
              </Text>
              <Text
                className="text-[52px] font-black text-white text-center leading-tight mb-1"
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.4}
              >
                {formatCurrency(cuotaMensualEstimada, moneda)}
              </Text>
              <Text className="text-teal-400 text-center text-sm font-medium mb-4">
                por {plazoReal} meses · {(incluirSeguro && parseFloat(seguroDesgravamenRateMensual || '0') > 0) ? 'incluye seguro desgravamen' : 'sin seguro de desgravamen'}
              </Text>

              {/* ── BADGE + AHORRO DE PREPAGO ─────────────────── */}
              {prepago && originalMetrics && (
                <View style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(52, 211, 153, 0.4)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}>
                  {/* Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, marginRight: 6 }}>📌</Text>
                    <Text style={{ color: '#34d399', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>
                      PREPAGO ACTIVO
                    </Text>
                  </View>
                  <Text style={{ color: '#a7f3d0', fontSize: 12, marginBottom: 12 }}>
                    {formatCurrency(prepago.monto, moneda)} en el mes {prepago.mes} · {prepago.tipo === 'reducir_cuota' ? 'Pagar Menos al Mes' : 'Terminar Antes'}
                  </Text>

                  {/* Ahorro cuantificado */}
                  <View style={{ gap: 6 }}>
                    {(() => {
                      const ahorroInteres = originalMetrics.totalInteres - totalInteres;
                      const ahorroMeses = originalMetrics.plazo - plazoReal;
                      return (
                        <>
                          {ahorroInteres > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons name="trending-down-outline" size={14} color="#34d399" />
                              <Text style={{ color: '#6ee7b7', fontSize: 13, fontWeight: '700' }}>
                                Ahorras {formatCurrency(ahorroInteres, moneda)} en intereses
                              </Text>
                            </View>
                          )}
                          {ahorroMeses > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons name="time-outline" size={14} color="#34d399" />
                              <Text style={{ color: '#6ee7b7', fontSize: 13, fontWeight: '700' }}>
                                Terminas {ahorroMeses} {ahorroMeses === 1 ? 'mes' : 'meses'} antes
                              </Text>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </View>
              )}

              {tcea > 0 && (
                <View className="bg-teal-900 rounded-full py-2 px-4 self-center mb-6 border border-teal-700">
                  <Text className="text-teal-100 font-bold text-xs tracking-wider">
                    TCEA ESTIMADA: {tcea.toFixed(2)}%
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between mb-8">
                <View className="flex-1 items-center">
                  <Text className="text-xs text-teal-400 font-bold tracking-widest mb-1">TOTAL PAGO</Text>
                  <Text
                    className="text-white font-extrabold text-lg"
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                  >
                    {formatCurrency(totalPagar, moneda)}
                  </Text>
                </View>
                <View className="w-px bg-teal-800" />
                <View className="flex-1 items-center">
                  <Text className="text-xs text-teal-400 font-bold tracking-widest mb-1">INTS. Y SEGURO</Text>
                  <Text
                    className="text-teal-300 font-extrabold text-lg"
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                  >
                    {formatCurrency(totalInteres + totalSeguro, moneda)}
                  </Text>
                </View>
              </View>

              {/* Botón 1: Ver Tabla de Amortización (Botón Principal - Teal Sólido) */}
              <Link href="/explore" asChild onPress={() => { }}>
                <Pressable
                  className="rounded-2xl py-4 items-center justify-center flex-row mb-3"
                  style={{
                    backgroundColor: '#0f766e',
                    borderWidth: 1,
                    borderColor: 'rgba(94, 234, 212, 0.25)',
                  }}
                >
                  <Ionicons name="list-outline" size={20} color="#f0fdfa" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#f0fdfa', fontWeight: '700', fontSize: 15 }}>
                    Ver Tabla de Amortización
                  </Text>
                </Pressable>
              </Link>

              {/* Botón 2: Simular / Editar Pago Adelantado */}
              <Pressable
                className="rounded-2xl py-4 items-center justify-center flex-row mb-3"
                style={{
                  backgroundColor: prepago ? 'rgba(6, 182, 212, 0.2)' : 'rgba(15, 118, 110, 0.35)',
                  borderWidth: 1,
                  borderColor: prepago ? 'rgba(103, 232, 249, 0.5)' : 'rgba(94, 234, 212, 0.4)',
                }}
                onPress={() => setPrepagoModalVisible(true)}
              >
                <Ionicons name={prepago ? 'create-outline' : 'cash-outline'} size={20} color={prepago ? '#67e8f9' : '#5eead4'} style={{ marginRight: 8 }} />
                <Text style={{ color: prepago ? '#67e8f9' : '#5eead4', fontWeight: '700', fontSize: 15 }}>
                  {prepago ? 'Editar Pago Adelantado' : 'Simular Pago Adelantado'}
                </Text>
              </Pressable>

              {/* Botón 3: Exportar a PDF (Rojo Sólido Vivo) */}
              <Pressable
                className="rounded-2xl py-4 items-center justify-center flex-row"
                style={{
                  backgroundColor: '#991b1b',
                  borderWidth: 1,
                  borderColor: '#ef4444',
                  opacity: isGeneratingPDF ? 0.7 : 1,
                }}
                onPress={generatePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>
                  {isGeneratingPDF ? 'Generando PDF...' : 'Exportar a PDF'}
                </Text>
              </Pressable>
            </View>

            {/* Botones de Acción Posterior al Cálculo */}
            <View className="gap-3 mb-10">
              {/* Botón 4: Nueva Simulación (Adaptable con excelente contraste) */}
              <Pressable
                onPress={handleNuevaSimulacion}
                className="rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderWidth: 1.5,
                  borderColor: isDark ? '#334155' : '#0f766e',
                }}
              >
                <Ionicons name="refresh-outline" size={20} color={isDark ? '#5eead4' : '#0f766e'} style={{ marginRight: 8 }} />
                <Text style={{ color: isDark ? '#5eead4' : '#0f766e', fontWeight: '700', fontSize: 15 }}>
                  Nueva Simulación (Mantener Tasa)
                </Text>
              </Pressable>

              {/* Botón Limpiar Todo */}
              <Pressable
                onPress={handleLimpiarTodo}
                className="rounded-2xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="trash-outline" size={16} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 6 }} />
                <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: '600', fontSize: 14 }}>
                  Limpiar todos los campos
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón Modo Oscuro */}
      <Pressable
        onPress={toggleColorScheme}
        className="absolute right-6 rounded-full p-2.5 bg-slate-200/60 dark:bg-slate-800"
        style={{ top: insets.top + 12, zIndex: 999, elevation: 5 }}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#fef08a' : '#334155'} />
      </Pressable>

      {/* Botón Info */}
      <Pressable
        onPress={() => setInfoVisible(true)}
        className="absolute rounded-full p-2.5 bg-slate-200/60 dark:bg-slate-800"
        style={{ top: insets.top + 12, right: 64, zIndex: 999, elevation: 5 }}
      >
        <Ionicons name="information-circle-outline" size={20} color={isDark ? '#5eead4' : '#0f766e'} />
      </Pressable>

      {/* ── MODAL DE PREPAGO ──────────────────────────────────────────────── */}
      <PrepaymentModal
        visible={prepagoModalVisible}
        onClose={() => setPrepagoModalVisible(false)}
      />

      {/* ── MODAL GUIA DEL SIMULADOR ───────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={infoVisible}
        onRequestClose={() => setInfoVisible(false)}
      >
        {/* Fondo semi-transparente y contenedor principal */}
        <View style={{ flex: 1 }}>
          {/* Backdrop absoluto que captura los toques fuera del modal */}
          <Pressable
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }}
            onPress={() => setInfoVisible(false)}
          />

          <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
            {/* Tarjeta Modal — Un View simple para no interceptar los gestos del ScrollView */}
            <View
              style={{
                maxHeight: '88%',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingBottom: insets.bottom + 16,
              }}
            >
              {/* Cabecera del modal */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
                borderBottomWidth: 1, borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="book-outline" size={22} color="#0f766e" />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    Guía del Simulador
                  </Text>
                </View>
                <Pressable
                  onPress={() => setInfoVisible(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  }}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                </Pressable>
              </View>

              {/* Contenido con scroll */}
              <ScrollView
                style={{ paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 8 }}
              >
                {/* ── Sistema Francés ─────────────────────────── */}
                <View style={{
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 16, padding: 18, marginBottom: 14,
                  borderLeftWidth: 3, borderLeftColor: '#0f766e',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="stats-chart-outline" size={18} color="#0f766e" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      Sistema Francés (Cuotas Fijas)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', lineHeight: 22 }}>
                    Esta app utiliza el método de cuotas fijas. Al inicio pagas más intereses y menos capital, pero tu cuota mensual se mantiene igual durante todo el plazo.
                  </Text>
                </View>

                {/* ── Pago Adelantado ─────────────────────────── */}
                <View style={{
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 16, padding: 18, marginBottom: 14,
                  borderLeftWidth: 3, borderLeftColor: '#10b981',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="cash-outline" size={18} color="#10b981" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      Pago Adelantado (Prepago)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', lineHeight: 22 }}>
                    Un prepago es un abono extra directo al capital. Tienes dos opciones: <Text style={{ fontWeight: 'bold', color: isDark ? '#e2e8f0' : '#334155' }}>"Terminar Antes"</Text> (reduces el plazo total manteniendo tu cuota) o <Text style={{ fontWeight: 'bold', color: isDark ? '#e2e8f0' : '#334155' }}>"Pagar Menos al Mes"</Text> (reduces tu cuota mensual manteniendo tu plazo). Ejemplo: Si abonas S/ 5,000 extra en el mes 6, la app recalcula todo al instante para que veas cuánto ahorras en intereses.
                  </Text>
                </View>

                {/* ── TEA vs TCEA ─────────────────────────────── */}
                <View style={{
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 16, padding: 18, marginBottom: 14,
                  borderLeftWidth: 3, borderLeftColor: '#6366f1',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="trending-up-outline" size={18} color="#6366f1" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      TEA vs. TCEA
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', lineHeight: 22 }}>
                    La <Text style={{ fontWeight: 'bold', color: isDark ? '#c7d2fe' : '#4338ca' }}>TEA</Text> es el costo puro de tu préstamo por intereses. La <Text style={{ fontWeight: 'bold', color: isDark ? '#c7d2fe' : '#4338ca' }}>TCEA</Text> refleja el costo total, incluyendo el seguro de desgravamen. Es un valor <Text style={{ fontWeight: 'bold', color: isDark ? '#c7d2fe' : '#4338ca' }}>ESTIMADO</Text> (referencial) ya que puede variar levemente frente a tu banco por reglas de redondeo exactas.
                  </Text>
                </View>

                {/* ── Seguro de Desgravamen ────────────────────── */}
                <View style={{
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 16, padding: 18, marginBottom: 14,
                  borderLeftWidth: 3, borderLeftColor: '#f59e0b',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#f59e0b" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      Seguro de Desgravamen
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', lineHeight: 22 }}>
                    Es obligatorio en muchos préstamos. Lo calculamos de forma proporcional a los días reales del período sobre tu saldo pendiente, tal como lo hacen BCP, BBVA e Interbank.
                  </Text>
                </View>

                {/* ── Calendario y Última Cuota ───────────────── */}
                <View style={{
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 16, padding: 18, marginBottom: 14,
                  borderLeftWidth: 3, borderLeftColor: '#ec4899',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="calendar-outline" size={18} color="#ec4899" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      Calendario y Última Cuota
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#475569', lineHeight: 22 }}>
                    El modo <Text style={{ fontWeight: 'bold', color: isDark ? '#fbcfe8' : '#be185d' }}>"Mes Comercial"</Text> asume 30 días fijos. El <Text style={{ fontWeight: 'bold', color: isDark ? '#fbcfe8' : '#be185d' }}>"Calendario Real"</Text> usa los días exactos entre pagos (28, 30, 31). En el calendario real, el interés fluctúa mes a mes, lo que causa que la <Text style={{ fontStyle: 'italic' }}>última cuota varíe ligeramente</Text> para ajustar tu saldo final exactamente a S/ 0.00.
                  </Text>
                </View>

                {/* ── Aviso Legal ──────────────────────────────── */}
                <View style={{
                  backgroundColor: isDark ? '#0f172a' : '#fafafa',
                  borderRadius: 16, padding: 16, marginBottom: 8,
                  borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <Ionicons name="alert-circle-outline" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8' }}>
                      Aviso Legal
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8', lineHeight: 18 }}>
                    Los resultados y la TCEA mostrada son simulaciones referenciales. Los montos finales pueden variar ligeramente por reglas de redondeo normativo de la SBS, cobros de portes o políticas específicas de cada entidad financiera. Esta app no constituye asesoría financiera.
                  </Text>
                </View>

                {/* ── Botón toggle Fórmulas ───────────────────────────── */}
                <Pressable
                  onPress={() => setShowFormulas(!showFormulas)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 14, marginTop: 8, marginBottom: 4, gap: 8,
                    borderRadius: 14,
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  }}
                >
                  <Ionicons
                    name={showFormulas ? 'chevron-up-outline' : 'calculator-outline'}
                    size={16}
                    color="#0f766e"
                  />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f766e' }}>
                    {showFormulas ? 'Ocultar Fórmulas' : 'Ver Fórmulas y Casos de Uso Reales'}
                  </Text>
                </Pressable>

                {/* ── Contenido expandible ──────────────────────────── */}
                {showFormulas && (
                  <View style={{ marginTop: 12, gap: 12 }}>

                    {/* Casos de Uso */}
                    <View style={{
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderRadius: 14, padding: 16,
                      borderLeftWidth: 3, borderLeftColor: '#6366f1',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Ionicons name="briefcase-outline" size={16} color="#6366f1" />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#c7d2fe' : '#4338ca' }}>
                          Cuándo usar cada tasa
                        </Text>
                      </View>
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Text style={{
                            fontFamily: 'monospace', fontWeight: '700', fontSize: 12,
                            color: '#0f766e', backgroundColor: isDark ? '#0f172a' : '#f0fdf4',
                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                          }}>TEA</Text>
                          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569', flex: 1, lineHeight: 18 }}>
                            Estándar bancario. Hipotecas, créditos vehiculares y personales. Considera la capitalización del dinero.
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Text style={{
                            fontFamily: 'monospace', fontWeight: '700', fontSize: 12,
                            color: '#f59e0b', backgroundColor: isDark ? '#0f172a' : '#fffbeb',
                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                          }}>TEM</Text>
                          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569', flex: 1, lineHeight: 18 }}>
                            Tasa ya mensualizada. Útil cuando el banco te informa directamente la tasa del mes.
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Text style={{
                            fontFamily: 'monospace', fontWeight: '700', fontSize: 12,
                            color: '#ec4899', backgroundColor: isDark ? '#0f172a' : '#fdf2f8',
                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                          }}>TNA</Text>
                          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569', flex: 1, lineHeight: 18 }}>
                            Tasa sin capitalización de intereses. Común en tarjetas de crédito y algunos créditos de consumo de corto plazo. Si tu banco te la da, pídeles también la TEA equivalente para comparar bien.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Conversión a TEM */}
                    <View style={{
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderRadius: 14, padding: 16,
                      borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Ionicons name="swap-horizontal-outline" size={16} color="#0f766e" />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          Conversión a Tasa Mensual
                        </Text>
                      </View>
                      <View style={{ gap: 8 }}>
                        <View style={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderRadius: 10, padding: 12,
                        }}>
                          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 4 }}>Desde TEA:</Text>
                          <LaTeXView
                            formula={String.raw`TEM = (1 + TEA)^{\frac{1}{12}} - 1`}
                            color={isDark ? '#0f766e' : undefined}
                            backgroundColor={isDark ? '#1e293b' : '#ffffff'}
                            fontSize={14}
                          />
                        </View>
                        <View style={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderRadius: 10, padding: 12,
                        }}>
                          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 4 }}>Desde TNA:</Text>
                          <LaTeXView
                            formula={String.raw`TEM = \frac{TNA}{12}`}
                            color={isDark ? '#f59e0b' : '#b45309'}
                            backgroundColor={isDark ? '#1e293b' : '#ffffff'}
                            fontSize={14}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Fórmula de Cuota Fija */}
                    <View style={{
                      backgroundColor: isDark ? '#0c1a2e' : '#eff6ff',
                      borderRadius: 14, padding: 16,
                      borderLeftWidth: 3, borderLeftColor: '#3b82f6',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Ionicons name="calculator-outline" size={16} color="#3b82f6" />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#bfdbfe' : '#1d4ed8' }}>
                          Sistema Francés — Fórmula de Cuota
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 10,
                      }}>
                        <LaTeXView
                          formula={String.raw`Cuota = P \times \frac{i(1+i)^n}{(1+i)^n - 1}`}
                          color={isDark ? '#93c5fd' : '#2563eb'}
                          backgroundColor={isDark ? '#1e293b' : '#ffffff'}
                          fontSize={15}
                        />
                      </View>
                      <View style={{ gap: 5 }}>
                        {[
                          ['P', 'Monto del préstamo'],
                          ['i', 'TEM + Tasa de Desgravamen'],
                          ['n', 'Plazo en meses'],
                        ].map(([sym, desc]) => (
                          <View key={sym} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{
                              fontFamily: 'monospace', fontWeight: '800', fontSize: 13,
                              color: '#3b82f6', width: 18, textAlign: 'center',
                            }}>{sym}</Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569' }}>=  {desc}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}