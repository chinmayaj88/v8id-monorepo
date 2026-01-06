/**
 * User DTOs
 * 
 * Data Transfer Objects for user operations.
 */

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UpdateUserByAdminDTO {
  firstName?: string;
  lastName?: string;
  storageQuota?: number;
  isActive?: boolean;
}

export interface ListUsersDTO {
  page?: number;
  limit?: number;
  search?: string;
}

