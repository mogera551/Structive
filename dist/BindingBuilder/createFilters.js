import { raiseError } from "../utils";
function textToFilter(filters, text) {
    const filter = filters[text.name];
    if (!filter)
        raiseError(`outputBuiltinFiltersFn: filter not found: ${name}`);
    return filter(text.options);
}
const cache = new Map();
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
