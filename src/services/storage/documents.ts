import AsyncStorage from "@react-native-async-storage/async-storage";
import type { VehicleDocument } from "../types";

const key = (vehicleId: string) => `@autokeep/documents/${vehicleId}`;
export async function getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  const raw = await AsyncStorage.getItem(key(vehicleId));
  if (!raw) return [];
  try { return JSON.parse(raw) as VehicleDocument[]; } catch { return []; }
}
export async function addVehicleDocument(document: VehicleDocument): Promise<void> {
  const items = await getVehicleDocuments(document.vehicleId);
  await AsyncStorage.setItem(key(document.vehicleId), JSON.stringify([...items, document]));
}
export async function deleteVehicleDocument(vehicleId: string, documentId: string): Promise<void> {
  const items = await getVehicleDocuments(vehicleId);
  await AsyncStorage.setItem(key(vehicleId), JSON.stringify(items.filter(item => item.id !== documentId)));
}
