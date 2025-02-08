import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { useNavigation } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation" // Make sure this path is correct

type PresidentDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, "PresidentDashboard">

type Props = {
  navigation: any; // We'll type this properly later
};

export default function PresidentDashboardScreen({ navigation }: Props) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  if (!fontsLoaded) {
    return null
  }

  const handleApproveRequests = () => {
    navigation.navigate("KMemberApproval")
  }

  const dashboardItems = [
    {
      title: "Manage Members",
      icon: "people",
      onPress: () => navigation.navigate('PresidentStack', { 
        screen: 'ApprovedMembers' 
      }),
      color: "#8B5CF6"
    },
    {
      title: "Approve Requests",
      icon: "clipboard",
      onPress: handleApproveRequests,
      color: "#8B5CF6"
    },
    {
      title: "View Reports",
      icon: "bar-chart",
      onPress: () => navigation.navigate("ViewReports"),
      color: "#8B5CF6"
    },
    {
      title: "Schedule Meetings",
      icon: "calendar",
      onPress: () => navigation.navigate('PresidentStack', { 
        screen: 'ScheduleMeeting' 
      }),
      color: "#8B5CF6"
    },
    {
      title: "Add Notice/News",
      icon: "newspaper" as keyof typeof Ionicons.glyphMap,
      onPress: () => navigation.navigate("PresidentStack", 
        { screen: "AddNoticeNews" }),

      color: "#8B5CF6"
    },
  ];

  return (
    <LinearGradient
      colors={["#8B5CF6", "#EC4899"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>President Dashboard</Text>
          <View style={styles.cardContainer}>
            {dashboardItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.card} onPress={item.onPress}>
                <Ionicons name={item.icon + "-outline"} size={40} color={item.color} />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "white",
    textAlign: "center",
    marginBottom: 30,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
})

