import client from './client'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: 'user' | 'owner' | 'admin'
  phone_number?: string
  is_email_verified?: boolean
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const signup = (data: {
  full_name: string
  email: string
  password: string
  phone_number?: string
  role: 'user' | 'owner'
}) => client.post<AuthResponse>('/auth/signup', data).then((r) => r.data)

export const login = (data: { email: string; password: string }) =>
  client.post<AuthResponse>('/auth/login', data).then((r) => r.data)

export const getMe = () =>
  client.get<{ user: AuthUser }>('/auth/me').then((r) => r.data.user)

export const forgotPassword = (email: string) =>
  client.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token: string, newPassword: string) =>
  client.post<{ message: string }>('/auth/reset-password', { token, newPassword }).then((r) => r.data)

export const verifyEmail = (token: string) =>
  client.post<{ message: string }>('/auth/verify-email', { token }).then((r) => r.data)

export const resendVerification = () =>
  client.post<{ message: string }>('/auth/resend-verification').then((r) => r.data)
