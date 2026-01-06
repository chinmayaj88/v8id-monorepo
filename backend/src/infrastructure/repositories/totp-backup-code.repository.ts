/**
 * TOTP Backup Code Repository Implementation
 * 
 * Concrete implementation of ITotpBackupCodeRepository using Prisma.
 */

import { prisma } from '../database';
import { ITotpBackupCodeRepository } from '../../application/interfaces/totp-backup-code-repository.interface';
import { PasswordService } from '../services/password.service';

export class TotpBackupCodeRepository implements ITotpBackupCodeRepository {
  async createCodes(userId: string, hashedCodes: string[]): Promise<void> {
    // Delete existing codes first
    await this.deleteAllForUser(userId);

    // Create new codes
    await prisma.totpBackupCode.createMany({
      data: hashedCodes.map((hashedCode) => ({
        userId,
        code: hashedCode,
        isUsed: false,
      })),
    });
  }

  async verifyAndUseCode(userId: string, code: string): Promise<boolean> {
    // Get all unused backup codes for the user
    const backupCodes = await prisma.totpBackupCode.findMany({
      where: {
        userId,
        isUsed: false,
      },
    });

    // Check each code
    for (const backupCode of backupCodes) {
      const isValid = await PasswordService.verifyPassword(code, backupCode.code);
      if (isValid) {
        // Mark as used
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
}

