import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useColorScheme } from 'nativewind';
import { AmortizationRow } from '../types';

interface AmortizationChartProps {
  data: AmortizationRow[];
}

export default function AmortizationChart({ data }: AmortizationChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const screenWidth = Dimensions.get('window').width;

  const chartData = useMemo(() => {
    // Filtrar desembolso (mes 0) y mapear a formato StackedBar
    // Para no saturar el gráfico si hay muchos meses (ej. 60 o 120), podríamos
    // mostrar 1 de cada N meses o agrupar por años. Pero para préstamos cortos (12-24)
    // mostrar todos está bien.
    const filtered = data.filter(r => r.mes > 0);
    
    // Si hay más de 36 meses, mostramos saltos para que quepa bien
    const step = filtered.length > 36 ? Math.ceil(filtered.length / 30) : 1;

    const result = [];
    for (let i = 0; i < filtered.length; i += step) {
      const r = filtered[i];
      result.push({
        stacks: [
          { value: r.capitalAmortizado, color: isDark ? '#0f766e' : '#14b8a6', marginBottom: 2 }, // Teal (Amortización)
          { value: r.interesPagado, color: isDark ? '#f59e0b' : '#fbbf24', marginBottom: 2 },     // Amber (Interés)
          { value: r.seguroDesgravamen, color: isDark ? '#64748b' : '#cbd5e1' }                   // Slate (Seguro)
        ],
        label: r.mes.toString(),
      });
    }
    return result;
  }, [data, isDark]);

  if (!data || data.length <= 1) return null;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm mx-4 mb-6">
      <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
        Composición de Cuota (Amortización vs Interés)
      </Text>
      
      <View className="flex-row justify-center gap-4 mb-6">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? '#0f766e' : '#14b8a6' }} />
          <Text className="text-xs text-slate-500 dark:text-slate-400">Capital</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? '#f59e0b' : '#fbbf24' }} />
          <Text className="text-xs text-slate-500 dark:text-slate-400">Interés</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: isDark ? '#64748b' : '#cbd5e1' }} />
          <Text className="text-xs text-slate-500 dark:text-slate-400">Seguro</Text>
        </View>
      </View>

      <BarChart
        stackData={chartData}
        width={screenWidth - 80}
        height={220}
        barWidth={chartData.length > 24 ? 6 : 12}
        spacing={chartData.length > 24 ? 4 : 8}
        initialSpacing={10}
        hideRules
        hideYAxisText
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor={isDark ? '#334155' : '#e2e8f0'}
        noOfSections={4}
        stepValue={1000} // opcional, dependerá del monto
        showValuesAsTopLabel={false}
        rulesColor={isDark ? '#1e293b' : '#f1f5f9'}
        xAxisLabelTextStyle={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }}
      />
    </View>
  );
}
