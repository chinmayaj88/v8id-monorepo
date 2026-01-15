/**
 * Password Service
 * 
 * Handles password hashing and verification using bcrypt.
 */

import bcrypt from 'bcrypt';
import { IPasswordService } from '../../application/interfaces/password-service.interface.js';

export class PasswordService implements IPasswordService {
  constructor(private saltRounds: number = parseInt(process.env.BCRYPT_ROUNDS || '12', 10)) {}

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

