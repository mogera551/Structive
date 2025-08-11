import { IUpdater, IUpdaterConstructor } from "./types";

class _Updater implements IUpdater {
  version: number;
  constructor(version: number) {
    this.version = version;
  }

  static create(componentId: number): IUpdater {
    let version = this.versionByComponentId.get(componentId);
    if (typeof version === "undefined") {
      version = 0;
    }
    version++;
    this.versionByComponentId.set(componentId, version);
    return new _Updater(version);
  }
  static versionByComponentId: Map<number, number> = new Map();

}

export const Updater = _Updater as IUpdaterConstructor;