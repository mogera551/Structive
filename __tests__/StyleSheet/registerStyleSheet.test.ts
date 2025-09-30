/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { registerStyleSheet, getStyleSheetById } from "../../src/StyleSheet/registerStyleSheet";

describe("StyleSheet/registerStyleSheet", () => {
  let mockStyleSheet: CSSStyleSheet;

  beforeEach(() => {
    // CSSStyleSheetのモックを作成
    mockStyleSheet = {
      cssRules: [],
      ownerRule: null,
      disabled: false,
      href: null,
      media: { mediaText: "" } as MediaList,
      ownerNode: null,
      parentStyleSheet: null,
      title: null,
      type: "text/css",
      insertRule: vi.fn(),
      deleteRule: vi.fn(),
      replace: vi.fn(),
      replaceSync: vi.fn(),
    } as unknown as CSSStyleSheet;
  });

  describe("registerStyleSheet", () => {
    test("should register a stylesheet with given id", () => {
      const id = 1;
      
      // スタイルシートを登録
      registerStyleSheet(id, mockStyleSheet);
      
      // 登録されたスタイルシートを取得できることを確認
      const retrieved = getStyleSheetById(id);
      expect(retrieved).toBe(mockStyleSheet);
    });

    test("should allow overwriting existing stylesheet", () => {
      const id = 2;
      const secondStyleSheet = { ...mockStyleSheet } as CSSStyleSheet;
      
      // 最初のスタイルシートを登録
      registerStyleSheet(id, mockStyleSheet);
      
      // 同じIDで別のスタイルシートを登録（上書き）
      registerStyleSheet(id, secondStyleSheet);
      
      // 新しいスタイルシートが取得されることを確認
      const retrieved = getStyleSheetById(id);
      expect(retrieved).toBe(secondStyleSheet);
      expect(retrieved).not.toBe(mockStyleSheet);
    });

    test("should register multiple stylesheets with different ids", () => {
      const id1 = 3;
      const id2 = 4;
      const styleSheet1 = mockStyleSheet;
      const styleSheet2 = { ...mockStyleSheet } as CSSStyleSheet;
      
      // 異なるIDで複数のスタイルシートを登録
      registerStyleSheet(id1, styleSheet1);
      registerStyleSheet(id2, styleSheet2);
      
      // それぞれが正しく取得できることを確認
      expect(getStyleSheetById(id1)).toBe(styleSheet1);
      expect(getStyleSheetById(id2)).toBe(styleSheet2);
    });

    test("should handle zero as valid id", () => {
      const id = 0;
      
      registerStyleSheet(id, mockStyleSheet);
      
      const retrieved = getStyleSheetById(id);
      expect(retrieved).toBe(mockStyleSheet);
    });

    test("should handle negative id", () => {
      const id = -1;
      
      registerStyleSheet(id, mockStyleSheet);
      
      const retrieved = getStyleSheetById(id);
      expect(retrieved).toBe(mockStyleSheet);
    });
  });

  describe("getStyleSheetById", () => {
    test("should return registered stylesheet", () => {
      const id = 5;
      
      registerStyleSheet(id, mockStyleSheet);
      const retrieved = getStyleSheetById(id);
      
      expect(retrieved).toBe(mockStyleSheet);
    });

    test("should throw error for non-existent id", () => {
      const nonExistentId = 999;
      
      expect(() => {
        getStyleSheetById(nonExistentId);
  }).toThrow(`Stylesheet not found: ${nonExistentId}`);
    });

    test("should throw error for undefined id", () => {
      const undefinedId = 1000;
      
      expect(() => {
        getStyleSheetById(undefinedId);
  }).toThrow(`Stylesheet not found: ${undefinedId}`);
    });

    test("should return correct stylesheet when multiple are registered", () => {
      const id1 = 6;
      const id2 = 7;
      const id3 = 8;
      const styleSheet1 = mockStyleSheet;
      const styleSheet2 = { ...mockStyleSheet } as CSSStyleSheet;
      const styleSheet3 = { ...mockStyleSheet } as CSSStyleSheet;
      
      registerStyleSheet(id1, styleSheet1);
      registerStyleSheet(id2, styleSheet2);
      registerStyleSheet(id3, styleSheet3);
      
      // それぞれが正しいスタイルシートを返すことを確認
      expect(getStyleSheetById(id1)).toBe(styleSheet1);
      expect(getStyleSheetById(id2)).toBe(styleSheet2);
      expect(getStyleSheetById(id3)).toBe(styleSheet3);
    });

    test("should work with zero id", () => {
      const id = 0;
      
      registerStyleSheet(id, mockStyleSheet);
      const retrieved = getStyleSheetById(id);
      
      expect(retrieved).toBe(mockStyleSheet);
    });

    test("should work with negative id", () => {
      const id = -5;
      
      registerStyleSheet(id, mockStyleSheet);
      const retrieved = getStyleSheetById(id);
      
      expect(retrieved).toBe(mockStyleSheet);
    });
  });

  describe("integration tests", () => {
    test("should maintain separate storage for each id", () => {
      const ids = [10, 11, 12];
      const styleSheets = ids.map(() => ({ ...mockStyleSheet }) as CSSStyleSheet);
      
      // 複数のスタイルシートを登録
      ids.forEach((id, index) => {
        registerStyleSheet(id, styleSheets[index]);
      });
      
      // それぞれが独立して管理されていることを確認
      ids.forEach((id, index) => {
        expect(getStyleSheetById(id)).toBe(styleSheets[index]);
      });
    });

    test("should handle sequential register and get operations", () => {
      const operations = [
        { id: 20, styleSheet: mockStyleSheet },
        { id: 21, styleSheet: { ...mockStyleSheet } as CSSStyleSheet },
        { id: 22, styleSheet: { ...mockStyleSheet } as CSSStyleSheet },
      ];
      
      // 順次登録と取得を行う
      operations.forEach(({ id, styleSheet }) => {
        registerStyleSheet(id, styleSheet);
        expect(getStyleSheetById(id)).toBe(styleSheet);
      });
      
      // 全ての登録が維持されていることを確認
      operations.forEach(({ id, styleSheet }) => {
        expect(getStyleSheetById(id)).toBe(styleSheet);
      });
    });
  });
});