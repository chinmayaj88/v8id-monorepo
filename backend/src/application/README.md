# Application Layer

Contains **application-specific business rules** (use cases).

## Contents

- **Use Cases**: Application-specific operations
- **DTOs**: Data Transfer Objects for input/output
- **Interfaces**: Contracts for repositories and services

## SOLID Principles

- **Single Responsibility**: Each use case does one thing
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depends on abstractions, not implementations

## Guidelines

1. Use cases orchestrate domain entities
2. No framework dependencies
3. Define interfaces for infrastructure concerns
4. Input/output through DTOs only
