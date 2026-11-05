import AsyncStorage from "@react-native-async-storage/async-storage";
import type { VehicleDocument } from "../../types";

const key = (vehicleId: string) => `@autokeep/documents/${vehicleId}`;

export async function getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  const raw = await AsyncStorage.getItem(key(vehicleId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as VehicleDocument[] : [];
  } catch { return []; }
}

export async function addVehicleDocument(document: VehicleDocument): Promise<void> {
  const items = await getVehicleDocuments(document.vehicleId);
  await AsyncStorage.setItem(key(document.vehicleId), JSON.stringify([...items, document]));
}

export async function updateVehicleDocument(document: VehicleDocument): Promise<void> {
  const items = await getVehicleDocuments(document.vehicleId);
  if (!items.some((item) => item.id === document.id)) throw new Error("DOCUMENT_NOT_FOUND");
  await AsyncStorage.setItem(key(document.vehicleId), JSON.stringify(items.map((item) => item.id === document.id ? document : item)));
}

export async function deleteVehicleDocument(vehicleId: string, documentId: string): Promise<void> {
  const items = await getVehicleDocuments(vehicleId);
  await AsyncStorage.setItem(key(vehicleId), JSON.stringify(items.filter(item => item.id !== documentId)));
}
