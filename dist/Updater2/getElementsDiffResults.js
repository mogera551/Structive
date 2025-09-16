/**
 * リスト要素への直接操作によるリスト差分結果
 * ex.
 * swap
 * [this["list.1"], this["list.5"]] = [this["list.5"], this["list.1"]];
 *
 * updateItemsには[
 * {info: IStructuredPathInfo("list.*"), listIndex: IListIndex2(1)} // 置き換えられた要素の情報
 * {info: IStructuredPathInfo("list.*"), listIndex: IListIndex2(5)} // 置き換えられた要素の情報
 * ]
 *
 * replace
 * this["list.1"] = newValue;
 *
 * updateItemsには[
 * {info: IStructuredPathInfo("list.*"), listIndex: IListIndex2(1)} // 置き換えられた要素の情報
 * ]
 *
 */
import { raiseError } from "../utils";
/**
 * list[1]には旧list[5]の値が入る
 * list[5]には旧list[1]の値が入る
 *
 * newlist[0] -> oldlist[0] (oldIndex:0)
 * newlist[1] -> oldlist[5] (oldIndex:5) *
 * newlist[2] -> oldlist[2] (oldIndex:2)
 * newlist[3] -> oldlist[3] (oldIndex:3)
 * newlist[4] -> oldlist[4] (oldIndex:4)
 * newlist[5] -> oldlist[1] (oldIndex:1) *
 * newlist[6] -> oldlist[6] (oldIndex:6)
 */
export function elementDiffUpdate(elementValue, elementListIndex, oldValue, oldListIndexesSet) {
    const oldIndex = oldValue.indexOf(elementValue);
    const setElement = new Set([elementListIndex]);
    if (oldIndex === -1) {
        return { replaces: setElement };
    }
    const oldListIndex = Array.from(oldListIndexesSet)[oldIndex];
    if (!oldListIndex) {
        raiseError(`elementDiffUpdate: oldListIndex is not found`);
    }
    return { swapTargets: setElement, swapSources: new Set([oldListIndex]), updates: setElement };
}
