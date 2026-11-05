import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { getMileageEntries } from "../../../src/services/storage/maintenance";
import { getServiceRecords, type ServiceRecord } from "../../../src/services/storage/service-records";
import type { MileageEntry } from "../../../src/types";

import { useAppLanguage } from "../../../src/services/i18n";
type TimelineItem =
  | { id: string; type: "mileage"; date: string; km: number }
  | { id: string; type: "service"; date: string; record: ServiceRecord };

export default function VehicleTimelineScreen() {
  const { t } = useAppLanguage();
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [items, setItems] = useState<TimelineItem[]>([]);

  const refresh = useCallback(async () => {
    if (!vehicleId) return;
    const [mileage, services] = await Promise.all([getMileageEntries(vehicleId), getServiceRecords(vehicleId)]);
    const timeline: TimelineItem[] = [
      ...mileage.map((entry: MileageEntry): TimelineItem => ({ id: entry.id, type: "mileage", date: entry.recordedAt, km: entry.odometerKm })),
      ...services.map((record): TimelineItem => ({ id: record.id, type: "service", date: record.performedAt, record }))
    ];
    setItems(timeline.sort((a, b) => b.date.localeCompare(a.date)));
  }, [vehicleId]);

  useFocusEffect(useCallback(() => {
    refresh().catch(() => Alert.alert("Error", "No se pudo cargar la línea de tiempo del vehículo."));
  }, [refresh]));

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>{t("Historial unificado")}</Text>
    <Text style={styles.caption}>{t("Kilometraje y servicios, ordenados del más reciente al más antiguo. Todo está asociado al vehículo.")}</Text>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("Actividad")} ({items.length})</Text>
      {!items.length ? <Text style={styles.caption}>{t("Todavía no hay registros. Cargá kilometraje o servicios para verlos acá.")}</Text> : items.map((item) => <View key={item.id} style={styles.entry}>
        <View style={styles.marker}><Text>{item.type === "mileage" ? "📍" : "🛠️"}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.entryTitle}>{item.type === "mileage" ? t("Lectura de odómetro") : item.record.title}</Text>
          <Text style={styles.caption}>{new Date(item.date).toLocaleString("es-AR")}</Text>
          <Text style={styles.detail}>{item.type === "mileage" ? `${item.km.toLocaleString("es-AR")} km` : `${item.record.odometerKm.toLocaleString("es-AR")} km · ${item.record.category === "custom" ? t("Otro") : item.record.category === "oil" ? t("Aceite") : item.record.category === "filters" ? "Filtros" : item.record.category === "brakes" ? "Frenos" : item.record.category === "tires" ? "Neumáticos" : "Motor"}${item.record.cost !== undefined ? ` · $${item.record.cost.toLocaleString("es-AR")}` : ""}`}</Text>
          {item.type === "service" && item.record.notes ? <Text style={styles.detail}>{item.record.notes}</Text> : null}
        </View>
      </View>)}
    </View>
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>{t("Volver al vehículo")}</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 48, paddingBottom: 35, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 27, fontWeight: "800", color: "#20312F", marginTop: 18 },
  caption: { color: "#71817D", lineHeight: 20, marginTop: 5, fontSize: 13 },
  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 18, marginTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#20312F", marginBottom: 8 },
  entry: { flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: "#EEF2F1", paddingTop: 14, marginTop: 12 },
  marker: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E5F4F1", alignItems: "center", justifyContent: "center" },
  entryTitle: { color: "#20312F", fontSize: 15, fontWeight: "800" },
  detail: { color: "#50615D", marginTop: 5, fontSize: 13 },
  back: { padding: 15, alignItems: "center", marginTop: 10 },
  backText: { color: "#61716E", fontWeight: "700" }
});
