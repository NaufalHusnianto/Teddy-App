import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "./context/AuthContext";

export default function About() {
  const { loading } = useAuth();

  if (loading) return null; // Atau loader

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
});
