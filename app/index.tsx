import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";

type Vehicle = { id: string; model: string; plate: string; drivers: string[] };
const initialVehicles: Vehicle[] = [];

export default function HomeScreen() {
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>AutoKeep</Text>
        <Text style={styles.subtitle}>Tu vehículo, siempre al día.</Text>
      </View>
      <Text style={styles.title}>Mi flota</Text>
      <Text style={styles.helper}>Seleccioná un vehículo para gestionar su mantenimiento y documentación.</Text>
      {vehicles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.car}>🚘</Text>
          <Text style={styles.emptyTitle}>Todavía no hay vehículos</Text>
          <Text style={styles.helper}>Agregá el primero para empezar a llevar su control.</Text>
        </View>
      ) : vehicles.map((vehicle) => (
        <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} asChild>
          <Pressable style={styles.vehicle}>
            <Text style={styles.vehicleName}>{vehicle.model}</Text>
            <Text style={styles.plate}>{vehicle.plate}</Text>
          </Pressable>
        </Link>
      ))}
      <Link href="/vehicles/new" asChild>
        <Pressable style={styles.add}><Text style={styles.addText}>＋ Agregar vehículo</Text></Pressable>
      </Link>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 22, paddingTop: 52, flexGrow: 1 },
  header: { marginBottom: 34 },
  brand: { fontSize: 32, fontWeight: "800", color: "#137C70" },
  subtitle: { fontSize: 15, color: "#61716E", marginTop: 4 },
  title: { fontSize: 24, fontWeight: "700", color: "#20312F" },
  helper: { color: "#72817E", lineHeight: 21, marginTop: 8 },
  empty: { marginTop: 26, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 24, alignItems: "center" },
  car: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#20312F" },
  vehicle: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginTop: 14 },
  vehicleName: { fontSize: 18, fontWeight: "700", color: "#20312F" },
  plate: { color: "#137C70", marginTop: 5, fontWeight: "700" },
  add: { backgroundColor: "#137C70", borderRadius: 16, padding: 17, alignItems: "center", marginTop: 22 },
  addText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" }
});