/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi, MockedFunction } from "vitest";
import { registerCss } from "../../src/StyleSheet/regsiterCss";
import * as registerStyleSheetModule from "../../src/StyleSheet/registerStyleSheet";

// registerStyleSheetをモック
vi.mock("../../src/StyleSheet/registerStyleSheet", () => ({
  registerStyleSheet: vi.fn(),
  getStyleSheetById: vi.fn(),
}));

// CSSStyleSheetのコンストラクタをモック
const mockReplaceSync = vi.fn();
const mockCSSStyleSheet = vi.fn(() => ({
  replaceSync: mockReplaceSync,
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
}));

// グローバルなCSSStyleSheetをモック
(globalThis as any).CSSStyleSheet = mockCSSStyleSheet;

describe("StyleSheet/regsiterCss", () => {
  const mockRegisterStyleSheet = vi.mocked(vi.fn());

  beforeEach(() => {
    vi.clearAllMocks();
    
    // registerStyleSheetのモック実装を設定
    const registerStyleSheetMock = vi.mocked(registerStyleSheetModule.registerStyleSheet);
    registerStyleSheetMock.mockImplementation(mockRegisterStyleSheet);
  });

  describe("registerCss", () => {
    test("should create CSSStyleSheet and call replaceSync with css", () => {
      const id = 1;
      const css = "body { color: red; }";
      
      registerCss(id, css);
      
      // CSSStyleSheetが作成されることを確認
      expect(mockCSSStyleSheet).toHaveBeenCalledOnce();
      
      // replaceSyncが正しいCSSで呼ばれることを確認
      expect(mockReplaceSync).toHaveBeenCalledOnce();
      expect(mockReplaceSync).toHaveBeenCalledWith(css);
    });

    test("should register the created stylesheet with correct id", () => {
      const id = 2;
      const css = ".container { display: flex; }";
      
      registerCss(id, css);
      
      // registerStyleSheetが正しいIDで呼ばれることを確認
      expect(mockRegisterStyleSheet).toHaveBeenCalledOnce();
      expect(mockRegisterStyleSheet).toHaveBeenCalledWith(id, expect.any(Object));
    });

    test("should handle empty css string", () => {
      const id = 3;
      const css = "";
      
      registerCss(id, css);
      
      expect(mockCSSStyleSheet).toHaveBeenCalledOnce();
      expect(mockReplaceSync).toHaveBeenCalledWith(css);
      expect(mockRegisterStyleSheet).toHaveBeenCalledWith(id, expect.any(Object));
    });

    test("should handle complex css with multiple rules", () => {
      const id = 4;
      const css = `
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        
        .header {
          background-color: #f0f0f0;
          padding: 20px;
        }
        
        .header h1 {
          color: #333;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .header {
            padding: 10px;
          }
        }
      `;
      
      registerCss(id, css);
      
      expect(mockCSSStyleSheet).toHaveBeenCalledOnce();
      expect(mockReplaceSync).toHaveBeenCalledWith(css);
      expect(mockRegisterStyleSheet).toHaveBeenCalledWith(id, expect.any(Object));
    });

    test("should handle css with special characters", () => {
      const id = 5;
      const css = `
        .special::before {
          content: "→";
        }
        
        .unicode {
          content: "\\1F600";
        }
        
        .quotes {
          content: '"Hello World"';
        }
      `;
      
      registerCss(id, css);
      
      expect(mockReplaceSync).toHaveBeenCalledWith(css);
    });

    test("should work with zero as id", () => {
      const id = 0;
      const css = "p { margin: 0; }";
      
      registerCss(id, css);
      
      expect(mockRegisterStyleSheet).toHaveBeenCalledWith(id, expect.any(Object));
    });

    test("should work with negative id", () => {
      const id = -1;
      const css = "div { display: block; }";
      
      registerCss(id, css);
      
      expect(mockRegisterStyleSheet).toHaveBeenCalledWith(id, expect.any(Object));
    });

    test("should handle multiple calls with different ids", () => {
      const testCases = [
        { id: 10, css: "h1 { font-size: 24px; }" },
        { id: 11, css: "p { line-height: 1.5; }" },
        { id: 12, css: ".btn { padding: 10px; }" },
      ];
      
      testCases.forEach(({ id, css }) => {
        registerCss(id, css);
      });
      
      // CSSStyleSheetが各呼び出しで作成されることを確認
      expect(mockCSSStyleSheet).toHaveBeenCalledTimes(testCases.length);
      
      // 各CSSに対してreplaceSyncが呼ばれることを確認
      testCases.forEach(({ css }) => {
        expect(mockReplaceSync).toHaveBeenCalledWith(css);
      });
      
      // 各IDに対してregisterStyleSheetが呼ばれることを確認
      testCases.forEach(({ id }) => {
        expect(mockRegisterStyleSheet).toHaveBeenCalledWith(id, expect.any(Object));
      });
    });

    test("should create new CSSStyleSheet instance for each call", () => {
      const id1 = 20;
      const id2 = 21;
      const css1 = "body { color: blue; }";
      const css2 = "body { color: green; }";
      
      registerCss(id1, css1);
      registerCss(id2, css2);
      
      // 2回CSSStyleSheetが作成されることを確認
      expect(mockCSSStyleSheet).toHaveBeenCalledTimes(2);
      
      // 各呼び出しで異なるCSSStyleSheetインスタンスが登録されることを確認
      const firstCallArgs = mockRegisterStyleSheet.mock.calls[0];
      const secondCallArgs = mockRegisterStyleSheet.mock.calls[1];
      
      expect(firstCallArgs[0]).toBe(id1);
      expect(secondCallArgs[0]).toBe(id2);
      // インスタンスが異なることを確認（両方ともオブジェクト型であることをチェック）
      expect(typeof firstCallArgs[1]).toBe('object');
      expect(typeof secondCallArgs[1]).toBe('object');
    });

    test("should handle css with comments", () => {
      const id = 30;
      const css = `
        /* Main styles */
        body {
          margin: 0; /* Remove default margin */
          padding: 0;
        }
        
        /* 
         * Multi-line comment
         * for header styles
         */
        .header {
          background: white;
        }
      `;
      
      registerCss(id, css);
      
      expect(mockReplaceSync).toHaveBeenCalledWith(css);
    });
  });

  describe("error handling", () => {
    test("should propagate CSSStyleSheet constructor errors", () => {
      const id = 100;
      const css = "valid css";
      
      // CSSStyleSheetコンストラクタでエラーを発生させる
      mockCSSStyleSheet.mockImplementationOnce(() => {
        throw new Error("Failed to create CSSStyleSheet");
      });
      
      expect(() => {
        registerCss(id, css);
      }).toThrow("Failed to create CSSStyleSheet");
    });

    test("should propagate replaceSync errors", () => {
      const id = 101;
      const css = "invalid css syntax";
      
      // replaceSyncでエラーを発生させる
      mockReplaceSync.mockImplementationOnce(() => {
        throw new Error("Invalid CSS syntax");
      });
      
      expect(() => {
        registerCss(id, css);
      }).toThrow("Invalid CSS syntax");
    });

    test("should propagate registerStyleSheet errors", () => {
      const id = 102;
      const css = "body { color: red; }";
      
      // registerStyleSheetでエラーを発生させる
      mockRegisterStyleSheet.mockImplementationOnce(() => {
        throw new Error("Registration failed");
      });
      
      expect(() => {
        registerCss(id, css);
      }).toThrow("Registration failed");
    });
  });
});