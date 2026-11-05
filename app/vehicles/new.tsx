import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, StyleSheet, Pressable } from "react-native";
import { saveVehicle } from "../../src/services/storage/vehicles";

export default function NewVehicleScreen() {
  const { t } = useAppLanguage();
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [drivers, setDrivers] = useState([""]);
  const [saving, setSaving] = useState(false);

  const updateDriver = (index: number, value: string) =>
    setDrivers((current) => current.map((name, i) => i === index ? value : name));

  const addDriver = () => setDrivers((current) => [...current, ""]);

  async function handleSave() {
    const cleanModel = model.trim();
    const cleanPlate = plate.trim().toUpperCase();
    const cleanDrivers = drivers.map((name) => name.trim()).filter(Boolean);
    if (!cleanModel || !cleanPlate || cleanDrivers.length === 0) {
      Alert.alert("Datos incompletos", "Ingresá modelo, patente y al menos un chofer.");
      return;
    }
    setSaving(true);
    try {
      await saveVehicle({
        id: `vehicle-${Date.now()}`,
        model: cleanModel,
        plate: cleanPlate,
        drivers: cleanDrivers.map((name, index) => ({ id: `driver-${Date.now()}-${index}`, name })),
        createdAt: new Date().toISOString()
      });
      router.replace("/");
    } catch {
      Alert.alert("No se pudo guardar", "Intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>AutoKeep</Text>
      <Text style={styles.title}>{t("Agregar vehículo")}</Text>
      <Text style={styles.subtitle}>{t("Registrá los datos de tu vehículo y sus choferes.")}</Text>
      <Text style={styles.label}>{t("Modelo del vehículo")}</Text>
      <TextInput value={model} onChangeText={setModel} placeholder="Ej. Volkswagen Polo Track" style={styles.input} />
      <Text style={styles.label}>{t("Patente")}</Text>
      <TextInput value={plate} onChangeText={setPlate} placeholder="Ej. AB123CD" autoCapitalize="characters" style={styles.input} />
      <Text style={styles.label}>{t("Choferes")}</Text>
      {drivers.map((name, index) => <View key={index}>
        <Text style={styles.driverLabel}>Chofer {index + 1}</Text>
        <TextInput value={name} onChangeText={(value) => updateDriver(index, value)} placeholder={t("Nombre del chofer")} style={styles.input} />
      </View>)}
      <Pressable style={styles.secondary} onPress={addDriver}><Text style={styles.secondaryText}>{t("＋ Agregar otro chofer")}</Text></Pressable>
      <Pressable disabled={saving} style={styles.button} onPress={handleSave}><Text style={styles.buttonText}>{saving ? "Guardando..." : "Guardar vehículo"}</Text></Pressable>
      <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>{t("Cancelar")}</Text></Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 50, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F", marginTop: 20 },
  subtitle: { color: "#61716E", lineHeight: 22, marginTop: 8, marginBottom: 20 },
  label: { color: "#20312F", fontWeight: "700", marginTop: 16, marginBottom: 8 },
  driverLabel: { color: "#61716E", fontWeight: "600", marginBottom: 6 },
  input: { backgroundColor: "#FFFFFF", borderColor: "#DDE8E5", borderWidth: 1, borderRadius: 13, padding: 15, color: "#20312F" },
  secondary: { padding: 14, alignItems: "center", marginTop: 10 },
  secondaryText: { color: "#137C70", fontWeight: "700" },
  button: { backgroundColor: "#137C70", padding: 16, borderRadius: 14, marginTop: 18, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  back: { padding: 14, alignItems: "center", marginTop: 8 },
  backText: { color: "#61716E", fontWeight: "600" }
});