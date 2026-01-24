# Presentation Layer

The **outermost layer** handling HTTP concerns.

## Contents

- **Controllers**: Handle HTTP requests and responses
- **Routes**: Express route definitions
- **Middleware**: Authentication, validation, error handling
- **Validators**: Request validation schemas
- **Utils**: Response utilities and helpers

## SOLID Principles

- **Single Responsibility**: Controllers only translate HTTP to use cases
- **Open/Closed**: Easy to add new routes without modifying existing ones

## Guidelines

1. No business logic here
2. Controllers call use cases and return responses
3. Validation happens before reaching use cases
4. Authentication/authorization middleware here
