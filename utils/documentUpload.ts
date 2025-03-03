import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export const handleDocumentUpload = async (
  documentType: 'aadhaar' | 'rationCard',
  phone: string
): Promise<string> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const storage = getStorage();
      const fileName = `${documentType}s/${Date.now()}_${phone}`;
      const storageRef = ref(storage, fileName);
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    }
    throw new Error('No image selected');
  } catch (error) {
    console.error(`Error uploading ${documentType}:`, error);
    throw error;
  }
};
