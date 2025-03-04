import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { TOAST_DURATION } from "../components/SonnerToast";
import { Ionicons } from "@expo/vector-icons";

export default function WeeklyDueSetupScreen({ navigation }) {
  const [weeklyAmount, setWeeklyAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentAmount();
  }, []);

  const fetchCurrentAmount = async () => {
    try {
      const db = getFirestore();
      const settingsDoc = await getDoc(doc(db, "weeklyDueSettings", "config"));
      if (settingsDoc.exists()) {
        setWeeklyAmount(settingsDoc.data().amount.toString());
      }
    } catch (error) {
      console.error("Error fetching current amount:", error);
    }
  };

  const handleSaveAmount = async () => {
    if (!weeklyAmount || isNaN(Number(weeklyAmount))) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid amount",
        visibilityTime: TOAST_DURATION,
      });
      return;
    }

    try {
      setIsLoading(true);
      const db = getFirestore();

      await setDoc(doc(db, "weeklyDueSettings", "config"), {
        amount: Number(weeklyAmount),
        updatedAt: new Date(),
        startDate: new Date("2024-02-01"), // First week of February
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Weekly due amount has been set",
        visibilityTime: TOAST_DURATION,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error saving amount:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save amount",
        visibilityTime: TOAST_DURATION,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Weekly Due</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="cash-outline" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.title}>Set Weekly Due Amount</Text>
          <Text style={styles.description}>
            This amount will be collected from all members on a weekly basis.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weekly Due Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                value={weeklyAmount}
                onChangeText={setWeeklyAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveAmount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.saveButtonText}>Save Amount</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F3F4F6",
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 20,
    color: "#1F2937",
    padding: 16,
  },
  saveButton: {
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  saveButtonDisabled: {
    backgroundColor: "#C4B5FD",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    backgroundColor: "#EDE9FE",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currencySymbol: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#6B7280",
    paddingLeft: 16,
    paddingRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
