# Infrastructure Layer

Contains **external concerns** and implementations.

## Contents

- **Config**: Environment and configuration management
- **Database**: Database connections and ORM setup
- **Repositories**: Concrete implementations of repository interfaces
- **Services**: External service integrations (email, storage, etc.)

## SOLID Principles

- **Dependency Inversion**: Implements interfaces defined in Application layer
- **Single Responsibility**: Each implementation has one concern

## Guidelines

1. Implements interfaces from Application layer
2. Contains all external dependencies (Prisma, OCI SDK, etc.)
3. Configuration and environment handling
4. Database migrations and connections
