import client from "./client";
import type { Make, VehicleModel, ModelYear } from "../types";

export async function getMakes(): Promise<Make[]> {
  const res = await client.get<Make[]>("/api/vehicles/makes");
  return res.data;
}

export async function getModels(makeId: number): Promise<VehicleModel[]> {
  const res = await client.get<VehicleModel[]>(`/api/vehicles/makes/${makeId}/models`);
  return res.data;
}

export async function getYears(modelId: number): Promise<ModelYear[]> {
  const res = await client.get<ModelYear[]>(`/api/vehicles/models/${modelId}/years`);
  return res.data;
}
