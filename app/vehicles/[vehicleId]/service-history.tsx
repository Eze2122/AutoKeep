import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, Pressable, StyleSheet } from "react-native";
import { addServiceRecord, updateServiceRecord, deleteServiceRecord, getServiceRecords, type ServiceRecord } from "../../../src/services/storage/service-records";

import { useAppLanguage } from "../../../src/services/i18n";
const categories: { value: ServiceRecord["category"]; label: string }[] = [
  { value: "oil", label: "Aceite" }, { value: "filters", label: "Filtros" },
  { value: "brakes", label: "Frenos" }, { value: "tires", label: "Neumáticos" },
  { value: "engine", label: "Motor" }, { value: "custom", label: "Otro" }
];

export default function ServiceHistoryScreen() {
  const { t } = useAppLanguage();
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ServiceRecord["category"]>("oil");
  const [km, setKm] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  const refresh = useCallback(async () => {
    if (vehicleId) setRecords(await getServiceRecords(vehicleId));
  }, [vehicleId]);
  useFocusEffect(useCallback(() => { refresh().catch(() => Alert.alert("Error", "No se pudo cargar el historial.")); }, [refresh]));

  async function save() {
    const cleanTitle = title.trim();
    const odometer = Number(km.replace(",", "."));
    const amount = cost.trim() ? Number(cost.replace(",", ".")) : undefined;
    if (!vehicleId || !cleanTitle || !Number.isFinite(odometer) || odometer <= 0) {
      Alert.alert(t("Datos incompletos"), t("Ingresá descripción y kilometraje válido."));
      return;
    }
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      Alert.alert(t("Costo inválido"), t("El costo debe ser un número positivo."));
      return;
    }
    const record: ServiceRecord = { id: `service-${Date.now()}`, vehicleId, title: cleanTitle, category, odometerKm: odometer, performedAt: new Date().toISOString(), cost: amount, notes: notes.trim() || undefined };
    try {
      await addServiceRecord(record);
      setTitle(""); setKm(""); setCost(""); setNotes("");
      await refresh();
      Alert.alert(t("Servicio registrado"), t("Se agregó al historial de este vehículo."));
    } catch { Alert.alert(t("Error"), t("No se pudo guardar el servicio.")); }
  }

  function confirmDelete(record: ServiceRecord) {
    Alert.alert(t("Eliminar registro"), `${t("¿Eliminar “")}${record.title}” ${t("del historial?")}`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        try { if (vehicleId) await deleteServiceRecord(vehicleId, record.id); await refresh(); }
        catch { Alert.alert(t("Error"), t("No se pudo eliminar el registro.")); }
      }}
    ]);
  }

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>{t("Historial de mantenimiento")}</Text>
    <Text style={styles.caption}>{t("Cada servicio queda asociado al vehículo, no al conductor.")}</Text>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("＋ Registrar servicio")}</Text>
      <Text style={styles.label}>{t("Tipo")}</Text>
      <View style={styles.categories}>{categories.map(item => <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.category, category === item.value && styles.activeCategory]}><Text style={[styles.categoryText, category === item.value && styles.activeCategoryText]}>{item.label}</Text></Pressable>)}</View>
      <Text style={styles.label}>{t("Descripción del trabajo")}</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder={t("Ej. Cambio de aceite y filtro")} style={styles.input}/>
      <Text style={styles.label}>{t("Kilometraje del servicio")}</Text>
      <TextInput value={km} onChangeText={setKm} keyboardType="decimal-pad" placeholder={t("Ej. 253000")} style={styles.input}/>
      <Text style={styles.label}>{t("Costo (opcional)")}</Text>
      <TextInput value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="ARS" style={styles.input}/>
      <Text style={styles.label}>{t("Notas (opcional)")}</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline placeholder={t("Repuestos, taller, observaciones…")} style={[styles.input, { minHeight: 75 }]}/>
      <Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>{editingRecord ? t("Actualizar servicio") : t("Guardar servicio")}</Text></Pressable>
      {editingRecord && <Pressable style={styles.back} onPress={() => { setEditingRecord(null); setTitle(""); setKm(""); setCost(""); setNotes(""); setCategory("oil"); }}><Text style={styles.backText}>{t("Cancelar edición")}</Text></Pressable>}
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("📚 Servicios anteriores")} ({records.length})</Text>
      {!records.length ? <Text style={styles.caption}>{t("Todavía no hay servicios registrados.")}</Text> : records.map(record => <View key={record.id} style={styles.record}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          <Text style={styles.caption}>{categories.find(item => item.value === record.category)?.label} · {record.odometerKm.toLocaleString("es-AR")} km</Text>
          <Text style={styles.caption}>{new Date(record.performedAt).toLocaleString("es-AR")}{record.cost !== undefined ? ` · $${record.cost.toLocaleString("es-AR")}` : ""}</Text>
          {record.notes ? <Text style={styles.notes}>{record.notes}</Text> : null}
        </View>
        <View><Pressable onPress={() => { setEditingRecord(record); setTitle(record.title); setCategory(record.category); setKm(String(record.odometerKm)); setCost(record.cost === undefined ? "" : String(record.cost)); setNotes(record.notes ?? ""); }} style={styles.delete}><Text style={{ color: "#137C70", fontWeight: "700" }}>{t("Editar")}</Text></Pressable><Pressable onPress={() => confirmDelete(record)} style={styles.delete}><Text style={styles.deleteText}>{t("Eliminar")}</Text></Pressable></View>
      </View>)}
    </View>
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>{t("Volver al vehículo")}</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 48, paddingBottom: 35, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" }, title: { fontSize: 27, fontWeight: "800", color: "#20312F", marginTop: 18 },
  caption: { color: "#71817D", lineHeight: 20, marginTop: 6, fontSize: 13 }, card: { backgroundColor: "#FFF", borderRadius: 18, padding: 18, marginTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#20312F", marginBottom: 10 }, label: { color: "#20312F", fontWeight: "700", marginTop: 12, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: "#DDE8E5", borderRadius: 12, padding: 13, color: "#20312F", backgroundColor: "#FFF" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, category: { borderWidth: 1, borderColor: "#DDE8E5", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  activeCategory: { backgroundColor: "#E5F4F1", borderColor: "#137C70" }, categoryText: { color: "#61716E", fontWeight: "700" }, activeCategoryText: { color: "#137C70" },
  button: { backgroundColor: "#137C70", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 14 }, buttonText: { color: "#FFF", fontWeight: "800" },
  record: { borderTopWidth: 1, borderTopColor: "#EEF2F1", paddingTop: 12, marginTop: 12, flexDirection: "row", gap: 10 },
  recordTitle: { fontSize: 15, fontWeight: "800", color: "#20312F" }, notes: { color: "#50615D", marginTop: 6 }, delete: { padding: 8 }, deleteText: { color: "#B42318", fontWeight: "700" },
  back: { padding: 15, alignItems: "center", marginTop: 10 }, backText: { color: "#61716E", fontWeight: "700" }
});
