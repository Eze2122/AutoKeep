import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View, Pressable, StyleSheet, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMileageEntries } from "../../../src/services/storage/maintenance";
import { getVehicles, updateVehicle, deleteVehicle } from "../../../src/services/storage/vehicles";
import { useAppLanguage } from "../../../src/services/i18n";
import type { MileageEntry, Vehicle, Driver } from "../../../src/types";

export default function SettingsScreen() {
  const { t } = useAppLanguage();
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [history, setHistory] = useState<MileageEntry[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [savingVehicle, setSavingVehicle] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      if (!vehicleId) return;
      const [storedLanguage, records, allVehicles] = await Promise.all([
        AsyncStorage.getItem("@autokeep/language"),
        getMileageEntries(vehicleId),
        getVehicles()
      ]);
      const current = allVehicles.find(item => item.id === vehicleId) ?? null;
      if (active) {
        setLanguage(storedLanguage === "en" ? "en" : "es");
        setHistory(records.slice().reverse());
        setVehicle(current);
        setModel(current?.model ?? "");
        setPlate(current?.plate ?? "");
        setDrivers(current?.drivers ?? []);
      }
    }
    load().catch(() => Alert.alert("Error", "No se pudo cargar la configuración."));
    return () => { active = false; };
  }, [vehicleId]));

  async function changeLanguage(next: "es" | "en") {
    setLanguage(next);
    try { await AsyncStorage.setItem("@autokeep/language", next); }
    catch { Alert.alert(t("Error"), t("No se pudo guardar el idioma.")); return; }
    Alert.alert(t("Idioma guardado"), t(next === "es" ? "Preferencia: Español." : "Preference: English. Note: translations will be applied progressively."));
  }

  async function handleSaveVehicle() {
    if (!vehicle) return;
    const cleanModel = model.trim();
    const cleanPlate = plate.trim().toUpperCase();
    const cleanDrivers = drivers.map(d => ({ ...d, name: d.name.trim() })).filter(d => d.name.length > 0);
    if (!cleanModel || !cleanPlate) {
      Alert.alert(t("Datos incompletos"), t("Ingresá modelo y patente."));
      return;
    }
    setSavingVehicle(true);
    try {
      const updated = { ...vehicle, model: cleanModel, plate: cleanPlate, drivers: cleanDrivers };
      await updateVehicle(updated);
      setVehicle(updated);
      setDrivers(cleanDrivers);
      Alert.alert(t("Guardado"), t("Los datos del vehículo y sus choferes se actualizaron."));
    } catch (error) {
      Alert.alert(t("No se pudo guardar"), t(error instanceof Error && error.message === "DUPLICATE_PLATE" ? "Ya existe otro vehículo con esa patente." : "Intentá nuevamente."));
    } finally { setSavingVehicle(false); }
  }

  function addDriver() {
    setDrivers(current => [...current, { id: `driver-${Date.now()}`, name: "" }]);
  }

  function removeDriver(driverId: string) {
    Alert.alert(t("Eliminar chofer"), t("¿Querés quitar este chofer del vehículo?"), [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => setDrivers(current => current.filter(driver => driver.id !== driverId)) }
    ]);
  }

  function confirmDeleteVehicle() {
    if (!vehicleId) return;
    Alert.alert(t("Eliminar vehículo"), t("Se quitará este vehículo de tu flota. Esta acción no se puede deshacer."), [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        try {
          await deleteVehicle(vehicleId);
          router.replace("/");
        } catch { Alert.alert(t("Error"), t("No se pudo eliminar el vehículo.")); }
      }}
    ]);
  }

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>{t("Configuración")}</Text>
    <Text style={styles.caption}>{t("Administrá los datos y preferencias de este vehículo.")}</Text>

    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("🚘 Datos del vehículo")}</Text>
      {!vehicle ? <Text style={styles.caption}>{t("No se encontró el vehículo.")}</Text> : <>
        <Text style={styles.fieldLabel}>{t("Modelo")}</Text>
        <TextInput value={model} onChangeText={setModel} placeholder={t("Modelo del vehículo")} style={styles.input} />
        <Text style={styles.fieldLabel}>{t("Patente")}</Text>
        <TextInput value={plate} onChangeText={setPlate} autoCapitalize="characters" placeholder={t("Patente")} style={styles.input} />
        <Text style={styles.sectionTitle}>{t("👤 Choferes")}</Text>
        {drivers.map((driver, index) => <View key={driver.id} style={styles.driverRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>{t("Chofer ")}{index + 1}</Text>
            <TextInput value={driver.name} onChangeText={name => setDrivers(current => current.map(item => item.id === driver.id ? { ...item, name } : item))} placeholder={t("Nombre del chofer")} style={styles.input} />
          </View>
          <Pressable style={styles.removeDriver} onPress={() => removeDriver(driver.id)}><Text style={styles.removeText}>{t("Quitar")}</Text></Pressable>
        </View>)}
        <Pressable style={styles.addDriver} onPress={addDriver}><Text style={styles.addDriverText}>{t("＋ Agregar chofer")}</Text></Pressable>
        <Pressable disabled={savingVehicle} style={[styles.saveButton, savingVehicle && { opacity: 0.6 }]} onPress={handleSaveVehicle}><Text style={styles.saveButtonText}>{savingVehicle ? t("Guardando…") : t("Guardar cambios")}</Text></Pressable>
        <Pressable style={styles.deleteVehicle} onPress={confirmDeleteVehicle}><Text style={styles.deleteText}>{t("Eliminar vehículo de la flota")}</Text></Pressable>
      </>}
    </View>

    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("🌐 Idioma")}</Text>
      <View style={styles.row}>
        <Pressable style={[styles.choice, language === "es" && styles.selected]} onPress={() => changeLanguage("es")}><Text style={[styles.choiceText, language === "es" && styles.selectedText]}>Español</Text></Pressable>
        <Pressable style={[styles.choice, language === "en" && styles.selected]} onPress={() => changeLanguage("en")}><Text style={[styles.choiceText, language === "en" && styles.selected && styles.selectedText]}>English</Text></Pressable>
      </View>
      <Text style={styles.caption}>{t("La preferencia se guarda en el dispositivo. La traducción completa se implementará en una etapa posterior.")}</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("📚 Historial de kilometraje")}</Text>
      {history.length === 0 ? <Text style={styles.caption}>{t("Todavía no hay registros de odómetro.")}</Text> : history.map((entry) => <View key={entry.id} style={styles.historyItem}>
        <Text style={styles.historyKm}>{entry.odometerKm.toLocaleString("es-AR")} km</Text>
        <Text style={styles.caption}>{new Date(entry.recordedAt).toLocaleString("es-AR")}</Text>
      </View>)}
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("🔒 Privacidad")}</Text>
      <Text style={styles.caption}>{t("Los datos se almacenan localmente en tu dispositivo. La política de privacidad oficial se agregará antes de la publicación.")}</Text>
    </View>
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>{t("Volver al vehículo")}</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 48, paddingBottom: 35, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F", marginTop: 18 },
  caption: { color: "#71817D", lineHeight: 20, marginTop: 7, fontSize: 13 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#20312F", marginBottom: 10, marginTop: 8 },
  fieldLabel: { color: "#20312F", fontWeight: "700", marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: "#FFFFFF", borderColor: "#DDE8E5", borderWidth: 1, borderRadius: 12, padding: 13, color: "#20312F" },
  driverRow: { flexDirection: "row", alignItems: "flex-end", gap: 9, marginTop: 5 },
  removeDriver: { padding: 12, marginBottom: 1 },
  removeText: { color: "#B42318", fontWeight: "700" },
  addDriver: { padding: 13, alignItems: "center", marginTop: 8 },
  addDriverText: { color: "#137C70", fontWeight: "800" },
  saveButton: { backgroundColor: "#137C70", padding: 15, borderRadius: 13, alignItems: "center", marginTop: 12 },
  saveButtonText: { color: "#FFFFFF", fontWeight: "800" },
  deleteVehicle: { padding: 14, alignItems: "center", marginTop: 8 },
  deleteText: { color: "#B42318", fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  choice: { flex: 1, borderWidth: 1, borderColor: "#DDE8E5", borderRadius: 12, padding: 13, alignItems: "center" },
  selected: { borderColor: "#137C70", backgroundColor: "#E5F4F1" },
  choiceText: { color: "#61716E", fontWeight: "700" },
  selectedText: { color: "#137C70" },
  historyItem: { borderTopWidth: 1, borderTopColor: "#EEF2F1", paddingTop: 10, marginTop: 8 },
  historyKm: { fontSize: 16, fontWeight: "800", color: "#20312F" },
  back: { padding: 15, alignItems: "center", marginTop: 10 },
  backText: { color: "#61716E", fontWeight: "700" }
});
