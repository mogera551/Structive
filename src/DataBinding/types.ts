import { ILoopContext } from "../LoopContext/types";
import { IListIndex } from "../ListIndex/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { IBindingNode } from "./BindingNode/types";
import { IBindingState } from "./BindingState/types";

export interface IBindContent {
  loopContext  : ILoopContext | null;
  parentBinding: IBinding | null;
  readonly isMounted         : boolean; // childNodes.length > 0 && childNodes[0].parentNode !== fragment
  readonly id                : number;
  readonly firstChildNode    : Node | null;
  readonly lastChildNode     : Node | null;
  readonly currentLoopContext: ILoopContext | null;
  mount(parentNode:Node):void;
  mountBefore(parentNode:Node, beforeNode:Node | null):void;
  mountAfter(parentNode:Node, afterNode:Node | null):void
  unmount():void;
  fragment: DocumentFragment; // unmount時にchildNodesをfragmentに移動する
  childNodes: Node[];
  // 考察：
  // テンプレートのコンテントが得られれば、boundNodesを計算で求めることができる。
  // コンテントが変わらない場合、boundNodesも変えなくてよい。
  // boundNodes: Node[]; // 特に処理の必要がないので削除
  // ToDo: boundNodeと紐づくバインドプロパティ情報の持たせ方
  //       nodeのプロパティを更新し、stateのプロパティを更新するために必要
  //       と考えたが、イベントハンドラの中にバインドプロパティ情報を持たせることで対応
  bindings: IBinding[];
  // ToDo: statePropと紐づくバインドプロパティ情報の持たせ方
  //       コンポーネントに持たせるが、再構築時のコストを考える
  render(): void;
  init(): void;
  assignListIndex(listIndex: IListIndex): void;
  getLastNode(parentNode: Node): Node | null  
}

// バインドプロパティ情報
// ノードプロパティとステートプロパティの紐づけ
export interface IBinding {
  parentBindContent: IBindContent;
  engine           : IComponentEngine;
  node             : Node;
  bindingNode      : IBindingNode;
  bindingState     : IBindingState;
  bindContents     : Set<IBindContent>;
  render(): void;
  init(): void;
}

export type StateBindSummary = Map<string, WeakMap<ILoopContext, IBindContent>>;
