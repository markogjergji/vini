import client from "./client";
import type { PartListItem } from "../types";

export async function getFavorites(): Promise<PartListItem[]> {
  const res = await client.get<PartListItem[]>("/api/favorites/");
  return res.data;
}

export async function getFavoriteIds(): Promise<number[]> {
  const res = await client.get<number[]>("/api/favorites/ids");
  return res.data;
}

export async function addFavorite(partId: number): Promise<void> {
  await client.post(`/api/favorites/${partId}`);
}

export async function removeFavorite(partId: number): Promise<void> {
  await client.delete(`/api/favorites/${partId}`);
}
