import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface ICacheEntry {
  readonly value: any;
  readonly version: number;
  setValue(value: any, version: number): void;
}
