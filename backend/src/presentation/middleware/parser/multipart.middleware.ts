import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

/**
 * Enterprise-Grade Multipart Request Handler
 *
 * PROBLEM: Express (body-parser) strictly parses valid JSON or URL-encoded bodies.
 * Clients (like Mobile Apps or certain Postman configs) often send 'multipart/form-data'
 * even for non-file requests (just text fields). Without Multer, Express ignores these bodies.
 *
 * SOLUTION: This middleware intelligently delegates parsing strategy based on Content-Type and Route.
 *
 * 1. Checks Header: Is it 'multipart/form-data'?
 * 2. Checks Route Registry: Is this a route that expects an ACTUAL file (binary)?
 *    - YES: Delegate to the specific controller's strict configuration (validation, limits, etc).
 *    - NO: Assume it's a "Text-Over-Multipart" request. Safely parse text fields only using upload.none().
 *
 * BENEFITS:
 * - Decouples transport format from business logic (Client can send JSON or Form-Data, we don't care).
 * - Prevents route pollution (No need to add upload.none() to every single controller).
 * - Secure: Strictly filters out binaries on non-file routes to prevent DoS via large uploads.
 */

// REGISTRY: Routes that explicitly handle binary file streams.
// We MUST skip global parsing for these to allow their specific configurations to take over.
const BINARY_ROUTE_REGISTRY = [
  '/api/files/upload',
  '/api/users/me/profile', // Avatar upload
];

// Reusable instance for text-only parsing
const textOnlyParser = multer().none();

export const multipartHandler = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'];

  // 1. Fast Exit: If not multipart, let Express JSON parser handle it
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return next();
  }

  // 2. Route Check: Is this a specialized file upload route?
  // We use .some() for flexible matching of sub-paths
  const isBinaryRoute = BINARY_ROUTE_REGISTRY.some(route => req.originalUrl.includes(route));

  if (isBinaryRoute) {
    // Pass through to the specific route handler which has its own Multer config
    return next();
  }

  // 3. Fallback: Client sent multipart but we only expect text.
  // Parse fields, discard files.
  textOnlyParser(req, res, err => {
    if (err) {
      // Multer error (e.g., unexpected field, limit exceeded)
      // We wrap it in a standardized format for our Error Middleware
      return next(new Error(`Multipart Parsing Error: ${err.message}`));
    }
    next();
  });
};
