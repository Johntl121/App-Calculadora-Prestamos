import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useColorScheme } from 'nativewind';
import { AmortizationRow } from '../types';

interface AmortizationChartProps {
  data: AmortizationRow[];
  moneda?: string;
}

export default function AmortizationChart({ data, moneda = 'S/' }: AmortizationChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const screenWidth = Dimensions.get('window').width;

  const isGrouped = useMemo(() => {
    const filtered = data?.filter(r => r.mes > 0) || [];
    return filtered.length > 60;
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const filtered = data.filter(r => r.mes > 0);
    const result: any[] = [];
    
    if (!isGrouped) {
      for (let i = 0; i < filtered.length; i++) {
        const r = filtered[i];
        
        result.push({
          stacks: [
            { value: r.capitalAmortizado, color: isDark ? '#0f766e' : '#14b8a6', marginBottom: 2 },
            { value: r.interesPagado, color: isDark ? '#f59e0b' : '#fbbf24', marginBottom: 2 },
            { value: r.seguroDesgravamen, color: isDark ? '#64748b' : '#cbd5e1' }
          ],
          // Usamos labelComponent para saltarnos el sistema de colisión de gifted-charts
          labelComponent: () => (
            <View style={{ width: 36 }}>
              <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 9, textAlign: 'center' }}>
                {r.mes}
              </Text>
            </View>
          ),
          _cap: r.capitalAmortizado,
          _int: r.interesPagado,
          _seg: r.seguroDesgravamen,
          _label: `Mes ${r.mes}`,
        });
      }
    } else {
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

        if (monthsInYear === 12 || i === filtered.length - 1) {
          
          // Capturamos el currentYear para el componente funcional
          const labelYear = currentYear;
          
          result.push({
            stacks: [
              { value: capSum, color: isDark ? '#0f766e' : '#14b8a6', marginBottom: 2 },
              { value: intSum, color: isDark ? '#f59e0b' : '#fbbf24', marginBottom: 2 },
              { value: segSum, color: isDark ? '#64748b' : '#cbd5e1' }
            ],
            labelComponent: () => (
              <View style={{ width: 36 }}>
                <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 9, textAlign: 'center' }}>
                  {labelYear}
                </Text>
              </View>
            ),
            _cap: capSum,
            _int: intSum,
            _seg: segSum,
            _label: `Año ${labelYear}`,
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
  }, [data, isGrouped, isDark]);

  const maxValue = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1000;
    const maxInChart = Math.max(...chartData.map((c: any) => c.stacks.reduce((acc: number, s: any) => acc + s.value, 0)));
    return Math.ceil(maxInChart * 1.12);
  }, [chartData]);

  if (!data || data.length <= 1) return null;

  const formatNumber = (v: number) =>
    v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl pt-5 px-5 pb-5 shadow-sm mx-4 mb-6">
      <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
        Composición de Cuota (Amortización vs Interés)
      </Text>
      
      {isGrouped && (
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6 -mt-4 font-medium italic">
          Datos agrupados anualmente · Toca una barra para ver detalle
        </Text>
      )}

      {!isGrouped && (
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6 -mt-4 font-medium italic">
          Toca una barra para ver detalle
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
        height={250}
        barWidth={16}
        spacing={20}
        scrollAnimation={true}
        initialSpacing={10} 
        endSpacing={10}
        hideRules
        hideYAxisText
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor={isDark ? '#334155' : '#e2e8f0'}
        noOfSections={4}
        maxValue={maxValue}
        showValuesAsTopLabel={false}
        autoShiftLabelsForNegativeStacks={false}
        labelsExtraHeight={-5}
        rulesColor={isDark ? '#1e293b' : '#f1f5f9'}
        xAxisLabelsVerticalShift={4}
        labelsDistanceFromXaxis={0}
        
        focusBarOnPress
        focusedBarConfig={{
          color: isDark ? '#2dd4bf' : '#99f6e4',
          opacity: 0.85,
        }}
        autoCenterTooltip={false} 
        renderTooltip={(item: any, index: number) => {
          const tooltipWidth = 175;
          const tooltipHeight = 135; 
          const barWidth = 16;
          
          let leftShift = - (tooltipWidth / 2) + (barWidth / 2); 
          
          if (index === 0) leftShift = -5;
          else if (index === 1) leftShift = -35;
          else if (index === chartData.length - 1) leftShift = -165;
          else if (index === chartData.length - 2) leftShift = -135;
          else if (index === chartData.length - 3) leftShift = -105;

          const itemTotal = item._cap + item._int + item._seg;
          const spaceAbove = (1 - itemTotal / maxValue) * 250; 
          let pullDown = 0; 
          if (spaceAbove < tooltipHeight) {
            pullDown = Math.max(0, tooltipHeight - spaceAbove + 8);
          }

          return (
            <View
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                width: tooltipWidth,
                left: leftShift, 
                bottom: -pullDown, 
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text style={{ fontWeight: '800', fontSize: 12, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 6 }}>
                {item._label}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: isDark ? '#14b8a6' : '#0f766e', fontWeight: '600' }}>Capital</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#e2e8f0' : '#334155', fontWeight: '600' }}>{moneda} {formatNumber(item._cap)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: isDark ? '#fbbf24' : '#d97706', fontWeight: '600' }}>Interés</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#e2e8f0' : '#334155', fontWeight: '600' }}>{moneda} {formatNumber(item._int)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Seguro</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#e2e8f0' : '#334155', fontWeight: '600' }}>{moneda} {formatNumber(item._seg)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: isDark ? '#334155' : '#e2e8f0', marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: '800' }}>Total</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: '800' }}>{moneda} {formatNumber(item._cap + item._int + item._seg)}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
