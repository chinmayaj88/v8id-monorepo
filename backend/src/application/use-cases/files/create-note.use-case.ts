import { IFileRepository, IStorageService, IUserRepository } from '../../interfaces/index.js';
import { File, StorageTier } from '../../../infrastructure/database/index.js';

export interface CreateNoteDTO {
  name: string;
  content: string;
  folderId?: string | null;
}

export class CreateNoteUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: CreateNoteDTO): Promise<File> {
    const buffer = Buffer.from(dto.content, 'utf-8');
    const size = BigInt(buffer.length);

    // 1. Validate Quota
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.storageUsed + size > user.storageQuota) {
      throw new Error('Storage quota exceeded');
    }

    // 2. Filename Deduplication (ensure .txt extension)
    let fileName = dto.name.endsWith('.txt') ? dto.name : `${dto.name}.txt`;
    const exists = await this.fileRepository.existsByName(dto.folderId || null, fileName, userId);
    if (exists) {
      const timestamp = Math.floor(Date.now() / 1000);
      fileName = `${fileName.replace('.txt', '')}_${timestamp}.txt`;
    }

    // 3. Generate Storage Key
    const fileUuid = crypto.randomUUID();
    const storageKey = `${userId}/${fileUuid}-${fileName}`;

    // 4. Upload to Storage
    await this.storageService.uploadFile({
      objectName: storageKey,
      file: buffer,
      contentType: 'text/plain',
      tier: StorageTier.STANDARD,
    });

    // 5. Create DB Record
    const file = await this.fileRepository.create({
      userId,
      folderId: dto.folderId || null,
      name: fileName,
      storageKey,
      storageTier: StorageTier.STANDARD,
      size,
      mimeType: 'text/plain',
      extension: 'txt',
      isOfflineAvailable: false,
    });

    // 6. Update User Storage Usage
    await this.userRepository.incrementStorageUsed(userId, size);

    return file;
  }
}
