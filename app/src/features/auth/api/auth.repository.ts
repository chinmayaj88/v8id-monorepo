import { User } from '../types';
import { LoginRequest, RegisterRequest } from '../types/dtos';

export interface AuthRepository {
  login(request: LoginRequest): Promise<User>;
  register(request: RegisterRequest): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
