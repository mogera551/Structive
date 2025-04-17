import { FilterFn, Filters, FilterWithOptions } from "../Filter/types";
import { raiseError } from "../utils";
import { IFilterText } from "./types";

function textToFilter(filters:FilterWithOptions, text: IFilterText): FilterFn {
  const filter = filters[text.name];
  if (!filter) raiseError(`outputBuiltinFiltersFn: filter not found: ${name}`);
  return filter(text.options);
}

const cache : Map<IFilterText[], Filters> = new Map();

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
