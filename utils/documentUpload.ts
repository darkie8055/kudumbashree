import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase";

export const handleDocumentUpload = async (
  documentType: "aadhaar" | "rationCard",
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
    throw new Error("No image selected");
  } catch (error) {
    console.error(`Error uploading ${documentType}:`, error);
    throw error;
  }
};

// Update the type to use the correct DocumentPicker result type
export const uploadDocument = async (
  result: DocumentPicker.DocumentPickerResult,
  phone: string,
  type: "aadhar" | "ration-card"
): Promise<string> => {
  // Initialize Firebase with storage bucket
  const app = initializeApp({
    ...firebaseConfig,
    storageBucket: "kudumbashree-0.firebasestorage.app",
  });

  const storage = getStorage(app);
  const timestamp = new Date().getTime();
  const folder =
    type === "aadhar" ? "aadhar-documents" : "ration-card-documents";

  if (!result.assets || !result.assets[0]) {
    throw new Error("No file selected");
  }

  try {
    // Upload file
    const response = await fetch(result.assets[0].uri);
    const blob = await response.blob();
    const path = `${folder}/${phone}-${timestamp}.pdf`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, blob);

    // Return hardcoded URL format
    return `https://firebasestorage.googleapis.com/v0/b/kudumbashree-0.firebasestorage.app/o/${folder}%2F${phone}-${timestamp}.pdf?alt=media`;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

// Optional: Update the image upload function to use the same pattern
export const uploadImage = async (
  result: ImagePicker.ImagePickerResult,
  phone: string,
  folder: string
): Promise<string> => {
  if (result.canceled || !result.assets[0]) {
    throw new Error("No image selected");
  }

  const app = initializeApp({
    ...firebaseConfig,
    storageBucket: "kudumbashree-0.firebasestorage.app",
  });

  const storage = getStorage(app);
  const timestamp = new Date().getTime();
  const path = `${folder}/${phone}-${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  const response = await fetch(result.assets[0].uri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob);

  return `https://firebasestorage.googleapis.com/v0/b/kudumbashree-0.firebasestorage.app/o/${encodeURIComponent(
    path
  )}?alt=media`;
};
