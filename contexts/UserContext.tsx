import React, { createContext, useState, useContext, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserContextType {
  userId: string | null;
  userDetails: any | null;
  loading: boolean;
  updateUser: (id: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
  userId: null,
  userDetails: null,
  loading: true,
  updateUser: async () => {},
});

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user data on app start
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "K-member", storedUserId));

          if (userDoc.exists()) {
            setUserId(storedUserId);
            setUserDetails(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const updateUser = async (id: string) => {
    try {
      setLoading(true);
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "K-member", id));

      if (userDoc.exists()) {
        await AsyncStorage.setItem("userId", id);
        setUserId(id);
        setUserDetails(userDoc.data());
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ userId, userDetails, loading, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
