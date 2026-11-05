import { useLocalSearchParams, router } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";

export default function MaintenanceScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  return <View style={styles.container}>
    <Text style={styles.brand}>AutoKeep</Text>
    <Text style={styles.title}>Mantenimiento</Text>
    <Text style={styles.caption}>Vehículo: {vehicleId}</Text>
    <Text style={styles.body}>Registro manual de odómetro y próximo cambio de aceite. Esta sección se implementará en el siguiente paso.</Text>
    <Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Volver</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 50, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F", marginTop: 22 },
  caption: { color: "#71817D", marginTop: 8 },
  body: { color: "#61716E", lineHeight: 23, marginTop: 22 },
  button: { backgroundColor: "#137C70", padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" }
});