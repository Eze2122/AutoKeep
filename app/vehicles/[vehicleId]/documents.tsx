import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, TextInput, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { DocumentKind, VehicleDocument } from "../../../src/types";
import { addVehicleDocument, updateVehicleDocument, deleteVehicleDocument, getVehicleDocuments } from "../../../src/services/storage/documents";
import { cancelLocalNotification, scheduleDocumentExpiryAlert } from "../../../src/services/notifications";

import { useAppLanguage } from "../../../src/services/i18n";
const kinds: DocumentKind[] = ["Permiso de transporte (aplicación)", "Permiso de transporte (turismo)", "RTO", "Seguro", "Pago de patente", "Cédula de GNC", "Cédula verde o azul", "Otro documento"];
const alertOptions = [1, 3, 7, 15, 30];

export default function DocumentsScreen() {
  const { t } = useAppLanguage();
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [kind, setKind] = useState<DocumentKind>(kinds[0]);
  const [customName, setCustomName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [alertDays, setAlertDays] = useState(7);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!vehicleId) return;
    try { setDocuments(await getVehicleDocuments(vehicleId)); }
    catch { Alert.alert(t("Error"), t("No se pudieron cargar los documentos.")); }
    finally { setLoading(false); }
  }, [vehicleId]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("Permiso requerido"), t("Permití el acceso a las fotos para adjuntar una imagen del documento.")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.75 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  async function saveDocument() {
    if (!vehicleId) return;
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(expiry) ? new Date(`${expiry}T00:00:00Z`) : null;
    const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === expiry;
    if (!validDate) {
      Alert.alert(t("Fecha inválida"), t("Ingresá la fecha con formato AAAA-MM-DD. Ejemplo: 2027-04-22.")); return;
    }
    try {
      const displayName = customName.trim() || kind;
      const notificationId = await scheduleDocumentExpiryAlert(displayName, expiry, alertDays);
      const doc: VehicleDocument = {
        id: editingDoc?.id ?? `doc-${Date.now()}`,
        vehicleId,
        kind,
        customName: customName.trim() || undefined,
        expiresAt: expiry,
        alertDays,
        photoUri,
        notificationId
      };
      if (editingDoc) {
        await updateVehicleDocument(doc);
        await cancelLocalNotification(editingDoc.notificationId);
      } else {
        await addVehicleDocument(doc);
      }
      setEditingDoc(null); setKind(kinds[0]); setCustomName(""); setExpiry(""); setPhotoUri(undefined); setAlertDays(7);
      await refresh();
      Alert.alert(t(editingDoc ? "Documento actualizado" : "Documento guardado"), t(editingDoc ? "Se actualizaron los datos y la alerta del documento." : "Se guardó en la documentación de este vehículo."));
    } catch { Alert.alert(t("Error"), t("No se pudo guardar el documento.")); }
  }

  function removeDocument(doc: VehicleDocument) {
    Alert.alert(t("Eliminar documento"), `${t("¿Querés eliminar “")}${doc.customName || t(doc.kind)}”?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { if (vehicleId) { await cancelLocalNotification(doc.notificationId); await deleteVehicleDocument(vehicleId, doc.id); await refresh(); } } }
    ]);
  }

  function status(expiresAt: string) {
    const days = Math.ceil((new Date(`${expiresAt}T23:59:59`).getTime() - Date.now()) / 86400000);
    if (days < 0) return `Vencido hace ${Math.abs(days)} día(s)`;
    if (days === 0) return "Vence hoy";
    return `Vence en ${days} día(s)`;
  }

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>{t("Documentación")}</Text>
    <Text style={styles.caption}>{t("Guardá los documentos y controlá sus vencimientos.")}</Text>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t("＋ Agregar documento")}</Text>
      <Text style={styles.label}>{t("Tipo de documento")}</Text>
      <View style={styles.kindList}>{kinds.map((item) => <Pressable key={item} onPress={() => setKind(item)} style={[styles.kindChoice, kind === item && styles.selected]}><Text style={[styles.kindText, kind === item && styles.selectedText]}>{t(item)}</Text></Pressable>)}</View>
      <Text style={styles.label}>{t("Nombre personalizado (opcional)")}</Text>
      <TextInput value={customName} onChangeText={setCustomName} placeholder={t("Ej. Seguro La Caja")} style={styles.input}/>
      <Text style={styles.label}>{t("Fecha de vencimiento (AAAA-MM-DD)")}</Text>
      <TextInput value={expiry} onChangeText={setExpiry} placeholder="2027-04-22" keyboardType="numbers-and-punctuation" style={styles.input}/>
      <Text style={styles.label}>{t("Avisar antes del vencimiento")}</Text>
      <View style={styles.row}>{alertOptions.map((days) => <Pressable key={days} onPress={() => setAlertDays(days)} style={[styles.alertChoice, alertDays === days && styles.selected]}><Text style={[styles.kindText, alertDays === days && styles.selectedText]}>{days} d</Text></Pressable>)}</View>
      <Pressable style={styles.photoButton} onPress={pickPhoto}><Text style={styles.photoText}>{photoUri ? t("Cambiar foto adjunta") : t("📷 Adjuntar foto del documento")}</Text></Pressable>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="contain" />}
      <Pressable style={styles.button} onPress={saveDocument}><Text style={styles.buttonText}>{editingDoc ? t("Actualizar documento") : t("Guardar documento")}</Text></Pressable>
      {editingDoc && <Pressable style={styles.deleteButton} onPress={() => { setEditingDoc(null); setKind(kinds[0]); setCustomName(""); setExpiry(""); setAlertDays(7); setPhotoUri(undefined); }}><Text style={styles.deleteText}>{t("Cancelar edición")}</Text></Pressable>}
    </View>
    <Text style={styles.listTitle}>{t("Documentos guardados")}</Text>
    {loading ? <ActivityIndicator color="#137C70" style={{ marginTop: 18 }} /> : documents.length === 0 ? <Text style={styles.caption}>{t("Todavía no hay documentos registrados.")}</Text> : documents.map((doc) => <View key={doc.id} style={styles.savedCard}>
      <Text style={styles.savedTitle}>{doc.customName || doc.kind}</Text>
      {doc.customName && <Text style={styles.caption}>{doc.kind}</Text>}
      <Text style={styles.savedDate}>{t("Vencimiento:")} {doc.expiresAt} · {t(status(doc.expiresAt))}</Text>
      <Text style={styles.caption}>{t("Alerta configurada:")} {doc.alertDays} {t(" días antes")}</Text>
      {doc.photoUri && <Image source={{ uri: doc.photoUri }} style={styles.preview} resizeMode="contain" />}
      <View style={{ flexDirection: "row", gap: 12 }}><Pressable style={styles.deleteButton} onPress={() => { setEditingDoc(doc); setKind(doc.kind); setCustomName(doc.customName ?? ""); setExpiry(doc.expiresAt); setAlertDays(doc.alertDays); setPhotoUri(doc.photoUri); }}><Text style={{ color: "#137C70", fontWeight: "700" }}>{t("Editar")}</Text></Pressable><Pressable style={styles.deleteButton} onPress={() => removeDocument(doc)}><Text style={styles.deleteText}>{t("Eliminar documento")}</Text></Pressable></View>
    </View>)}
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>{t("Volver al vehículo")}</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 48, paddingBottom: 35, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F", marginTop: 18 },
  caption: { color: "#71817D", lineHeight: 20, marginTop: 6, fontSize: 13 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, marginTop: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#20312F" },
  label: { color: "#20312F", fontWeight: "700", marginTop: 15, marginBottom: 8 },
  kindList: { gap: 8 },
  kindChoice: { borderWidth: 1, borderColor: "#DDE8E5", borderRadius: 11, padding: 12, backgroundColor: "#FAFCFB" },
  selected: { borderColor: "#137C70", backgroundColor: "#E5F4F1" },
  kindText: { color: "#61716E", fontWeight: "600", fontSize: 13 },
  selectedText: { color: "#137C70", fontWeight: "800" },
  input: { backgroundColor: "#FFFFFF", borderColor: "#DDE8E5", borderWidth: 1, borderRadius: 13, padding: 14, color: "#20312F" },
  row: { flexDirection: "row", gap: 6 },
  alertChoice: { flex: 1, borderWidth: 1, borderColor: "#DDE8E5", borderRadius: 10, padding: 10, alignItems: "center" },
  photoButton: { borderWidth: 1, borderColor: "#137C70", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 18 },
  photoText: { color: "#137C70", fontWeight: "700" },
  preview: { width: "100%", height: 180, marginTop: 12, borderRadius: 12 },
  button: { backgroundColor: "#137C70", padding: 15, borderRadius: 13, marginTop: 16, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  listTitle: { fontSize: 20, fontWeight: "800", color: "#20312F", marginTop: 25 },
  savedCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginTop: 12 },
  savedTitle: { fontSize: 16, fontWeight: "800", color: "#20312F" },
  savedDate: { color: "#20312F", marginTop: 8, fontSize: 13, fontWeight: "600" },
  deleteButton: { alignSelf: "flex-start", padding: 10, marginTop: 8 },
  deleteText: { color: "#B42318", fontWeight: "700" },
  back: { padding: 15, alignItems: "center", marginTop: 10 },
  backText: { color: "#61716E", fontWeight: "700" }
});