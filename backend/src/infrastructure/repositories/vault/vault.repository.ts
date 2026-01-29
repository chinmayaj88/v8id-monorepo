import { VaultSecret } from '../../../generated/prisma/index.js';
import { prisma } from '../../database/index.js';
import {
  IVaultRepository,
  CreateVaultSecretDTO,
  UpdateVaultSecretDTO,
} from '../../application/interfaces/vault/vault-repository.interface.js';

export class VaultRepository implements IVaultRepository {
  constructor() {}

  async create(data: CreateVaultSecretDTO): Promise<VaultSecret> {
    return prisma.vaultSecret.create({
      data,
    });
  }

  async findById(id: string): Promise<VaultSecret | null> {
    return prisma.vaultSecret.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<VaultSecret[]> {
    return prisma.vaultSecret.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: UpdateVaultSecretDTO): Promise<VaultSecret> {
    return prisma.vaultSecret.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.vaultSecret.delete({
      where: { id },
    });
  }

  async search(userId: string, query: string): Promise<VaultSecret[]> {
    return prisma.vaultSecret.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query } },
          { url: { contains: query } },
          { username: { contains: query } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }
}
