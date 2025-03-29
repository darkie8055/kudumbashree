import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

const regulations = [
  {
    title: "Membership Eligibility",
    icon: "people",
    items: [
      "Only adult women can become members",
      "Limited to one member per family",
      "Must be a resident of the local area",
      "Regular attendance in weekly meetings required",
      "Must participate in thrift and credit activities",
    ],
  },
  {
    title: "Financial Guidelines",
    icon: "cash",
    items: [
      "Regular weekly savings is mandatory",
      "Maintain proper records of all transactions",
      "Internal lending allowed as per group decision",
      "Interest rates as per government guidelines",
      "Timely repayment of all loans",
    ],
  },
  {
    title: "Meeting Rules",
    icon: "calendar",
    items: [
      "Weekly meetings are mandatory",
      "Minimum 75% attendance required",
      "Proper meeting minutes must be recorded",
      "Democratic decision making process",
      "Inform in advance for absence",
    ],
  },
  {
    title: "Administrative Rules",
    icon: "document-text",
    items: [
      "Maintain all required registers",
      "Regular auditing of accounts",
      "Follow proper election procedures",
      "Update member information regularly",
      "Comply with government guidelines",
    ],
  },
];

export default function RulesAndRegulationsScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rules & Guidelines</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {regulations.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name={section.icon} size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.rulesList}>
              {section.items.map((rule, ruleIndex) => (
                <View key={ruleIndex} style={styles.ruleItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.learnMoreContainer}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.1)", "rgba(192, 38, 211, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.learnMoreWrapper}
          >
            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={() =>
                Linking.openURL("https://www.kudumbashree.org/pages/7")
              }
            >
              <LinearGradient
                colors={["#7C3AED", "#C026D3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.learnMoreGradient}
              >
                <View style={styles.learnMoreContent}>
                  <View style={styles.learnMoreTextContainer}>
                    <Text style={styles.learnMoreTitle}>
                      Official Guidelines
                    </Text>
                    <Text style={styles.learnMoreSubtitle}>
                      Visit Kudumbashree website for detailed information
                    </Text>
                  </View>
                  <View style={styles.learnMoreIconContainer}>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={32}
                      color="#fff"
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  rulesList: {
    paddingLeft: 8,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
    marginRight: 12,
  },
  ruleText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
  learnMoreContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  learnMoreWrapper: {
    borderRadius: 16,
    padding: 1,
  },
  learnMoreButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  learnMoreGradient: {
    borderRadius: 16,
  },
  learnMoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  learnMoreTextContainer: {
    flex: 1,
  },
  learnMoreTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
  },
  learnMoreSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  learnMoreIconContainer: {
    marginLeft: 12,
  },
});
