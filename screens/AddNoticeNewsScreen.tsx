import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebase } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddNoticeNewsScreen() {
  const [activeTab, setActiveTab] = useState<'notice' | 'news'>('notice');
  const [loading, setLoading] = useState(false);
  
  // Notice fields
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDescription, setNoticeDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // News fields
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleAddNotice = async () => {
    if (!noticeTitle.trim()) {
      Alert.alert('Error', 'Please enter a notice title');
      return;
    }

    try {
      setLoading(true);
      const noticesRef = collection(firebase, 'notices');
      
      await addDoc(noticesRef, {
        title: noticeTitle,
        description: noticeDescription,
        venue,
        date,
        createdAt: serverTimestamp(),
        type: 'notice'
      });

      Alert.alert('Success', 'Notice added successfully', [{
        text: 'OK',
        onPress: () => {
          setNoticeTitle('');
          setNoticeDescription('');
          setVenue('');
          setDate(new Date());
        }
      }]);
    } catch (error) {
      console.error('Error adding notice:', error);
      Alert.alert('Error', 'Failed to add notice');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNews = async () => {
    if (!newsHeadline.trim() || !imageUrl.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const newsRef = collection(firebase, 'news');
      
      await addDoc(newsRef, {
        headline: newsHeadline,
        content: newsContent,
        image: imageUrl,
        createdAt: serverTimestamp()
      });

      Alert.alert('Success', 'News added successfully', [{
        text: 'OK',
        onPress: () => {
          setNewsHeadline('');
          setNewsContent('');
          setImageUrl('');
        }
      }]);
    } catch (error) {
      console.error('Error adding news:', error);
      Alert.alert('Error', 'Failed to add news');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'notice' && styles.activeTab]}
            onPress={() => setActiveTab('notice')}
          >
            <Text style={[styles.tabText, activeTab === 'notice' && styles.activeTabText]}>
              Notice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'news' && styles.activeTab]}
            onPress={() => setActiveTab('news')}
          >
            <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
              News
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'notice' ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Notice Title</Text>
            <TextInput
              style={styles.input}
              value={noticeTitle}
              onChangeText={setNoticeTitle}
              placeholder="Enter notice title"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={noticeDescription}
              onChangeText={setNoticeDescription}
              placeholder="Enter description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Venue</Text>
            <TextInput
              style={styles.input}
              value={venue}
              onChangeText={setVenue}
              placeholder="Enter venue"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  Select Date: {date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  Select Time: {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddNotice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Add Notice</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.label}>News Headline</Text>
            <TextInput
              style={styles.input}
              value={newsHeadline}
              onChangeText={setNewsHeadline}
              placeholder="Enter news headline"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newsContent}
              onChangeText={setNewsContent}
              placeholder="Enter news content"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Enter image URL"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddNews}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Add News</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateTimeButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 0.48,
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#1F2937',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 