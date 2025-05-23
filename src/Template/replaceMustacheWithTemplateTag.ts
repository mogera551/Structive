/**
 * replaceMustacheWithTemplateTag.ts
 *
 * Mustache構文（{{if:条件}}, {{for:式}}, {{endif}}, {{endfor}}, {{elseif:条件}}, {{else}} など）を
 * <template>タグやコメントノードに変換するユーティリティ関数です。
 *
 * 主な役割:
 * - HTML文字列内のMustache構文を正規表現で検出し、<template data-bind="...">やコメントノードに変換
 * - if/for/endif/endfor/elseif/elseなどの制御構文をネスト対応で<template>タグに変換
 * - 通常の埋め込み式（{{expr}}）はコメントノード（<!--embed:expr-->）に変換
 *
 * 設計ポイント:
 * - stackでネスト構造を管理し、endif/endfor/elseif/elseの対応関係を厳密にチェック
 * - 不正なネストや対応しない構文にはraiseErrorで例外を発生
 * - elseif/elseはnot条件のtemplateを自動生成し、条件分岐を表現
 * - コメントノードへの変換で埋め込み式の安全なDOM挿入を実現
 */
import { COMMENT_EMBED_MARK } from "../constants.js";
import { raiseError } from "../utils.js";

const MUSTACHE_REGEXP = /\{\{([^\}]+)\}\}/g;
const MUSTACHE_TYPES:Set<string> = new Set(['if', 'for', 'endif', 'endfor', 'elseif', 'else']);

type MustacheType = 'if' | 'for' | 'endif' | 'endfor' | 'elseif' | 'else';
type MustacheInfo = {
  type: MustacheType;
  remain: string; // after first ':'
  expr: string;
}

export function replaceMustacheWithTemplateTag(html: string): string {
  const stack:MustacheInfo[] = [];
  return html.replaceAll(MUSTACHE_REGEXP, (match, expr) => {
    expr = expr.trim();
    const [ type ] = expr.split(':');
    if (!MUSTACHE_TYPES.has(type)) {
      // embed
      return `<!--${COMMENT_EMBED_MARK}${expr}-->`;
    }
    const remain = expr.slice(type.length + 1).trim();
    const currentInfo:MustacheInfo = { type, expr, remain };
    if (type === 'if' || type === 'for') {
      stack.push(currentInfo);
      return `<template data-bind="${expr}">`;
    } else if (type === 'endif') {
      const endTags = [];
      do {
        const info = stack.pop() ?? raiseError('replaceMustacheToTemplateOrEmbed: endif without if');
        if (info.type === 'if') {
          endTags.push('</template>');
          break;
        } else if (info.type === 'elseif') {
          endTags.push('</template>');
        } else {
          raiseError('replaceMustacheToTemplateOrEmbed: endif without if');
        }
      } while(true);
      return endTags.join('');
    } else if (type === 'endfor') {
      const info = stack.pop() ?? raiseError('replaceMustacheToTemplateOrEmbed: endif without if');
      if (info.type === 'for') {
        return '</template>';
      } else {
        raiseError('replaceMustacheToTemplateOrEmbed: endfor without for');
      }
    } else if (type === 'elseif') {
      const lastInfo = stack.at(-1) ?? raiseError('replaceMustacheToTemplateOrEmbed: elseif without if');
      if (lastInfo.type === 'if' || lastInfo.type === 'elseif') {
        stack.push(currentInfo);
        return `</template><template data-bind="if:${lastInfo.remain}|not"><template data-bind="if:${remain}">`;
      } else {
        raiseError('replaceMustacheToTemplateOrEmbed: elseif without if');
      }
    } else if (type === 'else') {
      const lastInfo = stack.at(-1) ?? raiseError('replaceMustacheToTemplateOrEmbed: else without if');
      if (lastInfo.type === 'if') {
        return `</template><template data-bind="if:${lastInfo.remain}|not">`;
      } else {
        raiseError('replaceMustacheToTemplateOrEmbed: else without if');
      }
    } else {
      raiseError('replaceMustacheToTemplateOrEmbed: unknown type');
    }
  });
}



