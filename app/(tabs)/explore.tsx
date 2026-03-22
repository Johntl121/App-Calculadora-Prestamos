import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoanStore } from '../../src/store/useLoanStore';
import { AmortizationRow } from '../../src/types';

const formatNum = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AmortizationTableScreen() {
  const { amortizationTable, moneda } = useLoanStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const renderItem = ({ item, index }: { item: AmortizationRow; index: number }) => {
    const isZebra = index % 2 === 1;
    const rowBg = isZebra
      ? (isDark ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.8)')
      : (isDark ? '#1e293b' : '#ffffff');
    const textMain = isDark ? '#e2e8f0' : '#334155';
    const textSub = isDark ? '#94a3b8' : '#64748b';
    const textAccent = isDark ? '#5eead4' : '#0f766e';

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 11,
          paddingHorizontal: 10,
          backgroundColor: rowBg,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#0f172a' : '#f1f5f9',
          marginHorizontal: 20,
        }}
      >
        {/* Mes */}
        <Text style={{ width: '6%', color: textSub, fontWeight: 'bold', fontSize: 9, textAlign: 'center' }}>
          {item.mes}
        </Text>
        {/* Fecha */}
        <Text style={{ width: '15%', color: textSub, fontWeight: '500', fontSize: 9, textAlign: 'center' }}>
          {item.fecha}
        </Text>
        {/* Capital */}
        <Text style={{ width: '15%', color: textSub, fontWeight: '500', fontSize: 9, textAlign: 'center' }} numberOfLines={1}>
          {formatNum(item.capitalAmortizado)}
        </Text>
        {/* Interés */}
        <Text style={{ width: '15%', color: textSub, fontWeight: '500', fontSize: 9, textAlign: 'center' }} numberOfLines={1}>
          {formatNum(item.interesPagado)}
        </Text>
        {/* Seguro */}
        <Text style={{ width: '14%', color: textSub, fontWeight: '500', fontSize: 9, textAlign: 'center' }} numberOfLines={1}>
          {formatNum(item.seguroDesgravamen)}
        </Text>
        {/* Total */}
        <Text style={{ width: '18%', color: textMain, fontWeight: 'bold', fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
          {moneda} {formatNum(item.cuotaTotal)}
        </Text>
        {/* Saldo */}
        <Text style={{ width: '17%', color: textAccent, fontWeight: 'bold', fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
          {moneda} {formatNum(item.saldoRemanente)}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-10">
      <View
        style={{
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: isDark ? '#1e293b' : 'rgba(226,232,240,0.5)',
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}
      >
        <Ionicons name="calendar-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
      </View>
      <Text className="text-xl font-bold text-slate-800 dark:text-white text-center mb-3">
        Aún no hay datos
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-relaxed">
        Ve al Simulador, configura tus parámetros, presiona "Calcular Préstamo" y luego "Ver Tabla de Amortización".
      </Text>
    </View>
  );

  return (
    <View
      className="flex-1 bg-slate-100 dark:bg-slate-950"
      style={{ paddingTop: insets.top }}
    >
      {/* Encabezado */}
      <View className="px-6 pt-8 pb-4">
        <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1">
          Resumen de Préstamo
        </Text>
        <Text className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Plan de Amortización
        </Text>
      </View>

      {/* Cabecera de la Tabla */}
      {amortizationTable.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#0f172a',
            paddingVertical: 14,
            paddingHorizontal: 10,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginHorizontal: 20,
            marginTop: 8,
          }}
        >
          <Text style={{ width: '6%',  color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Mes</Text>
          <Text style={{ width: '15%', color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Fecha</Text>
          <Text style={{ width: '15%', color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Cap.</Text>
          <Text style={{ width: '15%', color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Int.</Text>
          <Text style={{ width: '14%', color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Seg.</Text>
          <Text style={{ width: '18%', color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Total</Text>
          <Text style={{ width: '17%', color: '#99f6e4', fontWeight: 'bold', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' }}>Saldo</Text>
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={amortizationTable}
        keyExtractor={(item) => item.mes.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={amortizationTable.length === 0 ? { flexGrow: 1 } : { paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
        ListFooterComponent={
          amortizationTable.length > 0
            ? (
              <View
                style={{
                  height: 24,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  marginHorizontal: 20,
                  borderBottomLeftRadius: 24,
                  borderBottomRightRadius: 24,
                  marginBottom: 32,
                }}
              />
            )
            : null
        }
      />

      {/* Botón Modo Oscuro */}
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
