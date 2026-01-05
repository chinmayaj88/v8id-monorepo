# Presentation Layer

The **Presentation Layer** handles HTTP requests and responses. It's responsible for input validation, authentication, and formatting responses.

## Structure

- **controllers/** - Request handlers that call use cases
- **routes/** - Route definitions
- **middleware/** - Authentication, error handling, logging middleware
- **validators/** - Input validation schemas and logic

## Rules

- ✅ Can depend on application layer (use cases)
- ✅ Handles HTTP-specific concerns
- ✅ Validates and transforms input/output
- ❌ Cannot contain business logic (delegate to use cases)
- ❌ Cannot depend on infrastructure directly (go through application layer)

## Examples

- `FileController` - Handles file-related HTTP requests
- `UserController` - Handles user-related HTTP requests
- `AuthMiddleware` - Validates JWT tokens
- `ErrorHandlerMiddleware` - Centralized error handling

