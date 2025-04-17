import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
export declare function collectAffectedGetters(updateRefs: {
    info: IStructuredPathInfo;
    listIndex: IListIndex | null;
}[], engine: IComponentEngine): {
    info: IStructuredPathInfo;
    listIndex: IListIndex | null;
}[];
