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

  const extremeInfo = useMemo(() => {
    const filtered = data.filter(r => r.mes > 0);
    if (filtered.length < 2) return { isExtreme: false, maxVisualCuota: Infinity };
    
    const baseCuota = filtered[0].cuotaTotal;
    const maxCuota = Math.max(...filtered.map(r => r.cuotaTotal));
    
    // Si la máxima cuota es más de 3 veces la inicial, es un caso de distorsión extrema
    return {
      isExtreme: maxCuota > baseCuota * 3,
      maxVisualCuota: baseCuota * 1.5,
    };
  }, [data]);

  const chartData = useMemo(() => {
    const filtered = data.filter(r => r.mes > 0);
    const step = filtered.length > 36 ? Math.ceil(filtered.length / 30) : 1;

    const result = [];
    for (let i = 0; i < filtered.length; i += step) {
      const r = filtered[i];
      let cap = r.capitalAmortizado;
      let int = r.interesPagado;
      let seg = r.seguroDesgravamen;
      
      const total = cap + int + seg;
      if (extremeInfo.isExtreme && total > extremeInfo.maxVisualCuota) {
        // Escalar proporcionalmente para no romper la visualización
        const scale = extremeInfo.maxVisualCuota / total;
        cap *= scale;
        int *= scale;
        seg *= scale;
      }

      result.push({
        stacks: [
          { value: cap, color: isDark ? '#0f766e' : '#14b8a6', marginBottom: 2 },
          { value: int, color: isDark ? '#f59e0b' : '#fbbf24', marginBottom: 2 },
          { value: seg, color: isDark ? '#64748b' : '#cbd5e1' }
        ],
        label: r.mes.toString(),
      });
    }
    return result;
  }, [data, isDark, extremeInfo]);

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1000;
    if (extremeInfo.isExtreme) return Math.ceil(extremeInfo.maxVisualCuota * 1.1);
    
    const maxCuota = Math.max(...data.map(r => r.cuotaTotal));
    return Math.ceil(maxCuota * 1.1);
  }, [data, extremeInfo]);

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

      {extremeInfo.isExtreme && (
        <View className="flex-row bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 mb-6 items-center">
          <Text className="text-amber-700 dark:text-amber-500 text-[11px] flex-1 leading-4 text-center">
            ⚠️ Escala ajustada visualmente debido al crecimiento exponencial del saldo por la alta tasa en un plazo extenso.
          </Text>
        </View>
      )}

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
        maxValue={maxValue}
        showValuesAsTopLabel={false}
        rulesColor={isDark ? '#1e293b' : '#f1f5f9'}
        xAxisLabelTextStyle={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }}
      />
    </View>
  );
}
