import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";
import { useAuth } from "./context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [babyDevices, setBabyDevices] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBaby, setNewBaby] = useState({ name: "", age: "" });
  const prevDevicesRef = useRef<any[]>([]); // Gunakan useRef agar tidak trigger re-render

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "babies"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const babies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Deteksi perubahan kategori suhu
      for (let baby of babies) {
        const prev = prevDevicesRef.current.find((d) => d.id === baby.id);
        if (
          prev &&
          getTemperatureCategory(prev.temp) !==
            getTemperatureCategory(baby.temp)
        ) {
          const kategoriBaru = getTemperatureCategory(baby.temp);
          const info = {
            name: baby.name,
            category: kategoriBaru,
            time: new Date().toISOString(),
          };

          try {
            const existing = await AsyncStorage.getItem("notifications");
            const parsed = existing ? JSON.parse(existing) : [];
            parsed.push(info);
            await AsyncStorage.setItem("notifications", JSON.stringify(parsed));
            console.log("Notifikasi disimpan:", info);
          } catch (e) {
            console.error("Gagal menyimpan notifikasi ke AsyncStorage", e);
          }
        }
      }

      prevDevicesRef.current = babies; // Update ref setelah loop selesai
      setBabyDevices(babies);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddBaby = async () => {
    if (!newBaby.name || !newBaby.age) return;

    await addDoc(collection(db, "babies"), {
      name: newBaby.name,
      age: newBaby.age,
      temp: 0,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    setNewBaby({ name: "", age: "" });
    setModalVisible(false);
  };

  const getTemperatureCategory = (tempStr: number) => {
    const temp = Number(tempStr);
    if (temp > 40.6) return "Demam Sangat Tinggi";
    if (temp >= 40.0) return "Demam Tinggi";
    if (temp >= 39.0) return "Demam Sedang";
    if (temp >= 37.6) return "Demam Ringan";
    if (temp >= 36.4 && temp <= 37.5) return "Suhu Normal";
    return "Belum Terdeteksi";
  };

  const getCardColor = (tempStr: number) => {
    const category = getTemperatureCategory(tempStr);
    switch (category) {
      case "Suhu Normal":
        return "#d0f0c0";
      case "Demam Ringan":
        return "#fff4cc";
      case "Demam Sedang":
        return "#ffdf99";
      case "Demam Tinggi":
        return "#ffc2b3";
      case "Demam Sangat Tinggi":
        return "#ff8c8c";
      default:
        return "#e0e0e0";
    }
  };

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      {/* Header Profil */}
      <TouchableOpacity
        style={styles.profileCard}
        onPress={() => router.push("/account")}
      >
        <Image
          source={
            user.photoURL
              ? { uri: user.photoURL }
              : require("../assets/images/Icon-teddy.png")
          }
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>Hi, {user.displayName || "No Name"}!</Text>
          <Text style={styles.goodParent}>Good Parents!</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/notification")}
          style={styles.accountButton}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={"#3185c4"}
            style={{
              backgroundColor: "#d6d6d6",
              borderRadius: 8,
              padding: 4,
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      <Text style={styles.title}>Baby Status</Text>

      {/* Daftar Bayi */}
      <ScrollView style={styles.deviceList}>
        {babyDevices.map((device) => {
          const category = getTemperatureCategory(device.temp);
          const iconName =
            category === "Suhu Normal"
              ? "checkmark-circle-outline"
              : "warning-outline";
          const iconColor = category === "Suhu Normal" ? "green" : "red";

          return (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceCard,
                { backgroundColor: getCardColor(device.temp) },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/baby/[id]",
                  params: { id: String(device.id) },
                })
              }
            >
              <Image
                source={require("../assets/images/baby-boy.png")}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={{ color: "#6b6b6b" }}>{device.temp} °C</Text>
                <Text style={{ fontWeight: "bold" }}>{category}</Text>
              </View>
              <Ionicons
                name={iconName}
                size={24}
                color={iconColor}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tombol Tambah */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Modal Tambah Bayi */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Tambah Data Bayi</Text>
            <TextInput
              placeholder="Nama Bayi"
              style={styles.input}
              value={newBaby.name}
              onChangeText={(text) => setNewBaby({ ...newBaby, name: text })}
            />
            <TextInput
              placeholder="Umur (bulan)"
              style={styles.input}
              keyboardType="numeric"
              value={newBaby.age}
              onChangeText={(text) => setNewBaby({ ...newBaby, age: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleAddBaby}>
                <Text style={{ color: "white" }}>Simpan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#aaa" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "white" }}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 16,
  },
  name: {
    fontSize: 14,
  },
  goodParent: {
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  deviceList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    paddingVertical: 24,
    marginBottom: 20,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#3185c4",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  accountButton: {
    padding: 8,
    marginLeft: "auto",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    backgroundColor: "#3185c4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
