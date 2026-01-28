import apiClient from './apiClient';

export interface DeviceSession {
  id: string;
  deviceType: string;
  deviceName: string;
  deviceId: string;
  userAgent?: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean; // Can be computed on client or returned by ID match
}

export const userService = {
  getSessions: async (): Promise<DeviceSession[]> => {
    const response = await apiClient.get<{
      data: { sessions: DeviceSession[] };
    }>('/users/me/sessions');
    return response.data.data.sessions;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/users/me/sessions/${sessionId}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await apiClient.post('/users/me/sessions/revoke-all');
  },
};
