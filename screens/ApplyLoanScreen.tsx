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
        const phoneNumber = route.params?.phoneNumber;
        console.log("Phone number from params:", phoneNumber); // Debug log

        if (!phoneNumber) {
          Alert.alert("Error", "Phone number not found");
          navigation.goBack();
          return;
        }

        // Get Firestore reference
        const db = getFirestore();
        const userDocRef = doc(db, "K-member", phoneNumber);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          console.log("Fetched user data:", data); // Debug log

          setUserData({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: phoneNumber, // Use the phone number from params
            unitName: data.unitName,
            unitNumber: data.unitNumber,
            status: data.status,
          });
        } else {
          Alert.alert("Error", "Member data not found");
          navigation.goBack();
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
    if (!userData) {
      Alert.alert("Error", "Missing required data");
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

  return (
    <LinearGradient
      colors={["rgba(162,39,142,0.01)", "rgba(162,39,142,0.03)"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={[styles.formContainer, fadeIn]}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.3)",
                  "rgba(255, 255, 255, 0.2)",
                ]}
                style={styles.borderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  style={styles.formGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.headerContainer}>
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Apply for Loan</Text>
                  </View>

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
                      <View>
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
                            <Picker.Item
                              label="Personal Loan"
                              value="personal"
                            />
                            <Picker.Item
                              label="Business Loan"
                              value="business"
                            />
                            <Picker.Item
                              label="Education Loan"
                              value="education"
                            />
                            <Picker.Item label="Medical Loan" value="medical" />
                            <Picker.Item label="Housing Loan" value="housing" />
                          </Picker>
                        </View>
                        {errors.loanType && touched.loanType && (
                          <Text style={styles.errorText}>
                            {errors.loanType}
                          </Text>
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
                            By submitting this application, you agree to the
                            terms and conditions of the Kudumbashree loan
                            program.
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.submitButton}
                          onPress={() => handleSubmit()}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.submitButtonText}>
                              Submit Application
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </Formik>
                </LinearGradient>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom:20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  borderGradient: {
    borderRadius: 20,
    padding: 2,
  },
  formGradient: {
    padding: 20,
    borderRadius: 18,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "white",
    flex: 1,
  },
  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    width: "100%",
    fontFamily: "Poppins_400Regular",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: "#FECACA",
    fontSize: 12,
    marginTop: 5,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
  },
  infoText: {
    color: "white",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginLeft: 5,
    flex: 1,
  },
  submitButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
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
