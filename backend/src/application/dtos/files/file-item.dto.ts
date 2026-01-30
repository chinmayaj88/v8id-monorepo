export interface FileItemDTO {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  extension?: string | null;
  thumbnailUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isOwner: boolean;
  ownerName: string;
  tier?: string;
  sharedUsers?: Array<{ name: string; avatarUrl?: string | null }>;
}

export interface FolderItemDTO {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isOwner: boolean;
  ownerName: string;
  sharedUsers?: Array<{ name: string; avatarUrl?: string | null }>;
}

export interface FolderWithBreadcrumbsDTO extends FolderItemDTO {
  breadcrumbs: FolderItemDTO[];
}

export interface SharedFileItemDTO {
  id: string; // share id
  file: FileItemDTO;
  permission: string;
  sharedAt: Date;
}

export interface SharedFolderItemDTO {
  id: string; // share id
  folder: FolderItemDTO;
  permission: string;
  sharedAt: Date;
}

export interface ListSharedWithMeResult {
  files: SharedFileItemDTO[];
  folders: SharedFolderItemDTO[];
}
