import { raiseError } from "../utils.js";
/**
 * フィルターテキスト（nameとoptionsを持つ）から、実際のフィルター関数（FilterFn）を生成する。
 *
 * - textToFilter: フィルターテキストから対応するフィルター関数を取得し、オプションを適用して返す。
 * - createFilters: フィルターテキスト配列からフィルター関数配列を生成し、同じ入力にはキャッシュを利用する。
 */
function textToFilter(filters, text) {
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
const cache = new Map();
/**
 * フィルターテキスト配列（texts）からフィルター関数配列（Filters）を生成する。
 * すでに同じtextsがキャッシュされていればそれを返す。
 *
 * @param filters フィルター名→関数の辞書
 * @param texts   フィルターテキスト配列
 * @returns       フィルター関数配列
 */
export function createFilters(filters, texts) {
    let result = cache.get(texts);
    if (typeof result === "undefined") {
        result = [];
        for (let i = 0; i < texts.length; i++) {
            result.push(textToFilter(filters, texts[i]));
        }
        cache.set(texts, result);
    }
    return result;
}
