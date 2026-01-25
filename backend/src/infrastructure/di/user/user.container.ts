/**
 * User Dependency Injection Container
 */

import { sharedContainer } from '../shared/shared.container.js';
import {
  CreateUserUseCase,
  GetLoginHistoryUseCase,
  UpdateUserProfileUseCase,
  SearchUsersUseCase,
} from '../../../application/use-cases/index.js';
import { UserController } from '../../../presentation/controllers/index.js';

export class UserContainer {
  private static instance: UserContainer;

  // Use Cases
  public readonly createUserUseCase: CreateUserUseCase;
  public readonly getLoginHistoryUseCase: GetLoginHistoryUseCase;
  public readonly updateUserProfileUseCase: UpdateUserProfileUseCase;
  public readonly searchUsersUseCase: SearchUsersUseCase;

  // Controller
  public readonly userController: UserController;

  private constructor() {
    this.createUserUseCase = new CreateUserUseCase(
      sharedContainer.userRepository,
      sharedContainer.totpBackupCodeRepository,
      sharedContainer.emailService,
      sharedContainer.passwordService,
      sharedContainer.totpService
    );

    this.getLoginHistoryUseCase = new GetLoginHistoryUseCase(sharedContainer.auditLogRepository);

    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      sharedContainer.userRepository,
      sharedContainer.storageService
    );

    this.searchUsersUseCase = new SearchUsersUseCase(sharedContainer.userRepository);

    this.userController = new UserController(
      this.createUserUseCase,
      this.getLoginHistoryUseCase,
      this.updateUserProfileUseCase,
      sharedContainer.userRepository,
      sharedContainer.deviceSessionRepository,
      sharedContainer.auditLogService,
      sharedContainer.storageService
    );
  }

  public static getInstance(): UserContainer {
    if (!UserContainer.instance) {
      UserContainer.instance = new UserContainer();
    }
    return UserContainer.instance;
  }
}

export const userContainer = UserContainer.getInstance();

