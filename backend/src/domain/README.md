# Domain Layer

The **innermost layer** containing enterprise business rules.

## Contents

- **Entities**: Core business objects with identity and lifecycle
- **Value Objects**: Immutable objects defined by their attributes
- **Domain Events**: Events representing something that happened in the domain
- **Domain Services**: Stateless operations that don't belong to entities

## SOLID Principles

- **Single Responsibility**: Each entity/value object has one reason to change
- **Open/Closed**: Domain objects are open for extension, closed for modification
- **Dependency Rule**: This layer has NO dependencies on outer layers

## Guidelines

1. No framework dependencies (no Express, no Prisma, etc.)
2. Pure TypeScript/JavaScript only
3. Business logic lives here
4. Entities should be self-validating
