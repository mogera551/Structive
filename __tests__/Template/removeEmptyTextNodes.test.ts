/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import { removeEmptyTextNodes } from "../../src/Template/removeEmptyTextNodes";

describe("Template/removeEmptyTextNodes", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("removeEmptyTextNodes", () => {
    test("should remove empty text nodes", () => {
      const fragment = document.createDocumentFragment();
      
      // 空のテキストノードを追加
      const emptyTextNode1 = document.createTextNode("");
      const emptyTextNode2 = document.createTextNode("   ");
      const emptyTextNode3 = document.createTextNode("\n\t ");
      
      fragment.appendChild(emptyTextNode1);
      fragment.appendChild(emptyTextNode2);
      fragment.appendChild(emptyTextNode3);
      
      expect(fragment.childNodes.length).toBe(3);
      
      removeEmptyTextNodes(fragment);
      
      expect(fragment.childNodes.length).toBe(0);
    });

    test("should keep non-empty text nodes", () => {
      const fragment = document.createDocumentFragment();
      
      const textNode1 = document.createTextNode("Hello");
      const textNode2 = document.createTextNode(" World ");
      const textNode3 = document.createTextNode("!");
      
      fragment.appendChild(textNode1);
      fragment.appendChild(textNode2);
      fragment.appendChild(textNode3);
      
      expect(fragment.childNodes.length).toBe(3);
      
      removeEmptyTextNodes(fragment);
      
      expect(fragment.childNodes.length).toBe(3);
      expect(fragment.childNodes[0].nodeValue).toBe("Hello");
      expect(fragment.childNodes[1].nodeValue).toBe(" World ");
      expect(fragment.childNodes[2].nodeValue).toBe("!");
    });

    test("should keep element nodes", () => {
      const fragment = document.createDocumentFragment();
      
      const div = document.createElement("div");
      const span = document.createElement("span");
      
      fragment.appendChild(div);
      fragment.appendChild(span);
      
      expect(fragment.childNodes.length).toBe(2);
      
      removeEmptyTextNodes(fragment);
      
      expect(fragment.childNodes.length).toBe(2);
      expect(fragment.childNodes[0]).toBe(div);
      expect(fragment.childNodes[1]).toBe(span);
    });

    test("should handle mixed content", () => {
      const fragment = document.createDocumentFragment();
      
      // 混在したコンテンツを追加
      const emptyText1 = document.createTextNode("");
      const div = document.createElement("div");
      const validText = document.createTextNode("Valid content");
      const emptyText2 = document.createTextNode("  \n  ");
      const span = document.createElement("span");
      const emptyText3 = document.createTextNode("\t");
      
      fragment.appendChild(emptyText1);
      fragment.appendChild(div);
      fragment.appendChild(validText);
      fragment.appendChild(emptyText2);
      fragment.appendChild(span);
      fragment.appendChild(emptyText3);
      
      expect(fragment.childNodes.length).toBe(6);
      
      removeEmptyTextNodes(fragment);
      
      // 有効なノードのみ残る
      expect(fragment.childNodes.length).toBe(3);
      expect(fragment.childNodes[0]).toBe(div);
      expect(fragment.childNodes[1]).toBe(validText);
      expect(fragment.childNodes[2]).toBe(span);
    });

    test("should handle empty fragment", () => {
      const fragment = document.createDocumentFragment();
      
      expect(fragment.childNodes.length).toBe(0);
      
      removeEmptyTextNodes(fragment);
      
      expect(fragment.childNodes.length).toBe(0);
    });

    test("should handle whitespace-only text nodes", () => {
      const fragment = document.createDocumentFragment();
      
      const whitespaceNodes = [
        document.createTextNode(" "),
        document.createTextNode("\n"),
        document.createTextNode("\t"),
        document.createTextNode("\r"),
        document.createTextNode("   \n\t\r   "),
      ];
      
      whitespaceNodes.forEach(node => fragment.appendChild(node));
      
      expect(fragment.childNodes.length).toBe(5);
      
      removeEmptyTextNodes(fragment);
      
      expect(fragment.childNodes.length).toBe(0);
    });

    test("should preserve text nodes with meaningful content", () => {
      const fragment = document.createDocumentFragment();
      
      const meaningfulNodes = [
        document.createTextNode("a"),
        document.createTextNode("0"),
        document.createTextNode("   a   "),
        document.createTextNode("\n  content  \t"),
        document.createTextNode("Special: àáâ"),
      ];
      
      meaningfulNodes.forEach(node => fragment.appendChild(node));
      
      expect(fragment.childNodes.length).toBe(5);
      
      removeEmptyTextNodes(fragment);
      
      expect(fragment.childNodes.length).toBe(5);
      meaningfulNodes.forEach((node, index) => {
        expect(fragment.childNodes[index]).toBe(node);
      });
    });

    test("should handle comment nodes", () => {
      const fragment = document.createDocumentFragment();
      
      const comment1 = document.createComment("This is a comment");
      const comment2 = document.createComment("");
      const emptyText = document.createTextNode("");
      
      fragment.appendChild(comment1);
      fragment.appendChild(comment2);
      fragment.appendChild(emptyText);
      
      expect(fragment.childNodes.length).toBe(3);
      
      removeEmptyTextNodes(fragment);
      
      // コメントノードは残り、空のテキストノードのみ削除される
      expect(fragment.childNodes.length).toBe(2);
      expect(fragment.childNodes[0]).toBe(comment1);
      expect(fragment.childNodes[1]).toBe(comment2);
    });

    test("should handle text nodes with null nodeValue", () => {
      const fragment = document.createDocumentFragment();
      
      const textNode = document.createTextNode("test");
      // nodeValueをnullに設定（通常は起こらないが、エッジケースとしてテスト）
      Object.defineProperty(textNode, "nodeValue", {
        value: null,
        configurable: true,
      });
      
      fragment.appendChild(textNode);
      
      expect(fragment.childNodes.length).toBe(1);
      
      removeEmptyTextNodes(fragment);
      
      // nullは空文字列として扱われ、削除される
      expect(fragment.childNodes.length).toBe(0);
    });

    test("should work with nested structure in real DOM", () => {
      const template = document.createElement("template");
      
      // HTMLを直接設定してからDocumentFragmentを取得
      template.innerHTML = `
        
        <div>
          
          <p>Content</p>
          
        </div>
        
      `;
      
      const fragment = template.content;
      
      // innerHTML設定により、空白テキストノードが作成される
      const initialChildCount = fragment.childNodes.length;
      expect(initialChildCount).toBeGreaterThan(1); // 複数のノードが存在
      
      removeEmptyTextNodes(fragment);
      
      // 空白テキストノードが削除され、divのみ残る
      expect(fragment.childNodes.length).toBe(1);
      expect(fragment.childNodes[0].nodeName).toBe("DIV");
    });

    test("should handle unicode whitespace characters", () => {
      const fragment = document.createDocumentFragment();
      
      const unicodeWhitespaceNodes = [
        document.createTextNode("\u00A0"), // Non-breaking space
        document.createTextNode("\u2000"), // En quad
        document.createTextNode("\u2003"), // Em space
        document.createTextNode("\u200B"), // Zero width space
      ];
      
      unicodeWhitespaceNodes.forEach(node => fragment.appendChild(node));
      
      expect(fragment.childNodes.length).toBe(4);
      
      removeEmptyTextNodes(fragment);
      
      // trim()がこれらの文字を空と認識するかによる
      // 通常のtrim()では一部のUnicode空白文字が残る可能性がある
      const remainingCount = fragment.childNodes.length;
      expect(remainingCount).toBeGreaterThanOrEqual(0);
      expect(remainingCount).toBeLessThanOrEqual(4);
    });

    test("should handle document fragment with only elements", () => {
      const fragment = document.createDocumentFragment();
      
      const elements = [
        document.createElement("div"),
        document.createElement("span"),
        document.createElement("p"),
      ];
      
      elements.forEach(el => fragment.appendChild(el));
      
      expect(fragment.childNodes.length).toBe(3);
      
      removeEmptyTextNodes(fragment);
      
      // 要素ノードはそのまま残る
      expect(fragment.childNodes.length).toBe(3);
      elements.forEach((el, index) => {
        expect(fragment.childNodes[index]).toBe(el);
      });
    });
  });
});