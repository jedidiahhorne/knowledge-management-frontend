import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  validateFullName,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('returns null for valid email', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
    });

    it('returns error for empty email', () => {
      expect(validateEmail('')).toBe('Email is required');
    });

    it('returns error for invalid email format', () => {
      expect(validateEmail('invalid')).toBe('Please enter a valid email address');
      expect(validateEmail('invalid@')).toBe('Please enter a valid email address');
      expect(validateEmail('@example.com')).toBe('Please enter a valid email address');
    });
  });

  describe('validateUsername', () => {
    it('returns null for valid username', () => {
      expect(validateUsername('testuser')).toBeNull();
      expect(validateUsername('user123')).toBeNull();
      expect(validateUsername('user_name')).toBeNull();
    });

    it('returns error for empty username', () => {
      expect(validateUsername('')).toBe('Username is required');
    });

    it('returns error for too short username', () => {
      expect(validateUsername('ab')).toBe('Username must be at least 3 characters');
    });

    it('returns error for too long username', () => {
      const longUsername = 'a'.repeat(101);
      expect(validateUsername(longUsername)).toBe('Username must be less than 100 characters');
    });

    it('returns error for invalid characters', () => {
      expect(validateUsername('user-name')).toBe('Username can only contain letters, numbers, and underscores');
      expect(validateUsername('user name')).toBe('Username can only contain letters, numbers, and underscores');
    });
  });

  describe('validatePassword', () => {
    it('returns null for valid password', () => {
      expect(validatePassword('password123')).toBeNull();
      expect(validatePassword('SecurePass123!')).toBeNull();
    });

    it('returns error for empty password', () => {
      expect(validatePassword('')).toBe('Password is required');
    });

    it('returns error for too short password', () => {
      expect(validatePassword('short')).toBe('Password must be at least 8 characters');
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('returns null when passwords match', () => {
      expect(validatePasswordConfirmation('password123', 'password123')).toBeNull();
    });

    it('returns error when passwords do not match', () => {
      expect(validatePasswordConfirmation('password123', 'password456')).toBe('Passwords do not match');
    });

    it('returns error for empty confirmation', () => {
      expect(validatePasswordConfirmation('password123', '')).toBe('Please confirm your password');
    });
  });

  describe('validateFullName', () => {
    it('returns null for valid full name', () => {
      expect(validateFullName('John Doe')).toBeNull();
      expect(validateFullName(undefined as unknown as string)).toBeNull();
    });

    it('returns error for too long full name', () => {
      const longName = 'a'.repeat(256);
      expect(validateFullName(longName)).toBe('Full name must be less than 255 characters');
    });
  });
});

