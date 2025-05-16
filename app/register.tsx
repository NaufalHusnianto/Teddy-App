import { Redirect, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state tambahan

  const { user, loading: authLoading } = useAuth();

  if (authLoading || loading)
    return <ActivityIndicator size="large" style={styles.loader} />;

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  const handleRegister = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Simpan display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Redirect setelah sukses register dan update profile
      router.replace("/dashboard");
    } catch (err) {
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/images/picture.png")}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Text style={styles.title}>Register</Text>
      <Image
        source={require("../assets/images/Company.png")}
        style={{
          width: 240,
          height: 80,
          marginBottom: 40,
          marginTop: 20,
          marginHorizontal: "auto",
        }}
      />

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
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
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Register</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/login")} // push ke login
          >
            Login
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
    height: "85%",
    padding: 24,
    alignItems: "center",
    gap: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    marginTop: 50,
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
