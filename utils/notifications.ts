import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { firebase } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  }
  return false;
};

export const showLocalNotification = async (title: string, body: string) => {
  try {
    // Store notification in Firebase
    const notificationsRef = collection(firebase, "appNotifications");
    await addDoc(notificationsRef, {
      title,
      body,
      createdAt: serverTimestamp(),
    });

    // Show local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error showing notification:", error);
  }
};

export const setupNotificationListener = () => {
  const notificationsRef = collection(firebase, "appNotifications");
  const q = query(notificationsRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const notification = change.doc.data();
        showLocalNotification(notification.title, notification.body);
      }
    });
  });

  return unsubscribe;
};

export const sendNotificationToAll = async (title: string, body: string) => {
  try {
    const notificationsRef = collection(firebase, "appNotifications");
    await addDoc(notificationsRef, {
      title,
      body,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
