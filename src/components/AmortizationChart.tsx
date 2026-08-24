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
    if (!data || data.length === 0) return [];
    const filtered = data.filter(r => r.mes > 0);
    const result = [];
    
    // Si hay menos o igual a 60 meses (5 años), mostrar mes a mes (con scroll natural)
    if (filtered.length <= 60) {
      for (let i = 0; i < filtered.length; i++) {
        const r = filtered[i];
        let cap = r.capitalAmortizado;
        let int = r.interesPagado;
        let seg = r.seguroDesgravamen;
        
        // Mostrar etiqueta cada 6 meses (semestral) o en los extremos para evitar superposición visual
        const showLabel = (r.mes % 6 === 0) || r.mes === 1 || r.mes === filtered.length;

        result.push({
          stacks: [
            { value: cap, color: isDark ? '#0f766e' : '#14b8a6', marginBottom: 2 },
            { value: int, color: isDark ? '#f59e0b' : '#fbbf24', marginBottom: 2 },
            { value: seg, color: isDark ? '#64748b' : '#cbd5e1' }
          ],
          label: showLabel ? r.mes.toString() : '',
        });
      }
    } else {
      // Si hay más de 60 meses, agrupar por años (12 meses por barra)
      let currentYear = 1;
      let capSum = 0;
      let intSum = 0;
      let segSum = 0;
      let monthsInYear = 0;

      for (let i = 0; i < filtered.length; i++) {
        const r = filtered[i];
        capSum += r.capitalAmortizado;
        intSum += r.interesPagado;
        segSum += r.seguroDesgravamen;
        monthsInYear++;

        // Cortar al llegar al mes 12 o al último elemento
        if (monthsInYear === 12 || i === filtered.length - 1) {
          result.push({
            stacks: [
              { value: capSum, color: isDark ? '#0f766e' : '#14b8a6', marginBottom: 2 },
              { value: intSum, color: isDark ? '#f59e0b' : '#fbbf24', marginBottom: 2 },
              { value: segSum, color: isDark ? '#64748b' : '#cbd5e1' }
            ],
            label: currentYear.toString(),
          });

          currentYear++;
          capSum = 0;
          intSum = 0;
          segSum = 0;
          monthsInYear = 0;
        }
      }
    }
    return result;
  }, [data, isDark]);

  const maxValue = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1000;
    // Calcular el máximo real sobre los stacks ya sumados
    const maxInChart = Math.max(...chartData.map(c => c.stacks.reduce((acc, s) => acc + s.value, 0)));
    return Math.ceil(maxInChart * 1.1);
  }, [chartData]);

  if (!data || data.length <= 1) return null;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm mx-4 mb-6">
      <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
        Composición de Cuota (Amortización vs Interés)
      </Text>
      
      {data.length > 61 && (
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6 -mt-4 font-medium italic">
          Datos agrupados anualmente
        </Text>
      )}

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
        barWidth={16}
        spacing={8}
        scrollAnimation={true}
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
