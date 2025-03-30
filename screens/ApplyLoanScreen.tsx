import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
  getFirestore,
  arrayUnion,
} from "firebase/firestore";
import { firebase } from "../firebase"; // Add this import
import * as Yup from "yup";
import { Formik, FormikHelpers } from "formik";
import { Picker } from "@react-native-picker/picker";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import { getAuth } from "firebase/auth";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

type ApplyLoanScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ApplyLoan"
>;

interface Props {
  navigation: ApplyLoanScreenNavigationProp;
  route: {
    params?: {
      phoneNumber: string;
    };
  };
}

// LoanApplication interface to match Firebase structure
interface LoanApplication {
  memberId: string;
  memberName: string;
  amount: number;
  purpose: string;
  repaymentPeriod: number;
  loanType: "personal" | "business" | "education" | "medical" | "housing";
  unitId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  references: string[];
}

// Update the UserData interface to match KMemberDetails
interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  unitName: string;
  unitNumber: string;
  status: string;
}

interface FormValues {
  amount: string;
  purpose: string;
  repaymentPeriod: string;
  loanType: "personal" | "business" | "education" | "medical" | "housing";
  references: string[];
}

export default function ApplyLoanScreen({ navigation, route }: Props) {
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const db = firebase; // Use firebase instance directly

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const validationSchema = Yup.object().shape({
    amount: Yup.number()
      .required("Loan amount is required")
      .positive("Amount must be positive")
      .max(50000, "Maximum loan amount is ₹50,000"),
    purpose: Yup.string()
      .required("Loan purpose is required")
      .min(10, "Please provide more details (minimum 10 characters)"),
    repaymentPeriod: Yup.number()
      .required("Repayment period is required")
      .min(1, "Minimum 1 month")
      .max(36, "Maximum 36 months"),
    loanType: Yup.string().required("Loan type is required"),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get phone number from route params
        const phoneNumber = route.params?.phoneNumber;

        if (!phoneNumber) {
          console.log("No phone number available");
          Alert.alert("Error", "Please login to apply for loan");
          navigation.navigate("Login");
          return;
        }

        console.log("Using phone number:", phoneNumber);

        const db = getFirestore();
        const userDocRef = doc(db, "K-member", phoneNumber);
        console.log("Fetching K-member document:", phoneNumber);

        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          console.log("Found user data:", JSON.stringify(data, null, 2));
          setUserData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: phoneNumber,
            unitName: data.unitName || "",
            unitNumber: data.unitNumber || "",
            status: data.status || "active",
          });
        } else {
          console.log("No user document found");
          Alert.alert(
            "Error",
            "Member data not found. Please ensure you're registered.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load member data");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [route.params?.phoneNumber]); // Add dependency

  // Update handleSubmit to use userData directly
  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>
  ) => {
    // Use debug phone number in debug mode
    if (!userData) {
      Alert.alert("Error", "Please login to submit application");
      navigation.navigate("Login");
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore();
      const unitId = `${userData.unitName}-${userData.unitNumber}`;

      const loanApplication: LoanApplication = {
        memberId: userData.phone,
        memberName: `${userData.firstName} ${userData.lastName}`.trim(),
        amount: parseFloat(values.amount),
        purpose: values.purpose.trim(),
        repaymentPeriod: parseInt(values.repaymentPeriod),
        loanType: values.loanType,
        unitId: unitId,
        status: "pending",
        createdAt: serverTimestamp(),
        references: values.references || [],
      };

      // Add to loanApplications collection
      const docRef = await addDoc(
        collection(db, "loanApplications"),
        loanApplication
      );

      // Update user's loan applications array
      await updateDoc(doc(db, "K-member", userData.phone), {
        loanApplications: arrayUnion(docRef.id),
      });

      Alert.alert("Success", "Loan application submitted successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      resetForm();
    } catch (error) {
      console.error("Error submitting loan application:", error);
      Alert.alert("Error", "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const fadeIn = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  // Update the component structure
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ExpoStatusBar style="dark" />
      <View style={styles.mainContainer}>
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
          <Text style={styles.headerTitle}>Apply for Loan</Text>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.formContainer, fadeIn]}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>Loan Details</Text>
                <Text style={styles.sectionSubtitle}>
                  Please fill in all required fields
                </Text>
                <Formik<FormValues>
                  initialValues={{
                    amount: "",
                    purpose: "",
                    repaymentPeriod: "12",
                    loanType: "personal",
                    references: [],
                  }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched,
                    setFieldValue,
                  }) => (
                    <View style={styles.formContent}>
                      <Text style={styles.fieldLabel}>Loan Type</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={values.loanType}
                          style={styles.picker}
                          onValueChange={(itemValue) =>
                            setFieldValue("loanType", itemValue)
                          }
                          dropdownIconColor="#8B5CF6"
                        >
                          <Picker.Item label="Personal Loan" value="personal" />
                          <Picker.Item label="Business Loan" value="business" />
                          <Picker.Item
                            label="Education Loan"
                            value="education"
                          />
                          <Picker.Item label="Medical Loan" value="medical" />
                          <Picker.Item label="Housing Loan" value="housing" />
                        </Picker>
                      </View>
                      {errors.loanType && touched.loanType && (
                        <Text style={styles.errorText}>{errors.loanType}</Text>
                      )}

                      <Text style={styles.fieldLabel}>Loan Amount (₹)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Enter amount (in ₹)"
                        onChangeText={handleChange("amount")}
                        onBlur={handleBlur("amount")}
                        value={values.amount}
                        maxLength={10}
                      />
                      {errors.amount && touched.amount && (
                        <Text style={styles.errorText}>{errors.amount}</Text>
                      )}

                      <Text style={styles.fieldLabel}>Purpose of Loan</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Why do you need this loan?"
                        onChangeText={handleChange("purpose")}
                        onBlur={handleBlur("purpose")}
                        value={values.purpose}
                        multiline
                      />
                      {errors.purpose && touched.purpose && (
                        <Text style={styles.errorText}>{errors.purpose}</Text>
                      )}

                      <Text style={styles.fieldLabel}>
                        Repayment Period (months)
                      </Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Enter number of months"
                        onChangeText={handleChange("repaymentPeriod")}
                        onBlur={handleBlur("repaymentPeriod")}
                        value={values.repaymentPeriod}
                        maxLength={2}
                      />
                      {errors.repaymentPeriod && touched.repaymentPeriod && (
                        <Text style={styles.errorText}>
                          {errors.repaymentPeriod}
                        </Text>
                      )}

                      <View style={styles.infoContainer}>
                        <Ionicons
                          name="information-circle-outline"
                          size={16}
                          color="#8B5CF6"
                        />
                        <Text style={styles.infoText}>
                          By submitting this application, you agree to the terms
                          and conditions of the Kudumbashree loan program.
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => handleSubmit()}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={["#8B5CF6", "#C026D3"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.submitButtonInner}
                        >
                          {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Ionicons
                                name="paper-plane"
                                size={20}
                                color="#fff"
                              />
                              <Text style={styles.submitButtonText}>
                                Submit Application
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </Formik>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Match gradient start color
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#7C3AED",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 20,
    marginHorizontal: 4,
  },
  borderGradient: {
    borderRadius: 20,
    padding: 2,
  },
  formGradient: {
    padding: 20,
    borderRadius: 18,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 12, // Reduced top padding since we're in SafeArea
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  sectionContainer: {
    padding: 20,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: "#1F2937",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 20,
  },
  formContent: {
    gap: 16,
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  infoText: {
    color: "#6B7280",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 32,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitButtonInner: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitButtonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
