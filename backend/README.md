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

## Authentication & Sessions

The backend uses JWTs with device sessions and **secure HttpOnly cookies** for the web, plus bearer tokens for non-browser clients.

- **Web clients (browser / Next.js app)**:
  - On successful login (`POST /api/auth/verify-totp`), the API issues:
    - `v8id_access_token` – short-lived access token in an HttpOnly, `Secure`, `SameSite=Lax` cookie.
    - `v8id_refresh_token` – longer-lived refresh token in an HttpOnly, `Secure`, `SameSite=Lax` cookie.
  - Tokens are **not returned in the JSON body** for the default web flow.
  - The browser automatically sends cookies; protected routes read the access token from cookies via `authMiddleware`.
  - `POST /api/auth/refresh` rotates both tokens and updates the cookies.
  - `POST /api/auth/logout` revokes the current device session and clears both cookies.

- **Mobile / non-browser clients**:
  - Continue to use **Authorization: Bearer \<accessToken\>** with tokens returned in JSON.
  - `POST /api/auth/refresh` accepts a refresh token in the request body when no refresh cookie is present.

### CSRF Protection

For cookie-based web flows, state-changing requests are protected with a **double-submit CSRF token**:

- A non-HttpOnly cookie `v8id_csrf_token` is issued (and refreshed) on `/api` responses.
- The frontend must send a matching `X-CSRF-Token` header on `POST/PUT/PATCH/DELETE` requests.
- If the cookie and header don’t match, the request is rejected with `403 CSRF_TOKEN_INVALID`.

## SOLID Principles Applied

- **S**ingle Responsibility: Each class/module has one job
- **O**pen/Closed: Extend functionality without modifying existing code
- **L**iskov Substitution: Interfaces allow swappable implementations
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Inner layers don't depend on outer layers
