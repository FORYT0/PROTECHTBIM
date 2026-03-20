# Password Hashing Utility

This document describes the password hashing utilities implemented for PROTECHT BIM, fulfilling **Requirement 17.1**: "THE System SHALL hash passwords using bcrypt with configurable work factor".

## Overview

The password utility provides secure password hashing and validation using the bcrypt algorithm. Bcrypt is a password hashing function designed to be computationally expensive, making it resistant to brute-force attacks.

## Features

- **Secure Hashing**: Uses bcrypt algorithm with salt generation
- **Configurable Work Factor**: Adjustable computational cost (4-31)
- **Password Validation**: Compare plain text passwords with hashes
- **Rehash Detection**: Identify outdated hashes that need updating
- **Type Safety**: Full TypeScript support with type definitions

## API Reference

### `hashPassword(password: string, config?: PasswordHashConfig): Promise<string>`

Hash a plain text password using bcrypt.

**Parameters:**
- `password` (string): Plain text password to hash
- `config` (optional): Configuration object
  - `workFactor` (number): Bcrypt work factor (4-31, default: 10)

**Returns:** Promise resolving to the hashed password

**Throws:** Error if password is empty or work factor is invalid

**Example:**
```typescript
import { hashPassword } from '@protecht-bim/shared-utils';

// Hash with default work factor (10)
const hash = await hashPassword('mySecurePassword123');

// Hash with custom work factor
const hash = await hashPassword('mySecurePassword123', { workFactor: 12 });
```

### `validatePassword(password: string, hash: string): Promise<boolean>`

Validate a plain text password against a hashed password.

**Parameters:**
- `password` (string): Plain text password to validate
- `hash` (string): Hashed password to compare against

**Returns:** Promise resolving to `true` if password matches, `false` otherwise

**Example:**
```typescript
import { validatePassword } from '@protecht-bim/shared-utils';

const isValid = await validatePassword('userPassword', storedHash);
if (isValid) {
  // Password is correct
}
```

### `needsRehash(hash: string, targetWorkFactor?: number): boolean`

Check if a password hash needs to be rehashed due to outdated work factor.

**Parameters:**
- `hash` (string): The password hash to check
- `targetWorkFactor` (number, optional): Desired work factor (default: 10)

**Returns:** `true` if the hash should be regenerated, `false` otherwise

**Example:**
```typescript
import { needsRehash } from '@protecht-bim/shared-utils';

if (needsRehash(user.passwordHash, 12)) {
  // Rehash password on next login
}
```

## Work Factor Guidelines

The work factor determines the computational cost of hashing. Higher values are more secure but slower.

| Work Factor | Time (approx) | Use Case |
|-------------|---------------|----------|
| 4-6         | < 10ms        | Testing only |
| 8-10        | 50-100ms      | Standard users |
| 11-12       | 200-500ms     | Admin accounts |
| 13+         | 1s+           | High-security scenarios |

**Recommendation:** Use work factor 10 for standard users and 12 for admin accounts.

## Security Best Practices

1. **Never store plain text passwords**: Always hash passwords before storing
2. **Use appropriate work factors**: Balance security and performance
3. **Rehash periodically**: Update hashes when increasing work factor
4. **Validate on login**: Use `validatePassword()` to check credentials
5. **Handle errors gracefully**: Don't reveal whether email or password is wrong

## Usage Examples

### User Registration

```typescript
import { hashPassword } from '@protecht-bim/shared-utils';

async function registerUser(email: string, password: string) {
  // Hash the password
  const passwordHash = await hashPassword(password);
  
  // Store in database
  await userRepository.create({
    email,
    passwordHash,
  });
}
```

### User Login

```typescript
import { validatePassword } from '@protecht-bim/shared-utils';

async function loginUser(email: string, password: string) {
  // Fetch user from database
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Validate password
  const isValid = await validatePassword(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  return user;
}
```

### Password Rehashing

```typescript
import { hashPassword, validatePassword, needsRehash } from '@protecht-bim/shared-utils';

async function loginWithRehash(email: string, password: string) {
  const user = await userRepository.findByEmail(email);
  
  // Validate password
  const isValid = await validatePassword(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Check if rehashing is needed
  if (needsRehash(user.passwordHash, 12)) {
    // Rehash with updated work factor
    const newHash = await hashPassword(password, { workFactor: 12 });
    await userRepository.update(user.id, { passwordHash: newHash });
  }
  
  return user;
}
```

## Testing

The password utility includes comprehensive unit tests covering:

- Password hashing with various work factors
- Password validation (correct and incorrect)
- Edge cases (empty passwords, invalid hashes)
- Special characters and unicode support
- Rehash detection
- Integration scenarios

Run tests:
```bash
cd libs/shared-utils
npm test
```

## Implementation Details

- **Algorithm**: bcrypt (Blowfish-based)
- **Salt**: Automatically generated per hash
- **Hash Format**: `$2b$[rounds]$[salt][hash]`
- **Library**: `bcrypt` npm package (v5.1.1)
- **TypeScript**: Full type definitions included

## Requirements Fulfilled

✅ **Requirement 17.1**: "THE System SHALL hash passwords using bcrypt with configurable work factor"

This implementation provides:
- Bcrypt password hashing
- Configurable work factor (4-31)
- Secure password validation
- Rehash detection for security upgrades

## Related Files

- `libs/shared-utils/src/password.ts` - Main implementation
- `libs/shared-utils/src/__tests__/password.test.ts` - Unit tests
- `libs/shared-utils/src/password.example.ts` - Usage examples
- `apps/api/src/entities/User.ts` - User entity with passwordHash field
