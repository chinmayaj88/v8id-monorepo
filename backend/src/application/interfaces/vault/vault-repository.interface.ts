import { FileShare, FolderShare, VaultSecret, File, Folder, User, ShareType, SharePermission } from '../../../infrastructure/database/index.js';

export interface CreateVaultSecretDTO {
  userId: string;
  name: string;
  url?: string | null;
  username?: string | null;
  encryptedPassword: string;
  iv: string;
  authTag: string;
  notes?: string | null;
  category?: string;
}

export interface UpdateVaultSecretDTO {
  name?: string;
  url?: string | null;
  username?: string | null;
  encryptedPassword?: string;
  iv?: string;
  authTag?: string;
  notes?: string | null;
  category?: string;
}

export interface IVaultRepository {
  create(data: CreateVaultSecretDTO): Promise<VaultSecret>;
  findById(id: string): Promise<VaultSecret | null>;
  findByUserId(userId: string): Promise<VaultSecret[]>;
  update(id: string, data: UpdateVaultSecretDTO): Promise<VaultSecret>;
  delete(id: string): Promise<void>;
  search(userId: string, query: string): Promise<VaultSecret[]>;
}


