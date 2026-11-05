import { Link, useLocalSearchParams } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";


import { useAppLanguage } from "../../../src/services/i18n";
export default function VehicleDashboard() {
  const { t } = useAppLanguage();
  const sections = [
  { title: t("Mantenimiento"), route: "maintenance", icon: "🛠️", subtitle: t("Kilometraje y cambio de aceite") },
  { title: t("Historial unificado"), route: "timeline", icon: "🗓️", subtitle: t("Actividad del vehículo: odómetro y servicios") },
  { title: t("Historial de servicios"), route: "service-history", icon: "📚", subtitle: t("Aceite, filtros, frenos, neumáticos y costos") },
  { title: t("Documentación"), route: "documents", icon: "📄", subtitle: t("Vencimientos y archivos") },
  { title: t("Configuración"), route: "settings", icon: "⚙️", subtitle: t("Vehículo, choferes y preferencias") }
];
  const params = useLocalSearchParams<{ vehicleId: string | string[] }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  return <View style={styles.container}>
    <Text style={styles.brand}>AutoKeep</Text><Text style={styles.title}>{t("Panel del vehículo")}</Text>
    <Text style={styles.caption}>{t("Vehículo: ")}{vehicleId}</Text>
    {sections.map((item) => <Link key={item.route} href={`/vehicles/${vehicleId}/${item.route}`} asChild>
      <Pressable style={styles.card}><Text style={styles.icon}>{item.icon}</Text><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.caption}>{item.subtitle}</Text></View></Pressable>
    </Link>)}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, paddingTop: 50, backgroundColor: "#F4F8F7" },
  brand: { fontSize: 24, fontWeight: "800", color: "#137C70" },
  title: { fontSize: 25, fontWeight: "800", marginTop: 20, color: "#20312F" },
  caption: { color: "#71817D", marginTop: 5 },
  card: { flexDirection: "row", alignItems: "center", gap: 15, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 20, marginTop: 15 },
  icon: { fontSize: 30 }, cardTitle: { fontSize: 18, fontWeight: "700", color: "#20312F" }
});