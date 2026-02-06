import { vaultContainer } from '../vault/vault.container.js';
import { sharedContainer } from '../shared/shared.container.js';
import { RevokeShareUseCase } from '../../../application/use-cases/files/revoke-share.use-case.js';
import {
  UploadFileUseCase,
  GenerateFileLinkUseCase,
  DeleteFileUseCase,
  RestoreFileUseCase,
  CreateFolderUseCase,
  ListFolderContentsUseCase,
  DeleteFolderUseCase,
  RestoreFolderUseCase,
  SearchFilesUseCase,
  ListTrashUseCase,
  GetStorageAnalyticsUseCase,
  CreateFileShareUseCase,
  GetSharedFileUseCase,
  ListSharedWithMeUseCase,
  CreateFolderShareUseCase,
  GetSharedFolderUseCase,
  InitiateUploadUseCase,
  CompleteUploadUseCase,
  GetFileThumbnailUseCase,
  GetMediaAlbumsUseCase,
  MoveItemsUseCase,
  CopyItemsUseCase,
  BulkDeleteUseCase,
} from '../../../application/use-cases/index.js';
import { FileController } from '../../../presentation/controllers/files/file.controller.js';
import { FolderController } from '../../../presentation/controllers/files/folder.controller.js';
import { TrashController } from '../../../presentation/controllers/files/trash.controller.js';
import { ShareController } from '../../../presentation/controllers/files/share.controller.js';
import { SearchController } from '../../../presentation/controllers/search.controller.js';
import { FileRepository } from '../../repositories/files/file.repository.js';
import { FolderRepository } from '../../repositories/files/folder.repository.js';
import { ShareRepository } from '../../repositories/files/share.repository.js';
import { UserRepository } from '../../repositories/user/user.repository.js';

export class FilesContainer {
  private static instance: FilesContainer;

  // Repositories
  public readonly fileRepository: FileRepository;
  public readonly folderRepository: FolderRepository;
  public readonly shareRepository: ShareRepository;

  // Use Cases
  public readonly uploadFileUseCase: UploadFileUseCase;
  public readonly generateFileLinkUseCase: GenerateFileLinkUseCase;
  public readonly deleteFileUseCase: DeleteFileUseCase;
  public readonly restoreFileUseCase: RestoreFileUseCase;
  public readonly createFolderUseCase: CreateFolderUseCase;
  public readonly listFolderContentsUseCase: ListFolderContentsUseCase;
  public readonly deleteFolderUseCase: DeleteFolderUseCase;
  public readonly restoreFolderUseCase: RestoreFolderUseCase;
  public readonly searchFilesUseCase: SearchFilesUseCase;
  public readonly listTrashUseCase: ListTrashUseCase;
  public readonly getStorageAnalyticsUseCase: GetStorageAnalyticsUseCase;
  public readonly createFileShareUseCase: CreateFileShareUseCase;
  public readonly createFolderShareUseCase: CreateFolderShareUseCase;
  public readonly getSharedFileUseCase: GetSharedFileUseCase;
  public readonly getSharedFolderUseCase: GetSharedFolderUseCase;
  public readonly listSharedWithMeUseCase: ListSharedWithMeUseCase;
  public readonly initiateUploadUseCase: InitiateUploadUseCase;
  public readonly completeUploadUseCase: CompleteUploadUseCase;
  public readonly getFileThumbnailUseCase: GetFileThumbnailUseCase;
  public readonly getMediaAlbumsUseCase: GetMediaAlbumsUseCase;
  public readonly revokeShareUseCase: RevokeShareUseCase;
  public readonly moveItemsUseCase: MoveItemsUseCase;
  public readonly copyItemsUseCase: CopyItemsUseCase;
  public readonly bulkDeleteUseCase: BulkDeleteUseCase;

  // Controllers
  public readonly fileController: FileController;
  public readonly folderController: FolderController;
  public readonly trashController: TrashController;
  public readonly shareController: ShareController;
  public readonly searchController: SearchController;

