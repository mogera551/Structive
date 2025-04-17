import { COMMENT_EMBED_MARK } from "../constants";
import { raiseError } from "../utils";

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



