import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Vehicle } from "../types";

const VEHICLES_KEY = "@autokeep/vehicles";

export async function getVehicles(): Promise<Vehicle[]> {
  const raw = await AsyncStorage.getItem(VEHICLES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Vehicle[]; } catch { return []; }
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const vehicles = await getVehicles();
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify([...vehicles, vehicle]));
}
