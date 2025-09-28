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
  });
});