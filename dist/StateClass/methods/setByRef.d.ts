import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateHandler, IStateProxy } from "../types";
export declare function setByRef(target: Object, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any, receiver: IStateProxy, handler: IStateHandler): any;
