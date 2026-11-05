import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Vehicle } from "../../types";

const VEHICLES_KEY = "@autokeep/vehicles";

export async function getVehicles(): Promise<Vehicle[]> {
  const raw = await AsyncStorage.getItem(VEHICLES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Vehicle[] : [];
  } catch { return []; }
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const vehicles = await getVehicles();
  const normalizedPlate = vehicle.plate.trim().toUpperCase();
  if (vehicles.some((item) => item.plate.trim().toUpperCase() === normalizedPlate && item.id !== vehicle.id)) {
    throw new Error("DUPLICATE_PLATE");
  }
  const existingIndex = vehicles.findIndex((item) => item.id === vehicle.id);
  const next = existingIndex < 0
    ? [...vehicles, { ...vehicle, plate: normalizedPlate }]
    : vehicles.map((item) => item.id === vehicle.id ? { ...vehicle, plate: normalizedPlate } : item);
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(next));
}

export async function updateVehicle(vehicle: Vehicle): Promise<void> {
  const vehicles = await getVehicles();
  if (!vehicles.some((item) => item.id === vehicle.id)) throw new Error("VEHICLE_NOT_FOUND");
  await saveVehicle(vehicle);
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const vehicles = await getVehicles();
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles.filter((item) => item.id !== vehicleId)));
  await AsyncStorage.multiRemove([
    `@autokeep/documents/${vehicleId}`,
    `@autokeep/mileage/${vehicleId}`,
    `@autokeep/maintenance-settings/${vehicleId}`,
    `@autokeep/service-records/${vehicleId}`
  ]);
}
