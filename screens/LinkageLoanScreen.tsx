import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

type LinkageLoanScreenProps = {
  navigation: any;
};

const { width } = Dimensions.get("window");

const steps = [
  {
    title: "Eligibility Check",
    description:
      "Ensure your unit meets the minimum requirements:\n• Active for at least 6 months\n• Regular savings record\n• Good loan repayment history\n• Minimum 80% meeting attendance",
    icon: "checkmark-circle-outline",
    color: "#8B5CF6",
    level: "Step 1",
  },
  {
    title: "Documentation",
    description:
      "Prepare the following documents:\n• Unit registration certificate\n• Bank account statements\n• Meeting minutes approving loan\n• Members' loan applications\n• Grading certificate",
    icon: "document-text-outline",
    color: "#EC4899",
    level: "Step 2",
  },
  {
    title: "Bank Selection",
    description:
      "Choose a participating bank:\n• Verify bank's Kudumbashree linkage program\n• Compare interest rates\n• Check processing time\n• Review repayment terms",
    icon: "business-outline",
    color: "#10B981",
    level: "Step 3",
  },
  {
    title: "Application Process",
    description:
      "Submit application through proper channel:\n• Fill unit application form\n• Attach all required documents\n• Get CDS chairperson's recommendation\n• Submit to bank branch",
    icon: "create-outline",
    color: "#F59E0B",
    level: "Step 4",
  },
  {
    title: "Follow Up",
    description:
      "Track your application:\n• Regular follow-up with bank\n• Respond to queries promptly\n• Attend bank interviews if required\n• Complete additional formalities",
    icon: "time-outline",
    color: "#6366F1",
    level: "Step 5",
  },
];

const LinkageLoanScreen: React.FC<LinkageLoanScreenProps> = ({
  navigation,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const showAssistanceInfo = () => {
    Alert.alert(
      "Need Assistance?",
      "Contact your CDS Chairperson or reach out to:\n\nKudumbashree Help Desk\nPhone: 1800-425-2742\nEmail: help@kudumbashree.org\nWorking Hours: 10:00 AM - 5:00 PM",
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Linkage Loan</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {steps.map((step, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => toggleStep(index)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[
                completedSteps.includes(index)
                  ? `${step.color}15`
                  : "rgba(139, 92, 246, 0.08)",
                completedSteps.includes(index)
                  ? `${step.color}05`
                  : "rgba(236, 72, 153, 0.08)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.stepCard, { borderLeftColor: step.color }]}
            >
              <View style={styles.stepHeader}>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: `${step.color}15` },
                  ]}
                >
                  <Text style={[styles.levelText, { color: step.color }]}>
                    {step.level}
                  </Text>
                </View>
                <View
                  style={[
                    styles.stepIconContainer,
                    { backgroundColor: `${step.color}15` },
                  ]}
                >
                  {completedSteps.includes(index) ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={step.color}
                    />
                  ) : (
                    <Ionicons name={step.icon} size={24} color={step.color} />
                  )}
                </View>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.assistanceButton}
          onPress={showAssistanceInfo}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assistanceGradient}
          >
            <Ionicons name="help-circle" size={24} color="#fff" />
            <Text style={styles.assistanceText}>Need Assistance?</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerGradient: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom:80,
  },
  stepCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 3,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  stepTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 8,
  },
  stepDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  assistanceButton: {
    margin: 16,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  assistanceGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  assistanceText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});

export default LinkageLoanScreen;
