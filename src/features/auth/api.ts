import { apiRequest } from "@/shared/api/browser-client";
import type { components } from "@/shared/api/schema";
import { browserApiUrl, clearSession, setSession, type SessionResponse } from "./session";

type Schemas = components["schemas"];

export type RegisterRequest = Schemas["RegisterRequest"];
export type Me = Schemas["MeResponse"];
export type Profile = Schemas["ProfileResponse"];
export type UpdateProfileRequest = Schemas["UpdateProfileRequest"];

async function startSession(promise: Promise<SessionResponse>): Promise<SessionResponse> {
  const session = await promise;
  setSession(session);
  return session;
}

export function register(request: RegisterRequest): Promise<SessionResponse> {
  return startSession(apiRequest<SessionResponse>("/api/v1/auth/register", { method: "POST", body: request }));
}

export function login(email: string, password: string): Promise<SessionResponse> {
  return startSession(apiRequest<SessionResponse>("/api/v1/auth/login", { method: "POST", body: { email, password } }));
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${browserApiUrl()}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": "ecommerce-web" },
    });
  } finally {
    clearSession();
  }
}

export function changePassword(currentPassword: string, newPassword: string): Promise<SessionResponse> {
  return startSession(
    apiRequest<SessionResponse>("/api/v1/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
      auth: true,
    }),
  );
}

export function forgotPassword(email: string): Promise<void> {
  return apiRequest("/api/v1/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiRequest("/api/v1/auth/reset-password", { method: "POST", body: { token, newPassword } });
}

export function confirmEmail(token: string): Promise<void> {
  return apiRequest("/api/v1/auth/confirm-email", { method: "POST", body: { token } });
}

export function resendConfirmation(): Promise<void> {
  return apiRequest("/api/v1/auth/resend-confirmation", { method: "POST", auth: true });
}

export function getMe(): Promise<Me> {
  return apiRequest<Me>("/api/v1/auth/me", { auth: true });
}

export function getProfile(): Promise<Profile> {
  return apiRequest<Profile>("/api/v1/me/profile", { auth: true });
}

export function updateProfile(request: UpdateProfileRequest): Promise<void> {
  return apiRequest("/api/v1/me/profile", { method: "PUT", body: request, auth: true });
}
