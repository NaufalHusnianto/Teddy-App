// app/login.tsx
import { Redirect, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";
import { useAuth } from "./context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { user, loading, loginStart, loginEnd, authLoading } = useAuth();

  if (loading || authLoading)
    return <ActivityIndicator size="large" style={styles.loader} />;

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password must not be empty");
      return;
    }

    loginStart();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      loginEnd();
    }
  };

  if (user) return <Redirect href="/dashboard" />;

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/images/picture.png")}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.header}>
        <Text style={styles.title}>Login</Text>
        <Image
          source={require("../assets/images/Icon-teddy.png")}
          style={styles.icon}
        />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.registerText}>
          Don’t have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/register")}>
            Register
          </Text>
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#3185c4",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 100, 164, 0.8)",
  },
  header: {
    alignItems: "center",
    marginTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  icon: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f9f9f9",
    color: "black",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 16,
  },
  registerText: {
    marginTop: 32,
    fontSize: 14,
    color: "#444",
  },
  link: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
