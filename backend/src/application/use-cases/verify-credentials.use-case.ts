/**
 * Verify Credentials Use Case
 * 
 * First step of two-step login: Verifies email and password.
 * Returns a temporary session token that can be used to verify TOTP.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

export interface VerifyCredentialsResult {
  requiresTotp: boolean;
  tempToken: string; // Temporary token for TOTP verification step
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export class VerifyCredentialsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, password: string): Promise<VerifyCredentialsResult> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await PasswordService.verifyPassword(
      password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 4. Check if TOTP is required (TOTP is mandatory - check if secret exists)
    const requiresTotp = !!user.totpSecret;

    // 5. Generate temporary token (short-lived, 5 minutes) for TOTP verification
    const tempToken = JwtService.generateTempToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      requiresTotp,
      tempToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}

