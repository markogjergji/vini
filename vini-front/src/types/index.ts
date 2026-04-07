export interface Make {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  make_id: number;
  name: string;
}

export interface ModelYear {
  id: number;
  model_id: number;
  year_start: number;
  year_end: number;
  generation: string | null;
}

export interface PartCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export interface PartImage {
  id: number;
  filename: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Seller {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_business: boolean;
  is_verified: boolean;
}

export interface CompatibleVehicle {
  model_year_id: number;
  make: Make;
  model: VehicleModel;
  model_year: ModelYear;
}

export interface PartListItem {
  id: number;
  title: string;
  price: number | null;
  currency: string;
  condition: string;
  status: string;
  location_text: string | null;
  created_at: string;
  primary_image_url: string | null;
  category: PartCategory | null;
}

export interface PartSearchResponse {
  items: PartListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PartDetail {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  condition: string;
  status: string;
  oem_number: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  seller: Seller;
  category: PartCategory | null;
  images: PartImage[];
  compatible_vehicles: CompatibleVehicle[];
}

export interface SellerCreate {
  name: string;
  phone?: string;
  email?: string;
  business_name?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_business: boolean;
}

export interface SellerUpdate {
  name?: string;
  phone?: string;
  email?: string;
  business_name?: string;
  address?: string;
  city?: string;
  is_business?: boolean;
}

export interface UserProfileUpdate {
  full_name?: string;
}

export interface PartCreate {
  seller_id: number;
  category_id?: number;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  condition: string;
  oem_number?: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  compatible_model_year_ids: number[];
}

// ── Auth / User ───────────────────────────────────────────────────────────────

export type UserRole = "admin" | "seller" | "user";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  seller_id?: number | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: number;
  sellers: number;
  parts: number;
}

export interface SellerAdmin {
  id: number;
  user_id: number | null;
  username: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_business: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartAdmin {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  status: string;
  condition: string;
  oem_number: string | null;
  location_text: string | null;
  seller_id: number;
  seller_name: string | null;
  category_name: string | null;
  created_at: string;
}
