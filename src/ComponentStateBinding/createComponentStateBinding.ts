import { IBinding } from "../DataBinding/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { StructiveComponent } from "../WebComponents/types";
import { IComponentStateBinding } from "./types";

/**
 * ComponentStateBinding
 *
 * 目的:
 * - 親コンポーネントの状態パスと子コンポーネント側のサブパスを一対一で関連付け、
 *   双方向にパス変換・参照できるようにする（親->子/子->親）。
 *
 * 制約:
 * - 親パス/子パスは 1:1 のみ（重複登録は STATE-303）
 * - 最長一致でのパス変換を行い、下位セグメントはそのまま連結
 */
class ComponentStateBinding implements IComponentStateBinding {
  parentPaths: Set<string> = new Set<string>();
  childPaths: Set<string> = new Set<string>();
  childPathByParentPath: Map<string, string> = new Map();
  parentPathByChildPath: Map<string, string> = new Map();
  bindingByParentPath: Map<string, IBinding> = new Map();
  bindingByChildPath: Map<string, IBinding> = new Map();
  bindings: WeakSet<IBinding> = new WeakSet();

  addBinding(binding: IBinding): void {
    if (this.bindings.has(binding)) {
      return; // 既にバインディングが追加されている場合は何もしない
    }
    const parentPath = binding.bindingState.pattern;
    const childPath = binding.bindingNode.subName;
    if (this.childPathByParentPath.has(parentPath)) {
      raiseError({
        code: "STATE-303",
  message: `Parent path "${parentPath}" already has a child path`,
        context: { parentPath, existingChildPath: this.childPathByParentPath.get(parentPath) },
        docsUrl: "./docs/error-codes.md#state",
      });
    }
    if (this.parentPathByChildPath.has(childPath)) {
      raiseError({
        code: "STATE-303",
  message: `Child path "${childPath}" already has a parent path`,
        context: { childPath, existingParentPath: this.parentPathByChildPath.get(childPath) },
        docsUrl: "./docs/error-codes.md#state",
      });
    }
    this.childPathByParentPath.set(parentPath, childPath);
    this.parentPathByChildPath.set(childPath, parentPath);
    this.parentPaths.add(parentPath);
    this.childPaths.add(childPath);
    this.bindingByParentPath.set(parentPath, binding);
    this.bindingByChildPath.set(childPath, binding);
    this.bindings.add(binding);
  }
  
  getChildPath(parentPath: string): string | undefined {
    return this.childPathByParentPath.get(parentPath);
  }

  getParentPath(childPath: string): string | undefined {
    return this.parentPathByChildPath.get(childPath);
  }

  toParentPathFromChildPath(childPath: string): string {
    // 子から親へ: 最長一致する childPaths のエントリを探し、残差のセグメントを親に連結
    const childPathInfo = getStructuredPathInfo(childPath);
    const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
    if (matchPaths.size === 0) {
      raiseError({
        code: "STATE-302",
  message: `No parent path found for child path "${childPath}"`,
        context: { childPath },
        docsUrl: "./docs/error-codes.md#state",
      });
    }
    const matchPathArray = Array.from(matchPaths);
    const longestMatchPath = matchPathArray[matchPathArray.length - 1];
    const remainPath = childPath.slice(longestMatchPath.length); // include the dot
    const matchParentPath = this.parentPathByChildPath.get(longestMatchPath);
    if (typeof matchParentPath === "undefined") {
      raiseError({
        code: "STATE-302",
  message: `No parent path found for child path "${childPath}"`,
        context: { childPath, longestMatchPath },
        docsUrl: "./docs/error-codes.md#state",
      });
    }
    return matchParentPath + remainPath;
  }

  toChildPathFromParentPath(parentPath: string): string {
    // 親から子へ: 最長一致する parentPaths のエントリを探し、残差のセグメントを子に連結
    const parentPathInfo = getStructuredPathInfo(parentPath);
    const matchPaths = parentPathInfo.cumulativePathSet.intersection(this.parentPaths);
    if (matchPaths.size === 0) {
      raiseError({
        code: "STATE-302",
  message: `No child path found for parent path "${parentPath}"`,
        context: { parentPath },
        docsUrl: "./docs/error-codes.md#state",
      });
    }
    const matchPathArray = Array.from(matchPaths);
    const longestMatchPath = matchPathArray[matchPathArray.length - 1];
    const remainPath = parentPath.slice(longestMatchPath.length); // include the dot
    const matchChildPath = this.childPathByParentPath.get(longestMatchPath);
    if (typeof matchChildPath === "undefined") {
      raiseError({
        code: "STATE-302",
  message: `No child path found for parent path "${parentPath}"`,
        context: { parentPath, longestMatchPath },
        docsUrl: "./docs/error-codes.md#state",
      });
    }
    return matchChildPath + remainPath;
  }

  startsWithByChildPath(childPathInfo: IStructuredPathInfo): string | null {
    if (this.childPaths.size === 0) {
      return null;
    }
    const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
    if (matchPaths.size === 0) {
      return null;
    } else {
      const matches = Array.from(matchPaths);
      const longestMatchPath = matches[matches.length - 1];
      return longestMatchPath;
    }
  }

  bind(parentComponent: StructiveComponent, childComponent: StructiveComponent): void {
    // bindParentComponent
    const bindings = parentComponent.getBindingsFromChild(childComponent);
    for (const binding of bindings ?? []) {
      this.addBinding(binding);
    }
  }
}

export function createComponentStateBinding(): IComponentStateBinding {
  return new ComponentStateBinding();
}