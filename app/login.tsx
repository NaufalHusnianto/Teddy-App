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

    loginStart(); // Trigger loading hanya jika validasi lolos

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      loginEnd(); // Stop loading di sini, baik sukses atau gagal
    }
  };

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/images/picture.png")}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Text style={styles.title}>Login</Text>
      <Image
        source={require("../assets/images/Icon-teddy.png")}
        style={{
          width: 200,
          height: 200,
          marginBottom: 40,
          marginTop: 20,
          marginHorizontal: "auto",
        }}
      />

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Login</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={{ marginTop: 30 }}>
          Don`t have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/register")} // push ke register
          >
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
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#3185c4",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 100, 164, 0.8)", // semi-transparent blue
  },
  formContainer: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: "#fff",
    height: "60%",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    marginTop: 80,
  },
  input: {
    height: 48,
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: "60%",
    alignItems: "center",
  },
  error: {
    marginTop: 12,
    color: "red",
    textAlign: "center",
  },
  link: {
    color: "#007AFF",
  },
});
