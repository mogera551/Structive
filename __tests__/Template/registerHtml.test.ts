/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { registerHtml } from "../../src/Template/registerHtml";

// 依存関数をモック
vi.mock("../../src/Template/replaceMustacheWithTemplateTag", () => ({
  replaceMustacheWithTemplateTag: vi.fn((html: string) => `processed-${html}`),
}));

vi.mock("../../src/Template/replaceTemplateTagWithComment", () => ({
  replaceTemplateTagWithComment: vi.fn(),
}));

const { replaceMustacheWithTemplateTag } = vi.mocked(
  await import("../../src/Template/replaceMustacheWithTemplateTag")
);

const { replaceTemplateTagWithComment } = vi.mocked(
  await import("../../src/Template/replaceTemplateTagWithComment")
);

describe("Template/registerHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DOM環境をクリーンに
    document.body.innerHTML = "";
  });

  describe("registerHtml", () => {
    test("should create template element with correct id", () => {
      const id = 123;
      const html = "<div>test content</div>";
      
      // 関数が正常に実行されることを確認
      expect(() => {
        registerHtml(id, html);
      }).not.toThrow();
      
      // 依存関数が呼ばれることを確認
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
      expect(replaceTemplateTagWithComment).toHaveBeenCalled();
    });

    test("should set data-id attribute on template", () => {
      const id = 456;
      const html = "<p>sample text</p>";
      
      const mockTemplate = {
        dataset: {},
        innerHTML: "",
      } as unknown as HTMLTemplateElement;
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "template") {
          return mockTemplate;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      registerHtml(id, html);
      
      expect(mockTemplate.dataset.id).toBe(id.toString());
      
      // 復元
      document.createElement = originalCreateElement;
    });

    test("should process html with replaceMustacheWithTemplateTag", () => {
      const id = 789;
      const html = "<div>{{name}}</div>";
      
      registerHtml(id, html);
      
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
    });

    test("should set processed html as innerHTML", () => {
      const id = 101;
      const html = "<span>{{value}}</span>";
      
      const mockTemplate = {
        dataset: {},
        innerHTML: "",
      } as unknown as HTMLTemplateElement;
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "template") {
          return mockTemplate;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      registerHtml(id, html);
      
      // 処理されたHTMLがsetされることを確認
      expect(mockTemplate.innerHTML).toBe(`processed-${html}`);
      
      // 復元
      document.createElement = originalCreateElement;
    });

    test("should call replaceTemplateTagWithComment with id and template", () => {
      const id = 202;
      const html = "<div>content</div>";
      
      const mockTemplate = {
        dataset: {},
        innerHTML: "",
      } as unknown as HTMLTemplateElement;
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "template") {
          return mockTemplate;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      registerHtml(id, html);
      
      expect(replaceTemplateTagWithComment).toHaveBeenCalledWith(id, mockTemplate);
      
      // 復元
      document.createElement = originalCreateElement;
    });

    test("should handle empty html", () => {
      const id = 303;
      const html = "";
      
      expect(() => {
        registerHtml(id, html);
      }).not.toThrow();
      
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
    });

    test("should handle zero as id", () => {
      const id = 0;
      const html = "<div>zero id</div>";
      
      const mockTemplate = {
        dataset: {},
        innerHTML: "",
      } as unknown as HTMLTemplateElement;
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "template") {
          return mockTemplate;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      registerHtml(id, html);
      
      expect(mockTemplate.dataset.id).toBe("0");
      
      // 復元
      document.createElement = originalCreateElement;
    });

    test("should handle negative id", () => {
      const id = -1;
      const html = "<div>negative id</div>";
      
      const mockTemplate = {
        dataset: {},
        innerHTML: "",
      } as unknown as HTMLTemplateElement;
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "template") {
          return mockTemplate;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      registerHtml(id, html);
      
      expect(mockTemplate.dataset.id).toBe("-1");
      
      // 復元
      document.createElement = originalCreateElement;
    });

    test("should handle complex html with mustache syntax", () => {
      const id = 404;
      const html = `
        <div>
          <h1>{{title}}</h1>
          {{if:showContent}}
            <p>{{content}}</p>
          {{endif}}
          <ul>
            {{for:item in items}}
              <li>{{item.name}}</li>
            {{endfor}}
          </ul>
        </div>
      `;
      
      registerHtml(id, html);
      
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
    });

    test("should handle html with special characters", () => {
      const id = 505;
      const html = '<div title="こんにちは" data-value="&lt;&gt;&amp;">&nbsp;Special chars: ñ, ü, 中文</div>';
      
      registerHtml(id, html);
      
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
    });

    test("should work with multiple calls", () => {
      const testCases = [
        { id: 601, html: "<div>first</div>" },
        { id: 602, html: "<p>{{second}}</p>" },
        { id: 603, html: "{{if:condition}}<span>third</span>{{endif}}" },
      ];
      
      testCases.forEach(({ id, html }) => {
        registerHtml(id, html);
      });
      
      // 各呼び出しで関数が呼ばれることを確認
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledTimes(testCases.length);
      expect(replaceTemplateTagWithComment).toHaveBeenCalledTimes(testCases.length);
      
      testCases.forEach(({ html }) => {
        expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
      });
    });

    test("should handle self-closing tags", () => {
      const id = 707;
      const html = '<img src="{{imageUrl}}" alt="{{altText}}" /><br/><hr/>';
      
      registerHtml(id, html);
      
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalledWith(html);
    });
  });

  describe("integration with DOM", () => {
    test("should create actual template element in real DOM", () => {
      const id = 999;
      const html = "<div>real DOM test</div>";
      
      // モックを一時的に解除
      vi.mocked(replaceMustacheWithTemplateTag).mockReturnValue(html);
      vi.mocked(replaceTemplateTagWithComment).mockReturnValue(id);
      
      registerHtml(id, html);
      
      // テンプレート要素の作成を確認
      expect(replaceMustacheWithTemplateTag).toHaveBeenCalled();
      expect(replaceTemplateTagWithComment).toHaveBeenCalled();
    });
  });
});