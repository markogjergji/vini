import client from "./client";
import type { AdminStats, User, SellerAdmin, PartAdmin } from "../types";

export async function getAdminStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>("/api/admin/stats");
  return res.data;
}

// Users
export async function getAdminUsers(): Promise<User[]> {
  const res = await client.get<User[]>("/api/admin/users");
  return res.data;
}

export async function updateUser(id: number, data: { role?: string; is_active?: boolean; full_name?: string }): Promise<User> {
  const res = await client.patch<User>(`/api/admin/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/api/admin/users/${id}`);
}

export async function makeUserSeller(
  userId: number,
  data: { name?: string; phone?: string; business_name?: string; city?: string; is_business?: boolean }
): Promise<User> {
  const res = await client.post<User>(`/api/admin/users/${userId}/make-seller`, data);
  return res.data;
}

export async function revokeUserSeller(userId: number): Promise<User> {
  const res = await client.delete<User>(`/api/admin/users/${userId}/make-seller`);
  return res.data;
}

// Sellers
export async function getAdminSellers(): Promise<SellerAdmin[]> {
  const res = await client.get<SellerAdmin[]>("/api/admin/sellers");
  return res.data;
}

export async function verifySeller(id: number): Promise<void> {
  await client.patch(`/api/admin/sellers/${id}/verify`);
}

export async function unverifySeller(id: number): Promise<void> {
  await client.patch(`/api/admin/sellers/${id}/unverify`);
}

export async function updateAdminSeller(
  id: number,
  data: { name?: string; phone?: string; email?: string; business_name?: string; address?: string; city?: string; is_business?: boolean }
): Promise<SellerAdmin> {
  const res = await client.patch<SellerAdmin>(`/api/admin/sellers/${id}`, data);
  return res.data;
}

// Parts
export async function getAdminParts(): Promise<PartAdmin[]> {
  const res = await client.get<PartAdmin[]>("/api/admin/parts");
  return res.data;
}

export async function updateAdminPart(
  id: number,
  data: { title?: string; description?: string; price?: number; currency?: string; condition?: string; status?: string; oem_number?: string; location_text?: string }
): Promise<PartAdmin> {
  const res = await client.patch<PartAdmin>(`/api/admin/parts/${id}`, data);
  return res.data;
}

export async function deletePart(id: number): Promise<void> {
  await client.delete(`/api/admin/parts/${id}`);
}
