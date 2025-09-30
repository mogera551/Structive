import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFilters } from '../../src/BindingBuilder/createFilters.js';
import type { FilterWithOptions, FilterFn } from '../../src/Filter/types.js';
import type { IFilterText } from '../../src/BindingBuilder/types.js';

describe('BindingBuilder', () => {
  describe('createFilters', () => {
    // モック用のフィルター関数を作成
    const mockEqFilter = vi.fn((options?: string[]) => {
      return vi.fn((value: any) => value === (options?.[0] ?? ''));
    });

    const mockNotFilter = vi.fn((options?: string[]) => {
      return vi.fn((value: any) => !value);
    });

    const mockTrimFilter = vi.fn((options?: string[]) => {
      return vi.fn((value: string) => value.trim());
    });

    const mockUppercaseFilter = vi.fn((options?: string[]) => {
      return vi.fn((value: string) => value.toUpperCase());
    });

    const filters: FilterWithOptions = {
      eq: mockEqFilter,
      not: mockNotFilter,
      trim: mockTrimFilter,
      uppercase: mockUppercaseFilter,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create empty filter array for empty input', () => {
      const texts: IFilterText[] = [];
      
      const result = createFilters(filters, texts);
      
      expect(result).toEqual([]);
    });

    it('should create filter functions from filter texts', () => {
      const texts: IFilterText[] = [
        { name: 'eq', options: ['test'] },
        { name: 'not', options: [] },
      ];
      
      const result = createFilters(filters, texts);
      
      expect(result).toHaveLength(2);
      expect(mockEqFilter).toHaveBeenCalledWith(['test']);
      expect(mockNotFilter).toHaveBeenCalledWith([]);
    });

    it('should create filter with multiple options', () => {
      const texts: IFilterText[] = [
        { name: 'eq', options: ['value1', 'value2', 'value3'] },
      ];
      
      const result = createFilters(filters, texts);
      
      expect(result).toHaveLength(1);
      expect(mockEqFilter).toHaveBeenCalledWith(['value1', 'value2', 'value3']);
    });

    it('should handle filters without options', () => {
      const texts: IFilterText[] = [
        { name: 'trim', options: [] },
        { name: 'uppercase', options: [] },
      ];
      
      const result = createFilters(filters, texts);
      
      expect(result).toHaveLength(2);
      expect(mockTrimFilter).toHaveBeenCalledWith([]);
      expect(mockUppercaseFilter).toHaveBeenCalledWith([]);
    });

    it('should throw error for unknown filter', () => {
      const texts: IFilterText[] = [
        { name: 'unknown', options: [] },
      ];
      
  expect(() => createFilters(filters, texts)).toThrow('Filter not found');
    });

    it('should cache results for same input', () => {
      const texts: IFilterText[] = [
        { name: 'eq', options: ['test'] },
      ];
      
      const result1 = createFilters(filters, texts);
      const result2 = createFilters(filters, texts);
      
      // 同じ参照が返されることを確認（キャッシュされている）
      expect(result1).toBe(result2);
      
      // フィルター関数は1回しか呼ばれない（キャッシュが効いている）
      expect(mockEqFilter).toHaveBeenCalledTimes(1);
    });

    it('should not cache different inputs', () => {
      const texts1: IFilterText[] = [
        { name: 'eq', options: ['test1'] },
      ];
      
      const texts2: IFilterText[] = [
        { name: 'eq', options: ['test2'] },
      ];
      
      const result1 = createFilters(filters, texts1);
      const result2 = createFilters(filters, texts2);
      
      // 異なる参照が返される（別々のキャッシュエントリ）
      expect(result1).not.toBe(result2);
      
      // フィルター関数は2回呼ばれる
      expect(mockEqFilter).toHaveBeenCalledTimes(2);
      expect(mockEqFilter).toHaveBeenNthCalledWith(1, ['test1']);
      expect(mockEqFilter).toHaveBeenNthCalledWith(2, ['test2']);
    });

    it('should handle complex filter chain', () => {
      const texts: IFilterText[] = [
        { name: 'trim', options: [] },
        { name: 'uppercase', options: [] },
        { name: 'eq', options: ['EXPECTED'] },
        { name: 'not', options: [] },
      ];
      
      const result = createFilters(filters, texts);
      
      expect(result).toHaveLength(4);
      expect(mockTrimFilter).toHaveBeenCalledWith([]);
      expect(mockUppercaseFilter).toHaveBeenCalledWith([]);
      expect(mockEqFilter).toHaveBeenCalledWith(['EXPECTED']);
      expect(mockNotFilter).toHaveBeenCalledWith([]);
    });

    it('should preserve order of filters', () => {
      const texts: IFilterText[] = [
        { name: 'uppercase', options: [] },
        { name: 'trim', options: [] },
        { name: 'eq', options: ['test'] },
      ];
      
      createFilters(filters, texts);
      
      // 呼び出し順序が保持されることを確認
      const calls = [
        mockUppercaseFilter.mock.calls,
        mockTrimFilter.mock.calls,
        mockEqFilter.mock.calls,
      ];
      
      expect(mockUppercaseFilter).toHaveBeenCalledBefore(mockTrimFilter as any);
      expect(mockTrimFilter).toHaveBeenCalledBefore(mockEqFilter as any);
    });

    it('should handle empty options array', () => {
      const texts: IFilterText[] = [
        { name: 'not', options: [] },
      ];
      
      const result = createFilters(filters, texts);
      
      expect(result).toHaveLength(1);
      expect(mockNotFilter).toHaveBeenCalledWith([]);
    });
  });
});