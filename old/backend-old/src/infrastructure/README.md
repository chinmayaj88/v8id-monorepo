# Infrastructure Layer

The **Infrastructure Layer** implements the interfaces defined in the application layer. It handles external concerns like databases, APIs, and file systems.

## Structure

- **repositories/** - Concrete implementations of repository interfaces
- **database/** - Database connection, migrations, models
- **oci/** - OCI Object Storage client and implementations
- **config/** - Configuration management (environment variables, etc.)

## Rules

- ✅ Can depend on application and domain layers
- ✅ Implements interfaces from application layer
- ✅ Handles external services (OCI, databases, APIs)
- ✅ Can use external libraries and frameworks
- ❌ Should not contain business logic (that belongs in domain/application)

## Examples

- `FileRepository` - Implements IFileRepository using OCI Object Storage
- `UserRepository` - Implements IUserRepository using database
- `OciStorageClient` - OCI Object Storage client wrapper
- `DatabaseConnection` - Database connection and query handling

