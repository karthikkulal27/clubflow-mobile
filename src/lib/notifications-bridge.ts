// In Expo Go, expo-notifications crashes at startup (SDK 53+).
// In EAS builds (preview/production), the real module works fine.
// We detect Expo Go via Constants.appOwnership === 'expo' and load accordingly.
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Conditional require — only the chosen branch is evaluated, so
// expo-notifications is never loaded in Expo Go.
const Notifications = isExpoGo
  ? require('./notifications-mock')
  : require('expo-notifications');

export default Notifications;

export const setNotificationHandler = Notifications.setNotificationHandler;
export const getPermissionsAsync = Notifications.getPermissionsAsync;
export const requestPermissionsAsync = Notifications.requestPermissionsAsync;
export const setNotificationChannelAsync = Notifications.setNotificationChannelAsync;
export const getExpoPushTokenAsync = Notifications.getExpoPushTokenAsync;
export const AndroidImportance = Notifications.AndroidImportance;
