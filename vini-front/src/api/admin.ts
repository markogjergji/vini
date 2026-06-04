import client from "./client";
import type { AdminStats, User, SellerAdmin, PartAdmin, TokenResponse } from "../types";

export async function getAdminStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>("/api/admin/stats");
  return res.data;
}

// Users
export interface AdminUsersParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  limit?: number;
}

export interface AdminUsersPage {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export async function getAdminUsers(params?: AdminUsersParams): Promise<AdminUsersPage> {
  const res = await client.get<AdminUsersPage>("/api/admin/users", { params });
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

export async function impersonateUser(userId: number): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>(`/api/admin/users/${userId}/impersonate`);
  return res.data;
}

// Sellers
export interface AdminSellersParams {
  search?: string;
  is_verified?: boolean;
  is_business?: boolean;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  limit?: number;
}

export interface AdminSellersPage {
  items: SellerAdmin[];
  total: number;
  page: number;
  limit: number;
}

export async function getAdminSellers(params?: AdminSellersParams): Promise<AdminSellersPage> {
  const res = await client.get<AdminSellersPage>("/api/admin/sellers", { params });
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
export interface AdminPartsParams {
  search?: string;
  status?: string;
  condition?: string;
  category_id?: number;
  vehicle_search?: string;
  location_search?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  limit?: number;
}

export interface AdminPartsPage {
  items: PartAdmin[];
  total: number;
  page: number;
  limit: number;
}

export async function getAdminParts(params?: AdminPartsParams): Promise<AdminPartsPage> {
  const res = await client.get<AdminPartsPage>("/api/admin/parts", { params });
  return res.data;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const res = await client.get<AdminCategory[]>("/api/admin/categories");
  return res.data;
}

export async function createAdminCategory(data: { name: string; slug: string; parent_id?: number | null; icon?: string | null; sort_order?: number }): Promise<AdminCategory> {
  const res = await client.post<AdminCategory>("/api/admin/categories", data);
  return res.data;
}

export async function updateAdminCategory(id: number, data: { name?: string; slug?: string; parent_id?: number | null; icon?: string | null; sort_order?: number }): Promise<AdminCategory> {
  const res = await client.patch<AdminCategory>(`/api/admin/categories/${id}`, data);
  return res.data;
}

export async function deleteAdminCategory(id: number): Promise<void> {
  await client.delete(`/api/admin/categories/${id}`);
}

export async function uploadCategoryImage(id: number, file: File): Promise<AdminCategory> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post<AdminCategory>(`/api/admin/categories/${id}/image`, form);
  return res.data;
}

export async function deleteCategoryImage(id: number): Promise<void> {
  await client.delete(`/api/admin/categories/${id}/image`);
}

export async function updateAdminPart(
  id: number,
  data: {
    title?: string;
    description?: string | null;
    price?: number | null;
    currency?: string;
    condition?: string;
    status?: string;
    oem_number?: string | null;
    location_text?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    category_id?: number | null;
    compatible_vehicles?: { model_year_id: number; specific_year: number | null }[];
  }
): Promise<PartAdmin> {
  const res = await client.patch<PartAdmin>(`/api/admin/parts/${id}`, data);
  return res.data;
}

export async function deletePart(id: number): Promise<void> {
  await client.delete(`/api/admin/parts/${id}`);
}

// Makes
export interface AdminMake {
  id: number;
  name: string;
  is_active: boolean;
  model_count: number;
  generation_count: number;
}

export async function getAdminMakes(params?: { is_active?: boolean; year?: number }): Promise<AdminMake[]> {
  const res = await client.get<AdminMake[]>("/api/admin/makes", { params });
  return res.data;
}

export async function activateMake(id: number): Promise<void> {
  await client.patch(`/api/admin/makes/${id}/activate`);
}

export async function deactivateMake(id: number): Promise<void> {
  await client.patch(`/api/admin/makes/${id}/deactivate`);
}
