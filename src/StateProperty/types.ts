//import { IListIndexes, INamedLoopIndexes } from "../loopContext/types";

export interface IStructuredPathInfo {
  readonly id: number;
  /** 
   * ex. aaa.\*.bbb.\*.ccc => ["aaa", "\*", "bbb", "\*", "ccc"]
   */
  readonly pathSegments: string[];
  readonly lastSegment: string;
  /** 
   * ex. aaa.\*.bbb.\*.ccc => [
   *   "aaa",
   *   "aaa.\*",
   *   "aaa.\*.bbb",
   *   "aaa.\*.bbb.\*",
   *   "aaa.\*.bbb.\*.ccc"
   * ]
   */
  readonly cumulativePaths: string[];
  readonly cumulativeInfos: IStructuredPathInfo[];
  readonly cumulativeInfoSet: Set<IStructuredPathInfo>;
  /** 
   * ex. aaa.\*.bbb.\*.ccc => "aaa.\*.bbb.\*"
   */
  readonly parentPath:string | null;
  readonly parentInfo: IStructuredPathInfo | null;
  /**
   * ex. aaa.\*.bbb.\*.ccc => [
   *   "aaa.\*",
   *   "aaa.\*.bbb.\*"
   * ]
   */
  readonly wildcardPaths: string[];
  readonly wildcardInfos: IStructuredPathInfo[];
  readonly wildcardInfoSet: Set<IStructuredPathInfo>;
  readonly wildcardParentPaths: string[];
  readonly wildcardParentInfos: IStructuredPathInfo[];
  readonly wildcardParentInfoSet: Set<IStructuredPathInfo>;
  readonly lastWildcardPath: string | null;
  readonly lastWildcardInfo: IStructuredPathInfo | null;
  /**
   * ex. aaa.*.bbb.*.ccc
   */
  readonly pattern: string;
  readonly wildcardCount: number;
  readonly children: {[segment:string]: IStructuredPathInfo};
}

export type WildcardType = "none" | "context" | "partial" | "all";

export interface IResolvedPathInfo {
  readonly id: number;
  /**
   * ex. aaa.0.bbb.2.ccc => aaa.0.bbb.2.ccc
   */
  readonly name: string; // The original name
  /** 
   * ex. aaa.0.bbb.2.ccc => ["aaa", "0", "bbb", "2", "ccc"]
   */
  readonly elements: string[];
  /** 
   * ex. aaa.0.bbb.2.ccc => [
   *   "aaa",
   *   "aaa.0",
   *   "aaa.0.bbb",
   *   "aaa.0.bbb.2",
   *   "aaa.0.bbb.2.ccc"
   * ]
   */
  readonly paths: string[];
  readonly wildcardType: WildcardType;
  readonly wildcardIndexes: (number | null)[];
  readonly info: IStructuredPathInfo;
}

export type Index = number | undefined;
export type Indexes = (undefined|number)[];
