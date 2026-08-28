# 🏦 Calculadora de Préstamos Pro (Perú)

Una sofisticada aplicación móvil híbrida desarrollada en **React Native (Expo)**, diseñada para simular préstamos bancarios de acuerdo con las normativas y fórmulas exactas de las entidades financieras peruanas.

![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-blue?style=for-the-badge)

## ✨ Características Principales

*   **Motor Matemático Bancario:** Implementa el Sistema de Amortización Francés (cuotas fijas).
*   **Flexibilidad de Tasas:** Soporte completo para TEA (Efectiva Anual), TEM (Efectiva Mensual) y TNA (Nominal Anual).
*   **Base de Cálculo Dual:** Permite simular usando Calendario Real (días exactos) o Mes Comercial (30/360).
*   **Seguro de Desgravamen Opcional:** Toggle integrado para incluir o excluir el costo del seguro mensual.
*   **Simulador de Prepagos Avanzado:** Permite evaluar pagos adelantados con dos modalidades: Reducir Cuota o Reducir Plazo (Terminar Antes).
*   **Visualización de Datos:** Gráficos interactivos de la evolución del capital e intereses a lo largo del tiempo.
*   **Exportación Profesional:** Generación de reportes PDF detallados con el cronograma de pagos completo, compartibles de forma offline.
*   **Persistencia Local:** Guarda automáticamente los parámetros de tu última simulación para retomar rápidamente.
*   **Diseño Premium:** Interfaz adaptable con soporte completo para Light y Dark mode.

## 🛠️ Stack Tecnológico

| Dependencia | Versión | Rol principal |
| :--- | :--- | :--- |
| `react-native` | 0.81.x | Framework base |
| `expo` | 54.x | Entorno de desarrollo y build |
| `expo-router` | 6.x | Enrutamiento basado en archivos |
| `zustand` | 5.x | Gestión de estado global ligero |
| `nativewind` | 4.x | Estilos usando clases de Tailwind CSS |
| `decimal.js` | 10.x | Precisión matemática para cálculos financieros |
| `date-fns` | 4.x | Manipulación y cálculo de días exactos entre fechas |
| `react-native-gifted-charts` | 1.x | Visualización de gráficos interactivos |
| `expo-print` / `expo-sharing` | 15.x / 14.x | Generación y compartición de reportes en PDF |
| `react-native-katex` | 1.x | Renderizado offline de fórmulas matemáticas |

## 🚀 Requisitos Previos

*   Node.js (v18 o superior)
*   npm o yarn
*   Aplicación **Expo Go** instalada en tu dispositivo físico, o un emulador (Android Studio / Xcode) configurado.

## 📦 Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd calculadora-prestamos
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npx expo start
    ```
4.  **Ejecutar:**
    *   Escanea el código QR que aparece en la terminal con Expo Go (dispositivo físico).
    *   O presiona `a` para abrir en emulador Android, o `i` para simulador iOS.

## 🏗️ Estructura de Carpetas

```text
├── app/                  # Rutas principales (Expo Router)
│   ├── (tabs)/index.tsx  # Pantalla principal del simulador (Formulario)
│   └── (tabs)/explore.tsx# Pantalla de análisis (Tabla y gráficos)
├── src/
│   ├── components/       # Componentes de UI reusables (LaTeXView, Modales, Gráficos)
│   ├── store/            # Estado global de la aplicación (useLoanStore.ts con Zustand)
│   ├── types/            # Definiciones de interfaces TypeScript
│   └── utils/            # Lógica pura: Motor de cálculo bancario y formateadores
├── README.md
├── tailwind.config.js    # Configuración de colores y tokens de diseño
└── package.json
```

## 🧪 Tests y Verificación

El proyecto cuenta con un conjunto robusto de pruebas unitarias para garantizar la precisión del motor financiero.

*   **Ejecutar pruebas unitarias:**
    ```bash
    npx jest
    ```
    *(Verifica 6 casos críticos en `loanMath.test.ts`, incluyendo préstamos de largo plazo, distintos calendarios y simulación de prepagos).*

*   **Chequeo de tipos estático:**
    ```bash
    npx tsc --noEmit
    ```

## ⚠️ Limitaciones Conocidas

*   **Seguro de Desgravamen Opcional:** Desde septiembre de 2025, la normativa de la SBS en Perú estipula que el seguro de desgravamen ya NO es obligatorio para préstamos personales (solo se mantiene obligatorio para créditos hipotecarios). Por ello, la app lo ofrece como opcional vía toggle. Las tasas sugeridas deben ser verificadas por el usuario.
*   **TCEA Referencial:** La TCEA mostrada se calcula rigurosamente mediante el método de Tasa Interna de Retorno (TIR), pero se etiqueta como "Estimada (Referencial)". Esto se debe a que puede no coincidir de manera idéntica con el reporte SBS final de un banco, ya que la app no incluye gastos adicionales y variables (portes, comisiones de envío de estado de cuenta) que ciertas entidades aún podrían incorporar en su flujo.
*   **Rendimiento en Plazos Muy Largos:** El cálculo con "Calendario Real" para plazos muy extensos (ej. > 300 meses con tasas altísimas) utiliza un algoritmo iterativo de bisección para forzar la convergencia a saldo cero, lo cual requiere mayor procesamiento computacional que la fórmula tradicional comercial.

## 📄 Licencia

Este proyecto es de uso privado. Todos los derechos reservados.
