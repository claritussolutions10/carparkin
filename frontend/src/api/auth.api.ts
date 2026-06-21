import client from './client'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const signup = (data: { name: string; email: string; password: string; phone?: string }) =>
  client.post<AuthResponse>('/auth/signup', data).then((res) => res.data)

export const login = (data: { email: string; password: string }) =>
  client.post<AuthResponse>('/auth/login', data).then((res) => res.data)
