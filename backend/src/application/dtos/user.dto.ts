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

