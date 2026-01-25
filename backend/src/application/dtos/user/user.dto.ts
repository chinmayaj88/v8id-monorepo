export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface ListUsersDTO {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN';
  storageQuota?: number;
}

