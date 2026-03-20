/**
 * Configuration for password hashing
 */
export interface PasswordHashConfig {
    /**
     * Bcrypt work factor (cost factor)
     * Must be between 4 and 31
     * Default: 10
     */
    workFactor?: number;
}
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
export declare function hashPassword(password: string, config?: PasswordHashConfig): Promise<string>;
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
export declare function validatePassword(password: string, hash: string): Promise<boolean>;
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
export declare function needsRehash(hash: string, targetWorkFactor?: number): boolean;
//# sourceMappingURL=password.d.ts.map