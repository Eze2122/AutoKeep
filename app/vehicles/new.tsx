import { router } from "expo-router";
import { Text, View, StyleSheet, Pressable } from "react-native";

export default function NewVehicleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar vehículo</Text>
      <Text style={styles.text}>Próximo paso: formulario para modelo, patente y choferes dinámicos, con guardado local.</Text>
      <Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Volver a mi flota</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#F4F8F7" },
  title: { fontSize: 28, fontWeight: "800", color: "#20312F" },
  text: { color: "#61716E", lineHeight: 22, marginTop: 12 },
  button: { backgroundColor: "#137C70", padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" }
});