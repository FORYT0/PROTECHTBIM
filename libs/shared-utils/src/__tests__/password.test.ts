import { hashPassword, validatePassword, needsRehash } from '../password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully with default work factor', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt hash format
      expect(hash).not.toBe(password);
    });

    it('should hash a password with custom work factor', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password, { workFactor: 12 });

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$12\$/); // Should have work factor 12
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'mySecurePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for whitespace-only password', async () => {
      await expect(hashPassword('   ')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for work factor below minimum', async () => {
      await expect(
        hashPassword('password', { workFactor: 3 })
      ).rejects.toThrow('Work factor must be between 4 and 31');
    });

    it('should throw error for work factor above maximum', async () => {
      await expect(
        hashPassword('password', { workFactor: 32 })
      ).rejects.toThrow('Work factor must be between 4 and 31');
    });

    it('should accept minimum valid work factor', async () => {
      const hash = await hashPassword('password', { workFactor: 4 });
      expect(hash).toMatch(/^\$2[aby]\$04\$/);
    });

    it('should accept high work factor', async () => {
      const hash = await hashPassword('password', { workFactor: 12 });
      expect(hash).toMatch(/^\$2[aby]\$12\$/);
    });

    it('should handle special characters in password', async () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should handle unicode characters in password', async () => {
      const password = 'пароль密码🔒';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(100);
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'mySecurePassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should reject password with different case', async () => {
      const password = 'mySecurePassword123';
      const wrongPassword = 'MYSECUREPASSWORD123';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('password');
      const isValid = await validatePassword('', hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await validatePassword('password', '');

      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isValid = await validatePassword('password', 'invalid-hash');

      expect(isValid).toBe(false);
    });

    it('should validate password with special characters', async () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should validate password with unicode characters', async () => {
      const password = 'пароль密码🔒';
      const hash = await hashPassword(password);
      const isValid = await validatePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should work with different work factors', async () => {
      const password = 'myPassword';
      const hash4 = await hashPassword(password, { workFactor: 4 });
      const hash12 = await hashPassword(password, { workFactor: 12 });

      expect(await validatePassword(password, hash4)).toBe(true);
      expect(await validatePassword(password, hash12)).toBe(true);
    });
  });

  describe('needsRehash', () => {
    it('should return false for hash with current work factor', async () => {
      const hash = await hashPassword('password', { workFactor: 10 });
      const needs = needsRehash(hash, 10);

      expect(needs).toBe(false);
    });

    it('should return true for hash with lower work factor', async () => {
      const hash = await hashPassword('password', { workFactor: 8 });
      const needs = needsRehash(hash, 10);

      expect(needs).toBe(true);
    });

    it('should return false for hash with higher work factor', async () => {
      const hash = await hashPassword('password', { workFactor: 12 });
      const needs = needsRehash(hash, 10);

      expect(needs).toBe(false);
    });

    it('should use default work factor when not specified', async () => {
      const hash = await hashPassword('password', { workFactor: 8 });
      const needs = needsRehash(hash); // Should compare against default (10)

      expect(needs).toBe(true);
    });

    it('should return true for invalid hash format', () => {
      const needs = needsRehash('invalid-hash', 10);

      expect(needs).toBe(true);
    });

    it('should return true for empty hash', () => {
      const needs = needsRehash('', 10);

      expect(needs).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should support password change workflow', async () => {
      const oldPassword = 'oldPassword123';
      const newPassword = 'newPassword456';

      // Hash old password
      const oldHash = await hashPassword(oldPassword);

      // Validate old password
      expect(await validatePassword(oldPassword, oldHash)).toBe(true);

      // Hash new password
      const newHash = await hashPassword(newPassword);

      // Old password should not work with new hash
      expect(await validatePassword(oldPassword, newHash)).toBe(false);

      // New password should work with new hash
      expect(await validatePassword(newPassword, newHash)).toBe(true);
    });

    it('should support rehashing workflow', async () => {
      const password = 'myPassword';

      // Create hash with low work factor
      const oldHash = await hashPassword(password, { workFactor: 8 });

      // Check if rehash is needed
      expect(needsRehash(oldHash, 12)).toBe(true);

      // Validate password still works
      expect(await validatePassword(password, oldHash)).toBe(true);

      // Create new hash with higher work factor
      const newHash = await hashPassword(password, { workFactor: 12 });

      // Both hashes should validate the same password
      expect(await validatePassword(password, oldHash)).toBe(true);
      expect(await validatePassword(password, newHash)).toBe(true);

      // New hash should not need rehashing
      expect(needsRehash(newHash, 12)).toBe(false);
    });
  });
});
