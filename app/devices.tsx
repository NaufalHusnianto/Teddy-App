import { Ionicons } from "@expo/vector-icons"; // Pastikan sudah install @expo/vector-icons
import { router, useLocalSearchParams } from "expo-router";
import { get, getDatabase, ref } from "firebase/database";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

type Device = {
  id: string;
  name: string;
  suhu: number;
};

export default function Devices() {
  const { babyId } = useLocalSearchParams();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]); // Menyimpan semua perangkat
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const database = getDatabase();
        const rootRef = ref(database, "/");
        const snapshot = await get(rootRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const deviceList: Device[] = [];

          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "object" && "suhu" in value) {
              deviceList.push({
                id: key,
                name: key.charAt(0).toUpperCase() + key.slice(1),
                suhu: value.suhu,
              });
            }
          });

          setDevices(deviceList);
          setAllDevices(deviceList); // Simpan semua perangkat untuk pencarian
        } else {
          console.log("No devices found");
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    fetchDevices();
  }, []);

  // Filter perangkat berdasarkan pencarian
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setDevices(allDevices);
    } else {
      const filtered = allDevices.filter(
        (device) =>
          device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          device.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDevices(filtered);
    }
  }, [searchQuery, allDevices]);

  const handleSelectDevice = async (deviceId: string) => {
    try {
      await updateDoc(doc(db, "babies", String(babyId)), {
        device: deviceId,
      });
      Alert.alert("Success", "Device connected successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to connect device");
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pilih Perangkat</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari perangkat..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery !== "" && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {devices.length === 0 ? (
        <Text style={styles.noDevicesText}>
          {searchQuery.trim() === ""
            ? "Tidak ada perangkat yang ditemukan"
            : "Perangkat tidak ditemukan"}
        </Text>
      ) : (
        devices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={[
              styles.deviceItem,
              selectedDevice === device.id && styles.selectedDevice,
            ]}
            onPress={() => handleSelectDevice(device.id)}
          >
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceId}>ID: {device.id}</Text>
            <Text style={styles.deviceSuhu}>Suhu: {device.suhu}°C</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>Batal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  searchIcon: {
    marginRight: 5,
  },
  clearButton: {
    padding: 5,
  },
  deviceItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedDevice: {
    borderColor: "#3185c4",
    backgroundColor: "#e6f2ff",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deviceId: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  deviceSuhu: {
    fontSize: 14,
    marginTop: 8,
    color: "#333",
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#ff4d4d",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noDevicesText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});
