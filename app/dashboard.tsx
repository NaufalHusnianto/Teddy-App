import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { getDatabase, onValue, ref } from "firebase/database";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
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
import { startBackgroundTask } from "./utils/backgroundTask";

export default function Dashboard() {
  const { user } = useAuth();
  const [babyDevices, setBabyDevices] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBaby, setNewBaby] = useState({ name: "", age: "" });
  const prevDevicesRef = useRef<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // console.log(babyDevices);

  // useEffect(() => {
  //   if (user) {
  //     AsyncStorage.setItem("user", JSON.stringify(user));
  //     startBackgroundTask(); // ✅ Start once
  //     console.log("User logged in");
  //   } else {
  //     console.log("User not logged in");
  //   }
  // }, [user]);

  useEffect(() => {
    startBackgroundTask();
  }, []);

  useEffect(() => {
    if (!user) return;

    const dbRealtime = getDatabase();
    const q = query(collection(db, "babies"), where("userId", "==", user.uid));

    const unsubscribeFirestore = onSnapshot(q, async (snapshot) => {
      const babiesRaw = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // console.log("babyraw", babiesRaw);

      // Bersihkan subscription sebelumnya
      prevDevicesRef.current.forEach((baby) => {
        if (baby._realtimeUnsub) {
          baby._realtimeUnsub();
        }
      });

      const babiesWithTemp: any[] = [];
      const tempSubscriptions: (() => void)[] = [];

      const handleTemperatureChange = async (
        baby: any,
        tempValue: number,
        prevTemp: number | null
      ) => {
        const timestamp = Date.now();

        if (
          prevTemp !== null &&
          getTemperatureCategory(prevTemp) !== getTemperatureCategory(tempValue)
        ) {
          const kategoriBaru = getTemperatureCategory(tempValue);

          const newNotification = {
            babyId: baby.id,
            babyName: baby.name,
            category: kategoriBaru,
            temp: tempValue,
            userId: user.uid,
            createdAt: new Date(timestamp).toISOString(),
          };

          try {
            await saveNotificationToAsyncStorage(newNotification);
            // console.log("Notifikasi tersimpan:", baby.name, kategoriBaru);
          } catch (err) {
            console.error("Gagal menyimpan notifikasi ke AsyncStorage", err);
          }
        }

        // ✅ Simpan history suhu setiap kali berubah (terlepas dari kategorinya)
        await saveTemperatureHistory({
          babyId: baby.id,
          temp: tempValue,
          timestamp,
        });
      };

      // Buat promise untuk semua subscription realtime
      const subscriptionPromises = babiesRaw.map((baby) => {
        return new Promise<void>((resolve) => {
          const deviceName = baby.device;
          if (!deviceName) {
            babiesWithTemp.push({
              ...baby,
              temp: 0,
              _realtimeUnsub: () => {},
            });
            return resolve();
          }

          const tempRef = ref(dbRealtime, `${deviceName}/suhu`);

          const unsubscribeRealtime = onValue(tempRef, (snapshot) => {
            const tempValue = snapshot.exists() ? snapshot.val() : null;
            const currentTemp = tempValue ?? 0;

            // Cari bayi di state sebelumnya untuk mendapatkan suhu sebelumnya
            const prevBaby = prevDevicesRef.current.find(
              (d) => d.id === baby.id
            );
            const prevTemp = prevBaby?.temp ?? null;

            // Handle perubahan suhu
            handleTemperatureChange(baby, currentTemp, prevTemp);

            // Update data bayi
            const babyIndex = babiesWithTemp.findIndex((d) => d.id === baby.id);
            if (babyIndex >= 0) {
              babiesWithTemp[babyIndex].temp = currentTemp;
            } else {
              babiesWithTemp.push({
                ...baby,
                temp: currentTemp,
                _realtimeUnsub: unsubscribeRealtime,
              });
            }

            // Update state
            setBabyDevices([...babiesWithTemp]);
            prevDevicesRef.current = [...babiesWithTemp];
          });

          tempSubscriptions.push(unsubscribeRealtime);
          resolve();
        });
      });

      Promise.all(subscriptionPromises).then(() => {
        setBabyDevices([...babiesWithTemp]);
        prevDevicesRef.current = [...babiesWithTemp];
      });
    });

    return () => {
      unsubscribeFirestore();
      prevDevicesRef.current.forEach((baby) => {
        if (baby._realtimeUnsub) baby._realtimeUnsub();
      });
      prevDevicesRef.current = [];
    };
  }, [user, refreshTrigger]);

  const saveNotificationToAsyncStorage = async (notification: any) => {
    try {
      const existingNotificationsJson = await AsyncStorage.getItem(
        "notifications"
      );
      const existingNotifications = existingNotificationsJson
        ? JSON.parse(existingNotificationsJson)
        : [];
      const updatedNotifications = [notification, ...existingNotifications];
      await AsyncStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
      console.log("Notifikasi tersimpan di AsyncStorage:", notification);
    } catch (error) {
      console.error("Gagal menyimpan notifikasi di AsyncStorage:", error);
    }
  };

  const saveTemperatureHistory = async (entry: {
    babyId: string;
    temp: number;
    timestamp: number;
  }) => {
    try {
      const historyJson = await AsyncStorage.getItem("temperatureHistory");
      const history = historyJson ? JSON.parse(historyJson) : [];

      // Simpan entri baru
      history.push(entry);

      await AsyncStorage.setItem("temperatureHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Gagal menyimpan history suhu:", error);
    }
  };

  const handleAddBaby = async () => {
    if (!newBaby.name || !newBaby.age) return;

    await addDoc(collection(db, "babies"), {
      name: newBaby.name,
      age: newBaby.age,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    setNewBaby({ name: "", age: "" });
    setModalVisible(false);
  };

  const getTemperatureCategory = (temp: number) => {
    if (temp > 40.6) return "Demam Sangat Tinggi";
    if (temp >= 40.0) return "Demam Tinggi";
    if (temp >= 39.0) return "Demam Sedang";
    if (temp >= 37.6) return "Demam Ringan";
    if (temp >= 36.4 && temp <= 37.5) return "Suhu Normal";
    return "Suhu Terlalu Rendah";
  };

  const getCardColor = (temp: number) => {
    const category = getTemperatureCategory(temp);
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

      <View style={styles.statusHeader}>
        <Text style={styles.title}>Baby Status</Text>
        <TouchableOpacity
          onPress={() => setRefreshTrigger((prev) => prev + 1)}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#3185c4" />
        </TouchableOpacity>
      </View>

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

      {/* Modal dan tombol tambah bayi sama seperti sebelumnya */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

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
              placeholderTextColor={"#aaa"}
              style={styles.input}
              value={newBaby.name}
              onChangeText={(text) => setNewBaby({ ...newBaby, name: text })}
            />
            <TextInput
              placeholder="Umur (bulan)"
              placeholderTextColor={"#aaa"}
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

// Styles sama seperti sebelumnya (tidak saya ulang)

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
  statusHeader: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshButton: {
    backgroundColor: "#d6d6d6",
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
    marginRight: 20,
  },

  accountButton: {
    position: "absolute",
    top: 20,
    right: 20,
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
    backgroundColor: "#0033ff",
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 16,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    backgroundColor: "#0033ff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
});
