# Application Layer

The **Application Layer** contains use cases and application-specific business rules. It orchestrates domain objects to perform application tasks.

## Structure

- **use-cases/** - Application use cases (UploadFile, CreateFolder, ShareFile, etc.)
- **interfaces/** - Repository and service interfaces (contracts)
- **dtos/** - Data Transfer Objects for input/output

## Rules

- ✅ Can depend on domain layer
- ✅ Can define interfaces for infrastructure (repositories, services)
- ✅ Contains application-specific business logic
- ❌ Cannot depend on infrastructure or presentation layers
- ❌ Cannot contain framework-specific code

## Examples

- `UploadFileUseCase` - Handles file upload logic
- `CreateUserUseCase` - Handles user creation
- `IFileRepository` - Interface for file storage
- `IUserRepository` - Interface for user persistence

