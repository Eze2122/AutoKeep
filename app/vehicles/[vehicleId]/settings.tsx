import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMileageEntries } from "../../../src/services/storage/maintenance";
import type { MileageEntry } from "../../../src/types";


export default function SettingsScreen() {
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [history, setHistory] = useState<MileageEntry[]>([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      if (!vehicleId) return;
      const [storedLanguage, records] = await Promise.all([
        AsyncStorage.getItem("@autokeep/language"),
        getMileageEntries(vehicleId)
      ]);
      if (active) {
        setLanguage(storedLanguage === "en" ? "en" : "es");
        setHistory(records.slice().reverse());
      }
    }
    load().catch(() => Alert.alert("Error", "No se pudo cargar la configuración."));
    return () => { active = false; };
  }, [vehicleId]));

  async function changeLanguage(next: "es" | "en") {
    setLanguage(next);
    try { await AsyncStorage.setItem("@autokeep/language", next); }
    catch { Alert.alert("Error", "No se pudo guardar el idioma."); }
    Alert.alert("Idioma guardado", next === "es" ? "Preferencia: Español." : "Preference: English. Note: translations will be applied progressively.");
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>Configuración</Text>
    <Text style={styles.caption}>Preferencias e historial de este vehículo.</Text>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🌐 Idioma</Text>
      <View style={styles.row}>
        <Pressable style={[styles.choice, language === "es" && styles.selected]} onPress={() => changeLanguage("es")}><Text style={[styles.choiceText, language === "es" && styles.selectedText]}>Español</Text></Pressable>
        <Pressable style={[styles.choice, language === "en" && styles.selected]} onPress={() => changeLanguage("en")}><Text style={[styles.choiceText, language === "en" && styles.selectedText]}>English</Text></Pressable>
      </View>
      <Text style={styles.caption}>La preferencia se guarda en el dispositivo. La traducción completa de pantallas se añadirá en una etapa posterior.</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>📚 Historial de kilometraje</Text>
      {history.length === 0 ? <Text style={styles.caption}>Todavía no hay registros de odómetro.</Text> : history.map((entry) => <View key={entry.id} style={styles.historyItem}>
        <Text style={styles.historyKm}>{entry.odometerKm.toLocaleString("es-AR")} km</Text>
        <Text style={styles.caption}>{new Date(entry.recordedAt).toLocaleString("es-AR")}</Text>
      </View>)}
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🔒 Privacidad</Text>
      <Text style={styles.caption}>Los datos se almacenan localmente en tu dispositivo. La política de privacidad oficial se agregará antes de la publicación.</Text>
    </View>
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>Volver al vehículo</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 48, paddingBottom: 35, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F", marginTop: 18 },
  caption: { color: "#71817D", lineHeight: 20, marginTop: 7, fontSize: 13 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#20312F", marginBottom: 10 },
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