import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, Pressable, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { addMileageEntry, updateMileageEntry, deleteMileageEntry, getMileageEntries, getMaintenanceSettings, saveMaintenanceSettings, defaultMaintenanceSettings, type MaintenanceSettings } from "../../../src/services/storage/maintenance";
import type { MileageEntry } from "../../../src/types";
import { cancelLocalNotification, scheduleMileageReminder } from "../../../src/services/notifications";

export default function MaintenanceScreen() {
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [settings, setSettings] = useState<MaintenanceSettings>(defaultMaintenanceSettings);
  const [reading, setReading] = useState("");\n  const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null);
  const [oilReading, setOilReading] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!vehicleId) return;
    try {
      const [records, prefs] = await Promise.all([getMileageEntries(vehicleId), getMaintenanceSettings(vehicleId)]);
      setEntries(records); setSettings(prefs);
      setOilReading(prefs.lastOilChangeKm === null ? "" : String(prefs.lastOilChangeKm));
    } catch { Alert.alert("Error", "No se pudieron cargar los datos de mantenimiento."); }
    finally { setLoading(false); }
  }, [vehicleId]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const latest = entries.length ? entries[entries.length - 1] : undefined;
  const previous = entries.length > 1 ? entries[entries.length - 2] : undefined;
  const driven = latest && previous ? latest.odometerKm - previous.odometerKm : null;
  const oilBase = settings.lastOilChangeKm;
  const oilDueAt = oilBase === null ? null : oilBase + settings.oilIntervalKm;
  const oilRemaining = oilDueAt === null || latest === undefined ? null : oilDueAt - latest.odometerKm;

  async function changeSettings(next: MaintenanceSettings) {
    if (!vehicleId) return;
    try {
      await cancelLocalNotification(settings.mileageNotificationId);
      const mileageNotificationId = next.mileageAlertsEnabled
        ? await scheduleMileageReminder(next.mileageReminderHours)
        : undefined;
      const persisted = { ...next, mileageNotificationId };
      await saveMaintenanceSettings(vehicleId, persisted);
      setSettings(persisted);
      if (next.mileageAlertsEnabled && !mileageNotificationId) {
        Alert.alert("Recordatorio no activado", "No se concedió permiso para las notificaciones. Podés habilitarlo desde los ajustes del teléfono.");
      }
    } catch {
      Alert.alert("Error", "No se pudo guardar o programar el recordatorio.");
    }
  }

  async function recordMileage() {
    const value = Number(reading.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || !vehicleId) {
      Alert.alert("Kilometraje inválido", "Ingresá un odómetro válido en kilómetros.");
      return;
    }
    if (latest && value < latest.odometerKm) {
      Alert.alert("Lectura menor", "El nuevo kilometraje no puede ser menor que el último registrado.");
      return;
    }
    const entry: MileageEntry = { id: `mile-${Date.now()}`, vehicleId, odometerKm: value, recordedAt: new Date().toISOString() };
    try { await addMileageEntry(entry); setReading(""); await refresh(); Alert.alert("Registro guardado", "Se guardó el kilometraje con fecha y hora."); }
    catch { Alert.alert("Error", "No se pudo guardar el registro."); }
  }

  function confirmDeleteMileage(entry: MileageEntry) {
    Alert.alert("Eliminar lectura", `¿Eliminar el registro de ${entry.odometerKm.toLocaleString("es-AR")} km?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        try { if (vehicleId) await deleteMileageEntry(vehicleId, entry.id); await refresh(); }
        catch { Alert.alert("Error", "No se pudo eliminar la lectura."); }
      }}
    ]);
  }

  async function saveOilChange() {
    const value = Number(oilReading.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) { Alert.alert("Kilometraje inválido", "Ingresá los km en los que se hizo el cambio de aceite."); return; }
    if (latest && value > latest.odometerKm) { Alert.alert("Revisá el dato", "El kilometraje del cambio de aceite no puede superar el último odómetro registrado."); return; }
    await changeSettings({ ...settings, lastOilChangeKm: value });
    Alert.alert("Cambio de aceite guardado", `Próximo cambio estimado a los ${(value + settings.oilIntervalKm).toLocaleString("es-AR")} km.`);
  }

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>Mantenimiento</Text>
    <Text style={styles.caption}>Los registros quedan vinculados a este vehículo.</Text>
    {loading ? <ActivityIndicator color="#137C70" style={{ marginTop: 30 }} /> : <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Registro de kilometraje</Text>
        <Text style={styles.caption}>Ingresá manualmente el odómetro. La fecha y hora se guardan automáticamente.</Text>
        <Text style={styles.label}>Frecuencia de recordatorio</Text>
        <View style={styles.row}>
          {[12,24].map((hours) => <Pressable key={hours} style={[styles.choice, settings.mileageReminderHours === hours && styles.choiceActive]} onPress={() => changeSettings({ ...settings, mileageReminderHours: hours as 12 | 24 })}><Text style={[styles.choiceText, settings.mileageReminderHours === hours && styles.choiceTextActive]}>Cada {hours} h</Text></Pressable>)}
        </View>
        <View style={styles.switchRow}><Text style={styles.label}>Alertas de kilometraje</Text><Switch value={settings.mileageAlertsEnabled} onValueChange={(value) => changeSettings({ ...settings, mileageAlertsEnabled: value })} trackColor={{ true: "#137C70" }} /></View>
        <Text style={styles.label}>Odómetro actual (km)</Text>
        <TextInput value={reading} onChangeText={setReading} keyboardType="decimal-pad" placeholder="Ej. 253931" style={styles.input}/>
        <Pressable style={styles.button} onPress={recordMileage}><Text style={styles.buttonText}>{editingEntry ? "Actualizar lectura" : "Guardar kilometraje"}</Text></Pressable>\n        {editingEntry && <Pressable style={styles.back} onPress={() => { setEditingEntry(null); setReading(""); }}><Text style={styles.backText}>Cancelar edición</Text></Pressable>}
        <View style={styles.metric}><Text style={styles.metricLabel}>Última lectura</Text><Text style={styles.metricValue}>{latest ? `${latest.odometerKm.toLocaleString("es-AR")} km` : "Sin registros"}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>Km recorridos desde registro anterior</Text><Text style={styles.metricValue}>{driven === null ? "Necesitás 2 registros" : `${driven.toLocaleString("es-AR")} km`}</Text></View>
        {latest && <Text style={styles.caption}>Último registro: {new Date(latest.recordedAt).toLocaleString("es-AR")}</Text>}
        <Text style={styles.label}>Lecturas anteriores</Text>
        {!entries.length ? <Text style={styles.caption}>Sin historial todavía.</Text> : [...entries].reverse().map((entry) => <View key={entry.id} style={styles.mileageRecord}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricValue}>{entry.odometerKm.toLocaleString("es-AR")} km</Text>
            <Text style={styles.caption}>{new Date(entry.recordedAt).toLocaleString("es-AR")}</Text>
          </View>
          <View style={{ flexDirection: "row" }}><Pressable onPress={() => { setEditingEntry(entry); setReading(String(entry.odometerKm)); }} style={styles.deleteButton}><Text style={{ color: "#137C70", fontWeight: "700" }}>Editar</Text></Pressable><Pressable onPress={() => confirmDeleteMileage(entry)} style={styles.deleteButton}><Text style={styles.deleteText}>Eliminar</Text></Pressable></View>
        </View>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🛢️ Cambio de aceite</Text>
        <Text style={styles.caption}>Definí el intervalo y el kilometraje en que se realizó el último cambio.</Text>
        <Text style={styles.label}>Intervalo recomendado</Text>
        <View style={styles.row}>
          {[8000,13000].map((km) => <Pressable key={km} style={[styles.choice, settings.oilIntervalKm === km && styles.choiceActive]} onPress={() => changeSettings({ ...settings, oilIntervalKm: km as 8000 | 13000 })}><Text style={[styles.choiceText, settings.oilIntervalKm === km && styles.choiceTextActive]}>{km.toLocaleString("es-AR")} km</Text></Pressable>)}
        </View>
        <Text style={styles.label}>Km del último cambio de aceite</Text>
        <TextInput value={oilReading} onChangeText={setOilReading} keyboardType="decimal-pad" placeholder="Ej. 245000" style={styles.input}/>
        <Pressable style={styles.secondaryButton} onPress={saveOilChange}><Text style={styles.secondaryText}>Guardar cambio de aceite</Text></Pressable>
        <View style={styles.metric}><Text style={styles.metricLabel}>Próximo cambio</Text><Text style={styles.metricValue}>{oilDueAt === null ? "Registrá el último cambio" : `${oilDueAt.toLocaleString("es-AR")} km`}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>Estado</Text><Text style={[styles.metricValue, oilRemaining !== null && oilRemaining <= 0 && { color: "#B42318" }]}>{oilRemaining === null ? "—" : oilRemaining <= 0 ? `Vencido por ${Math.abs(oilRemaining).toLocaleString("es-AR")} km` : `Restan ${oilRemaining.toLocaleString("es-AR")} km`}</Text></View>
      </View>
    </>}
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>Volver al vehículo</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 48, backgroundColor: "#F4F8F7", paddingBottom: 35 },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F", marginTop: 18 },
  caption: { color: "#71817D", lineHeight: 21, marginTop: 6, fontSize: 13 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#20312F" },
  label: { color: "#20312F", fontWeight: "700", marginTop: 15, marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  choice: { flex: 1, borderWidth: 1, borderColor: "#DDE8E5", borderRadius: 12, padding: 12, alignItems: "center", backgroundColor: "#F9FBFA" },
  choiceActive: { borderColor: "#137C70", backgroundColor: "#E5F4F1" },
  choiceText: { color: "#61716E", fontWeight: "700" },
  choiceTextActive: { color: "#137C70" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: { backgroundColor: "#FFFFFF", borderColor: "#DDE8E5", borderWidth: 1, borderRadius: 13, padding: 14, color: "#20312F" },
  button: { backgroundColor: "#137C70", padding: 15, borderRadius: 13, marginTop: 12, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: { borderColor: "#137C70", borderWidth: 1, padding: 14, borderRadius: 13, marginTop: 12, alignItems: "center" },
  secondaryText: { color: "#137C70", fontWeight: "700" },
  metric: { backgroundColor: "#F4F8F7", borderRadius: 12, padding: 13, marginTop: 10 },
  mileageRecord: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEF2F1", paddingTop: 10, marginTop: 10 },
  deleteButton: { padding: 8 },
  deleteText: { color: "#B42318", fontWeight: "700" },
  metricLabel: { color: "#71817D", fontSize: 12, fontWeight: "600" },
  metricValue: { color: "#20312F", fontSize: 16, fontWeight: "800", marginTop: 4 },
  back: { padding: 15, alignItems: "center", marginTop: 10 },
  backText: { color: "#61716E", fontWeight: "700" }
});