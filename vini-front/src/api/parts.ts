import client from "./client";
import type { PartSearchResponse, PartDetail, PartCategory, PartCreate, PartImage } from "../types";

export async function searchParts(params: {
  make_id?: number;
  model_id?: number;
  model_year_id?: number;
  seller_id?: number;
  page?: number;
  limit?: number;
}): Promise<PartSearchResponse> {
  const res = await client.get<PartSearchResponse>("/api/parts/search", { params });
  return res.data;
}

export async function getPartById(partId: number): Promise<PartDetail> {
  const res = await client.get<PartDetail>(`/api/parts/${partId}`);
  return res.data;
}

export async function createPart(data: PartCreate): Promise<PartDetail> {
  const res = await client.post<PartDetail>("/api/parts/", data);
  return res.data;
}

export async function uploadPartImages(partId: number, files: File[]): Promise<PartImage[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  const res = await client.post<PartImage[]>(`/api/parts/${partId}/images`, form);
  return res.data;
}

export async function getCategories(): Promise<PartCategory[]> {
  const res = await client.get<PartCategory[]>("/api/parts/categories");
  return res.data;
}
