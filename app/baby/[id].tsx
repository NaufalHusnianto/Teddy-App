import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

  const getTemperatureCategory = (temp: number) => {
    if (temp > 40.6) return "Demam Sangat Tinggi";
    if (temp >= 40.0) return "Demam Tinggi";
    if (temp >= 39.0) return "Demam Sedang";
    if (temp >= 37.6) return "Demam Ringan";
    if (temp >= 36.4 && temp <= 37.5) return "Normal";
    return "Belum Terdeteksi";
  };

  const getTempColor = (temp: number) => {
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

  const tempColor = getTempColor(baby.temp);

  const data = [{ value: 15 }, { value: 30 }, { value: 26 }, { value: 40 }];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Suhu Bayi */}
      <View style={[styles.circle, { borderColor: tempColor }]}>
        <Text style={styles.temp}>{baby.temp}°C</Text>
      </View>

      <Text style={[styles.status, { backgroundColor: tempColor + "33" }]}>
        <Ionicons name="thermometer" size={20} color={tempColor} />{" "}
        {getTemperatureCategory(baby.temp)}
      </Text>

      {/* Status Perangkat */}
      <View style={styles.deviceContainer}>
        <View>
          <Text style={styles.deviceLabel}>Device Connected:</Text>
          <Text style={styles.deviceValue}>{baby.device || "None"}</Text>
        </View>
        <Ionicons name="sync-circle" size={20} color="green" />
      </View>

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
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    padding: 14,
    borderRadius: 8,
    textAlign: "center",
    width: "100%",
    marginBottom: 20,
  },
  deviceContainer: {
    width: "100%",
    backgroundColor: "#d6ffdd",
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  deviceLabel: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  deviceValue: {
    fontSize: 14,
    color: "#aaa",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: "100%",
    marginBottom: 20,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 40,
    resizeMode: "cover",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  info: {
    fontSize: 14,
  },
  editCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  chartContainer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: "100%",
    marginBottom: 20,
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
