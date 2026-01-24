# Domain Layer

The **Domain Layer** is the innermost layer and contains the core business logic. It has **no dependencies** on other layers.

## Structure

- **entities/** - Core business entities (User, File, Folder, etc.)
- **value-objects/** - Immutable value objects (Email, FilePath, etc.)
- **services/** - Domain services that contain business logic that doesn't belong to a single entity

## Rules

- ✅ Can contain business logic
- ✅ Can define interfaces for repositories (but not implementations)
- ❌ Cannot depend on application, infrastructure, or presentation layers
- ❌ Cannot use external libraries (except for types/utilities)
- ❌ Cannot access databases, APIs, or file systems directly

## Examples

- `User` entity with business rules
- `File` entity with validation logic
- `Email` value object with validation
- `FilePermissions` value object

