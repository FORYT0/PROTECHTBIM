"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.validatePassword = validatePassword;
exports.needsRehash = needsRehash;
const tslib_1 = require("tslib");
const bcrypt = tslib_1.__importStar(require("bcrypt"));
/**
 * Default bcrypt work factor (cost factor)
 * Higher values = more secure but slower
 * Recommended range: 10-12 for production
 */
const DEFAULT_WORK_FACTOR = 10;
/**
 * Hash a plain text password using bcrypt
 *
 * @param password - Plain text password to hash
 * @param config - Optional configuration for hashing
 * @returns Promise resolving to the hashed password
 * @throws Error if password is empty or work factor is invalid
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('mySecurePassword123');
 * // Returns: $2b$10$...
 *
 * // With custom work factor
 * const hash = await hashPassword('mySecurePassword123', { workFactor: 12 });
 * ```
 */
async function hashPassword(password, config = {}) {
    if (!password || password.trim().length === 0) {
        throw new Error('Password cannot be empty');
    }
    const workFactor = config.workFactor ?? DEFAULT_WORK_FACTOR;
    if (workFactor < 4 || workFactor > 31) {
        throw new Error('Work factor must be between 4 and 31');
    }
    return bcrypt.hash(password, workFactor);
}
/**
 * Validate a plain text password against a hashed password
 *
 * @param password - Plain text password to validate
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await validatePassword('myPassword', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
async function validatePassword(password, hash) {
    if (!password || !hash) {
        return false;
    }
    try {
        return await bcrypt.compare(password, hash);
    }
    catch (error) {
        // Invalid hash format or other bcrypt errors
        return false;
    }
}
/**
 * Check if a password hash needs to be rehashed due to outdated work factor
 *
 * @param hash - The password hash to check
 * @param targetWorkFactor - The desired work factor (default: DEFAULT_WORK_FACTOR)
 * @returns True if the hash should be regenerated with a higher work factor
 *
 * @example
 * ```typescript
 * if (needsRehash(user.passwordHash, 12)) {
 *   // Rehash password on next login
 * }
 * ```
 */
function needsRehash(hash, targetWorkFactor = DEFAULT_WORK_FACTOR) {
    try {
        const rounds = bcrypt.getRounds(hash);
        return rounds < targetWorkFactor;
    }
    catch (error) {
        // Invalid hash format
        return true;
    }
}
//# sourceMappingURL=password.js.map