import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInputMask } from 'react-native-masked-text';
import { useColorScheme } from 'nativewind';
import { useLoanStore } from '../store/useLoanStore';

interface PrepaymentModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrepaymentModal({ visible, onClose }: PrepaymentModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { updateParameter, calculateLoan, plazoMeses, prepago } = useLoanStore();

  const [mes, setMes] = useState('6');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<'reducir_cuota' | 'reducir_plazo'>('reducir_plazo');

  useEffect(() => {
    if (visible && prepago) {
      setMes(prepago.mes.toString());
      setMonto(prepago.monto.toString());
      setTipo(prepago.tipo);
    }
  }, [visible, prepago]);

  const maxMeses = parseInt(plazoMeses) || 0;

  const handleApply = () => {
    const numMes = parseInt(mes);
    const numMonto = parseFloat(monto);
    
    if (numMes > 0 && numMes < maxMeses && numMonto > 0) {
      updateParameter('prepago', { mes: numMes, monto: numMonto, tipo });
      calculateLoan();
      onClose();
    }
  };

  const handleClear = () => {
    updateParameter('prepago', undefined);
    calculateLoan();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-black text-slate-900 dark:text-white">Pago Adelantado</Text>
            <Pressable onPress={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              <Ionicons name="close" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
            </Pressable>
          </View>

          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">MES DEL PREPAGO (1 - {maxMeses - 1})</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-4">
            <TextInput
              className="flex-1 text-xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" 
              value={mes} 
              onChangeText={setMes}
              placeholder="6" 
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2">MONTO A INYECTAR</Text>
          <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-5">
            <TextInputMask
              type="money"
              options={{ precision: 2, separator: '.', delimiter: ',', unit: '', suffixUnit: '' }}
              className="flex-1 text-xl font-bold text-slate-950 dark:text-white py-4 p-0"
              keyboardType="numeric" 
              value={monto} 
              includeRawValueInChangeText={true}
              onChangeText={(_, rawText) => setMonto(rawText || '')}
              placeholder="5,000.00" 
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3">¿QUÉ DESEAS LOGRAR?</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {(['reducir_plazo', 'reducir_cuota'] as const).map((t) => {
              const isActive = tipo === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setTipo(t);
                  }}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5,
                    backgroundColor: isActive ? (isDark ? '#134e4a' : '#0f766e') : (isDark ? '#1e293b' : '#f1f5f9'),
                    borderColor: isActive ? '#0f766e' : (isDark ? '#334155' : '#e2e8f0'),
                  }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 13, color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'), marginBottom: 2 }}>
                    {t === 'reducir_plazo' ? 'Terminar Antes' : 'Pagar Menos al Mes'}
                  </Text>
                  <Text style={{ fontSize: 10, color: isActive ? '#99f6e4' : (isDark ? '#475569' : '#94a3b8'), textAlign: 'center', paddingHorizontal: 4 }}>
                    {t === 'reducir_plazo' ? 'Reduce el plazo total' : 'Reduce tu cuota mensual'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={handleClear}
              className="flex-1 rounded-2xl py-4 items-center justify-center bg-slate-100 dark:bg-slate-800"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold">Quitar Prepago</Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              className="flex-1 rounded-2xl py-4 items-center justify-center shadow-lg shadow-teal-900/30"
              style={{ backgroundColor: '#0f766e' }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '900' }}>Aplicar Simulación</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
