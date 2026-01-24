/**
 * Search Users Use Case
 *
 * Search users by email for sharing purposes.
 * Returns minimal user info for selection.
 */

import { IUserRepository } from '../interfaces/user-repository.interface.js';

export interface SearchUsersDTO {
  query: string;
  limit?: number;
}

export interface UserSearchResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string;
}

export interface SearchUsersResult {
  users: UserSearchResult[];
  total: number;
}

export class SearchUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(requestingUserId: string, dto: SearchUsersDTO): Promise<SearchUsersResult> {
    const query = dto.query?.trim();

    if (!query || query.length < 2) {
      return { users: [], total: 0 };
    }

    const limit = Math.min(dto.limit || 10, 20); // Cap at 20 results

    // Search users by email (partial match)
    const users = await this.userRepository.searchByEmail(query, limit);

    // Filter out the requesting user and inactive users
    const filteredUsers = users
      .filter(user => user.id !== requestingUserId && user.isUserActive())
      .map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        avatarUrl: undefined, // Can be enhanced to include presigned avatar URL
      }));

    return {
      users: filteredUsers,
      total: filteredUsers.length,
    };
  }
}
