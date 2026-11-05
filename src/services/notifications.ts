import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function scheduleDocumentExpiryAlert(
  title: string,
  expiresAt: string,
  alertDays: number
): Promise<string | undefined> {
  const permission = await Notifications.getPermissionsAsync();
  const granted = permission.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return undefined;

  const expiry = new Date(`${expiresAt}T09:00:00`);
  expiry.setDate(expiry.getDate() - alertDays);
  if (expiry.getTime() <= Date.now()) return undefined;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "AutoKeep · Vencimiento próximo",
      body: `${title} vence el ${expiresAt}. Revisá la documentación del vehículo.`,
      data: { type: "document-expiry", expiresAt }
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: expiry }
  });
}

export async function cancelLocalNotification(notificationId?: string): Promise<void> {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleMileageReminder(hours: 12 | 24): Promise<string | undefined> {
  const permission = await Notifications.getPermissionsAsync();
  const granted = permission.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return undefined;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "AutoKeep · Recordatorio de odómetro",
      body: "Es momento de actualizar el kilometraje de tu vehículo.",
      data: { type: "mileage-reminder", intervalHours: hours }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: hours * 60 * 60,
      repeats: true
    }
  });
}
