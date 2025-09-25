export interface IPathNode {
  parentPath: string;
  currentPath: string;
  name: string;
  childNodeByName: Map<string, IPathNode>;
  level: number;
  find(segments: string[], segIndex?: number): IPathNode | null;
  appendChild(childName: string): IPathNode;
}
