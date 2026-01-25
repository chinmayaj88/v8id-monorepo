import { Folder } from '../../../../generated/prisma/index.js';
import { IFolderRepository } from '../../interfaces/index.js';

export interface CreateFolderDTO {
  parentId?: string | null;
  name: string;
}

export class CreateFolderUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute(userId: string, dto: CreateFolderDTO): Promise<Folder> {
    // 1. Validate parent folder (if provided)
    let path = '';
    if (dto.parentId) {
      const parent = await this.folderRepository.findById(dto.parentId);
      if (!parent) {
        throw new Error('Parent folder not found');
      }
      // Ensure parent belongs to user
      if (parent.userId !== userId) {
        throw new Error('Access denied to parent folder');
      }
      path = parent.path;
    }

    // 2. Normalize name
    const normalizedName = dto.name.trim();
    if (!normalizedName) {
      throw new Error('Folder name cannot be empty');
    }

    // 3. Check for duplicates in the same parent
    const exists = await this.folderRepository.existsByName(
      dto.parentId ?? null,
      normalizedName,
      userId
    );

    if (exists) {
      throw new Error('A folder with this name already exists in this location');
    }

    // 4. Construct new path
    // Path convention: /root/parent/child
    // If root: /{name}
    // If child: {parentPath}/{name}
    const newPath = path ? `${path}/${normalizedName}` : `/${normalizedName}`;

    // 5. Create folder
    return this.folderRepository.create({
      userId,
      parentId: dto.parentId ?? null,
      name: normalizedName,
      path: newPath,
    });
  }
}
