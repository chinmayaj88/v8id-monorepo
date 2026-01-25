/**
 * TOTP Backup Code Repository Implementation
 *
 * Concrete implementation of ITotpBackupCodeRepository using Prisma.
 */

import { prisma } from '../../database/index.js';
import {
  ITotpBackupCodeRepository,
  IPasswordService,
} from '../../../application/interfaces/index.js';

export class TotpBackupCodeRepository implements ITotpBackupCodeRepository {
  constructor(private passwordService: IPasswordService) {}
  async createCodes(userId: string, hashedCodes: string[]): Promise<void> {
    await this.deleteAllForUser(userId);

    await prisma.totpBackupCode.createMany({
      data: hashedCodes.map(hashedCode => ({
        userId,
        code: hashedCode,
        isUsed: false,
      })),
    });
  }

  async verifyAndUseCode(userId: string, code: string): Promise<boolean> {
    const backupCodes = await prisma.totpBackupCode.findMany({
      where: {
        userId,
        isUsed: false,
      },
    });

    for (const backupCode of backupCodes) {
      const isValid = await this.passwordService.verifyPassword(code, backupCode.code);
      if (isValid) {
        await prisma.totpBackupCode.update({
          where: { id: backupCode.id },
          data: {
            isUsed: true,
            usedAt: new Date(),
          },
        });
        return true;
      }
    }

    return false;
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.totpBackupCode.deleteMany({
      where: { userId },
    });
  }

  async getBackupCodeStats(
    userId: string
  ): Promise<{ total: number; unused: number; used: number }> {
    const [total, unused, used] = await Promise.all([
      prisma.totpBackupCode.count({
        where: { userId },
      }),
      prisma.totpBackupCode.count({
        where: {
          userId,
          isUsed: false,
        },
      }),
      prisma.totpBackupCode.count({
        where: {
          userId,
          isUsed: true,
        },
      }),
    ]);

    return { total, unused, used };
  }
}

