import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { firebase } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import LinearGradient from 'expo-linear-gradient';

export default function ApprovedMembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const fetchApprovedMembers = async () => {
    try {
      // Get current president's unit number
      const presidentsRef = collection(firebase, "president");
      const presidentSnapshot = await getDocs(presidentsRef);
      const presidentData = presidentSnapshot.docs[0].data();
      const unitNumber = presidentData.unitNumber;

      // Get all approved members from this unit
      const membersRef = collection(firebase, "K-member");
      const q = query(
        membersRef, 
        where("status", "==", "approved"),
        where("unitNumber", "==", unitNumber)
      );
      
      const querySnapshot = await getDocs(q);
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovedMembers();
  }, []);

  const handleDelete = (memberId: string, memberName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${memberName} from your unit?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firebase, "K-member", memberId));
              Alert.alert("Success", "Member removed successfully");
              fetchApprovedMembers();
            } catch (error) {
              console.error("Error deleting member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          }
        }
      ]
    );
  };

  const renderMemberCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>{item.firstName} {item.lastName}</Text>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id, `${item.firstName} ${item.lastName}`)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={24} color="#EC4899" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{item.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{item.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Aadhar:</Text>
            <Text style={styles.value}>{item.aadhar}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Ration Card:</Text>
            <Text style={styles.value}>{item.rationCard}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMemberCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchApprovedMembers();
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No approved members found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B5CF6',
  },
  deleteButton: {
    padding: 8,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B5CF6',
  },
  value: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4B5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#8B5CF6',
    marginTop: 24,
  },
}); 