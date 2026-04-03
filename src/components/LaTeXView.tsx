import React from 'react';
import { View, Platform } from 'react-native';
import Katex from 'react-native-katex';

interface LaTeXViewProps {
  formula: string;
  /** Color del texto de la fórmula (por defecto negro) */
  color?: string;
  /** Color de fondo del contenedor (debe coincidir con la tarjeta) */
  backgroundColor?: string;
  /** Tamaño de fuente base para KaTeX (en px, por defecto 16) */
  fontSize?: number;
}

const LaTeXView: React.FC<LaTeXViewProps> = ({
  formula,
  color = '#0f172a',
  backgroundColor = 'transparent',
  fontSize = 16,
}) => {
  const inlineStyle = `
html, body {
  background: ${backgroundColor === 'transparent' ? 'transparent' : backgroundColor};
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.katex {
  color: ${color} !important;
  font-size: ${fontSize + 2}px !important;
}
.katex * { color: inherit !important; }
</style><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><style>
  `;

  // Determinamos un alto aproximado basado en la complejidad de la fórmula 
  // para evitar inyecciones de JS personalizadas que alteren el core de KaTeX offline.
  const isFraction = formula.includes('\\frac');
  const rootHeight = isFraction ? (Platform.OS === 'ios' ? 70 : 80) : 55;

  return (
    <View style={{ height: rootHeight, width: '100%', overflow: 'hidden' }}>
      <Katex
        expression={formula}
        displayMode={true}
        inlineStyle={inlineStyle}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
};

export default LaTeXView;
