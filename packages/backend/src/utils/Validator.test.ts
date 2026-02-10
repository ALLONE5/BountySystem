import { describe, it, expect } from 'vitest';
import { Validator } from './Validator.js';
import { ValidationError } from './errors.js';

describe('Validator', () => {
  describe('required()', () => {
    it('should not throw for valid values', () => {
      expect(() => Validator.required('value', 'field')).not.toThrow();
      expect(() => Validator.required(0, 'field')).not.toThrow();
      expect(() => Validator.required(false, 'field')).not.toThrow();
      expect(() => Validator.required([], 'field')).not.toThrow();
      expect(() => Validator.required({}, 'field')).not.toThrow();
    });

    it('should throw ValidationError for null, undefined, or empty string', () => {
      expect(() => Validator.required(null, 'field')).toThrow(ValidationError);
      expect(() => Validator.required(undefined, 'field')).toThrow(ValidationError);
      expect(() => Validator.required('', 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.required(null, 'username')).toThrow('username is required');
    });
  });

  describe('string()', () => {
    it('should not throw for string values', () => {
      expect(() => Validator.string('hello', 'field')).not.toThrow();
      expect(() => Validator.string('', 'field')).not.toThrow();
      expect(() => Validator.string('123', 'field')).not.toThrow();
    });

    it('should throw ValidationError for non-string values', () => {
      expect(() => Validator.string(123, 'field')).toThrow(ValidationError);
      expect(() => Validator.string(true, 'field')).toThrow(ValidationError);
      expect(() => Validator.string(null, 'field')).toThrow(ValidationError);
      expect(() => Validator.string(undefined, 'field')).toThrow(ValidationError);
      expect(() => Validator.string({}, 'field')).toThrow(ValidationError);
      expect(() => Validator.string([], 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.string(123, 'title')).toThrow('title must be a string');
    });
  });

  describe('number()', () => {
    it('should not throw for valid number values', () => {
      expect(() => Validator.number(0, 'field')).not.toThrow();
      expect(() => Validator.number(123, 'field')).not.toThrow();
      expect(() => Validator.number(-456, 'field')).not.toThrow();
      expect(() => Validator.number(3.14, 'field')).not.toThrow();
    });

    it('should throw ValidationError for non-number values', () => {
      expect(() => Validator.number('123', 'field')).toThrow(ValidationError);
      expect(() => Validator.number(true, 'field')).toThrow(ValidationError);
      expect(() => Validator.number(null, 'field')).toThrow(ValidationError);
      expect(() => Validator.number(undefined, 'field')).toThrow(ValidationError);
      expect(() => Validator.number({}, 'field')).toThrow(ValidationError);
      expect(() => Validator.number([], 'field')).toThrow(ValidationError);
    });

    it('should throw ValidationError for NaN', () => {
      expect(() => Validator.number(NaN, 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.number('abc', 'age')).toThrow('age must be a valid number');
    });
  });

  describe('email()', () => {
    it('should not throw for valid email addresses', () => {
      expect(() => Validator.email('test@example.com', 'field')).not.toThrow();
      expect(() => Validator.email('user.name@domain.co.uk', 'field')).not.toThrow();
      expect(() => Validator.email('user+tag@example.com', 'field')).not.toThrow();
    });

    it('should throw ValidationError for invalid email addresses', () => {
      expect(() => Validator.email('invalid', 'field')).toThrow(ValidationError);
      expect(() => Validator.email('invalid@', 'field')).toThrow(ValidationError);
      expect(() => Validator.email('@example.com', 'field')).toThrow(ValidationError);
      expect(() => Validator.email('invalid@domain', 'field')).toThrow(ValidationError);
      expect(() => Validator.email('invalid @domain.com', 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.email('invalid', 'email')).toThrow('email must be a valid email address');
    });
  });

  describe('uuid()', () => {
    it('should not throw for valid UUIDs', () => {
      expect(() => Validator.uuid('123e4567-e89b-12d3-a456-426614174000', 'field')).not.toThrow();
      expect(() => Validator.uuid('550e8400-e29b-41d4-a716-446655440000', 'field')).not.toThrow();
      expect(() => Validator.uuid('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE', 'field')).not.toThrow();
    });

    it('should throw ValidationError for invalid UUIDs', () => {
      expect(() => Validator.uuid('invalid', 'field')).toThrow(ValidationError);
      expect(() => Validator.uuid('123e4567-e89b-12d3-a456', 'field')).toThrow(ValidationError);
      expect(() => Validator.uuid('123e4567e89b12d3a456426614174000', 'field')).toThrow(ValidationError);
      expect(() => Validator.uuid('123e4567-e89b-12d3-a456-42661417400g', 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.uuid('invalid', 'id')).toThrow('id must be a valid UUID');
    });
  });

  describe('minLength()', () => {
    it('should not throw for strings meeting minimum length', () => {
      expect(() => Validator.minLength('hello', 5, 'field')).not.toThrow();
      expect(() => Validator.minLength('hello world', 5, 'field')).not.toThrow();
      expect(() => Validator.minLength('abc', 1, 'field')).not.toThrow();
    });

    it('should throw ValidationError for strings below minimum length', () => {
      expect(() => Validator.minLength('hi', 5, 'field')).toThrow(ValidationError);
      expect(() => Validator.minLength('', 1, 'field')).toThrow(ValidationError);
    });

    it('should include field name and minimum in error message', () => {
      expect(() => Validator.minLength('hi', 5, 'password')).toThrow('password must be at least 5 characters');
    });
  });

  describe('maxLength()', () => {
    it('should not throw for strings within maximum length', () => {
      expect(() => Validator.maxLength('hello', 10, 'field')).not.toThrow();
      expect(() => Validator.maxLength('hi', 5, 'field')).not.toThrow();
      expect(() => Validator.maxLength('', 10, 'field')).not.toThrow();
    });

    it('should throw ValidationError for strings exceeding maximum length', () => {
      expect(() => Validator.maxLength('hello world', 5, 'field')).toThrow(ValidationError);
      expect(() => Validator.maxLength('toolong', 3, 'field')).toThrow(ValidationError);
    });

    it('should include field name and maximum in error message', () => {
      expect(() => Validator.maxLength('toolong', 5, 'username')).toThrow('username must be at most 5 characters');
    });
  });

  describe('min()', () => {
    it('should not throw for numbers meeting minimum value', () => {
      expect(() => Validator.min(10, 10, 'field')).not.toThrow();
      expect(() => Validator.min(15, 10, 'field')).not.toThrow();
      expect(() => Validator.min(0, -5, 'field')).not.toThrow();
    });

    it('should throw ValidationError for numbers below minimum value', () => {
      expect(() => Validator.min(5, 10, 'field')).toThrow(ValidationError);
      expect(() => Validator.min(-10, 0, 'field')).toThrow(ValidationError);
    });

    it('should include field name and minimum in error message', () => {
      expect(() => Validator.min(5, 10, 'age')).toThrow('age must be at least 10');
    });
  });

  describe('max()', () => {
    it('should not throw for numbers within maximum value', () => {
      expect(() => Validator.max(10, 10, 'field')).not.toThrow();
      expect(() => Validator.max(5, 10, 'field')).not.toThrow();
      expect(() => Validator.max(-10, 0, 'field')).not.toThrow();
    });

    it('should throw ValidationError for numbers exceeding maximum value', () => {
      expect(() => Validator.max(15, 10, 'field')).toThrow(ValidationError);
      expect(() => Validator.max(5, 0, 'field')).toThrow(ValidationError);
    });

    it('should include field name and maximum in error message', () => {
      expect(() => Validator.max(150, 100, 'score')).toThrow('score must be at most 100');
    });
  });

  describe('enum()', () => {
    it('should not throw for values in allowed list', () => {
      expect(() => Validator.enum('active', ['active', 'inactive'], 'field')).not.toThrow();
      expect(() => Validator.enum(1, [1, 2, 3], 'field')).not.toThrow();
      expect(() => Validator.enum('red', ['red', 'green', 'blue'], 'field')).not.toThrow();
    });

    it('should throw ValidationError for values not in allowed list', () => {
      expect(() => Validator.enum('pending', ['active', 'inactive'], 'field')).toThrow(ValidationError);
      expect(() => Validator.enum(4, [1, 2, 3], 'field')).toThrow(ValidationError);
    });

    it('should include field name and allowed values in error message', () => {
      expect(() => Validator.enum('yellow', ['red', 'green', 'blue'], 'color'))
        .toThrow('color must be one of: red, green, blue');
    });
  });

  describe('date()', () => {
    it('should not throw for valid dates', () => {
      expect(() => Validator.date(new Date(), 'field')).not.toThrow();
      expect(() => Validator.date(new Date('2024-01-01'), 'field')).not.toThrow();
      expect(() => Validator.date('2024-01-01', 'field')).not.toThrow();
      expect(() => Validator.date('2024-01-01T10:00:00Z', 'field')).not.toThrow();
    });

    it('should throw ValidationError for invalid dates', () => {
      expect(() => Validator.date('invalid', 'field')).toThrow(ValidationError);
      expect(() => Validator.date('not-a-date', 'field')).toThrow(ValidationError);
      expect(() => Validator.date({}, 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.date('invalid', 'deadline')).toThrow('deadline must be a valid date');
    });
  });

  describe('futureDate()', () => {
    it('should not throw for future dates', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(() => Validator.futureDate(futureDate, 'field')).not.toThrow();
    });

    it('should throw ValidationError for past or current dates', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const now = new Date();
      expect(() => Validator.futureDate(pastDate, 'field')).toThrow(ValidationError);
      expect(() => Validator.futureDate(now, 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      const pastDate = new Date(Date.now() - 86400000);
      expect(() => Validator.futureDate(pastDate, 'deadline')).toThrow('deadline must be a future date');
    });
  });

  describe('Edge cases', () => {
    it('should handle boundary values for minLength', () => {
      expect(() => Validator.minLength('abc', 3, 'field')).not.toThrow();
      expect(() => Validator.minLength('ab', 3, 'field')).toThrow(ValidationError);
    });

    it('should handle boundary values for maxLength', () => {
      expect(() => Validator.maxLength('abc', 3, 'field')).not.toThrow();
      expect(() => Validator.maxLength('abcd', 3, 'field')).toThrow(ValidationError);
    });

    it('should handle boundary values for min', () => {
      expect(() => Validator.min(10, 10, 'field')).not.toThrow();
      expect(() => Validator.min(9.999, 10, 'field')).toThrow(ValidationError);
    });

    it('should handle boundary values for max', () => {
      expect(() => Validator.max(10, 10, 'field')).not.toThrow();
      expect(() => Validator.max(10.001, 10, 'field')).toThrow(ValidationError);
    });

    it('should handle zero values correctly', () => {
      expect(() => Validator.required(0, 'field')).not.toThrow();
      expect(() => Validator.number(0, 'field')).not.toThrow();
      expect(() => Validator.min(0, 0, 'field')).not.toThrow();
      expect(() => Validator.max(0, 0, 'field')).not.toThrow();
    });

    it('should handle negative numbers correctly', () => {
      expect(() => Validator.number(-123, 'field')).not.toThrow();
      expect(() => Validator.min(-5, -10, 'field')).not.toThrow();
      expect(() => Validator.max(-15, -10, 'field')).not.toThrow();
    });

    it('should handle empty strings correctly', () => {
      expect(() => Validator.required('', 'field')).toThrow(ValidationError);
      expect(() => Validator.string('', 'field')).not.toThrow();
      expect(() => Validator.minLength('', 1, 'field')).toThrow(ValidationError);
      expect(() => Validator.maxLength('', 10, 'field')).not.toThrow();
    });
  });

  describe('Error messages', () => {
    it('should provide descriptive error messages for all validators', () => {
      try {
        Validator.required(null, 'username');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('username');
        expect((error as ValidationError).message).toContain('required');
      }

      try {
        Validator.string(123, 'title');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('title');
        expect((error as ValidationError).message).toContain('string');
      }

      try {
        Validator.number('abc', 'age');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('age');
        expect((error as ValidationError).message).toContain('number');
      }

      try {
        Validator.email('invalid', 'email');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('email');
        expect((error as ValidationError).message).toContain('valid email');
      }

      try {
        Validator.uuid('invalid', 'id');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('id');
        expect((error as ValidationError).message).toContain('UUID');
      }
    });
  });
});
