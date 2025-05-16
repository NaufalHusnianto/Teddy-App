// context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebaseConfig";

const AuthContext = createContext({
  user: null as User | null,
  loading: true,
  authLoading: false,
  loginStart: () => {},
  loginEnd: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const loginStart = () => setAuthLoading(true);
  const loginEnd = () => setAuthLoading(false);

  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (e) {
        console.log("Failed to load stored user", e);
      }
    };

    checkStoredUser();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setAuthLoading(false);

      if (firebaseUser) {
        await AsyncStorage.setItem("user", JSON.stringify(firebaseUser));
      } else {
        await AsyncStorage.removeItem("user");
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, authLoading, loginStart, loginEnd, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
