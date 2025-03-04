import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
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
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";

export default function LoanApprovalScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [loanApplications, setLoanApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [unitId, setUnitId] = useState("");
  const db = getFirestore();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    fetchLoanApplications();
  }, []);

  const fetchLoanApplications = async () => {
    try {
      const q = query(
        collection(db, "loanApplications"),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Format phone number for display
        memberId: doc.data().memberId, // Keep original format in data
        displayMemberId: `${doc.data().memberId.slice(0, 5)} ${doc
          .data()
          .memberId.slice(5)}`, // Format for display
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      applications.sort((a, b) => b.createdAt - a.createdAt);
      setLoanApplications(applications);
    } catch (error) {
      console.error("Error fetching loan applications:", error);
      Alert.alert("Error", "Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    setLoading(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, "loanApplications", selectedApplication.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      // Remove from pending applications list
      setLoanApplications((prevApplications) =>
        prevApplications.filter((app) => app.id !== selectedApplication.id)
      );

      Alert.alert("Success", "Loan application has been approved");
      setModalVisible(false);
    } catch (error) {
      console.error("Error approving loan:", error);
      Alert.alert("Error", "Failed to approve loan");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    setLoading(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, "loanApplications", selectedApplication.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      // Remove from pending applications list
      setLoanApplications((prevApplications) =>
        prevApplications.filter((app) => app.id !== selectedApplication.id)
      );

      Alert.alert("Rejected", "Loan application has been rejected");
      setModalVisible(false);
    } catch (error) {
      console.error("Error rejecting loan:", error);
      Alert.alert("Error", "Failed to reject loan");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!fontsLoaded) {
    return null;
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Loan Approval</Text>
            <Text style={styles.headerSubtitle}>
              Review and manage loan applications
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loanApplications.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹
              {loanApplications
                .reduce((sum, app) => sum + app.amount, 0)
                .toLocaleString("en-IN")}
            </Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.formContainer, fadeIn]}>
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.2)"]}
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
                <Text style={styles.title}>Loan Approval</Text>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loadingText}>
                      Loading applications...
                    </Text>
                  </View>
                ) : loanApplications.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons
                        name="documents-outline"
                        size={48}
                        color="#8B5CF6"
                      />
                    </View>
                    <Text style={styles.emptyTitle}>
                      No Pending Applications
                    </Text>
                    <Text style={styles.emptyText}>
                      When members submit loan applications, they will appear
                      here for your review
                    </Text>
                  </View>
                ) : (
                  <View style={styles.applicationList}>
                    {loanApplications.map((application) => (
                      <TouchableOpacity
                        key={application.id}
                        style={styles.applicationCard}
                        onPress={() => {
                          setSelectedApplication(application);
                          setModalVisible(true);
                        }}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={styles.memberName}>
                            {application.memberName}
                          </Text>
                          <Text style={styles.amountText}>
                            ₹{application.amount.toLocaleString("en-IN")}
                          </Text>
                        </View>

                        <View style={styles.cardDetails}>
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color="#8B5CF6"
                            />
                            <Text style={styles.detailText}>
                              Applied on {formatDate(application.createdAt)}
                            </Text>
                          </View>

                          <View style={styles.detailRow}>
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color="#8B5CF6"
                            />
                            <Text style={styles.detailText}>
                              {application.repaymentPeriod} month
                              {application.repaymentPeriod > 1 ? "s" : ""}
                            </Text>
                          </View>

                          <View style={styles.detailRow}>
                            <Ionicons
                              name="pricetag-outline"
                              size={16}
                              color="#8B5CF6"
                            />
                            <Text style={styles.detailText}>
                              {application.loanType}
                            </Text>
                          </View>

                          <View style={styles.detailRow}>
                            <Ionicons
                              name="call-outline"
                              size={16}
                              color="#8B5CF6"
                            />
                            <Text style={styles.detailText}>
                              +91 {application.memberId}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardFooter}>
                          <Text style={styles.purposeLabel}>Purpose:</Text>
                          <Text style={styles.purposeText} numberOfLines={2}>
                            {application.purpose}
                          </Text>
                        </View>

                        <View style={styles.viewMoreContainer}>
                          <Text style={styles.viewMoreText}>
                            Tap to view details
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#8B5CF6"
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        {/* Application Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#8B5CF6" />
              </TouchableOpacity>

              {selectedApplication && (
                <>
                  <Text style={styles.modalTitle}>
                    Loan Application Details
                  </Text>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Applicant Information
                    </Text>
                    <Text style={styles.modalLabel}>Name:</Text>
                    <Text style={styles.modalValue}>
                      {selectedApplication.memberName}
                    </Text>
                    <Text style={styles.modalLabel}>Phone Number:</Text>
                    {/* Change memberId display to show as phone number */}
                    <Text style={styles.modalValue}>
                      {`${selectedApplication.memberId}`}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Loan Details</Text>
                    <View style={styles.modalRow}>
                      <View style={styles.modalColumn}>
                        <Text style={styles.modalLabel}>Amount:</Text>
                        <Text style={styles.modalAmount}>
                          ₹{selectedApplication.amount.toLocaleString("en-IN")}
                        </Text>
                      </View>
                      <View style={styles.modalColumn}>
                        <Text style={styles.modalLabel}>Type:</Text>
                        <Text style={styles.modalValue}>
                          {selectedApplication.loanType}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.modalLabel}>Repayment Period:</Text>
                    <Text style={styles.modalValue}>
                      {selectedApplication.repaymentPeriod} month
                      {selectedApplication.repaymentPeriod > 1 ? "s" : ""}
                    </Text>

                    <Text style={styles.modalLabel}>Application Date:</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedApplication.createdAt)}
                    </Text>

                    <Text style={styles.modalLabel}>Purpose:</Text>
                    <Text style={styles.modalPurpose}>
                      {selectedApplication.purpose}
                    </Text>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={handleReject}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#ffffff"
                          />
                          <Text style={styles.buttonText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={handleApprove}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#ffffff"
                          />
                          <Text style={styles.buttonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#ffffff",
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    margin: 16,
  },
  emptyIconContainer: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  applicationList: {
    marginTop: 10,
  },
  applicationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
  },
  amountText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#8B5CF6",
  },
  cardDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  purposeLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#4B5563",
  },
  purposeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4B5563",
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  viewMoreText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#8B5CF6",
    marginRight: 4,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#333333",
    marginBottom: 20,
    textAlign: "center",
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#333333",
    marginBottom: 10,
  },
  modalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  modalValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#333333",
    marginBottom: 10,
  },
  modalAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#8B5CF6",
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalColumn: {
    flex: 1,
  },
  modalPurpose: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#333333",
    marginBottom: 10,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
    marginLeft: 6,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
});
