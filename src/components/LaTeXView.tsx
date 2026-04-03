import React, { useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

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
  const [height, setHeight] = useState(50);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }] });"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: ${backgroundColor === 'transparent' ? 'transparent' : backgroundColor};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .katex-display {
      margin: 0 !important;
      color: ${color};
      font-size: ${fontSize}px;
    }
    .katex { color: ${color} !important; font-size: ${fontSize}px; }
    .katex * { color: inherit !important; }
  </style>
</head>
<body>
  <div id="formula"></div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      katex.render(String.raw\`${formula}\`, document.getElementById('formula'), {
        displayMode: true,
        throwOnError: false
      });
      // Enviar la altura real al componente nativo
      const h = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(String(h));
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={{ height, width: '100%' }}>
      <WebView
        source={{ html }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 0) setHeight(h + 8);
        }}
        originWhitelist={['*']}
        // Necesario para fondo transparente en Android
        androidLayerType="software"
      />
    </View>
  );
};

export default LaTeXView;
