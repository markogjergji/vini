import client from "./client";
import type { Make, VehicleModel, ModelYear } from "../types";

export async function getAvailableYears(): Promise<number[]> {
  const res = await client.get<number[]>("/api/vehicles/years");
  return res.data;
}

export async function getMakesByYear(year: number): Promise<Make[]> {
  const res = await client.get<Make[]>(`/api/vehicles/years/${year}/makes`);
  return res.data;
}

export async function getMakes(): Promise<Make[]> {
  const res = await client.get<Make[]>("/api/vehicles/makes");
  return res.data;
}

export async function getModels(makeId: number, year?: number): Promise<VehicleModel[]> {
  const res = await client.get<VehicleModel[]>(`/api/vehicles/makes/${makeId}/models`, {
    params: year !== undefined ? { year } : undefined,
  });
  return res.data;
}

export async function getTrims(modelId: number, year?: number): Promise<ModelYear[]> {
  const res = await client.get<ModelYear[]>(`/api/vehicles/models/${modelId}/trims`, {
    params: year !== undefined ? { year } : undefined,
  });
  return res.data;
}
