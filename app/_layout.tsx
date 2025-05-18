import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen
          name="baby/[id]"
          options={{
            header: () => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 36,
                  paddingBottom: 24,
                }}
              >
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons
                    name="arrow-back-circle"
                    size={24}
                    color="#3185c4"
                  />
                </TouchableOpacity>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginLeft: 16 }}
                >
                  Baby Details
                </Text>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="account"
          options={{
            header: () => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 36,
                  paddingBottom: 24,
                }}
              >
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons
                    name="arrow-back-circle"
                    size={24}
                    color="#3185c4"
                  />
                </TouchableOpacity>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginLeft: 16 }}
                >
                  Account Settings
                </Text>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            header: () => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 36,
                  paddingBottom: 24,
                }}
              >
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons
                    name="arrow-back-circle"
                    size={24}
                    color="#3185c4"
                  />
                </TouchableOpacity>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginLeft: 16 }}
                >
                  About Us
                </Text>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="notification"
          options={{
            header: () => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 36,
                  paddingBottom: 24,
                }}
              >
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons
                    name="arrow-back-circle"
                    size={24}
                    color="#3185c4"
                  />
                </TouchableOpacity>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginLeft: 16 }}
                >
                  Notifications
                </Text>
              </View>
            ),
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
