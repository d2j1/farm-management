import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import './src/locales/i18n'; // Import i18n configuration
import { initDB } from './src/database/db';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      await initDB();

      // Configure Notification Categories (Snooze, Close)
      await Notifications.setNotificationCategoryAsync('reminder', [
        { identifier: 'snooze', buttonTitle: 'Snooze 10 mins', options: { isDestructive: false, isAuthenticationRequired: false } },
        { identifier: 'close', buttonTitle: 'Close', options: { isDestructive: true, isAuthenticationRequired: false } },
      ]);

      setDbReady(true);
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
