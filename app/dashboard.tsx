import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "babies"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const babies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
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
    if (temp >= 37.8) return "Demam Ringan";
    if (temp >= 36.4 && temp <= 37.5) return "Normal";
    return "Belum Terdeteksi";
  };

  const getCardColor = (tempStr: number) => {
    const category = getTemperatureCategory(tempStr);
    switch (category) {
      case "Normal":
        return "#d0f0c0"; // hijau muda
      case "Demam Ringan":
        return "#fff4cc"; // kuning muda
      case "Demam Sedang":
        return "#ffdf99"; // oranye
      case "Demam Tinggi":
        return "#ffc2b3"; // merah muda
      case "Demam Sangat Tinggi":
        return "#ff8c8c"; // merah terang
      default:
        return "#e0e0e0"; // abu-abu
    }
  };

  // ⛔ Jangan panggil hook secara kondisional — render kondisi di bawah ini saja
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      {/* Header Profil */}
      <View style={styles.profileCard}>
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
          onPress={() => router.push("/account")}
          style={styles.accountButton}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={"#3185c4"}
            style={{
              backgroundColor: "#d6d6d6",
              borderRadius: 8,
              padding: 4,
            }}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Baby Status</Text>

      {/* Daftar Bayi */}
      <ScrollView style={styles.deviceList}>
        {babyDevices.map((device) => {
          const category = getTemperatureCategory(device.temp);
          const iconName =
            category === "Normal"
              ? "checkmark-circle-outline"
              : "warning-outline";
          const iconColor = category === "Normal" ? "green" : "red";

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
                <Text style={{ color: "#6b6b6b" }}>{category}</Text>
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
