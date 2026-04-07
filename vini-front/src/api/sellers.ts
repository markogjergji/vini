import client from "./client";
import type { Seller, SellerCreate, SellerUpdate } from "../types";

export async function createSeller(data: SellerCreate): Promise<Seller> {
  const res = await client.post<Seller>("/api/sellers/", data);
  return res.data;
}

export async function getSellerById(sellerId: number): Promise<Seller> {
  const res = await client.get<Seller>(`/api/sellers/${sellerId}`);
  return res.data;
}

export async function getMySeller(): Promise<Seller> {
  const res = await client.get<Seller>("/api/sellers/me");
  return res.data;
}

export async function updateMySeller(data: SellerUpdate): Promise<Seller> {
  const res = await client.put<Seller>("/api/sellers/me", data);
  return res.data;
}
