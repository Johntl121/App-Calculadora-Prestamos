/**
 * Utilidades de formateo para inputs numéricos.
 * Formateo visual de miles y sanitización de texto numérico.
 */

/**
 * Agrega separadores de miles (comas) a la parte entera de un valor numérico.
 * Acepta string o number; retorna string formateado para display.
 * Ejemplo: "2500.50" → "2,500.50"
 */
export const formatWithThousandSeparators = (val: any): string => {
  if (val === undefined || val === null || val === '') return '';
  const stringVal = String(val);
  const parts = stringVal.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

/**
 * Filtra caracteres no numéricos de un texto, preservando un único punto decimal.
 * Diseñada para usarse en onChangeText de TextInput con keyboardType="decimal-pad".
 * Ejemplo: "2,500.50" → "2500.50"
 */
export const cleanNumericText = (text: string): string => {
  let cleanText = text.replace(/[^0-9.]/g, '');
  const parts = cleanText.split('.');
  if (parts.length > 2) {
    cleanText = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleanText;
};
