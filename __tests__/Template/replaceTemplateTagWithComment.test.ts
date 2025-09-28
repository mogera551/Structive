/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { replaceTemplateTagWithComment } from "../../src/Template/replaceTemplateTagWithComment";

// 依存関数をモック
vi.mock("../../src/GlobalId/generateId", () => ({
  generateId: vi.fn(() => 9999),
}));

vi.mock("../../src/Template/registerTemplate", () => ({
  registerTemplate: vi.fn((id: number) => id),
}));

const { generateId } = vi.mocked(await import("../../src/GlobalId/generateId"));
const { registerTemplate } = vi.mocked(await import("../../src/Template/registerTemplate"));

describe("Template/replaceTemplateTagWithComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("basic functionality", () => {
    test("should replace template with comment when has parent", () => {
      const container = document.createElement("div");
      const template = document.createElement("template");
      const id = 123;
      
      container.appendChild(template);
      
      const result = replaceTemplateTagWithComment(id, template);
      
      expect(result).toBe(id);
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect((container.childNodes[0] as Comment).nodeValue).toBe("@@|123");
    });

    test("should not replace template when no parent", () => {
      const template = document.createElement("template");
      const id = 456;
      
      const result = replaceTemplateTagWithComment(id, template);
      
      expect(result).toBe(id);
      // テンプレートは置き換えられない
    });

    test("should call registerTemplate with correct parameters", () => {
      const template = document.createElement("template");
      const id = 789;
      const rootId = 100;
      
      replaceTemplateTagWithComment(id, template, rootId);
      
      expect(registerTemplate).toHaveBeenCalledWith(id, template, rootId);
    });

    test("should use id as rootId when rootId not provided", () => {
      const template = document.createElement("template");
      const id = 101;
      
      replaceTemplateTagWithComment(id, template);
      
      expect(registerTemplate).toHaveBeenCalledWith(id, template, id);
    });
  });

  describe("real DOM integration", () => {
    test("should work with actual DOM elements", () => {
      const container = document.createElement("div");
      const template = document.createElement("template");
      const id = 808;
      
      template.innerHTML = "<div>test content</div>";
      container.appendChild(template);
      document.body.appendChild(container);
      
      const result = replaceTemplateTagWithComment(id, template);
      
      expect(result).toBe(id);
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect((container.childNodes[0] as Comment).nodeValue).toBe("@@|808");
      expect(registerTemplate).toHaveBeenCalledWith(id, template, id);
    });

    test("should preserve template content", () => {
      const template = document.createElement("template");
      const id = 909;
      
      const contentDiv = document.createElement("div");
      contentDiv.textContent = "preserved content";
      template.content.appendChild(contentDiv);
      
      replaceTemplateTagWithComment(id, template);
      
      expect(template.content.childNodes.length).toBe(1);
      expect(template.content.childNodes[0]).toBe(contentDiv);
      expect((template.content.childNodes[0] as HTMLElement).textContent).toBe("preserved content");
    });

    test("should handle template with data-bind attribute", () => {
      const template = document.createElement("template");
      const id = 1010;
      
      template.setAttribute("data-bind", "if:condition");
      
      replaceTemplateTagWithComment(id, template);
      
      expect(template.getAttribute("data-bind")).toBe("if:condition");
      expect(registerTemplate).toHaveBeenCalledWith(id, template, id);
    });
  });

  describe("edge cases", () => {
    test("should handle template without content", () => {
      const template = document.createElement("template");
      const id = 1111;
      
      const result = replaceTemplateTagWithComment(id, template);
      
      expect(result).toBe(id);
      expect(registerTemplate).toHaveBeenCalledWith(id, template, id);
    });

    test("should handle zero as id", () => {
      const container = document.createElement("div");
      const template = document.createElement("template");
      const id = 0;
      
      container.appendChild(template);
      
      const result = replaceTemplateTagWithComment(id, template);
      
      expect(result).toBe(0);
      expect((container.childNodes[0] as Comment).nodeValue).toBe("@@|0");
    });

    test("should handle negative id", () => {
      const container = document.createElement("div");
      const template = document.createElement("template");
      const id = -1;
      
      container.appendChild(template);
      
      const result = replaceTemplateTagWithComment(id, template);
      
      expect(result).toBe(-1);
      expect((container.childNodes[0] as Comment).nodeValue).toBe("@@|-1");
    });

    test("should handle error in registerTemplate", () => {
      const template = document.createElement("template");
      const id = 1313;
      
      registerTemplate.mockImplementationOnce(() => {
        throw new Error("Registration failed");
      });
      
      expect(() => {
        replaceTemplateTagWithComment(id, template);
      }).toThrow("Registration failed");
    });

    test("should handle error in generateId", () => {
      const outerTemplate = document.createElement("template");
      const nestedTemplate = document.createElement("template");
      const id = 1414;
      
      outerTemplate.content.appendChild(nestedTemplate);
      generateId.mockImplementationOnce(() => {
        throw new Error("ID generation failed");
      });
      
      expect(() => {
        replaceTemplateTagWithComment(id, outerTemplate);
      }).toThrow("ID generation failed");
    });
  });

  describe("nested template handling", () => {
    test("should recursively process nested templates", () => {
      const outerTemplate = document.createElement("template");
      const nestedTemplate = document.createElement("template");
      const id = 505;
      
      // ネストされたテンプレートを設定
      outerTemplate.content.appendChild(nestedTemplate);
      
      replaceTemplateTagWithComment(id, outerTemplate);
      
      // generateIdがネストされたテンプレート用に呼ばれることを確認
      expect(generateId).toHaveBeenCalled();
      // registerTemplateが外側のテンプレートで呼ばれることを確認
      expect(registerTemplate).toHaveBeenCalledWith(id, outerTemplate, id);
    });
  });
});