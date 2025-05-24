import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "./context/AuthContext";

// Definisikan tipe notifikasi
type NotificationItem = {
  babyName: string;
  category: string;
  createdAt: string; // ISO date string
};

export default function Notification() {
  const { loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const storedData = await AsyncStorage.getItem("notifications");

      console.log("Notifikasi dari AsyncStorage:", storedData);
      if (storedData) {
        const parsedData: NotificationItem[] = JSON.parse(storedData);
        // Urutkan dari terbaru ke terlama berdasarkan waktu
        const sortedData = parsedData.sort(
          (a: NotificationItem, b: NotificationItem) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(sortedData);
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi dari AsyncStorage", error);
    }
  };

  const clearNotifications = async () => {
    try {
      await AsyncStorage.removeItem("notifications");
      setNotifications([]);
      Alert.alert("Berhasil", "Semua notifikasi telah dihapus.");
    } catch (error) {
      console.error("Gagal menghapus notifikasi", error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.card}>
      <Image
        source={require("../assets/images/baby-boy.png")}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.message}>
          <Text style={styles.bold}>{item.babyName}</Text> {item.category}
        </Text>
        <Text style={styles.subtitle}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  if (loading) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearButton} onPress={clearNotifications}>
        <Text style={styles.clearButtonText}>Clear Notifications</Text>
      </TouchableOpacity>

      <FlatList
        data={notifications}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 12, paddingTop: 10 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Tidak ada notifikasi.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f9ff",
    padding: 20,
    paddingTop: 40,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#ff5252",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 16,
  },
  message: {
    fontSize: 14,
    color: "#333",
  },
  bold: {
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: "#ff5252",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
