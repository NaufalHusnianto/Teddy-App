import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { get, getDatabase, ref } from "firebase/database";
import { Alert, Platform, Text, TouchableOpacity } from "react-native";

// Task and Storage Keys
const TASK_NAME = "temperature-monitoring-task";
const HISTORY_KEY = "temperatureHistory";
const PREV_TEMP_KEY = "previousTemperatures";
const NOTIF_KEY = "notifications";

// Interfaces
interface Baby {
  id: string;
  name: string;
  device?: string;
  userId: string;
}

interface NotificationEntry {
  babyId: string;
  babyName: string;
  category: string;
  temp: number;
  userId: string;
  createdAt: string;
}

interface TempEntry {
  babyId: string;
  temp: number;
  category: string;
  timestamp: number;
}

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define Task
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    console.log("🛠️ Background task running");

    const babiesJson = await AsyncStorage.getItem("babies");
    if (!babiesJson) return BackgroundFetch.BackgroundFetchResult.NoData;

    const babies: Baby[] = JSON.parse(babiesJson);
    const prevTempsJson = await AsyncStorage.getItem(PREV_TEMP_KEY);
    const prevTemps = prevTempsJson ? JSON.parse(prevTempsJson) : {};

    const dbRealtime = getDatabase();

    const newNotifications: NotificationEntry[] = [];
    const newHistory: TempEntry[] = [];

    for (const baby of babies) {
      if (!baby.device) continue;

      const tempRef = ref(dbRealtime, `${baby.device}/suhu`);
      const snapshot = await get(tempRef);
      if (!snapshot.exists()) continue;

      const temp = Number(snapshot.val());
      if (isNaN(temp)) continue;

      const currentCategory = getCategory(temp);
      const previousCategory = prevTemps[baby.id]?.category || getCategory(0);

      // Simpan histori suhu setiap 15 menit
      newHistory.push({
        babyId: baby.id,
        temp,
        category: currentCategory,
        timestamp: Date.now(),
      });

      // Kirim notifikasi jika kategori berubah
      if (currentCategory !== previousCategory) {
        console.log(
          `🔔 ${baby.name} kategori berubah: ${previousCategory} ➡️ ${currentCategory}`
        );

        const notification: NotificationEntry = {
          babyId: baby.id,
          babyName: baby.name,
          category: currentCategory,
          temp,
          userId: baby.userId,
          createdAt: new Date().toISOString(),
        };

        newNotifications.push(notification);
        await sendLocalNotification(notification);
      }

      // Simpan kategori saat ini untuk perbandingan selanjutnya
      prevTemps[baby.id] = { temp, category: currentCategory };
    }

    // Simpan notifikasi ke storage
    if (newNotifications.length > 0) {
      const existingNotif = await AsyncStorage.getItem(NOTIF_KEY);
      const notifArray = existingNotif ? JSON.parse(existingNotif) : [];
      await AsyncStorage.setItem(
        NOTIF_KEY,
        JSON.stringify([...newNotifications, ...notifArray])
      );
    }

    // Simpan histori suhu setiap 15 menit
    if (newHistory.length > 0) {
      const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
      const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
      const maxEntries = 1000;
      const updatedHistory = [...newHistory, ...historyArray].slice(
        0,
        maxEntries
      );
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    }

    // Simpan suhu sebelumnya
    await AsyncStorage.setItem(PREV_TEMP_KEY, JSON.stringify(prevTemps));

    return newNotifications.length > 0 || newHistory.length > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error("❌ Error in background task:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register task
export async function startBackgroundTask() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("temperature-alerts", {
        name: "Temperature Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 30, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("✅ Background task registered");
    } else {
      console.log("ℹ️ Background task already registered");
    }
  } catch (err) {
    console.error("❌ Failed to start background task:", err);
  }
}

// Send local push
async function sendLocalNotification({
  babyName,
  temp,
  category,
}: NotificationEntry) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${babyName} - ${category}`,
        body: `Suhu saat ini ${temp}°C`,
        sound: true,
      },
      trigger: null,
      ...(Platform.OS === "android" && {
        android: {
          channelId: "temperature-alerts",
        },
      }),
    });
    console.log("📱 Local notification sent:", babyName, temp, category);
  } catch (err) {
    console.error("❌ Error sending notification:", err);
  }
}

// Helper: get temp category
function getCategory(temp: number): string {
  if (temp > 40.6) return "Demam Sangat Tinggi";
  if (temp >= 40.0) return "Demam Tinggi";
  if (temp >= 39.0) return "Demam Sedang";
  if (temp >= 37.6) return "Demam Ringan";
  if (temp >= 36.4 && temp <= 37.5) return "Suhu Normal";
  return "Suhu Terlalu Rendah";
}

// UI button test
export function TestNotificationButton() {
  const sendTestNotification = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        Alert.alert(
          "Izin Diperlukan",
          "Aplikasi perlu izin untuk mengirim notifikasi."
        );
        return;
      }
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("test-channel", {
        name: "Test Channel",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Notifikasi Uji Coba",
        body: "Ini adalah pesan notifikasi lokal!",
        sound: true,
      },
      trigger: null,
    });

    Alert.alert("Berhasil", "Notifikasi dikirim ke perangkat.");
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: "blue",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
      }}
      onPress={sendTestNotification}
    >
      <Text style={{ color: "#fff", fontWeight: "bold" }}>
        Test Notification
      </Text>
    </TouchableOpacity>
  );
}
