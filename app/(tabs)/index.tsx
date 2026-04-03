import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, moveAsync } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useMemo, useState } from 'react';
import {
  Modal,
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
    bancoSeleccionado,
    updateParameter,
    setMoneda,
    calculateLoan,
    resetStore,
    applyBankPreset,
  } = useLoanStore();

  const [isCalculated, setIsCalculated] = useState(false);
  const [infoVisible, setInfoVisible]   = useState(false);

  // Ocultar resultados si la tabla está vacía o el store cambió
  React.useEffect(() => {
    if (amortizationTable.length === 0) setIsCalculated(false);
  }, [amortizationTable]);

  /* ── Handlers ─────────────────────────────────────────────────────────────── */

  const handleMonto = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    updateParameter('monto', clean);
    setIsCalculated(false);
  };

  const handleTasa = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    updateParameter('tasaInteres', clean);
    setIsCalculated(false);
  };

  const handleDesgravamen = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    updateParameter('seguroDesgravamenRateMensual', clean);
    setIsCalculated(false);
  };

  const handlePlazo = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    updateParameter('plazoMeses', clean);
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

  /* ── PDF estilo BCP ───────────────────────────────────────────────────────── */

  const generatePDF = async () => {
    try {
      const fn = (v: number) =>
        v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      let totalAmort = 0, totalInteres = 0, totalSeguro = 0, totalCuotas = 0;
      amortizationTable.forEach((r) => {
        if (r.mes === 0) return;
        totalAmort   += r.capitalAmortizado;
        totalInteres += r.interesPagado;
        totalSeguro  += r.seguroDesgravamen;
        totalCuotas  += r.cuotaTotal;
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
      const cuotaMes1  = amortizationTable.find((r) => r.mes === 1)?.cuotaTotal ?? 0;
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
              <p>Tasa (${tipoTasa}): ${tasaInteres || 0}% ${esAnual ? 'Anual' : 'Mensual'} &nbsp;·&nbsp; Seguro Desgravamen: ${seguroDesgravamenRateMensual || 0}% mensual &nbsp;·&nbsp; Plazo: ${plazoMeses || 0} meses</p>
            </div>

            <div class="summary">
              <div class="card"><div class="lbl">Monto Prestado</div><div class="val">${moneda} ${fn(numMonto)}</div></div>
              <div class="card"><div class="lbl">Cuota Mensual</div><div class="val teal">${moneda} ${fn(cuotaMes1)}</div></div>
              <div class="card"><div class="lbl">Total Intereses</div><div class="val">${moneda} ${fn(totalInteres)}</div></div>
              <div class="card"><div class="lbl">Total Pagado</div><div class="val">${moneda} ${fn(totalCuotas)}</div></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align:center;">Mes</th>
                  <th style="text-align:center;">Vcto.</th>
                  <th>Saldo Capital</th>
                  <th>Amortización</th>
                  <th>Interés</th>
                  <th>Seguro</th>
                  <th>Cuota Total</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align:left; padding-left:12px;">TOTALES</td>
                  <td>${moneda} ${fn(totalAmort)}</td>
                  <td>${moneda} ${fn(totalInteres)}</td>
                  <td>${moneda} ${fn(totalSeguro)}</td>
                  <td>${moneda} ${fn(totalCuotas)}</td>
                </tr>
              </tfoot>
            </table>

            <div class="doc-footer">
              Reporte generado el ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              · Solo referencial, no constituye oferta crediticia.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const pdfName = `${Paths.cache.uri}Reporte_Simulacion_${numMonto}_${safeMoneda}.pdf`;
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
      if (row.mes === 0) continue;
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
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 mr-2">{moneda}</Text>
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" value={monto} onChangeText={handleMonto}
              placeholder="25,000" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          {/* Tasa de Interés */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">TASA DE INTERÉS</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-4">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" value={tasaInteres} onChangeText={handleTasa}
              placeholder="21.50" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
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

          {/* Entidad Bancaria */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3" style={{ marginTop: 8 }}>
            ENTIDAD BANCARIA (AUTOCOMPLETAR SEGURO)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 8 }}
          >
            {['BCP', 'BBVA', 'Interbank', 'Scotiabank'].map((banco) => {
              const isActive = bancoSeleccionado === banco;
              return (
                <Pressable
                  key={banco}
                  onPress={() => {
                    applyBankPreset(banco);
                    setIsCalculated(false);
                  }}
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
                    color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')
                  }}>
                    {banco}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Seguro de Desgravamen */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">
            SEGURO DESGRAVAMEN (% MENSUAL)
          </Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-5">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" value={seguroDesgravamenRateMensual} onChangeText={handleDesgravamen}
              placeholder="0.05" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-2xl font-bold text-slate-400 dark:text-slate-500 ml-2">%</Text>
          </View>

          {/* Plazo */}
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">PLAZO</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4">
            <TextInput
              className="flex-1 text-2xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" maxLength={3} value={plazoMeses} onChangeText={handlePlazo}
              placeholder="24" placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
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
        {isCalculated && amortizationTable.length > 0 && (
          <View>
            <View className="bg-teal-950 rounded-3xl p-7 mb-4 shadow-xl shadow-teal-900/40">
              <Text className="text-xs font-bold text-teal-300 tracking-widest mb-1 text-center">
                CUOTA MENSUAL FIJA
              </Text>
              <Text className="text-[52px] font-black text-white text-center leading-tight mb-1" numberOfLines={1}>
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

            {/* Botón Reinicio Rectangular */}
            <Pressable
              onPress={resetStore}
              className="rounded-2xl py-4 flex-row items-center justify-center border border-slate-300 dark:border-slate-800 mb-10"
              style={{ backgroundColor: isDark ? 'transparent' : '#f8fafc' }}
            >
              <Ionicons name="refresh-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 8 }} />
              <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', fontSize: 15 }}>
                Nueva Simulación / Limpiar
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

      {/* ── MODAL GUIA DEL SIMULADOR ───────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={infoVisible}
        onRequestClose={() => setInfoVisible(false)}
      >
        {/* Fondo semi-transparente */}
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
          onPress={() => setInfoVisible(false)}
        >
          {/* Tarjeta — bloqueamos el press para que no cierre al tocar dentro */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
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
                  La <Text style={{ fontWeight: 'bold', color: isDark ? '#c7d2fe' : '#4338ca' }}>TEA</Text> es el costo puro de tu préstamo.{' '}
                  La <Text style={{ fontWeight: 'bold', color: isDark ? '#c7d2fe' : '#4338ca' }}>TCEA</Text> es la TEA + el Seguro de Desgravamen.{' '}
                  Ingresa tu TEA para que la simulación sea exacta.
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
                  Los resultados son simulaciones referenciales. Los montos finales pueden variar ligeramente por redondeos o políticas específicas de cada entidad financiera. Esta app no constituye asesoría financiera.
                </Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}