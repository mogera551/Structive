/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { registerTemplate, getTemplateById } from "../../src/Template/registerTemplate";

// 依存関数をモック
vi.mock("../../src/BindingBuilder/registerDataBindAttributes", () => ({
  registerDataBindAttributes: vi.fn(),
}));

vi.mock("../../src/Template/removeEmptyTextNodes", () => ({
  removeEmptyTextNodes: vi.fn(),
}));

const { registerDataBindAttributes } = vi.mocked(
  await import("../../src/BindingBuilder/registerDataBindAttributes")
);

const { removeEmptyTextNodes } = vi.mocked(
  await import("../../src/Template/removeEmptyTextNodes")
);

describe("Template/registerTemplate", () => {
  let mockTemplate: HTMLTemplateElement;
  let mockContent: DocumentFragment;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // DocumentFragmentのモック
    mockContent = {
      childNodes: [],
    } as unknown as DocumentFragment;
    
    // HTMLTemplateElementのモック
    mockTemplate = {
      content: mockContent,
    } as HTMLTemplateElement;
  });

  describe("registerTemplate", () => {
    test("should call removeEmptyTextNodes with template content", () => {
      const id = 1;
      const rootId = 10;
      
      const result = registerTemplate(id, mockTemplate, rootId);
      
      expect(removeEmptyTextNodes).toHaveBeenCalledWith(mockContent);
      expect(result).toBe(id);
    });

    test("should call registerDataBindAttributes with correct parameters", () => {
      const id = 2;
      const rootId = 20;
      
      registerTemplate(id, mockTemplate, rootId);
      
      expect(registerDataBindAttributes).toHaveBeenCalledWith(id, mockContent, rootId);
    });

    test("should register template and return id", () => {
      const id = 3;
      const rootId = 30;
      
      const result = registerTemplate(id, mockTemplate, rootId);
      
      expect(result).toBe(id);
      
      // 登録されたテンプレートを取得できることを確認
      const retrieved = getTemplateById(id);
      expect(retrieved).toBe(mockTemplate);
    });

    test("should handle zero as id", () => {
      const id = 0;
      const rootId = 0;
      
      const result = registerTemplate(id, mockTemplate, rootId);
      
      expect(result).toBe(0);
      expect(getTemplateById(0)).toBe(mockTemplate);
    });

    test("should handle negative id", () => {
      const id = -1;
      const rootId = -10;
      
      const result = registerTemplate(id, mockTemplate, rootId);
      
      expect(result).toBe(-1);
      expect(getTemplateById(-1)).toBe(mockTemplate);
    });

    test("should overwrite existing template with same id", () => {
      const id = 4;
      const rootId = 40;
      const secondTemplate = { content: {} } as HTMLTemplateElement;
      
      // 最初のテンプレートを登録
      registerTemplate(id, mockTemplate, rootId);
      expect(getTemplateById(id)).toBe(mockTemplate);
      
      // 同じIDで別のテンプレートを登録（上書き）
      registerTemplate(id, secondTemplate, rootId);
      expect(getTemplateById(id)).toBe(secondTemplate);
    });

    test("should register multiple templates with different ids", () => {
      const templates = [
        { id: 10, template: mockTemplate, rootId: 100 },
        { id: 11, template: { content: {} } as HTMLTemplateElement, rootId: 101 },
        { id: 12, template: { content: {} } as HTMLTemplateElement, rootId: 102 },
      ];
      
      templates.forEach(({ id, template, rootId }) => {
        registerTemplate(id, template, rootId);
      });
      
      // それぞれが正しく登録されていることを確認
      templates.forEach(({ id, template }) => {
        expect(getTemplateById(id)).toBe(template);
      });
    });

    test("should call functions in correct order", () => {
      const id = 5;
      const rootId = 50;
      let callOrder: string[] = [];
      
      removeEmptyTextNodes.mockImplementation(() => {
        callOrder.push("removeEmptyTextNodes");
      });
      
      registerDataBindAttributes.mockImplementation(() => {
        callOrder.push("registerDataBindAttributes");
        return [];
      });
      
      registerTemplate(id, mockTemplate, rootId);
      
      expect(callOrder).toEqual([
        "removeEmptyTextNodes",
        "registerDataBindAttributes"
      ]);
    });

    test("should handle complex template structure", () => {
      const id = 6;
      const rootId = 60;
      
      // より複雑なDocumentFragmentをモック
      const complexContent = {
        childNodes: [
          { nodeType: Node.TEXT_NODE },
          { nodeType: Node.ELEMENT_NODE },
        ],
      } as unknown as DocumentFragment;
      
      const complexTemplate = {
        content: complexContent,
      } as HTMLTemplateElement;
      
      registerTemplate(id, complexTemplate, rootId);
      
      expect(removeEmptyTextNodes).toHaveBeenCalledWith(complexContent);
      expect(registerDataBindAttributes).toHaveBeenCalledWith(id, complexContent, rootId);
    });
  });

  describe("getTemplateById", () => {
    test("should return registered template", () => {
      const id = 7;
      const rootId = 70;
      
      registerTemplate(id, mockTemplate, rootId);
      const retrieved = getTemplateById(id);
      
      expect(retrieved).toBe(mockTemplate);
    });

    test("should throw error for non-existent id", () => {
      const nonExistentId = 999;
      
      expect(() => {
        getTemplateById(nonExistentId);
  }).toThrow(`Template not found: ${nonExistentId}`);
    });

    test("should throw error for undefined id", () => {
      const undefinedId = 1000;
      
      expect(() => {
        getTemplateById(undefinedId);
  }).toThrow(`Template not found: ${undefinedId}`);
    });

    test("should return correct template when multiple are registered", () => {
      const templates = [
        { id: 20, template: mockTemplate },
        { id: 21, template: { content: {} } as HTMLTemplateElement },
        { id: 22, template: { content: {} } as HTMLTemplateElement },
      ];
      
      templates.forEach(({ id, template }) => {
        registerTemplate(id, template, id * 10);
      });
      
      // それぞれが正しいテンプレートを返すことを確認
      templates.forEach(({ id, template }) => {
        expect(getTemplateById(id)).toBe(template);
      });
    });

    test("should work with zero id", () => {
      const id = 0;
      
      registerTemplate(id, mockTemplate, 0);
      const retrieved = getTemplateById(id);
      
      expect(retrieved).toBe(mockTemplate);
    });

    test("should work with negative id", () => {
      const id = -5;
      
      registerTemplate(id, mockTemplate, -50);
      const retrieved = getTemplateById(id);
      
      expect(retrieved).toBe(mockTemplate);
    });
  });

  describe("integration tests", () => {
    test("should maintain separate storage for each id", () => {
      const testData = [
        { id: 30, rootId: 300 },
        { id: 31, rootId: 301 },
        { id: 32, rootId: 302 },
      ];
      
      const templates = testData.map(() => ({ content: {} }) as HTMLTemplateElement);
      
      // 複数のテンプレートを登録
      testData.forEach(({ id, rootId }, index) => {
        registerTemplate(id, templates[index], rootId);
      });
      
      // それぞれが独立して管理されていることを確認
      testData.forEach(({ id }, index) => {
        expect(getTemplateById(id)).toBe(templates[index]);
      });
    });

    test("should handle sequential register and get operations", () => {
      const operations = [
        { id: 40, template: mockTemplate, rootId: 400 },
        { id: 41, template: { content: {} } as HTMLTemplateElement, rootId: 401 },
        { id: 42, template: { content: {} } as HTMLTemplateElement, rootId: 402 },
      ];
      
      // 順次登録と取得を行う
      operations.forEach(({ id, template, rootId }) => {
        const result = registerTemplate(id, template, rootId);
        expect(result).toBe(id);
        expect(getTemplateById(id)).toBe(template);
      });
      
      // 全ての登録が維持されていることを確認
      operations.forEach(({ id, template }) => {
        expect(getTemplateById(id)).toBe(template);
      });
    });

    test("should propagate errors from dependencies", () => {
      const id = 50;
      const rootId = 500;
      
      // removeEmptyTextNodesでエラーを発生させる
      removeEmptyTextNodes.mockImplementationOnce(() => {
        throw new Error("removeEmptyTextNodes failed");
      });
      
      expect(() => {
        registerTemplate(id, mockTemplate, rootId);
      }).toThrow("removeEmptyTextNodes failed");
    });

    test("should propagate errors from registerDataBindAttributes", () => {
      const id = 51;
      const rootId = 501;
      
      // registerDataBindAttributesでエラーを発生させる
      registerDataBindAttributes.mockImplementationOnce(() => {
        throw new Error("registerDataBindAttributes failed");
      });
      
      expect(() => {
        registerTemplate(id, mockTemplate, rootId);
      }).toThrow("registerDataBindAttributes failed");
    });
  });
});