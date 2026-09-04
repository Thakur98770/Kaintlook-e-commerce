import { apiRequest } from "./client";

export const registerRequest = (name, email, password) =>
  apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });

export const verifyOtpRequest = (email, otp) =>
  apiRequest("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) });

export const resendOtpRequest = (email) =>
  apiRequest("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }) });

export const loginRequest = (email, password) =>
  apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const forgotPasswordRequest = (email) =>
  apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPasswordRequest = (email, otp, newPassword) =>
  apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, newPassword }) });

export const getProfileRequest = () => apiRequest("/auth/me");


export const updateProfileRequest = (name) =>
  apiRequest("/auth/profile", { method: "PUT", body: JSON.stringify({ name }) });

export const changePasswordRequest = (currentPassword, newPassword) =>
  apiRequest("/auth/change-password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });