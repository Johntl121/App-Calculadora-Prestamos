# 🏦 Calculadora de Préstamos Pro (Perú)

Una sofisticada aplicación móvil híbrida desarrollada en **React Native (Expo SDK 52+)** diseñada para simular préstamos bancarios de acuerdo con las normativas y fórmulas exactas de las entidades financieras peruanas (BCP, BBVA, Scotiabank, Interbank).

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Características Principales

### 📈 Motor Matemático Bancario
* **Sistema de Amortización Francés** (cuotas fijas).
* **Tipos de Tasa Soportados:** TEA (Efectiva Anual), TEM (Efectiva Mensual) y TNA (Nominal Anual).
* **Base de Cálculo Dual (Calendarios):**
  * **Calendario Real (Bancario):** Usa matemáticas de días exactos (`date-fns`) bajo una base anual de 365 días. Incorpora un ajuste algorítmico automatizado sobre la cuota teórica para eliminar el efecto "Balloon Payment" (cuota globo) en el último mes de períodos largos.
  * **Mes Comercial (30/360):** Cálculo tradicional e ideal para escenarios de cuotas puramente perfectas y simétricas, usado frecuentemente por analistas locales y cajas de ahorro.

### 💼 Experiencia de Usuario Localizada
* **Presets Bancarios:** Autocompleta automáticamente las tasas vigentes aproximadas del *Seguro de Desgravamen Mensual* basándose en la entidad seleccionada (BCP, BBVA, Interbank, Scotiabank).
* **Generación de Cronogramas PDF:** Exportación robusta offline generando tablas de reporte nítidas (soportando Native Share en iOS y Android a través de Expo FileSystem).
* **Bloqueo Inteligente:** Una vez generada la simulación, la ventana queda asegurada contra toques accidentales previniendo discordancia de datos hasta hacer reset.

### 🎓 Guía Interactiva Educativa
* Un *BottomSheet* interactivo para educar al usuario sobre conceptos como TEM vs TCEA.
* **Componente LaTeX Offline:** Las fórmulas financieras (`react-native-katex`) para cálculo de anualidades y conversiones de tasas son dibujadas tipográficamente en modo 100% Offline (empaquetado nativo sin llamados externos), soportando de forma dinámica temas oscuros y claros sin destellos.

### 🎨 Diseño y UI Avanzado
* Totalmente adaptado con **NativeWind** (Tailwind CSS).
* Estética dinámica responsiva de primer nivel y compatibilidad total con **Dark / Light Mode**.

---

## 🛠️ Stack Tecnológico

* **Core:** React Native + Expo Router (File-based navigation)
* **Estilos:** NativeWind (v4 preconfigurado)
* **Gestor de Estado:** Zustand (ligero, prescinde de boilerplate y re-renders excesivos)
* **Matemática y Fechas:** `date-fns` (cálculo de *differenceInDays* exacto)
* **Render Matemático:** `react-native-katex` con motor incrustado WebView CSS/Base64.
* **Generación de Archivos:** `expo-print`, `expo-sharing`, `expo-file-system`.

---

## 🚀 Instalación y Desarrollo Locales

1. **Instalar Dependencias:**
   Asegúrate de clonar el proyecto y luego ejecutar:
   ```bash
   npm install
   ```

2. **Levantar el Servidor de Expo:**
   Inicia Metro Bundler.
   ```bash
   npx expo start
   ```

3. **Ejecutar en tu Dispositivo:**
   * Utiliza la aplicación **Expo Go** en Android/iOS y escanea el código QR en la consola.
   * Alternativamente, presiona `a` para emulador Android o `i` para simulador iOS si los tienes preconfigurados.

---

## 🏗️ Arquitectura de Carpetas

```text
├── app/                  # Rutas y Vistas principales usando Expo Router
│   ├── (tabs)/index.tsx  # Pantalla del Simulador
│   └── _layout.tsx       # Root layout, inyección de tema
├── src/
│   ├── components/       # Componentes reusables (ej. LaTeXView.tsx)
│   ├── store/            # Lógica global con Zustand (useLoanStore.ts)
│   ├── types/            # Interfaces de TypeScript (LoanParameters, AmortizationRow)
│   └── utils/            # Motores de cálculo matemáticos aislados (loanMath.ts)
├── README.md
├── tailwind.config.js    # Configuración de los tokens de color del simulador
└── package.json
```

---

*Proyecto diseñado con un enfoque de código limpio y escalabilidad. Contiene documentación intrínseca orientada a guiar decisiones financieras en Perú.*
