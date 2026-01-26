import { AuthRepository } from './auth.repository';
import { LoginRequest } from '../types/dtos';
import { User } from '../types';

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(request: LoginRequest): Promise<User> {
    // Business logic can go here (e.g. validation)
    if (!request.email) {
      throw new Error('Email is required');
    }
    return this.authRepository.login(request);
  }
}
