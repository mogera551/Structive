import { describe, it, expect } from 'vitest';
import { raiseError } from '../src/utils.js';

describe('utils', () => {
  describe('raiseError', () => {
    it('should throw an Error with the provided message', () => {
      const message = 'Test error message';
      
      expect(() => raiseError(message)).toThrow(Error);
      expect(() => raiseError(message)).toThrow(message);
    });

    it('should never return a value', () => {
      expect(() => {
        const result = raiseError('Test');
        // この行は実行されないはず
        expect(result).toBeUndefined();
      }).toThrow();
    });

    it('should throw with empty message', () => {
      expect(() => raiseError('')).toThrow('');
    });

    it('should attach structured fields when payload provided', () => {
      const payload = {
        code: 'TEST-001',
        message: 'Payload error',
        context: { foo: 'bar' },
        hint: 'Check config',
        docsUrl: 'https://example.com',
        severity: 'warn' as const,
        cause: new Error('root'),
      };

      try {
        raiseError(payload);
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Payload error');
        expect(err.code).toBe('TEST-001');
        expect(err.context).toEqual({ foo: 'bar' });
        expect(err.hint).toBe('Check config');
        expect(err.docsUrl).toBe('https://example.com');
        expect(err.severity).toBe('warn');
        expect(err.cause).toBeInstanceOf(Error);
      }
    });

    it('should skip optional fields when payload omits them', () => {
      const payload = {
        code: 'TEST-002',
        message: 'Minimal payload',
      };

      try {
        raiseError(payload);
        expect.unreachable();
      } catch (err: any) {
        expect(err.code).toBe('TEST-002');
        expect('context' in err).toBe(false);
        expect('hint' in err).toBe(false);
        expect('docsUrl' in err).toBe(false);
        expect('severity' in err).toBe(false);
        expect('cause' in err).toBe(false);
      }
    });
  });
});