import { Link, Redirect, router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "./context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  console.log(user);

  if (loading) return null; // Atau loader

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Company.png")}
        style={{ width: 150, height: 50, marginBottom: 20 }}
      />

      <Text style={styles.description}>
        <Text style={{ fontWeight: "bold" }}>Teddy</Text> is a Temperature
        Monitoring Patch with Real-Time WiFi Tracking for Early Fever Alert and
        Built-In Cooling Therapy
      </Text>

      <Image
        source={require("../assets/images/Artboard.png")}
        style={{ width: 300, height: 180, marginTop: 80, marginBottom: 40 }}
      />

      <Link href="/login" style={styles.button}>
        Get Started
      </Link>
      <Text style={{ marginTop: 30 }}>
        Already have an account?{" "}
        <Text
          style={styles.link}
          onPress={() => router.push("/login")} // push ke register
        >
          Login
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    textAlign: "center",
  },
  description: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
  button: {
    fontSize: 20,
    padding: 10,
    paddingHorizontal: 50,
    marginTop: 50,
    borderRadius: 20,
    color: "#fff",
    backgroundColor: "#007AFF",
  },
  link: {
    color: "#007AFF",
  },
});
