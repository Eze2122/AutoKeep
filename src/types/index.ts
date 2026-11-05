export type Driver = { id: string; name: string };
export type Vehicle = { id: string; model: string; plate: string; drivers: Driver[]; createdAt: string };
export type MileageEntry = { id: string; vehicleId: string; odometerKm: number; recordedAt: string };
export type DocumentKind = "Permiso de transporte (aplicación)" | "Permiso de transporte (turismo)" | "RTO" | "Seguro" | "Pago de patente" | "Cédula de GNC" | "Cédula verde o azul" | "Otro documento";
export type VehicleDocument = { id: string; vehicleId: string; kind: DocumentKind; customName?: string; expiresAt: string; alertDays: number; photoUri?: string; notificationId?: string };