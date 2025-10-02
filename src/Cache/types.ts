import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface ICacheEntry {
  readonly value: any;
  readonly version: number;
}
