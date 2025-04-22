import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
export declare function getByRef(target: Object, info: IStructuredPathInfo, listIndex: IListIndex | null, receiver: IStateProxy, handler: IStateHandler): any;
