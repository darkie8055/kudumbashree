import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";

type LawsAndRegulationsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LawsAndRegulations"
>;

interface Props {
  navigation: LawsAndRegulationsScreenNavigationProp;
}

const regulations = [
  {
    title: "Membership Eligibility",
    rules: [
      "Only women aged 18 and above can become members",
      "Limited to one member per household",
      "Must be a resident of the local area",
      "Should belong to a BPL (Below Poverty Line) family",
      "Cannot be a member of multiple NHGs simultaneously"
    ]
  },
  {
    title: "Financial Rules",
    rules: [
      "Regular weekly savings is mandatory",
      "Minimum savings amount: ₹10 per week",
      "Internal lending among members with 12% annual interest",
      "Maintain proper books of accounts",
      "Regular auditing of accounts"
    ]
  },
  {
    title: "Meeting Guidelines",
    rules: [
      "Weekly meetings are mandatory",
      "Minimum 75% attendance required",
      "Meetings should follow prescribed agenda",
      "Proper minutes must be recorded",
      "Democratic decision making process"
    ]
  },
  {
    title: "Organizational Structure",
    rules: [
      "NHG (Neighborhood Groups) - Base level",
      "ADS (Area Development Society) - Ward level",
      "CDS (Community Development Society) - Panchayat/Municipality level",
      "Regular elections for office bearers",
      "Term limits for leadership positions"
    ]
  },
  {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="book" size={24} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Laws & Regulations</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {regulations.map((section, index) => (
          <LinearGradient
            key={index}
            colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            style={styles.sectionContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.rules.map((rule, ruleIndex) => (
              <View key={ruleIndex} style={styles.ruleContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </LinearGradient>
        ))}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    height: 48,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#fff",
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#7C3AED",
    marginBottom: 12,
  },
  ruleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 8,
  },
  ruleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

