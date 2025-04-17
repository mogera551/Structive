import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IUpdater {
  addProcess(process: () => Promise<void> | void): void;
  addUpdatedStatePropertyRefValue(info: IStructuredPathInfo, listIndex: IListIndex | null, value:any): void;
  addUpdatedListIndex(listIndex: IListIndex): void;
  terminate(): PromiseWithResolvers<void>;
  main(waitForComponentInit: PromiseWithResolvers<void>): Promise<void>;
}
