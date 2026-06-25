import api from './client';
import type { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
  space?: any;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function getMe(): Promise<{ user: User; space?: any }> {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function getShareData(type: string, id: string | number) {
  const { data } = await api.get(`/share/${type}/${id}`);
  return data;
}
