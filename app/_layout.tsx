import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="baby/[id]" options={{ title: "Baby Detail" }} />
        <Stack.Screen name="account" options={{ title: "" }} />
      </Stack>
    </AuthProvider>
  );
}
