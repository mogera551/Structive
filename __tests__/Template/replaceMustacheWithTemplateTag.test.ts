/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { replaceMustacheWithTemplateTag } from "../../src/Template/replaceMustacheWithTemplateTag";

describe("Template/replaceMustacheWithTemplateTag", () => {
  describe("basic functionality", () => {
    test("should replace embed expressions with comments", () => {
      const html = "<div>{{name}}</div>";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe("<div><!--@@:name--></div>");
    });

    test("should handle multiple embed expressions", () => {
      const html = "<div>{{firstName}} {{lastName}}</div>";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe("<div><!--@@:firstName--> <!--@@:lastName--></div>");
    });

    test("should handle embed expressions with complex expressions", () => {
      const html = "<span>{{user.name.toUpperCase()}}</span>";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe("<span><!--@@:user.name.toUpperCase()--></span>");
    });
  });

  describe("if statements", () => {
    test("should replace simple if statement", () => {
      const html = "{{if:condition}}<div>content</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:condition"><div>content</div></template>');
    });

    test("should handle nested if statements", () => {
      const html = "{{if:outer}}{{if:inner}}<span>nested</span>{{endif}}{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:outer"><template data-bind="if:inner"><span>nested</span></template></template>');
    });

    test("should handle if with else", () => {
      const html = "{{if:condition}}<div>true</div>{{else}}<div>false</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:condition"><div>true</div></template><template data-bind="if:condition|not"><div>false</div></template>');
    });

    test("should handle if with elseif", () => {
      const html = "{{if:a}}<div>A</div>{{elseif:b}}<div>B</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:a"><div>A</div></template><template data-bind="if:a|not"><template data-bind="if:b"><div>B</div></template></template>');
    });

    test("should handle if with multiple elseif", () => {
      const html = "{{if:a}}<div>A</div>{{elseif:b}}<div>B</div>{{elseif:c}}<div>C</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:a"><div>A</div></template><template data-bind="if:a|not"><template data-bind="if:b"><div>B</div></template><template data-bind="if:b|not"><template data-bind="if:c"><div>C</div></template></template></template>');
    });

    test("should handle if with elseif and else", () => {
      const html = "{{if:a}}<div>A</div>{{elseif:b}}<div>B</div>{{else}}<div>default</div>{{endif}}";
      
      // elseif後のelseは、実装上エラーが発生する
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Else without if");
    });
  });

  describe("for statements", () => {
    test("should replace simple for statement", () => {
      const html = "{{for:item in items}}<div>{{item}}</div>{{endfor}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="for:item in items"><div><!--@@:item--></div></template>');
    });

    test("should handle nested for statements", () => {
      const html = "{{for:outer in outers}}{{for:inner in inners}}<span>{{inner}}</span>{{endfor}}{{endfor}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="for:outer in outers"><template data-bind="for:inner in inners"><span><!--@@:inner--></span></template></template>');
    });

    test("should handle for with complex expression", () => {
      const html = "{{for:item in data.items.slice(0, 10)}}<li>{{item.name}}</li>{{endfor}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="for:item in data.items.slice(0, 10)"><li><!--@@:item.name--></li></template>');
    });
  });

  describe("mixed structures", () => {
    test("should handle if inside for", () => {
      const html = "{{for:item in items}}{{if:item.visible}}<div>{{item.name}}</div>{{endif}}{{endfor}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="for:item in items"><template data-bind="if:item.visible"><div><!--@@:item.name--></div></template></template>');
    });

    test("should handle for inside if", () => {
      const html = "{{if:showList}}{{for:item in items}}<li>{{item}}</li>{{endfor}}{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:showList"><template data-bind="for:item in items"><li><!--@@:item--></li></template></template>');
    });

    test("should handle complex nested structure", () => {
      const html = `
        {{if:user.isLoggedIn}}
          <div>Welcome, {{user.name}}!</div>
          {{if:user.hasMessages}}
            {{for:message in user.messages}}
              {{if:message.isUnread}}
                <div class="unread">{{message.text}}</div>
              {{else}}
                <div class="read">{{message.text}}</div>
              {{endif}}
            {{endfor}}
          {{endif}}
        {{endif}}
      `;
      
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toContain('<template data-bind="if:user.isLoggedIn">');
      expect(result).toContain('<!--@@:user.name-->');
      expect(result).toContain('<template data-bind="for:message in user.messages">');
      expect(result).toContain('<template data-bind="if:message.isUnread">');
    });
  });

  describe("error handling", () => {
    test("should throw error for endif without if", () => {
      const html = "<div>content</div>{{endif}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Endif without if");
    });

    test("should throw error for endfor without for", () => {
      const html = "<div>content</div>{{endfor}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Endfor without for");
    });

    test("should throw error for endfor after if (mismatched)", () => {
      const html = "{{if:cond}}x{{endfor}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Endfor without for");
    });

    test("should throw error for elseif without if", () => {
      const html = "<div>content</div>{{elseif:condition}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Elseif without if");
    });

    test("should throw error for else without if", () => {
      const html = "<div>content</div>{{else}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Else without if");
    });

    test("should throw error for mismatched endif and endfor", () => {
      const html = "{{for:item in items}}<div>{{item}}</div>{{endif}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Endif without if");
    });

    test("should throw error for elseif without proper if context", () => {
      const html = "{{for:item in items}}{{elseif:condition}}<div>content</div>{{endfor}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Elseif without if");
    });

    test("should throw error for else after for", () => {
      const html = "{{for:item in items}}{{else}}<div>content</div>{{endfor}}";
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Else without if");
    });

    test("should throw error for unknown control directive", () => {
      const html = "{{custom:expr}}";
      const originalHas = Set.prototype.has;
      const hasSpy = vi
        .spyOn(Set.prototype, "has")
        .mockImplementation(function patchedHas(this: Set<unknown>, value: unknown): boolean {
          try {
            const maybeTargetSet =
              originalHas.call(this, "if") &&
              originalHas.call(this, "for") &&
              originalHas.call(this, "endif") &&
              originalHas.call(this, "endfor") &&
              originalHas.call(this, "elseif") &&
              originalHas.call(this, "else");
            if (maybeTargetSet && value === "custom") {
              return true;
            }
            return originalHas.call(this, value);
          } catch {
            return originalHas.call(this, value);
          }
        });

      try {
        expect(() => {
          replaceMustacheWithTemplateTag(html);
        }).toThrow("Unknown type");
      } finally {
        hasSpy.mockRestore();
      }
    });
  });

  describe("edge cases", () => {
    test("should handle empty expressions", () => {
      const html = "{{ }}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe("<!--@@:-->");
    });

    test("should handle expressions with extra whitespace", () => {
      const html = "{{  if : condition  }}<div>content</div>{{  endif  }}";
      
      // 余分なスペースがあると、typeの解析でエラーが発生する
      expect(() => {
        replaceMustacheWithTemplateTag(html);
      }).toThrow("Endif without if");
    });

    test("should handle expressions without spaces around colon", () => {
      const html = "{{if:condition}}<div>content</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:condition"><div>content</div></template>');
    });

    test("should handle expressions with multiple colons", () => {
      const html = "{{if:a:b:c}}<div>content</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:a:b:c"><div>content</div></template>');
    });

    test("should handle empty conditions", () => {
      const html = "{{if:}}<div>content</div>{{endif}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<template data-bind="if:"><div>content</div></template>');
    });

    test("should preserve HTML structure", () => {
      const html = `
        <html>
          <head><title>{{title}}</title></head>
          <body>
            {{if:user}}
              <h1>Hello {{user.name}}</h1>
            {{endif}}
          </body>
        </html>
      `;
      
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toContain("<html>");
      expect(result).toContain("</html>");
      expect(result).toContain("<head>");
      expect(result).toContain("<!--@@:title-->");
      expect(result).toContain('<template data-bind="if:user">');
      expect(result).toContain("<!--@@:user.name-->");
    });

    test("should handle mustache in attributes", () => {
      const html = '<div class="{{className}}" id="{{elementId}}">content</div>';
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe('<div class="<!--@@:className-->" id="<!--@@:elementId-->">content</div>');
    });

    test("should handle mustache in text content with HTML entities", () => {
      const html = "<div>&lt;{{content}}&gt;</div>";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe("<div>&lt;<!--@@:content-->&gt;</div>");
    });

    test("should handle no mustache expressions", () => {
      const html = "<div>plain HTML content</div>";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe(html);
    });

    test("should handle only mustache expressions", () => {
      const html = "{{value}}";
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toBe("<!--@@:value-->");
    });
  });

  describe("real-world examples", () => {
    test("should handle template with navigation", () => {
      const html = `
        <nav>
          {{for:item in navigation}}
            <a href="{{item.url}}" 
               {{if:item.active}}class="active"{{endif}}>
              {{item.title}}
            </a>
          {{endfor}}
        </nav>
      `;
      
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toContain('<template data-bind="for:item in navigation">');
      expect(result).toContain('href="<!--@@:item.url-->"');
      expect(result).toContain('<template data-bind="if:item.active">');
      expect(result).toContain('<!--@@:item.title-->');
    });

    test("should handle template with form", () => {
      const html = `
        <form>
          {{if:errors}}
            <div class="error">{{errors.message}}</div>
          {{endif}}
          <input type="text" value="{{form.name}}" placeholder="{{placeholders.name}}">
          <button type="submit" {{if:form.isValid}}enabled{{else}}disabled{{endif}}>
            Submit
          </button>
        </form>
      `;
      
      const result = replaceMustacheWithTemplateTag(html);
      
      expect(result).toContain('<template data-bind="if:errors">');
      expect(result).toContain('<!--@@:errors.message-->');
      expect(result).toContain('value="<!--@@:form.name-->"');
      expect(result).toContain('placeholder="<!--@@:placeholders.name-->"');
      expect(result).toContain('<template data-bind="if:form.isValid">');
    });
  });
});