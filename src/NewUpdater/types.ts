import { Constructor } from "../types";

export interface IUpdater {
  version: number;
  //getWritableStateProxy(): IWritableStateProxy;
  //getReadonlyStateProxy(): IReadonlyStateProxy;
}

export interface IUpdaterStatic {
  versionByComponentId: Map<number, number>;
  create(componentId: number): IUpdater;
}

export type IUpdaterConstructor = IUpdaterStatic & Constructor<IUpdater>;