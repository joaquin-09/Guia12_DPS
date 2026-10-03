import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Define cómo se comporta una notificación recibida mientras la app está en
// primer plano. En SDK 57 se usan shouldShowBanner y shouldShowList
// (reemplazan al antiguo shouldShowAlert).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Solicita permisos, configura el canal de Android y devuelve el Expo Push Token. */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // En Android hay que declarar un canal antes de mostrar notificaciones.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Las push solo llegan a dispositivos físicos, no a emuladores.
  if (!Device.isDevice) {
    alert('Debe usar un dispositivo físico para recibir notificaciones push.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('¡No se pudieron obtener los permisos de notificaciones!');
    return;
  }

  // getExpoPushTokenAsync requiere el projectId de EAS en SDK 57.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    alert('No se encontró el projectId de EAS. Ejecuta "npx eas-cli init".');
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);
    return token;
  } catch (error) {
    console.error('Error obteniendo el Expo Push Token:', error);
  }
}

/** Programa una notificación local que se dispara a los 2 segundos. */
export async function schedulePushNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '¡Mira esto!',
      body: 'Este es un mensaje de notificación local.',
      data: { data: 'Información adicional' },
    },
    // En SDK 57 el trigger es tipado: se indica el tipo del disparador.
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}