import { sharedContainer } from '../shared/shared.container.js';
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
} from '../../../application/use-cases/index.js';
import { FileController } from '../../../presentation/controllers/files/file.controller.js';
import { FolderController } from '../../../presentation/controllers/files/folder.controller.js';
import { TrashController } from '../../../presentation/controllers/files/trash.controller.js';
import { FileRepository } from '../../repositories/files/file.repository.js';
import { FolderRepository } from '../../repositories/files/folder.repository.js';

export class FilesContainer {
  private static instance: FilesContainer;

  // Repositories
  public readonly fileRepository: FileRepository;
  public readonly folderRepository: FolderRepository;

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

  // Controllers
  public readonly fileController: FileController;
  public readonly folderController: FolderController;
  public readonly trashController: TrashController;

  private constructor() {
    this.fileRepository = new FileRepository();
    this.folderRepository = new FolderRepository();

    // Use Cases implementation
    this.uploadFileUseCase = new UploadFileUseCase(
      this.fileRepository,
      this.folderRepository,
      sharedContainer.storageService,
      sharedContainer.userRepository
    );

    this.generateFileLinkUseCase = new GenerateFileLinkUseCase(
      this.fileRepository,
      sharedContainer.storageService
    );

    this.deleteFileUseCase = new DeleteFileUseCase(
      this.fileRepository,
      sharedContainer.storageService
    );

    this.restoreFileUseCase = new RestoreFileUseCase(this.fileRepository);

    this.createFolderUseCase = new CreateFolderUseCase(this.folderRepository);

    this.listFolderContentsUseCase = new ListFolderContentsUseCase(
      this.folderRepository,
      this.fileRepository
    );

    this.deleteFolderUseCase = new DeleteFolderUseCase(
      this.folderRepository,
      this.fileRepository,
      sharedContainer.storageService
    );

    this.restoreFolderUseCase = new RestoreFolderUseCase(
      this.folderRepository,
      this.fileRepository
    );

    this.searchFilesUseCase = new SearchFilesUseCase(this.fileRepository, this.folderRepository);

    this.listTrashUseCase = new ListTrashUseCase(this.fileRepository, this.folderRepository);

    // Controllers implementation
    this.fileController = new FileController(
      this.uploadFileUseCase,
      this.generateFileLinkUseCase,
      this.deleteFileUseCase,
      this.restoreFileUseCase
    );

    this.folderController = new FolderController(
      this.createFolderUseCase,
      this.listFolderContentsUseCase,
      this.deleteFolderUseCase,
      this.restoreFolderUseCase
    );

    this.trashController = new TrashController(this.listTrashUseCase);
  }

  public static getInstance(): FilesContainer {
    if (!FilesContainer.instance) {
      FilesContainer.instance = new FilesContainer();
    }
    return FilesContainer.instance;
  }
}

export const filesContainer = FilesContainer.getInstance();
