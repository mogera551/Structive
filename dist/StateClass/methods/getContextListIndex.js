import { getLastStatePropertyRef } from "./getLastStatePropertyRef";
export function getContextListIndex(handler, structuredPath) {
    const lastRef = getLastStatePropertyRef(handler);
    if (lastRef === null) {
        return null;
    }
    const info = lastRef.info;
    const index = info.wildcardPaths.indexOf(structuredPath);
    if (index >= 0) {
        return lastRef.listIndex?.at(index) ?? null;
    }
    return null;
}
