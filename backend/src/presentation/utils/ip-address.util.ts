/**
 * IP Address Utility
 * 
 * Helper functions for extracting and normalizing IP addresses from requests.
 */

import { Request } from 'express';

/**
 * Extract real IP address from request
 * Handles IPv6 localhost, proxy headers, and normalizes the IP
 */
export function extractIpAddress(req: Request): string | undefined {
  // Check X-Forwarded-For header first (for reverse proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0]?.trim();
    
    if (ips) {
      // Convert IPv6 localhost to IPv4
      if (ips === '::1' || ips === '::ffff:127.0.0.1') {
        return '127.0.0.1';
      }
      return ips;
    }
  }

  // Use req.ip (works when trust proxy is enabled)
  let ip = req.ip || req.socket.remoteAddress;

  // Convert IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  // Remove IPv6 prefix if present
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  return ip || undefined;
}