  private constructor() {
    this.fileRepository = new FileRepository();
    this.folderRepository = new FolderRepository();
    this.shareRepository = new ShareRepository();

    // Use Cases implementation
    this.uploadFileUseCase = new UploadFileUseCase(
      this.fileRepository,
      this.folderRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );

    this.generateFileLinkUseCase = new GenerateFileLinkUseCase(
      this.fileRepository,
      this.folderRepository,
      sharedContainer.storageService,
      this.shareRepository,
      sharedContainer.userRepository
    );

    this.deleteFileUseCase = new DeleteFileUseCase(
      this.fileRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );

    this.restoreFileUseCase = new RestoreFileUseCase(this.fileRepository);

    this.createFolderUseCase = new CreateFolderUseCase(this.folderRepository);

    this.listFolderContentsUseCase = new ListFolderContentsUseCase(
      this.folderRepository,
      this.fileRepository,
      this.shareRepository,
      sharedContainer.userRepository
    );

    this.deleteFolderUseCase = new DeleteFolderUseCase(
      this.folderRepository,
      this.fileRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );

    this.restoreFolderUseCase = new RestoreFolderUseCase(
      this.folderRepository,
      this.fileRepository
    );

    this.searchFilesUseCase = new SearchFilesUseCase(
      this.fileRepository,
      this.folderRepository,
      new UserRepository(),
      vaultContainer.vaultRepository
    );

    this.listTrashUseCase = new ListTrashUseCase(
      this.fileRepository,
      this.folderRepository,
      sharedContainer.userRepository
    );

    this.getStorageAnalyticsUseCase = new GetStorageAnalyticsUseCase(
      this.fileRepository,
      sharedContainer.userRepository
    );

    // Share Use Cases
    this.createFileShareUseCase = new CreateFileShareUseCase(
      this.shareRepository,
      sharedContainer.userRepository,
      this.fileRepository
    );

    this.createFolderShareUseCase = new CreateFolderShareUseCase(
      this.shareRepository,
      this.folderRepository
    );

    this.getSharedFileUseCase = new GetSharedFileUseCase(this.shareRepository);
    this.getSharedFolderUseCase = new GetSharedFolderUseCase(this.shareRepository);

    this.listSharedWithMeUseCase = new ListSharedWithMeUseCase(
      this.shareRepository,
      sharedContainer.userRepository
    );

    this.revokeShareUseCase = new RevokeShareUseCase(this.shareRepository);

    this.initiateUploadUseCase = new InitiateUploadUseCase(
      this.fileRepository,
      this.folderRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );

    this.completeUploadUseCase = new CompleteUploadUseCase(
      this.fileRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );

    this.getFileThumbnailUseCase = new GetFileThumbnailUseCase(
      this.fileRepository,
      this.shareRepository,
      sharedContainer.userRepository,
      sharedContainer.storageService
    );

    this.getMediaAlbumsUseCase = new GetMediaAlbumsUseCase(this.fileRepository);

    this.moveItemsUseCase = new MoveItemsUseCase(this.fileRepository, this.folderRepository);
    this.copyItemsUseCase = new CopyItemsUseCase(
      this.fileRepository,
      this.folderRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );
    this.bulkDeleteUseCase = new BulkDeleteUseCase(
      this.deleteFileUseCase,
      this.deleteFolderUseCase
    );

    // Controllers implementation
    this.fileController = new FileController(
      this.fileRepository,
      this.generateFileLinkUseCase,
      this.deleteFileUseCase,
      this.restoreFileUseCase,
      this.getStorageAnalyticsUseCase,
      this.initiateUploadUseCase,
      this.completeUploadUseCase,
      this.getFileThumbnailUseCase,
      this.getMediaAlbumsUseCase,
      this.moveItemsUseCase,
      this.copyItemsUseCase,
      this.bulkDeleteUseCase
    );

    this.folderController = new FolderController(
      this.createFolderUseCase,
      this.listFolderContentsUseCase,
      this.deleteFolderUseCase,
      this.restoreFolderUseCase
    );

    this.trashController = new TrashController(this.listTrashUseCase);

    this.shareController = new ShareController(
      this.createFileShareUseCase,
      this.createFolderShareUseCase,
      this.getSharedFileUseCase,
      this.getSharedFolderUseCase,
      this.listSharedWithMeUseCase,
      sharedContainer.storageService,
      this.revokeShareUseCase
    );

    this.searchController = new SearchController(this.searchFilesUseCase);
  }

  public static getInstance(): FilesContainer {
    if (!FilesContainer.instance) {
      FilesContainer.instance = new FilesContainer();
    }
    return FilesContainer.instance;
  }
}

export const filesContainer = FilesContainer.getInstance();
