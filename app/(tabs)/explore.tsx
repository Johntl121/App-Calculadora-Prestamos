import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoanStore } from '../../src/store/useLoanStore';
import { AmortizationRow } from '../../src/types';
import AmortizationChart from '../../src/components/AmortizationChart';

const fmt = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Flexes para distribución proporcional (suma = 17)
// Mes(1) | Vcto(2.5) | SaldoCap(3) | Amort(2.5) | Interés(2.5) | Seguro(2.5) | Cuota(3)
const F = { mes: 1, fecha: 2.5, saldo: 3, amort: 2.5, interes: 2.5, seguro: 2.5, cuota: 3 };

export default function AmortizationTableScreen() {
  const { amortizationTable, moneda } = useLoanStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const renderItem = ({ item, index }: { item: AmortizationRow; index: number }) => {
    const isDisembolso = item.mes === 0;
    const isZebra = index % 2 === 1;
    const rowBg = isDisembolso
      ? (isDark ? '#052e16' : '#f0fdf4')
      : isZebra
        ? (isDark ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.9)')
        : (isDark ? '#1e293b' : '#ffffff');

    const tMuted  = isDark ? '#94a3b8' : '#64748b';
    const tBase   = isDark ? '#e2e8f0' : '#334155';
    const tAccent = isDark ? '#5eead4' : '#0f766e';
    const tBold   = isDark ? '#f1f5f9' : '#0f172a';

    return (
      <View style={[styles.row, { backgroundColor: rowBg, borderBottomColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
        {/* Mes */}
        <Text style={[styles.cell, { flex: F.mes, color: isDisembolso ? tAccent : tMuted, fontWeight: 'bold', fontSize: 9, textAlign: 'center' }]}>
          {item.mes}
        </Text>
        {/* Próximo Vencimiento */}
        <Text style={[styles.cell, { flex: F.fecha, color: tMuted, fontSize: 9, textAlign: 'center' }]}>
          {item.fecha}
        </Text>
        {/* Saldo Capital */}
        <Text style={[styles.cell, { flex: F.saldo, color: tAccent, fontWeight: 'bold', fontSize: 9, textAlign: 'right' }]} numberOfLines={1}>
          {fmt(item.saldoRemanente)}
        </Text>
        {/* Amortización */}
        <Text style={[styles.cell, { flex: F.amort, color: tBase, fontSize: 9, textAlign: 'right' }]} numberOfLines={1}>
          {isDisembolso ? '-' : fmt(item.capitalAmortizado)}
        </Text>
        {/* Interés */}
        <Text style={[styles.cell, { flex: F.interes, color: tBase, fontSize: 9, textAlign: 'right' }]} numberOfLines={1}>
          {isDisembolso ? '-' : fmt(item.interesPagado)}
        </Text>
        {/* Seguro */}
        <Text style={[styles.cell, { flex: F.seguro, color: tBase, fontSize: 9, textAlign: 'right' }]} numberOfLines={1}>
          {isDisembolso ? '-' : fmt(item.seguroDesgravamen)}
        </Text>
        {/* Cuota Total */}
        <Text
          style={[styles.cell, {
            flex: F.cuota,
            color: isDisembolso ? tMuted : tBold,
            fontWeight: isDisembolso ? 'normal' : 'bold',
            fontSize: isDisembolso ? 8 : 10,
            textAlign: 'right',
          }]}
          numberOfLines={1}
        >
          {isDisembolso ? 'DESEMBOLSO' : `${moneda} ${fmt(item.cuotaTotal)}`}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <View style={{
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: isDark ? '#1e293b' : 'rgba(226,232,240,0.5)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <Ionicons name="calendar-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#0f172a', textAlign: 'center', marginBottom: 12 }}>
        Aún no hay datos
      </Text>
      <Text style={{ color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
        Ve al Simulador, configura tus parámetros y presiona{' '}
        <Text style={{ fontWeight: 'bold' }}>"Calcular Préstamo"</Text>.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Encabezado */}
      <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#475569' : '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          Resumen de Préstamo
        </Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: -0.5 }}>
          Plan de Amortización
        </Text>
      </View>

      {/* Toggle Tabla vs Gráfico */}
      {amortizationTable.length > 0 && (
        <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 16, backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 12, padding: 4 }}>
          <Pressable 
            onPress={() => setViewMode('table')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: viewMode === 'table' ? (isDark ? '#0f766e' : '#ffffff') : 'transparent', alignItems: 'center', elevation: viewMode === 'table' ? 2 : 0, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: viewMode === 'table' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b') }}>Tabla de Detalles</Text>
          </Pressable>
          <Pressable 
            onPress={() => setViewMode('chart')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: viewMode === 'chart' ? (isDark ? '#0f766e' : '#ffffff') : 'transparent', alignItems: 'center', elevation: viewMode === 'chart' ? 2 : 0, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: viewMode === 'chart' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b') }}>Gráfico Visual</Text>
          </Pressable>
        </View>
      )}

      {/* Gráfico Visual */}
      {viewMode === 'chart' && amortizationTable.length > 0 && (
        <View style={{ flex: 1, paddingTop: 32 }}>
          <AmortizationChart data={amortizationTable} />
        </View>
      )}

      {/* Cabecera de la tabla — orden BCP */}
      {viewMode === 'table' && amortizationTable.length > 0 && (
        <View style={[styles.headerRow, { marginHorizontal: 16 }]}>
          <Text style={[styles.headerCell, { flex: F.mes,    textAlign: 'center' }]}>Mes</Text>
          <Text style={[styles.headerCell, { flex: F.fecha,  textAlign: 'center' }]}>Vcto.</Text>
          <Text style={[styles.headerCell, { flex: F.saldo,  textAlign: 'right'  }]}>Saldo Cap.</Text>
          <Text style={[styles.headerCell, { flex: F.amort,  textAlign: 'right'  }]}>Amort.</Text>
          <Text style={[styles.headerCell, { flex: F.interes,textAlign: 'right'  }]}>Interés</Text>
          <Text style={[styles.headerCell, { flex: F.seguro, textAlign: 'right'  }]}>Seguro</Text>
          <Text style={[styles.headerCell, { flex: F.cuota,  textAlign: 'right'  }]}>Cuota</Text>
        </View>
      )}

      {/* Lista de filas */}
      {viewMode === 'table' && (
        <FlatList
          data={amortizationTable}
          keyExtractor={(item) => item.mes.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={amortizationTable.length === 0 ? { flexGrow: 1 } : { paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          ListFooterComponent={
            amortizationTable.length > 0 ? (
              <View style={{
                height: 24, backgroundColor: isDark ? '#1e293b' : '#ffffff',
                marginHorizontal: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 32,
              }} />
            ) : null
          }
        />
      )}

      {/* Botón Modo Oscuro */}
      <Pressable
        onPress={toggleColorScheme}
        className="absolute right-6 rounded-full p-2.5 bg-slate-200/60 dark:bg-slate-800"
        style={{ top: insets.top + 12, zIndex: 999, elevation: 5 }}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#fef08a' : '#334155'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  cell: {
    paddingHorizontal: 2,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 4,
  },
  headerCell: {
    color: '#ccfbf1',
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
});
