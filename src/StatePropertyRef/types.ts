import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IStatePropertyRef {
  info: IStructuredPathInfo;
  listIndex: IListIndex | null;
}