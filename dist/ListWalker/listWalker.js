import { raiseError } from "../utils";
function listWalkerSub(engine, info, listIndex, callback) {
    const listIndexLen = listIndex?.length ?? 0;
    if (info.wildcardCount === listIndexLen) {
        callback(info, listIndex);
    }
    else {
        const parentInfo = info.wildcardParentInfos[listIndexLen] ?? raiseError("Invalid state property info");
        const listIndexes = engine.getListIndexesSet(parentInfo, listIndex);
        for (const subListIndex of listIndexes ?? []) {
            listWalkerSub(engine, info, subListIndex, callback);
        }
    }
}
export function listWalker(engine, info, listIndex, callback) {
    listWalkerSub(engine, info, listIndex, callback);
}
