/**
 * Utility functions for handling BigInt serialization
 */

/**
 * Convert BigInt values to strings in an object recursively
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }

  return obj;
}

/**
 * Prepare document data for JSON response
 */
export function prepareDocumentForResponse(document: any): any {
  return serializeBigInt(document);
}

/**
 * Prepare documents array for JSON response
 */
export function prepareDocumentsForResponse(documents: any[]): any[] {
  return documents.map(prepareDocumentForResponse);
} 