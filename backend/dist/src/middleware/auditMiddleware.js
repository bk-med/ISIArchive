"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = exports.auditMiddleware = void 0;
const auditService_1 = require("../services/auditService");
const recentLogs = new Map();
const DEDUP_WINDOW_MS = 1000;
const auditMiddleware = (action, resource) => {
    return (req, res, next) => {
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
        req.auditData = {
            action,
            resource,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };
        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAuditEventInternal(req, res, body);
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
async function logAuditEventInternal(req, res, responseBody) {
    try {
        if (!req.auditData)
            return;
        const userId = req.user?.id;
        const action = req.auditData.action;
        const url = req.originalUrl;
        const method = req.method;
        const dedupKey = `${userId}-${action}-${method}-${url}`;
        const now = Date.now();
        const lastLogTime = recentLogs.get(dedupKey);
        if (lastLogTime && (now - lastLogTime) < DEDUP_WINDOW_MS) {
            return;
        }
        recentLogs.set(dedupKey, now);
        if (recentLogs.size > 100) {
            const cutoff = now - DEDUP_WINDOW_MS;
            for (const [key, time] of recentLogs.entries()) {
                if (time < cutoff) {
                    recentLogs.delete(key);
                }
            }
        }
        const auditData = {
            userId,
            action,
            resource: req.auditData.resource,
            resourceId: extractResourceId(req, responseBody),
            details: buildAuditDetails(req, res, responseBody),
            ipAddress: req.auditData.ipAddress,
            userAgent: req.auditData.userAgent
        };
        await auditService_1.AuditService.log(auditData);
    }
    catch (error) {
        console.error('Error logging audit event:', error);
    }
}
function extractResourceId(req, responseBody) {
    if (req.params.id) {
        return req.params.id;
    }
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
function buildAuditDetails(req, res, responseBody) {
    const details = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode
    };
    if (Object.keys(req.query).length > 0) {
        details.query = req.query;
    }
    if (req.body && shouldIncludeRequestBody(req.auditData?.action)) {
        details.requestBody = sanitizeRequestBody(req.body);
    }
    if (responseBody && shouldIncludeResponseBody(req.auditData?.action)) {
        details.responseData = sanitizeResponseBody(responseBody);
    }
    return details;
}
function shouldIncludeRequestBody(action) {
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
function shouldIncludeResponseBody(action) {
    const actionsWithResponse = [
        'DOCUMENT_UPLOAD',
        'USER_CREATE',
        'FILIERE_CREATE',
        'MATIERE_CREATE'
    ];
    return action ? actionsWithResponse.includes(action) : false;
}
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.confirmPassword;
    delete sanitized.token;
    delete sanitized.refreshToken;
    return sanitized;
}
function sanitizeResponseBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.refreshToken;
    if (sanitized.user) {
        delete sanitized.user.password;
    }
    return sanitized;
}
async function logAuditEvent(userId, action, resource, resourceId, details, req) {
    try {
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
            const url = req.originalUrl;
            const method = req.method;
            const dedupKey = `${userId}-${action}-${method}-${url}-${resourceId || 'manual'}`;
            const now = Date.now();
            const lastLogTime = recentLogs.get(dedupKey);
            if (lastLogTime && (now - lastLogTime) < DEDUP_WINDOW_MS) {
                return;
            }
            recentLogs.set(dedupKey, now);
        }
        const auditData = {
            userId,
            action,
            resource,
            resourceId,
            details,
            ipAddress: req?.ip || req?.connection.remoteAddress,
            userAgent: req?.get('User-Agent')
        };
        await auditService_1.AuditService.log(auditData);
    }
    catch (error) {
        console.error('Error logging manual audit event:', error);
    }
}
exports.logAuditEvent = logAuditEvent;
//# sourceMappingURL=auditMiddleware.js.map