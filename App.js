import './global.css';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import './src/locales/i18n'; // Import i18n configuration
import { initDB } from './src/database/db';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      // Set notification handler FIRST, inside useEffect so the native bridge
      // is ready on Hermes — calling this at module level causes
      // "dispatch is not a function" on Android/Hermes.
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      } catch (e) {
        console.warn('Could not set notification handler:', e?.message);
      }

      await initDB();

      setDbReady(true);

      // Configure Notification Categories (Snooze, Close)
      // Deferred via setTimeout to avoid "dispatch is not a function" on Hermes
      // during cold start before the native bridge is fully ready.
      setTimeout(async () => {
        try {
          await Notifications.setNotificationCategoryAsync('reminder', [
            { identifier: 'snooze', buttonTitle: 'Snooze 10 mins', options: { isDestructive: false, isAuthenticationRequired: false } },
            { identifier: 'close', buttonTitle: 'Close', options: { isDestructive: true, isAuthenticationRequired: false } },
          ]);
        } catch (e) {
          console.warn('Could not set notification categories:', e?.message);
        }
      }, 0);
    }
    setup();

    const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
      const actionId = response.actionIdentifier;
      const notificationId = response.notification.request.identifier;

      // Dismiss the notification from the tray if an action is taken
      await Notifications.dismissNotificationAsync(notificationId);

      if (actionId === 'snooze') {
        const { title, body, data } = response.notification.request.content;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            data: data,
            categoryIdentifier: 'reminder',
          },
          trigger: { seconds: 10 * 60 }, // 10 minutes snooze
        });
      } else if (actionId === 'close' || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Just acknowledging it closes the notification since we dismissed it above
      }
    });

    return () => subscription.remove();
  }, []);

  if (!dbReady) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
