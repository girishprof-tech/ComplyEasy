import { request } from './client';
import type { Me } from '@/types';

export const authApi = {
  signupAccountant: (email: string, password: string, firmName: string) =>
    request<Me>('POST', '/api/auth/signup-accountant', { email, password, firmName }),
  signupOwner: (email: string, password: string) =>
    request<Me>('POST', '/api/auth/signup-owner', { email, password }),
  login: (email: string, password: string) => request<Me>('POST', '/api/auth/login', { email, password }),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout'),
  me: () => request<Me>('GET', '/api/auth/me'),
  activate: (token: string, email: string, password: string) =>
    request<Me>('POST', '/api/auth/activate', { token, email, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('POST', '/api/portal/change-password', { currentPassword, newPassword }),
};
