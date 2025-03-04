import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { TOAST_DURATION } from '../components/SonnerToast';

export default function WeeklyDueSetupScreen({ navigation }) {
  const [weeklyAmount, setWeeklyAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentAmount();
  }, []);

  const fetchCurrentAmount = async () => {
    try {
      const db = getFirestore();
      const settingsDoc = await getDoc(doc(db, 'weeklyDueSettings', 'config'));
      if (settingsDoc.exists()) {
        setWeeklyAmount(settingsDoc.data().amount.toString());
      }
    } catch (error) {
      console.error('Error fetching current amount:', error);
    }
  };

  const handleSaveAmount = async () => {
    if (!weeklyAmount || isNaN(Number(weeklyAmount))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid amount',
        visibilityTime: TOAST_DURATION,
      });
      return;
    }

    try {
      setIsLoading(true);
      const db = getFirestore();
      
      await setDoc(doc(db, 'weeklyDueSettings', 'config'), {
        amount: Number(weeklyAmount),
        updatedAt: new Date(),
        startDate: new Date('2024-02-01'), // First week of February
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Weekly due amount has been set',
        visibilityTime: TOAST_DURATION,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error saving amount:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save amount',
        visibilityTime: TOAST_DURATION,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.header}
      >
        <Text style={styles.title}>Set Weekly Due Amount</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.label}>Weekly Due Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={weeklyAmount}
          onChangeText={setWeeklyAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveAmount}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Amount'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});