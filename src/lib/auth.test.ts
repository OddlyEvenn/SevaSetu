import { describe, it, expect, vi } from 'vitest';
import { hashPassword, verifyPassword, createAuthToken } from './auth';

// Mock the Next.js cookies module which isn't available in the standard node test environment
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock Prisma
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Auth Library Unit Tests', () => {
  describe('Password Hashing', () => {
    it('should hash a password differently than the plain text', async () => {
      const plainPassword = 'SuperSecretPassword123!';
      const hash = await hashPassword(plainPassword);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(20); // bcrypt hashes are long
    });

    it('should verify a correct password against its hash', async () => {
      const plainPassword = 'AnotherSecretPassword456!';
      const hash = await hashPassword(plainPassword);
      
      const isValid = await verifyPassword(plainPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password against a hash', async () => {
      const plainPassword = 'CorrectPassword789';
      const hash = await hashPassword(plainPassword);
      
      const isValid = await verifyPassword('WrongPassword000', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    it('should create a valid JWT string containing the payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'CITIZEN' as const,
        isVerified: true
      };

      const token = await createAuthToken(payload);
      
      // A JWT consists of three parts separated by dots
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });
});
