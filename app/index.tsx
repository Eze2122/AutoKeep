import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { getVehicles } from "../src/services/storage/vehicles";
import type { Vehicle } from "../src/types";

import { useAppLanguage } from "../src/services/i18n";
export default function HomeScreen() {
  const { t } = useAppLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    getVehicles().then((items) => { if (active) setVehicles(items); })
      .catch(() => { if (active) setVehicles([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>AutoKeep</Text>
        <Text style={styles.subtitle}>{t("Tu vehículo, siempre al día.")}</Text>
      </View>
      <Text style={styles.title}>{t("Mi flota")}</Text>
      <Text style={styles.helper}>{t("Seleccioná un vehículo para gestionar su mantenimiento y documentación.")}</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 28 }} color="#137C70" size="large" /> :
      vehicles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.car}>🚘</Text>
          <Text style={styles.emptyTitle}>{t("Todavía no hay vehículos")}</Text>
          <Text style={styles.helper}>{t("Agregá el primero para empezar a llevar su control.")}</Text>
        </View>
      ) : vehicles.map((vehicle) => (
        <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} asChild>
          <Pressable style={styles.vehicle}>
            <Text style={styles.vehicleName}>{vehicle.model}</Text>
            <Text style={styles.plate}>{vehicle.plate}</Text>
            <Text style={styles.driverNames}>{t("Choferes: ")}{vehicle.drivers.map((driver) => driver.name).join(", ") || t("Sin choferes")}</Text>
          </Pressable>
        </Link>
      ))}
      <Link href="/vehicles/new" asChild>
        <Pressable style={styles.add}><Text style={styles.addText}>{t("＋ Agregar vehículo")}</Text></Pressable>
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
  driverNames: { color: "#71817D", marginTop: 8, fontSize: 13 },
  add: { backgroundColor: "#137C70", borderRadius: 16, padding: 17, alignItems: "center", marginTop: 22 },
  addText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" }
});