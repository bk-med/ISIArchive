import { Request, Response, NextFunction } from 'express';
import { AuditService, AuditLogData } from '../services/auditService';
import { AuditAction } from '@prisma/client';

// Simple in-memory cache to prevent duplicate logs within a short time window
const recentLogs = new Map<string, number>();
const DEDUP_WINDOW_MS = 1000; // 1 second

// Extend Request interface to include audit data
declare global {
  namespace Express {
    interface Request {
      auditData?: Partial<AuditLogData>;
    }
  }
}

/**
 * Middleware to automatically log certain actions
 */
export const auditMiddleware = (action: AuditAction, resource?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip audit logging for audit-related endpoints to prevent recursive logging
    const excludedPaths = [
      '/api/audit/logs',
      '/api/audit/stats', 
      '/api/audit/actions',
      '/api/audit/users'
    ];
    
    const shouldSkipLogging = excludedPaths.some(path => req.originalUrl.startsWith(path));
    
    if (shouldSkipLogging) {
      next();
      return;
    }

    // Store audit data in request for later use
    req.auditData = {
      action,
      resource,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Override res.json to log after successful response
    const originalJson = res.json;
    res.json = function(body: any) {
      // Only log if response is successful (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditEventInternal(req, res, body);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Log the audit event (internal function)
 */
async function logAuditEventInternal(req: Request, res: Response, responseBody?: any) {
  try {
    if (!req.auditData) return;

    const userId = req.user?.id;
    const action = req.auditData.action!;
    const url = req.originalUrl;
    const method = req.method;
    
    // Create a unique key for deduplication
    const dedupKey = `${userId}-${action}-${method}-${url}`;
    const now = Date.now();
    
    // Check if we've logged this exact action recently
    const lastLogTime = recentLogs.get(dedupKey);
    if (lastLogTime && (now - lastLogTime) < DEDUP_WINDOW_MS) {
      // Skip logging - too recent
      return;
    }
    
    // Update the last log time
    recentLogs.set(dedupKey, now);
    
    // Clean up old entries periodically (every 100 logs)
    if (recentLogs.size > 100) {
      const cutoff = now - DEDUP_WINDOW_MS;
      for (const [key, time] of recentLogs.entries()) {
        if (time < cutoff) {
          recentLogs.delete(key);
        }
      }
    }

    const auditData: AuditLogData = {
      userId,
      action,
      resource: req.auditData.resource,
      resourceId: extractResourceId(req, responseBody),
      details: buildAuditDetails(req, res, responseBody),
      ipAddress: req.auditData.ipAddress,
      userAgent: req.auditData.userAgent
    };

    await AuditService.log(auditData);
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Extract resource ID from request or response
 */
function extractResourceId(req: Request, responseBody?: any): string | undefined {
  // Try to get ID from URL params
  if (req.params.id) {
    return req.params.id;
  }

  // Try to get ID from response body
  if (responseBody && typeof responseBody === 'object') {
    if (responseBody.id) {
      return responseBody.id;
    }
    if (responseBody.document && responseBody.document.id) {
      return responseBody.document.id;
    }
    if (responseBody.user && responseBody.user.id) {
      return responseBody.user.id;
    }
  }

  return undefined;
}

/**
 * Build audit details object
 */
function buildAuditDetails(req: Request, res: Response, responseBody?: any): any {
  const details: any = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode
  };

  // Add query parameters if present
  if (Object.keys(req.query).length > 0) {
    details.query = req.query;
  }

  // Add request body for certain actions (excluding sensitive data)
  if (req.body && shouldIncludeRequestBody(req.auditData?.action)) {
    details.requestBody = sanitizeRequestBody(req.body);
  }

  // Add response data for certain actions
  if (responseBody && shouldIncludeResponseBody(req.auditData?.action)) {
    details.responseData = sanitizeResponseBody(responseBody);
  }

  return details;
}

/**
 * Determine if request body should be included in audit log
 */
function shouldIncludeRequestBody(action?: AuditAction): boolean {
  const actionsWithBody = [
    'DOCUMENT_UPLOAD',
    'DOCUMENT_UPDATE',
    'COMMENT_CREATE',
    'COMMENT_UPDATE',
    'USER_CREATE',
    'USER_UPDATE',
    'FILIERE_CREATE',
    'FILIERE_UPDATE',
    'MATIERE_CREATE',
    'MATIERE_UPDATE'
  ];
  return action ? actionsWithBody.includes(action) : false;
}

/**
 * Determine if response body should be included in audit log
 */
function shouldIncludeResponseBody(action?: AuditAction): boolean {
  const actionsWithResponse = [
    'DOCUMENT_UPLOAD',
    'USER_CREATE',
    'FILIERE_CREATE',
    'MATIERE_CREATE'
  ];
  return action ? actionsWithResponse.includes(action) : false;
}

/**
 * Remove sensitive data from request body
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  delete sanitized.refreshToken;

  return sanitized;
}

/**
 * Remove sensitive data from response body
 */
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.refreshToken;

  // If it's a user object, remove sensitive fields
  if (sanitized.user) {
    delete sanitized.user.password;
  }

  return sanitized;
}

/**
 * Manual audit logging function for custom events
 */
export async function logAuditEvent(
  userId: string | undefined,
  action: AuditAction,
  resource?: string,
  resourceId?: string,
  details?: any,
  req?: Request
): Promise<void> {
  try {
    // Skip audit logging for audit-related endpoints to prevent recursive logging
    if (req) {
      const excludedPaths = [
        '/api/audit/logs',
        '/api/audit/stats', 
        '/api/audit/actions',
        '/api/audit/users'
      ];
      
      const shouldSkipLogging = excludedPaths.some(path => req.originalUrl.startsWith(path));
      
      if (shouldSkipLogging) {
        return;
      }
      
      // Deduplication for manual logs
      const url = req.originalUrl;
      const method = req.method;
      const dedupKey = `${userId}-${action}-${method}-${url}-${resourceId || 'manual'}`;
      const now = Date.now();
      
      const lastLogTime = recentLogs.get(dedupKey);
      if (lastLogTime && (now - lastLogTime) < DEDUP_WINDOW_MS) {
        // Skip logging - too recent
        return;
      }
      
      recentLogs.set(dedupKey, now);
    }

    const auditData: AuditLogData = {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip || req?.connection.remoteAddress,
      userAgent: req?.get('User-Agent')
    };

    await AuditService.log(auditData);
  } catch (error) {
    console.error('Error logging manual audit event:', error);
  }
} 