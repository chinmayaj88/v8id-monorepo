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
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0]?.trim();
    
    if (ips) {
      if (ips === '::1' || ips === '::ffff:127.0.0.1') {
        return '127.0.0.1';
      }
      return ips;
    }
  }

  let ip = req.ip || req.socket.remoteAddress;

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  return ip || undefined;
}
