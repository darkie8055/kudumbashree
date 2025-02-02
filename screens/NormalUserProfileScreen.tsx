import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

export default function NormalUserProfileScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <LinearGradient
      colors={["#8B5CF6", "#EC4899"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userType}>Normal User</Text>
          </View>
          <View style={styles.infoContainer}>
            <InfoItem icon="call-outline" label="Phone" value="+1234567890" />
            <InfoItem icon="mail-outline" label="Email" value="johndoe@example.com" />
            <InfoItem icon="location-outline" label="Address" value="123 Main St, City, Country" />
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={24} color="white" style={styles.infoIcon} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 36,
    color: "#8B5CF6",
  },
  userName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "white",
    marginBottom: 5,
  },
  userType: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  infoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  infoValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "white",
  },
  editButton: {
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  editButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#8B5CF6",
  },
})

