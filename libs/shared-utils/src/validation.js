"use strict";
/**
 * Validation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPercentage = exports.isPositiveNumber = exports.isValidUUID = exports.isValidEmail = void 0;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
const isPositiveNumber = (value) => {
    return typeof value === 'number' && value > 0;
};
exports.isPositiveNumber = isPositiveNumber;
const isValidPercentage = (value) => {
    return typeof value === 'number' && value >= 0 && value <= 100;
};
exports.isValidPercentage = isValidPercentage;
//# sourceMappingURL=validation.js.map