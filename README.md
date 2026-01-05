# v8id-cloud

A personal Google Drive alternative built with Node.js and Oracle Cloud Infrastructure (OCI). Designed for personal use with support for up to 7 users.

## 🏗️ Architecture

This is a **monorepo** project using **pnpm workspaces** with the following structure:

```
v8id-monorepo/
├── backend/          # Backend API server (Node.js/Express)
├── web/              # Web frontend (React/Vite)
├── app/              # Mobile/Desktop application
├── infra/            # Infrastructure as Code (OCI/Terraform)
└── packages/         # Shared packages and utilities
```

## 🚀 Tech Stack

- **Runtime**: Node.js 22
- **Package Manager**: pnpm 9+
- **Backend**: Node.js with TypeScript
- **Frontend**: Modern web framework (TBD)
- **Infrastructure**: OCI (Oracle Cloud Infrastructure)
- **Architecture**: Clean Architecture principles

## 📋 Prerequisites

- Node.js 22+ (use `.nvmrc` for version management)
- pnpm 9+
- OCI account and credentials

## 🛠️ Setup

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm@9
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run development servers**:
   ```bash
   pnpm dev
   ```

## 📦 Workspaces

- `@v8id-cloud/backend` - Backend API
- `@v8id-cloud/web` - Web application
- `@v8id-cloud/app` - Mobile/Desktop app
- `@v8id-cloud/infra` - Infrastructure code

## 🎯 Features (Planned)

- File upload and storage
- File organization (folders, tags)
- File sharing and collaboration
- Real-time synchronization
- Version control for files
- Search and indexing
- User management (max 7 users)
- Secure authentication and authorization

## 📝 Development Guidelines

- Follow clean architecture principles
- Use TypeScript for type safety
- Write tests for critical functionality
- Follow semantic versioning
- Commit frequently with meaningful messages

## 📄 License

ISC

