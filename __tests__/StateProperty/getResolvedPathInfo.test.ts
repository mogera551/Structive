/**
 * getResolvedPathInfo.test.ts
 *
 * getResolvedPathInfo.tsの単体テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getResolvedPathInfo } from '../../src/StateProperty/getResolvedPathInfo';

describe('getResolvedPathInfo', () => {
  describe('基本的なパス解析', () => {
    it('単純なパス "aaa" を解析できる', () => {
      const info = getResolvedPathInfo('aaa');
      
      expect(info.name).toBe('aaa');
      expect(info.elements).toEqual(['aaa']);
      expect(info.paths).toEqual(['aaa']);
      expect(info.wildcardType).toBe('none');
      expect(info.wildcardIndexes).toEqual([]);
      expect(info.info.pattern).toBe('aaa');
    });

    it('ネストしたパス "aaa.bbb.ccc" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.bbb.ccc');
      
      expect(info.name).toBe('aaa.bbb.ccc');
      expect(info.elements).toEqual(['aaa', 'bbb', 'ccc']);
      expect(info.paths).toEqual(['aaa', 'aaa.bbb', 'aaa.bbb.ccc']);
      expect(info.wildcardType).toBe('none');
      expect(info.wildcardIndexes).toEqual([]);
      expect(info.info.pattern).toBe('aaa.bbb.ccc');
    });
  });

  describe('ワイルドカード解析', () => {
    it('単一のワイルドカード "*" を解析できる', () => {
      const info = getResolvedPathInfo('*');
      
      expect(info.name).toBe('*');
      expect(info.elements).toEqual(['*']);
      expect(info.paths).toEqual(['*']);
      expect(info.wildcardType).toBe('context');
      expect(info.wildcardIndexes).toEqual([null]);
      expect(info.info.pattern).toBe('*');
    });

    it('ワイルドカードを含むパス "aaa.*.bbb" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.*.bbb');
      
      expect(info.name).toBe('aaa.*.bbb');
      expect(info.elements).toEqual(['aaa', '*', 'bbb']);
      expect(info.paths).toEqual(['aaa', 'aaa.*', 'aaa.*.bbb']);
      expect(info.wildcardType).toBe('context');
      expect(info.wildcardIndexes).toEqual([null]);
      expect(info.info.pattern).toBe('aaa.*.bbb');
    });

    it('複数のワイルドカードを含むパス "aaa.*.bbb.*" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.*.bbb.*');
      
      expect(info.name).toBe('aaa.*.bbb.*');
      expect(info.elements).toEqual(['aaa', '*', 'bbb', '*']);
      expect(info.paths).toEqual(['aaa', 'aaa.*', 'aaa.*.bbb', 'aaa.*.bbb.*']);
      expect(info.wildcardType).toBe('context');
      expect(info.wildcardIndexes).toEqual([null, null]);
      expect(info.info.pattern).toBe('aaa.*.bbb.*');
    });
  });

  describe('数値インデックス解析', () => {
    it('数値インデックス "aaa.0.bbb" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.0.bbb');
      
      expect(info.name).toBe('aaa.0.bbb');
      expect(info.elements).toEqual(['aaa', '0', 'bbb']);
      expect(info.paths).toEqual(['aaa', 'aaa.0', 'aaa.0.bbb']);
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([0]);
      expect(info.info.pattern).toBe('aaa.*.bbb');
    });

    it('複数の数値インデックス "aaa.0.bbb.1.ccc" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.0.bbb.1.ccc');
      
      expect(info.name).toBe('aaa.0.bbb.1.ccc');
      expect(info.elements).toEqual(['aaa', '0', 'bbb', '1', 'ccc']);
      expect(info.paths).toEqual(['aaa', 'aaa.0', 'aaa.0.bbb', 'aaa.0.bbb.1', 'aaa.0.bbb.1.ccc']);
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([0, 1]);
      expect(info.info.pattern).toBe('aaa.*.bbb.*.ccc');
    });

    it('負の数値インデックス "aaa.-1.bbb" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.-1.bbb');
      
      expect(info.name).toBe('aaa.-1.bbb');
      expect(info.elements).toEqual(['aaa', '-1', 'bbb']);
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([-1]);
      expect(info.info.pattern).toBe('aaa.*.bbb');
    });

    it('小数点を含む数値 "aaa.3.14.bbb" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.3.14.bbb');
      
      expect(info.name).toBe('aaa.3.14.bbb');
      expect(info.elements).toEqual(['aaa', '3', '14', 'bbb']);
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([3, 14]);
      expect(info.info.pattern).toBe('aaa.*.*.bbb');
    });
  });

  describe('混合型（partial）', () => {
    it('ワイルドカードと数値インデックスの混合 "aaa.*.bbb.0" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.*.bbb.0');
      
      expect(info.name).toBe('aaa.*.bbb.0');
      expect(info.elements).toEqual(['aaa', '*', 'bbb', '0']);
      expect(info.paths).toEqual(['aaa', 'aaa.*', 'aaa.*.bbb', 'aaa.*.bbb.0']);
      expect(info.wildcardType).toBe('partial');
      expect(info.wildcardIndexes).toEqual([null, 0]);
      expect(info.info.pattern).toBe('aaa.*.bbb.*');
    });

    it('数値インデックスとワイルドカードの混合 "aaa.0.bbb.*" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.0.bbb.*');
      
      expect(info.name).toBe('aaa.0.bbb.*');
      expect(info.elements).toEqual(['aaa', '0', 'bbb', '*']);
      expect(info.wildcardType).toBe('partial');
      expect(info.wildcardIndexes).toEqual([0, null]);
      expect(info.info.pattern).toBe('aaa.*.bbb.*');
    });

    it('複雑な混合パターン "aaa.0.*.bbb.1.*" を解析できる', () => {
      const info = getResolvedPathInfo('aaa.0.*.bbb.1.*');
      
      expect(info.name).toBe('aaa.0.*.bbb.1.*');
      expect(info.elements).toEqual(['aaa', '0', '*', 'bbb', '1', '*']);
      expect(info.wildcardType).toBe('partial');
      expect(info.wildcardIndexes).toEqual([0, null, 1, null]);
      expect(info.info.pattern).toBe('aaa.*.*.bbb.*.*');
    });
  });

  describe('wildcardCount の計算', () => {
    it('ワイルドカードなしの場合は0', () => {
      const info = getResolvedPathInfo('aaa.bbb.ccc');
      expect(info.info.wildcardCount).toBe(0);
    });

    it('ワイルドカードが1つの場合は1', () => {
      const info = getResolvedPathInfo('aaa.*.bbb');
      expect(info.info.wildcardCount).toBe(1);
    });

    it('数値インデックスが1つの場合も1', () => {
      const info = getResolvedPathInfo('aaa.0.bbb');
      expect(info.info.wildcardCount).toBe(1);
    });

    it('ワイルドカードと数値インデックスの混合で正しくカウント', () => {
      const info = getResolvedPathInfo('aaa.*.bbb.0.ccc');
      expect(info.info.wildcardCount).toBe(2);
    });
  });

  describe('キャッシュ機能', () => {
    it('同じパスで複数回呼び出すと同じインスタンスを返す', () => {
      const info1 = getResolvedPathInfo('test.path');
      const info2 = getResolvedPathInfo('test.path');
      
      expect(info1).toBe(info2);
    });

    it('異なるパスでは異なるインスタンスを返す', () => {
      const info1 = getResolvedPathInfo('test.path1');
      const info2 = getResolvedPathInfo('test.path2');
      
      expect(info1).not.toBe(info2);
    });

    it('同じパターンを持つ異なるパスは異なるインスタンス', () => {
      const info1 = getResolvedPathInfo('aaa.0.bbb');
      const info2 = getResolvedPathInfo('aaa.1.bbb');
      
      expect(info1).not.toBe(info2);
      expect(info1.info).toBe(info2.info); // 構造化パス情報は同じ
    });
  });

  describe('IDの一意性', () => {
    it('各インスタンスが一意のIDを持つ', () => {
      const info1 = getResolvedPathInfo('path1');
      const info2 = getResolvedPathInfo('path2');
      
      expect(info1.id).not.toBe(info2.id);
      expect(info1.id).toBeGreaterThan(0);
      expect(info2.id).toBeGreaterThan(0);
    });
  });

  describe('エッジケース', () => {
    it('空文字列を渡した場合', () => {
      const info = getResolvedPathInfo('');
      
      expect(info.name).toBe('');
      expect(info.elements).toEqual(['']);
      expect(info.paths).toEqual(['']);
      // 空文字列は数値として解釈される
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([0]);
    });

    it('ドットのみのパス "." を渡した場合', () => {
      const info = getResolvedPathInfo('.');
      
      expect(info.name).toBe('.');
      expect(info.elements).toEqual(['', '']);
      expect(info.paths).toEqual(['', '.']);
    });

    it('ゼロのインデックス "0" を正しく処理', () => {
      const info = getResolvedPathInfo('0');
      
      expect(info.name).toBe('0');
      expect(info.elements).toEqual(['0']);
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([0]);
      expect(info.info.pattern).toBe('*');
    });

    it('文字列として数値でない "NaN" を正しく処理', () => {
      const info = getResolvedPathInfo('NaN');
      
      expect(info.name).toBe('NaN');
      expect(info.elements).toEqual(['NaN']);
      expect(info.wildcardType).toBe('none');
      expect(info.wildcardIndexes).toEqual([]);
      expect(info.info.pattern).toBe('NaN');
    });

    it('非常に大きな数値を正しく処理', () => {
      const info = getResolvedPathInfo('aaa.999999999999999.bbb');
      
      expect(info.name).toBe('aaa.999999999999999.bbb');
      expect(info.wildcardType).toBe('all');
      expect(info.wildcardIndexes).toEqual([999999999999999]);
      expect(info.info.pattern).toBe('aaa.*.bbb');
    });

    it('連続するドットを含むパス "aaa..bbb" を処理', () => {
      const info = getResolvedPathInfo('aaa..bbb');
      
      expect(info.name).toBe('aaa..bbb');
      expect(info.elements).toEqual(['aaa', '', 'bbb']);
      expect(info.paths).toEqual(['aaa', 'aaa.', 'aaa..bbb']);
      // 空文字列は数値として解釈されるため
      expect(info.wildcardType).toBe('all');
    });
  });
});