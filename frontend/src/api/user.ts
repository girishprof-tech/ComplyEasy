import { request } from './client';
import type { UserProfileDetail, UpdateProfilePayload } from '@/types';

export const userApi = {
  getProfile: () => request<UserProfileDetail>('GET', '/api/user/profile'),
  updateProfile: (data: UpdateProfilePayload) => request<UserProfileDetail>('POST', '/api/user/profile', data),
};

