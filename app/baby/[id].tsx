import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { getDatabase, off, onValue, ref } from "firebase/database";
import { deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { db } from "../../firebaseConfig";

export default function BabyDetail() {
  const { id } = useLocalSearchParams();
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [deviceTemp, setDeviceTemp] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "babies", String(id)), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBaby({ id: docSnap.id, ...data });
        setEditName(data.name || "");
        setEditAge(String(data.age || ""));
      } else {
        setBaby(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!baby?.device) {
      setDeviceTemp(null);
      return;
    }

    const dbRealtime = getDatabase();
    const deviceTempRef = ref(dbRealtime, `/${baby.device}/suhu`);

    const unsubscribe = onValue(deviceTempRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const tempNumber = typeof val === "number" ? val : Number(val);
        setDeviceTemp(isNaN(tempNumber) ? null : tempNumber);
      } else {
        setDeviceTemp(null);
      }
    });

    return () => {
      off(deviceTempRef);
    };
  }, [baby?.device]);

  // Perbaikan: menerima number | null, handle null
  const getTemperatureCategory = (temp: number | null) => {
    if (temp === null) return "Belum Terdeteksi";
    if (temp > 40.6) return "Demam Sangat Tinggi";
    if (temp >= 40.0) return "Demam Tinggi";
    if (temp >= 39.0) return "Demam Sedang";
    if (temp >= 37.6) return "Demam Ringan";
    if (temp >= 36.4 && temp <= 37.5) return "Normal";
    return "Belum Terdeteksi";
  };

  // Perbaikan: menerima number | null, handle null
  const getTempColor = (temp: number | null) => {
    if (temp === null) return "#e0e0e0";
    if (temp > 40.6) return "#ff4d4d";
    if (temp >= 40.0) return "#ff4d4d";
    if (temp >= 39.0) return "#ffb347";
    if (temp >= 37.6) return "#ffb347";
    if (temp >= 36.4 && temp <= 37.5) return "#2a9d8f";
    return "#e0e0e0";
  };

  const saveEdit = async () => {
    if (!editName || !editAge) {
      Alert.alert("Error", "Semua kolom harus diisi.");
      return;
    }

    const ageNum = Number(editAge);

    if (isNaN(ageNum) || ageNum <= 0) {
      Alert.alert("Error", "Umur harus berupa angka positif.");
      return;
    }

    try {
      await updateDoc(doc(db, "babies", String(id)), {
        name: editName,
        age: ageNum,
      });
      Alert.alert("Sukses", "Data bayi berhasil diperbarui.");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memperbarui data bayi.");
      console.error(error);
    }
  };

  const deleteData = () => {
    Alert.alert(
      "Konfirmasi",
      "Apakah Anda yakin ingin menghapus data bayi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "babies", String(id)));
              Alert.alert("Sukses", "Data bayi berhasil dihapus.");
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Gagal menghapus data bayi.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3185c4" />
      </View>
    );
  }

  if (!baby) {
    return (
      <View style={styles.center}>
        <Text>Bayi tidak ditemukan.</Text>
      </View>
    );
  }

  const tempColor = getTempColor(deviceTemp);

  const data = [{ value: 15 }, { value: 30 }, { value: 26 }, { value: 40 }];

  const handleDevicePress = () => {
    router.push({
      pathname: "/devices",
      params: { babyId: String(id) },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Suhu Bayi */}
      <View style={[styles.circle, { borderColor: tempColor }]}>
        <Text style={styles.temp}>
          {deviceTemp !== null ? `${deviceTemp}°C` : "–"}
        </Text>
      </View>

      <Text style={[styles.status, { backgroundColor: tempColor + "33" }]}>
        <Ionicons name="thermometer" size={20} color={tempColor} />{" "}
        {getTemperatureCategory(deviceTemp)}
      </Text>

      {/* Status Perangkat */}
      <TouchableOpacity
        style={styles.deviceContainer}
        onPress={handleDevicePress}
      >
        <View>
          <Text style={styles.deviceLabel}>Device Connected:</Text>
          <Text style={styles.deviceValue}>{baby.device || "None"}</Text>
        </View>
        <Ionicons name="sync-circle" size={20} color="green" />
      </TouchableOpacity>

      {/* Info Bayi */}
      {!isEditing ? (
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => setIsEditing(true)}
        >
          <Image
            source={require("../../assets/images/baby-boy.png")}
            style={styles.image}
          />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.name}>{baby.name}</Text>
            <Text style={styles.info}>Umur: {baby.age} bulan</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.editCard}>
          <Text style={styles.label}>Nama Bayi</Text>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Nama Bayi"
          />

          <Text style={styles.label}>Umur (bulan)</Text>
          <TextInput
            style={styles.input}
            value={editAge}
            onChangeText={setEditAge}
            keyboardType="numeric"
            placeholder="Umur dalam bulan"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#2a9d8f" }]}
              onPress={saveEdit}
            >
              <Text style={styles.buttonText}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#888" }]}
              onPress={() => {
                setIsEditing(false);
                setEditName(baby.name);
                setEditAge(String(baby.age));
              }}
            >
              <Text style={styles.buttonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          color="#3185c4"
          dataPointsColor1="red"
          height={150}
        />
        <Text style={styles.chartLabel}>Riwayat Suhu</Text>
      </View>

      {/* Tombol Hapus */}
      <TouchableOpacity style={styles.deleteButton} onPress={deleteData}>
        <Text style={styles.deleteText}>Hapus Data Bayi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#f4f6f8",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  temp: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    color: "#333",
    fontWeight: "600",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  deviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    width: "100%",
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  deviceLabel: {
    fontSize: 16,
    color: "#444",
  },
  deviceValue: {
    fontWeight: "700",
    fontSize: 18,
    color: "#2a9d8f",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },
  info: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  editCard: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  chartContainer: {
    width: "100%",
    marginBottom: 20,
  },
  chartLabel: {
    textAlign: "center",
    marginTop: 8,
    color: "#555",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#e63946",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
