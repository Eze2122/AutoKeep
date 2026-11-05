import AsyncStorage from "@react-native-async-storage/async-storage";

export type ServiceRecord = {
  id: string;
  vehicleId: string;
  title: string;
  category: "oil" | "filters" | "brakes" | "tires" | "engine" | "custom";
  odometerKm: number;
  performedAt: string;
  cost?: number;
  notes?: string;
};

const recordsKey = (vehicleId: string) => `@autokeep/service-records/${vehicleId}`;

export async function getServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
  const raw = await AsyncStorage.getItem(recordsKey(vehicleId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ServiceRecord[] : [];
  } catch { return []; }
}

export async function addServiceRecord(record: ServiceRecord): Promise<void> {
  const records = await getServiceRecords(record.vehicleId);
  await AsyncStorage.setItem(recordsKey(record.vehicleId), JSON.stringify(
    [...records, record].sort((a, b) => b.performedAt.localeCompare(a.performedAt))
  ));
}

export async function updateServiceRecord(record: ServiceRecord): Promise<void> {
  const records = await getServiceRecords(record.vehicleId);
  if (!records.some(item => item.id === record.id)) throw new Error("SERVICE_RECORD_NOT_FOUND");
  await AsyncStorage.setItem(recordsKey(record.vehicleId), JSON.stringify(
    records.map(item => item.id === record.id ? record : item).sort((a, b) => b.performedAt.localeCompare(a.performedAt))
  ));
}

export async function deleteServiceRecord(vehicleId: string, recordId: string): Promise<void> {
  const records = await getServiceRecords(vehicleId);
  await AsyncStorage.setItem(recordsKey(vehicleId), JSON.stringify(records.filter(item => item.id !== recordId)));
}
