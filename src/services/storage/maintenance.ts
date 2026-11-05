import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MileageEntry } from "../../types";

const mileageKey = (vehicleId: string) => `@autokeep/mileage/${vehicleId}`;
const settingsKey = (vehicleId: string) => `@autokeep/maintenance-settings/${vehicleId}`;

export type MaintenanceSettings = {
  mileageReminderHours: 12 | 24;
  mileageAlertsEnabled: boolean;
  oilIntervalKm: 8000 | 13000;
  lastOilChangeKm: number | null;
  mileageNotificationId?: string;
};

export const defaultMaintenanceSettings: MaintenanceSettings = {
  mileageReminderHours: 12,
  mileageAlertsEnabled: true,
  oilIntervalKm: 8000,
  lastOilChangeKm: null
};

export async function getMileageEntries(vehicleId: string): Promise<MileageEntry[]> {
  const raw = await AsyncStorage.getItem(mileageKey(vehicleId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as MileageEntry[] : [];
  } catch {
    return [];
  }
}

export async function addMileageEntry(entry: MileageEntry): Promise<void> {
  const entries = await getMileageEntries(entry.vehicleId);
  const next = [...entries, entry].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  await AsyncStorage.setItem(mileageKey(entry.vehicleId), JSON.stringify(next));
}

export async function updateMileageEntry(entry: MileageEntry): Promise<void> {
  const entries = await getMileageEntries(entry.vehicleId);
  if (!entries.some(item => item.id === entry.id)) throw new Error("MILEAGE_ENTRY_NOT_FOUND");
  const updated = entries
    .map(item => item.id === entry.id ? entry : item)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  await AsyncStorage.setItem(mileageKey(entry.vehicleId), JSON.stringify(updated));
}

export async function deleteMileageEntry(vehicleId: string, entryId: string): Promise<void> {
  const entries = await getMileageEntries(vehicleId);
  await AsyncStorage.setItem(mileageKey(vehicleId), JSON.stringify(entries.filter(entry => entry.id !== entryId)));
}

export async function getMaintenanceSettings(vehicleId: string): Promise<MaintenanceSettings> {
  const raw = await AsyncStorage.getItem(settingsKey(vehicleId));
  if (!raw) return defaultMaintenanceSettings;
  try {
    return { ...defaultMaintenanceSettings, ...(JSON.parse(raw) as Partial<MaintenanceSettings>) };
  } catch {
    return defaultMaintenanceSettings;
  }
}

export async function saveMaintenanceSettings(vehicleId: string, settings: MaintenanceSettings): Promise<void> {
  await AsyncStorage.setItem(settingsKey(vehicleId), JSON.stringify(settings));
}
