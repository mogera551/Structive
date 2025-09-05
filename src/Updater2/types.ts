import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex2 } from "../ListIndex2/types";
import { ILoopContext } from "../LoopContext/types";
import { IReadonlyStateProxy, IStructiveState, IWritableStateProxy } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export type IUpdateInfo = {
  info: IStructuredPathInfo;
  listIndex: IListIndex2 | null;
  value: any;
}

export interface IUpdater2 {
  queue: Array<IUpdateInfo>;
  // Ref情報をキュー
  enqueueRef(info: IStructuredPathInfo, listIndex: IListIndex2 | null, value: any): void;
  // 状態更新開始
  beginUpdate(engine: IComponentEngine, state: object, loopContext: ILoopContext | null, callback: (state: IWritableStateProxy) => Promise<void> | void): Promise<void>;
  // レンダリング
  rendering(): void;
}

export type IListIndexResults = {
  adds?: Set<IListIndex2>,
  updates?: Set<IListIndex2>,
  removes?: Set<IListIndex2>,
  newListIndexesSet?: Set<IListIndex2>
}
