"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDocumentsForResponse = exports.prepareDocumentForResponse = exports.serializeBigInt = void 0;
function serializeBigInt(obj) {
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
        const serialized = {};
        for (const [key, value] of Object.entries(obj)) {
            serialized[key] = serializeBigInt(value);
        }
        return serialized;
    }
    return obj;
}
exports.serializeBigInt = serializeBigInt;
function prepareDocumentForResponse(document) {
    return serializeBigInt(document);
}
exports.prepareDocumentForResponse = prepareDocumentForResponse;
function prepareDocumentsForResponse(documents) {
    return documents.map(prepareDocumentForResponse);
}
exports.prepareDocumentsForResponse = prepareDocumentsForResponse;
//# sourceMappingURL=bigint.js.map