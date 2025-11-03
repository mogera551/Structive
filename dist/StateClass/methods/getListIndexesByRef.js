import { raiseError } from "../../utils";
import { getByRef } from "./getByRef";
export function getListIndexesByRef(target, ref, receiver, handler) {
    if (!handler.engine.pathManager.lists.has(ref.info.pattern)) {
        raiseError({
            code: 'LIST-201',
            message: `path is not a list: ${ref.info.pattern}`,
            context: { where: 'getListIndexesByRef', pattern: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    getByRef(target, ref, receiver, handler); // キャッシュ更新を兼ねる
    const cacheEntry = handler.engine.cache.get(ref);
    if (typeof cacheEntry === "undefined") {
        raiseError({
            code: 'LIST-202',
            message: `List cache entry not found: ${ref.info.pattern}`,
            context: { where: 'getListIndexesByRef', pattern: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    const listIndexes = cacheEntry.listIndexes;
    if (listIndexes == null) {
        raiseError({
            code: 'LIST-203',
            message: `List indexes not found in cache entry: ${ref.info.pattern}`,
            context: { where: 'getListIndexesByRef', pattern: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    return listIndexes;
}
