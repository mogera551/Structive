import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
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
  beginUpdate(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (state: IWritableStateProxy) => Promise<void> | void): Promise<void>;
  // レンダリング
  rendering(): void;
}

export type IListDiffResults = {
  adds?: Set<IListIndex2>,
  updates?: Set<IListIndex2>,
  removes?: Set<IListIndex2>,
  newListIndexesSet?: Set<IListIndex2>
}

export interface IRenderer {
  updatedBindings: Set<IBinding>;
  trackedRefKeys : Set<string>;
  readonlyState  : IReadonlyStateProxy;
  render(items: IUpdateInfo[]): void;
  createListDiffResults(info: IStructuredPathInfo, listIndex: IListIndex2 | null): IListDiffResults;
}
