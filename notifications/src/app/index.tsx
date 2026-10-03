import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import {
  registerForPushNotificationsAsync,
  schedulePushNotification,
} from '@/lib/notifications';

export default function HomeScreen() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  // useRef guarda las suscripciones para poder cancelarlas al desmontar.
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Obtener el token del dispositivo.
    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    // Escucha las notificaciones mientras la app está en primer plano.
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Escucha cuando el usuario toca la notificación.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      // En SDK 57 se cancela con subscription.remove() (ya no
      // Notifications.removeNotificationSubscription()).
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.token}>Tu Expo Push Token: {expoPushToken}</Text>

      <View style={styles.button}>
        <Button
          title="Enviar notificación"
          onPress={async () => {
            await schedulePushNotification();
          }}
        />
      </View>

      {notification && (
        <View style={styles.button}>
          <Text style={styles.label}>Última notificación:</Text>
          <Text>{notification.request.content.title}</Text>
          <Text>{notification.request.content.body}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  token: { textAlign: 'center' },
  button: { marginTop: 20 },
  label: { fontWeight: 'bold' },
});