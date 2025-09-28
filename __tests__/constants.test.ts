import { describe, it, expect } from 'vitest';
import {
  DATA_BIND_ATTRIBUTE,
  COMMENT_EMBED_MARK,
  COMMENT_TEMPLATE_MARK,
  MAX_WILDCARD_DEPTH,
  WILDCARD,
  RESERVED_WORD_SET
} from '../src/constants.js';

describe('constants', () => {
  describe('DATA_BIND_ATTRIBUTE', () => {
    it('should be "data-bind"', () => {
      expect(DATA_BIND_ATTRIBUTE).toBe('data-bind');
    });

    it('should be a string', () => {
      expect(typeof DATA_BIND_ATTRIBUTE).toBe('string');
    });
  });

  describe('COMMENT_EMBED_MARK', () => {
    it('should be "@@:"', () => {
      expect(COMMENT_EMBED_MARK).toBe('@@:');
    });
  });

  describe('COMMENT_TEMPLATE_MARK', () => {
    it('should be "@@|"', () => {
      expect(COMMENT_TEMPLATE_MARK).toBe('@@|');
    });
  });

  describe('MAX_WILDCARD_DEPTH', () => {
    it('should be 32', () => {
      expect(MAX_WILDCARD_DEPTH).toBe(32);
    });

    it('should be a positive number', () => {
      expect(typeof MAX_WILDCARD_DEPTH).toBe('number');
      expect(MAX_WILDCARD_DEPTH).toBeGreaterThan(0);
    });
  });

  describe('WILDCARD', () => {
    it('should be "*"', () => {
      expect(WILDCARD).toBe('*');
    });
  });

  describe('RESERVED_WORD_SET', () => {
    it('should be a Set', () => {
      expect(RESERVED_WORD_SET).toBeInstanceOf(Set);
    });

    it('should contain common JavaScript reserved words', () => {
      const expectedWords = [
        'constructor', 'prototype', '__proto__', 'toString',
        'valueOf', 'hasOwnProperty', 'isPrototypeOf',
        'null', 'true', 'false', 'new', 'return'
      ];

      expectedWords.forEach(word => {
        expect(RESERVED_WORD_SET.has(word)).toBe(true);
      });
    });

    it('should have more than 10 reserved words', () => {
      expect(RESERVED_WORD_SET.size).toBeGreaterThan(10);
    });

    it('should not contain empty strings', () => {
      expect(RESERVED_WORD_SET.has('')).toBe(false);
    });

    it('should contain string values only', () => {
      const values = Array.from(RESERVED_WORD_SET);
      values.forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });
});