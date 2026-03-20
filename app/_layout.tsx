import { Stack } from "expo-router";
import "../global.css"; // Importante para que no se pierda el diseño de Tailwind

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Esto le dice a la app que cargue tus pestañas dentro del contenedor de navegación */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
