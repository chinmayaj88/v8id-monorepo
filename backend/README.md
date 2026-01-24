# Backend V2 - Clean Architecture

A fresh, maintainable backend built with **Clean Architecture** and **SOLID principles**.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Architecture

```
src/
├── domain/          # Enterprise business rules (entities, value objects)
├── application/     # Use cases, DTOs, interfaces
├── infrastructure/  # Database, config, external services
├── presentation/    # Controllers, routes, middleware
└── framework/       # Express server setup
```

## Endpoints

| Method | Path    | Description     |
| ------ | ------- | --------------- |
| GET    | /       | Welcome message |
| GET    | /health | Health check    |
| GET    | /api    | API information |

## SOLID Principles Applied

- **S**ingle Responsibility: Each class/module has one job
- **O**pen/Closed: Extend functionality without modifying existing code
- **L**iskov Substitution: Interfaces allow swappable implementations
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Inner layers don't depend on outer layers
