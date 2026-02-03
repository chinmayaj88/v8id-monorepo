# ☁️ v8id-cloud

<div align="center">

**Your Personal Cloud Storage Solution** | _Privacy-First • Self-Hosted • Enterprise-Grade_

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0-7F52FF?logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![OCI](https://img.shields.io/badge/OCI-Ready-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/cloud/)

</div>

---

**v8id-cloud** is a powerful, self-hosted cloud storage platform that gives you complete control over your files. Built with modern technologies and Clean Architecture principles, it offers Google Drive-like functionality while keeping your data private and secure on Oracle Cloud Infrastructure.

✨ **Perfect for** small teams, families, or individuals who want enterprise-grade file storage without the enterprise price tag.

🎯 **Key Highlights:**

- 🔒 **Privacy-First**: Your data, your control - no third-party access
- 🏗️ **Clean Architecture**: Maintainable, scalable, and testable codebase
- ☁️ **OCI-Powered**: Leverage Oracle Cloud Infrastructure for production deployment
- 🐳 **Docker-Ready**: Local development made simple
- 📦 **Monorepo**: Organized workspace with pnpm workspaces
- ⚡ **Blazing Smooth Mobile**: Native Kotlin apps for seamless mobile experience
- 🚀 **Production-Ready**: Enterprise-grade with CI/CD, Terraform IaC, and cloud-ready deployment

## 🏗️ Architecture

This is a **monorepo** project using **pnpm workspaces** with **Clean Architecture** principles. The project structure:

```
v8id-monorepo/
├── backend/                    # 🎯 Backend API server (Node.js/Express/Prisma)
│   ├── src/
│   │   ├── domain/            # Core business logic (entities, value objects)
│   │   ├── application/       # Use cases and interfaces
│   │   ├── infrastructure/    # Database, OCI, external services
│   │   ├── presentation/      # Controllers, routes, middleware
│   │   └── framework/         # Express setup, server initialization
│   └── prisma/                # Database schema and migrations
├── web/                       # 🌐 Web frontend (To be implemented)
├── app/                       # 📱 Mobile/Desktop application (To be implemented)
├── infra/                     # 🏗️ Infrastructure as Code
│   ├── docker/                # Docker Compose for local development
│   ├── terraform/             # Terraform configurations for OCI
│   └── scripts/               # Deployment and utility scripts
└── packages/                  # 📦 Shared packages and utilities
```

## 🚀 Tech Stack

### Backend

- **Runtime**: Node.js 22
- **Framework**: Express.js
- **Database**: MySQL 8.0 (via Docker, production: OCI MySQL HeatWave)
- **ORM**: Prisma
- **Language**: TypeScript
- **Architecture**: Clean Architecture

### Infrastructure

- **Local Development**: Docker Compose (MySQL + Adminer)
- **Production**: Oracle Cloud Infrastructure (OCI)
  - **IaC**: Terraform for infrastructure provisioning
  - **Database**: MySQL HeatWave on OCI
  - **Storage**: OCI Object Storage
- **Package Manager**: pnpm 9+

### Frontend (Planned)

- **Web**: Next.js 15 (To be implemented)
- **Mobile App**: Kotlin (Android) (To be implemented)

## 📋 Prerequisites

- **Node.js 22+** (use `.nvmrc` for version management)
- **pnpm 9+**
- **Docker Desktop** (for local MySQL database)
- **OCI account and credentials** (for production deployment)

## 🛠️ Setup

### 1. Install Dependencies

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm@9

# Install all workspace dependencies
pnpm install
```

### 2. Start Local Database

```bash
# Navigate to docker directory
cd infra/docker

# Start MySQL and Adminer containers
docker compose up -d

# Verify containers are running
docker compose ps
```

**Database Access:**

- **Adminer**: http://localhost:8080
  - Server: `mysql`
  - Username: `v8id_user`
  - Password: `v8id_password`
  - Database: `v8id_cloud`

### 3. Configure Environment Variables

```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit backend/.env and update if needed
# DATABASE_URL is already configured for Docker setup
```

### 4. Run Database Migrations

```bash
cd backend
pnpm prisma:generate
pnpm prisma:migrate
```

### 5. Start Development Server

```bash
# From root directory
pnpm dev:backend

# Or from backend directory
cd backend
pnpm dev
```

The backend API will be available at: http://localhost:4000

- Health check: http://localhost:4000/health

## 📦 Workspaces

- **`@v8id-cloud/backend`** - Backend API (Express + Prisma + MySQL)
- **`@v8id-cloud/web`** - Web application with Next.js (To be implemented)

> **Note**: The mobile app (Kotlin/Android) is not part of the pnpm workspace as it uses Gradle build system.

## 🎯 Features

### ✅ Currently Implemented

| Feature                  | Status    | Description                                 |
| ------------------------ | --------- | ------------------------------------------- |
| 🏗️ Monorepo Setup        | ✅        | pnpm workspaces with organized structure    |
| 🏛️ Clean Architecture    | ✅        | Enterprise-grade code organization          |
| 🚀 Express.js API        | ✅        | Fast and reliable REST API server           |
| 🗄️ Prisma ORM            | ✅        | Type-safe database access with MySQL        |
| 🐳 Docker Compose        | ✅        | One-command local development setup         |
| 📊 Database Migrations   | ✅        | Version-controlled schema management        |
| ❤️ Health Check          | ✅        | API health monitoring endpoint              |
| 📤 File Upload & Storage | 🔥 High   | OCI Object Storage integration              |
| 📁 File Organization     | 🔥 High   | Folders, tags, and metadata                 |
| 👥 File Sharing          | 🔥 High   | Share files with team members (max 7 users) |
| 🔄 Real-time Sync        | ⚡ Medium | Live file synchronization                   |
| 📜 Version Control       | ⚡ Medium | File versioning and history                 |
| 🔍 Search & Indexing     | ⚡ Medium | Fast file search capabilities               |
| 🔐 Authentication        | 🔥 High   | JWT-based secure authentication             |
| 🌐 Web Frontend          | 🔥 High   | Modern React-based web interface            |
| ☁️ Terraform IaC         | 🔥        | Infrastructure as Code for OCI              |
| 📱 Mobile App            | 💡 Low    | Native mobile applications                  |

## 📝 Available Scripts

### Root Level

```bash
pnpm dev:backend      # Start backend development server
pnpm dev:web          # Start web development server (when implemented)
pnpm build:backend    # Build backend
pnpm build:web        # Build web (when implemented)
pnpm test:backend     # Run backend tests
pnpm lint             # Lint backend code
```

### Backend Specific

```bash
cd backend
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio (database GUI)
```

## 🏛️ Backend Architecture

The backend follows **Clean Architecture** principles with clear separation of concerns:

- **Domain Layer**: Core business entities and logic (no dependencies)
- **Application Layer**: Use cases and business rules (depends on domain)
- **Infrastructure Layer**: Database, OCI, external services (implements application interfaces)
- **Presentation Layer**: HTTP controllers, routes, middleware (depends on application)
- **Framework Layer**: Express setup, server initialization (wires everything together)

See `backend/src/` for detailed layer structure.

## 🐳 Docker Commands

```bash
cd infra/docker

# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Reset database (removes all data)
docker compose down -v
```

## ☁️ Infrastructure as Code (Terraform)

The project includes Terraform configurations for deploying to Oracle Cloud Infrastructure:

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure
terraform destroy
```

**Terraform manages:**

### 🆓 Always Free Resources

- 🗄️ **MySQL HeatWave Database** (Always Free tier)
  - Database systems and configurations
  - Backup policies
  - Connection strings and endpoints
- 📦 **OCI Object Storage - Standard Bucket** (20 GB Always Free)
  - Standard storage bucket for active files
  - Bucket policies and lifecycle rules
  - Pre-authenticated requests

### 💰 Paid Resources (Minimal Cost)

- 🌐 **Compute Instances (EC2)**
  - Virtual machines for application hosting
  - Instance configurations optimized for small scale (7 users)
  - No auto-scaling needed
- 📦 **OCI Object Storage - Archive Storage** (Paid)
  - Archive tier for long-term file storage
  - Lifecycle policies to move old files to archive
  - Cost-effective cold storage

### 🔧 Infrastructure Components

- 👤 **IAM (Identity and Access Management)**
  - Users, groups, and policies
  - Service accounts and API keys
  - Compartment structure
- 💰 **Budget Management**
  - Budget alerts and notifications
  - Cost tracking and reporting
  - Spending limits and thresholds
  - Budget alerts for compute and storage
- 🔒 **Networking and Security**
  - Virtual Cloud Networks (VCN)
  - Subnets and route tables
  - Security lists and Network Security Groups (NSG)
  - Internet Gateway (no load balancer needed for 7 users)
  - NAT Gateway (if required)
- 📊 **Monitoring and Logging**
  - Cloud monitoring alarms
  - Log groups and log retention
  - Metrics and dashboards
  - Cost monitoring dashboards
- 🔐 **Security**
  - Vaults and encryption keys
  - SSL/TLS certificates
  - Security policies

### 🐳 Docker Services (Local & Production)

- 🗄️ **MySQL** - Database (via Docker Compose)
- 📊 **Adminer** - Database management UI (via Docker Compose)

> **Note**: Optimized for small-scale deployment. No load balancer needed. Most resources use OCI Always Free tier to minimize costs.

## 📈 Scalability & Performance Decisions

### Current Architecture (~7 Users)

We intentionally omitted **Redis** and **Background Workers** to prioritize simplicity, cost-efficiency, and ease of maintenance for a personal/small-team deployment.

- **Efficiency**: For a small user base, a single MySQL instance handles concurrent requests and session management effortlessly. The latency overhead of a separate caching layer outweighs the benefits at this scale.
- **Simplicity**: Node.js's non-blocking event loop handles asynchronous tasks (like file uploads) without blocking the main thread. Complex queue systems (like RabbitMQ) introduce unnecessary operational complexity for < 10 users.
- **Cost**: Eliminating extra services (Redis, Worker Nodes) keeps the infrastructure within the OCI Always Free tier or very low cost.

### 🔮 Scaling to Millions of Users

If v8id-cloud were to scale to 1 million+ users, the architecture would need to evolve significantly to handle the load, concurrency, and data volume.

#### 1. Caching Strategy (Redis/Memcached)

- **Session Management**: Move session storage from the database/memory to a distributed Redis cluster to handle millions of active sessions.
- **Query Caching**: Cache result sets of frequent database queries (e.g., file listings, user profiles) to reduce database read pressure.
- **Rate Limiting**: Implement distributed rate limiting using Redis to prevent abuse across multiple server instances.

#### 2. Asynchronous Processing (Message Queues & Workers)

- **Heavy Lifting**: Offload resource-intensive tasks (image thumbnail generation, video transcoding, file compression, virus scanning) to a background worker fleet.
- **Message Broker**: Use **RabbitMQ**, **Apache Kafka**, or **Amazon SQS** (OCI Queue) to buffer tasks. This decoupled architecture ensures the main API remains responsive even during traffic spikes.
- **Email/Notifications**: Process email delivery asynchronously to avoid API latency.

#### 3. Database Scaling

- **Read Replicas**: Deploy multiple read-only database replicas to distribute `SELECT` query load.
- **Sharding**: Partition the database horizontally (sharding) based on User ID or Region to distribute write load and storage across multiple physical nodes.
- **Connection Pooling**: Use advanced connection poolers (like PgBouncer for Postgres or ProxySQL for MySQL) to manage thousands of concurrent database connections.

#### 4. Load Balancing & Horizontal Auto-Scaling

- **Load Balancer**: Place a Load Balancer (OCI Load Balancer or NGINX) in front of the API servers to distribute incoming traffic evenly.
- **Auto-Scaling Groups**: Configure the backend server fleet to automatically scale out (add instances) during peak hours and scale in (remove instances) during low traffic to save costs.

#### 5. Content Delivery Network (CDN) & Storage

- **CDN**: Serve static assets and public file shares through a global CDN (Cloudflare or OCI CDN) to reduce latency for users worldwide.
- **Multi-Region Storage**: Replicate Object Storage buckets across different geographic regions for disaster recovery and faster access.

> **Note**: This "Hypothetical Scale" section serves as a roadmap. The current implementation remains lean to perfectly fit the needs of a personal cloud.

## 🚀 CI/CD Pipeline (Cost-Effective)

The project uses free CI/CD services to minimize costs:

- **GitHub Actions** - Free CI/CD for public repositories
  - Automated testing and builds
  - Docker image building and publishing
  - Automated deployments to OCI
  - Code quality checks and linting
  - Security scanning

- **Docker Hub Public Repository** - Free container registry
  - Public Docker image storage
  - Automated image builds from GitHub Actions
  - Version tagging and management
  - Image pull for deployments

> **Note**: CI/CD is configured via GitHub Actions workflows (`.github/workflows/`) and is separate from Terraform infrastructure management.

## 📝 Development Guidelines

- 🏛️ Follow **Clean Architecture** principles
- 🔷 Use **TypeScript** for type safety
- ✅ Write tests for critical functionality
- 📌 Follow **semantic versioning**
- 💬 Commit frequently with meaningful messages
- 🔗 Keep layers independent (dependency rule: outer → inner)
- 🧹 Keep code clean and maintainable
- 📚 Document complex logic and decisions

## 🔒 Environment Variables

See `backend/.env.example` for all required environment variables:

- Database configuration
- Server settings
- CORS configuration
- OCI credentials (for production)
- Authentication secrets

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome! Feel free to open issues or submit pull requests.

## 📄 License

ISC License - See LICENSE file for details

---

<div align="center">

**Built with ❤️ using Clean Architecture and modern technologies**

[⬆ Back to Top](#-v8id-cloud)

</div>
