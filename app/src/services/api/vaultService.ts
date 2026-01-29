import apiClient from './apiClient';

export interface VaultSecretListItem {
  id: string;
  name: string;
  url: string | null;
  username: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultSecret extends VaultSecretListItem {
  password?: string;
  notes: string | null;
}

export interface AddVaultSecretDTO {
  name: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  category?: string;
}

const vaultService = {
  listSecrets: async (): Promise<VaultSecretListItem[]> => {
    const response = await apiClient.get('/vault');
    return response.data?.data;
  },

  getSecret: async (id: string): Promise<VaultSecret> => {
    const response = await apiClient.get(`/vault/${id}`);
    return response.data?.data;
  },

  addSecret: async (data: AddVaultSecretDTO): Promise<VaultSecret> => {
    const response = await apiClient.post('/vault', data);
    return response.data?.data;
  },

  searchSecrets: async (query: string): Promise<VaultSecretListItem[]> => {
    const response = await apiClient.get('/vault/search', {
      params: { q: query },
    });
    return response.data?.data;
  },

  deleteSecret: async (id: string): Promise<void> => {
    await apiClient.delete(`/vault/${id}`);
  },
};

export default vaultService;
