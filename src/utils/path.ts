// src/utils/path.ts

/**
 * Split a dot-notated path into segments.
 * For example: "list.*.value" → ["list", "*", "value"]
 */
export function splitPath(path: string): string[] {
  return path === "" ? [] : path.split(".");
}

/**
 * Recursively resolve a wildcard path using index stack.
 */
export function resolvePath(state: any, path: string, indexes: number[]): any {
  const tokens = splitPath(path);
  if (tokens.length === 0) return state;

  const tail = tokens.pop()!;
  const parentPath = tokens.join(".");
  const parent = resolvePath(state, parentPath, indexes);

  if (parent === undefined) return undefined;

  if (tail === "*") {
    const depth = tokens.filter(t => t === "*").length;
    return parent?.[indexes[depth]];
  }

  return parent?.[tail];
}

/**
 * Recursively get all values matching wildcard path.
 */
export function getAll(state: any, path: string, indexes: number[] = []): any[] {
  const tokens = splitPath(path);
  return collect(state, tokens, indexes, 0);
}

function collect(current: any, tokens: string[], indexes: number[], depth: number): any[] {
  if (tokens.length === 0) return [current];

  const [head, ...rest] = tokens;

  if (head === "*") {
    if (!Array.isArray(current)) return [];

    const idx = indexes[depth];
    if (idx !== undefined) {
      return collect(current[idx], rest, indexes, depth + 1);
    } else {
      let results: any[] = [];
      for (let i = 0; i < current.length; i++) {
        results = results.concat(collect(current[i], rest, indexes.concat(i), depth + 1));
      }
      return results;
    }
  } else {
    return collect(current?.[head], rest, indexes, depth);
  }
}
