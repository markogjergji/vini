import client from "./client";
import type { TokenResponse, LoginRequest, RegisterRequest, User, UserProfileUpdate } from "../types";

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/api/auth/login", data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/api/auth/register", data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>("/api/auth/me");
  return res.data;
}

export async function updateMe(data: UserProfileUpdate): Promise<User> {
  const res = await client.put<User>("/api/auth/me", data);
  return res.data;
}
