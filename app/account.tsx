import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { updatePassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "./context/AuthContext";

export default function Account() {
  const { user, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <Redirect href="/login" />;
  }

  const confirmLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: handleLogout,
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          user.photoURL
            ? { uri: user.photoURL }
            : require("../assets/images/Icon-teddy.png")
        }
        style={styles.avatar}
      />
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.editBadge}
      >
        <Ionicons name="create-sharp" size={18} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.name}>{user.displayName || "No Name"}</Text>
      <Text style={styles.email}>{user.email || "No email"}</Text>

      {/* Menu Section */}
      <View style={styles.menuContainer}>
        {/* <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/account")}
        >
          <Ionicons name="settings" size={20} color="black" />
          <Text style={styles.menuText}>General</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="black"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/about")}
        >
          <Ionicons name="information-circle" size={20} color="black" />
          <Text style={styles.menuText}>About Us</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="black"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={confirmLogout} style={styles.logoutButton}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Logout</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Account</Text>

            <TextInput
              placeholder="New Display Name"
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              style={styles.input}
            />
            <TextInput
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                try {
                  setLoading(true);
                  if (user) {
                    if (newDisplayName !== user.displayName) {
                      await updateProfile(user, {
                        displayName: newDisplayName,
                      });
                    }
                    if (newPassword.length >= 6) {
                      await updatePassword(user, newPassword);
                    }
                    Alert.alert("Success", "Profile updated.");
                    setModalVisible(false);
                  }
                } catch (err) {
                  console.error(err);
                  Alert.alert("Error", "Failed to update account.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
    alignItems: "center",
    backgroundColor: "#f4f6f8",
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
    backgroundColor: "#3185c4",
  },
  editBadge: {
    position: "absolute",
    top: 220, // posisi tepat di bawah avatar
    right: "30%",
    backgroundColor: "#3185c4",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 1,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  menuContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: "auto",
    marginBottom: 50,
    padding: 12,
    borderRadius: 10,
    width: "60%",
    alignItems: "center",
    backgroundColor: "#fc8383",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "stretch",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#3185c4",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
  },
});
