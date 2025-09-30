import { FilterFn, Filters, FilterWithOptions } from "../Filter/types";
import { raiseError } from "../utils.js";
import { IFilterText } from "./types";

/**
 * フィルターテキスト（nameとoptionsを持つ）から、実際のフィルター関数（FilterFn）を生成する。
 * 
 * - textToFilter: フィルターテキストから対応するフィルター関数を取得し、オプションを適用して返す。
 * - createFilters: フィルターテキスト配列からフィルター関数配列を生成し、同じ入力にはキャッシュを利用する。
 */
function textToFilter(filters:FilterWithOptions, text: IFilterText): FilterFn {
  const filter = filters[text.name];
  if (!filter) {
    raiseError({
      code: 'FLT-201',
      message: `Filter not found: ${text.name}`,
      context: { where: 'createFilters.textToFilter', name: text.name },
      docsUrl: './docs/error-codes.md#flt',
    });
  }
  return filter(text.options);
}

const cache : Map<IFilterText[], Filters> = new Map();

/**
 * フィルターテキスト配列（texts）からフィルター関数配列（Filters）を生成する。
 * すでに同じtextsがキャッシュされていればそれを返す。
 * 
 * @param filters フィルター名→関数の辞書
 * @param texts   フィルターテキスト配列
 * @returns       フィルター関数配列
 */
export function createFilters(filters:FilterWithOptions, texts: IFilterText[]): Filters {
  let result = cache.get(texts);
  if (typeof result === "undefined") {
    result = [];
    for(let i = 0; i < texts.length; i++) {
      result.push(textToFilter(filters, texts[i]));
    }
    cache.set(texts, result);
  }
  return result;
}
