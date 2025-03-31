import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ToastConfig } from "react-native-toast-message";

export const TOAST_DURATION = 1500;

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <LinearGradient
      colors={["rgba(139, 92, 246, 0.95)", "rgba(236, 72, 153, 0.95)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{text1}</Text>
          {text2 && <Text style={styles.message}>{text2}</Text>}
        </View>
      </View>
    </LinearGradient>
  ),

  error: ({ text1, text2 }) => (
    <View style={[styles.container, styles.errorContainer]}>
      <View style={styles.content}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{text1}</Text>
          {text2 && <Text style={styles.message}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    marginHorizontal: "5%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  errorContainer: {
    backgroundColor: "#ef4444",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  message: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
});
