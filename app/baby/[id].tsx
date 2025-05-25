import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import { shareAsync } from "expo-sharing";
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

  const [temperatureHistory, setTemperatureHistory] = useState<any[]>([]);

  const [selectedPrinter, setSelectedPrinter] = useState();

  const generateHistoryHTML = () => {
    return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #3185c4; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .baby-info { margin-bottom: 20px; }
          .status { 
            padding: 5px 10px; 
            border-radius: 5px; 
            display: inline-block;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Record Suhu Teddy</h1>
          <div>
            <p>Tanggal: ${new Date().toLocaleDateString()}</p>
            <p>Jam: ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div class="baby-info">
          <h2>Informasi Bayi</h2>
          <p><strong>Nama:</strong> ${baby?.name || "-"}</p>
          <p><strong>Umur:</strong> ${baby?.age || "-"} bulan</p>
          <p><strong>Suhu Terakhir:</strong> ${
            deviceTemp !== null ? `${deviceTemp}°C` : "-"
          }</p>
          <div class="status" style="background-color: ${tempColor}33; color: #333;">
            Status: ${getTemperatureCategory(deviceTemp)}
          </div>
        </div>
        
        <h2>Riwayat Suhu 24 Jam Terakhir</h2>
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Suhu (°C)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${temperatureHistory
              .map(
                (entry) => `
              <tr>
                <td>${entry.label}</td>
                <td>${entry.value}</td>
                <td>${getTemperatureCategory(entry.value)}</td>
              </tr>
            `
              )
              .join("")}
            ${
              temperatureHistory.length === 0
                ? `
              <tr>
                <td colspan="3" style="text-align: center;">Tidak ada data suhu</td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
          Dokumen ini dicetak secara otomatis dari aplikasi Baby Temperature Monitor
        </div>
      </body>
    </html>
    `;
  };

  const print = async () => {
    try {
      const historyHtml = generateHistoryHTML();
      await Print.printAsync({
        html: historyHtml,
        printerUrl: selectedPrinter?.url,
      });
    } catch (error) {
      console.error("Failed to print:", error);
      Alert.alert("Error", "Gagal mencetak dokumen");
    }
  };

  const printToFile = async () => {
    try {
      const historyHtml = generateHistoryHTML();
      const { uri } = await Print.printToFileAsync({
        html: historyHtml,
        width: 595, // A4 width in pixels at 72dpi
        height: 842, // A4 height in pixels at 72dpi
      });
      console.log("File has been saved to:", uri);
      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      Alert.alert("Error", "Gagal membuat dokumen PDF");
    }
  };

  const selectPrinter = async () => {
    const printer = await Print.selectPrinterAsync(); // iOS only
    setSelectedPrinter(printer);
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyJson = await AsyncStorage.getItem("temperatureHistory");
        const allHistory = historyJson ? JSON.parse(historyJson) : [];

        // Filter history for current baby and sort by timestamp
        const babyHistory = allHistory
          .filter((entry: any) => entry.babyId === id)
          .sort((a: any, b: any) => a.timestamp - b.timestamp)
          .map((entry: any) => ({
            value: entry.temp,
            label: new Date(entry.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date(entry.timestamp),
            dataPointText: `${entry.temp}°C`,
            labelTextStyle: { color: "gray", width: 60 },
          }));

        setTemperatureHistory(babyHistory);
      } catch (error) {
        console.error("Failed to load temperature history:", error);
      }
    };

    loadHistory();
  }, [id]);

  // Format chart data
  const chartData =
    temperatureHistory.length > 0
      ? temperatureHistory
      : [{ value: 0, label: "No data" }];

  // Calculate min/max for y-axis
  const minTemp =
    temperatureHistory.length > 0
      ? Math.min(...temperatureHistory.map((item) => item.value)) - 1
      : 0;
  const maxTemp =
    temperatureHistory.length > 0
      ? Math.max(...temperatureHistory.map((item) => item.value)) + 1
      : 40;

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
    return "Suhu Terlalu Rendah";
  };

  // Perbaikan: menerima number | null, handle null
  const getTempColor = (temp: number | null) => {
    if (temp === null) return "#e0e0e0";
    if (temp > 40.6) return "#ff4d4d";
    if (temp >= 40.0) return "#ff4d4d";
    if (temp >= 39.0) return "#ffb347";
    if (temp >= 37.6) return "#ffb347";
    if (temp >= 36.4 && temp <= 37.5) return "#2a9d8f";
    return "#ff4d4d";
  };

  const resetTemperatureHistory = async () => {
    Alert.alert(
      "Reset Riwayat Suhu",
      "Apakah Anda yakin ingin mereset riwayat suhu?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Reset",
          onPress: async () => {
            try {
              const historyJson = await AsyncStorage.getItem(
                "temperatureHistory"
              );
              const allHistory = historyJson ? JSON.parse(historyJson) : [];

              const filteredHistory = allHistory.filter(
                (entry: any) => entry.babyId !== id
              );
              await AsyncStorage.setItem(
                "temperatureHistory",
                JSON.stringify(filteredHistory)
              );
              setTemperatureHistory([]);
              Alert.alert("Sukses", "Riwayat suhu telah direset.");
            } catch (error) {
              console.error("Gagal mereset riwayat:", error);
              Alert.alert("Error", "Gagal mereset riwayat.");
            }
          },
        },
      ]
    );
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

      <TouchableOpacity style={styles.chartContainer}>
        <LineChart
          data={chartData}
          color="#3185c4"
          dataPointsColor="#3185c4"
          height={200}
          width={300}
          yAxisColor="#3185c4"
          xAxisColor="#3185c4"
          noOfSections={5}
          maxValue={maxTemp}
          minValue={minTemp}
          spacing={40}
          initialSpacing={10}
          yAxisTextStyle={{ color: "gray" }}
          xAxisLabelTextStyle={{ color: "gray", width: 60 }}
          showReferenceLine1
          referenceLine1Position={37.5}
          referenceLine1Config={{
            color: "red",
            dashWidth: 2,
            dashGap: 3,
          }}
          referenceLine1Label="Normal"
          showReferenceLine2
          referenceLine2Position={36.5}
          referenceLine2Config={{
            color: "red",
            dashWidth: 2,
            dashGap: 3,
          }}
          curved
          isAnimated
        />
        <Text style={styles.chartLabel}>Riwayat Suhu 24 Jam Terakhir</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={resetTemperatureHistory}
      >
        <Text style={styles.buttonText}>Reset History</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={printToFile} style={styles.printerButton}>
        <Text style={styles.buttonText}>Cetak Laporan</Text>
      </TouchableOpacity>

      {/* Tombol Hapus */}
      <TouchableOpacity style={styles.deleteButton} onPress={deleteData}>
        <Text style={styles.buttonText}>Hapus Data Bayi</Text>
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
    marginVertical: 32,
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
  spacer: {
    height: 20,
  },
  printer: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  printerButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginVertical: 15,
  },
});
