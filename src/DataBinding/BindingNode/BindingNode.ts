import { Filters } from "../../Filter/types";
import { IListIndex2 } from "../../ListIndex2/types";
import { IReadonlyStateProxy } from "../../StateClass/types";
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IListIndexResults } from "../../Updater2/types";
import { raiseError } from "../../utils.js";
import { IBindContent, IBinding } from "../types";
import { IBindingNode } from "./types";

/**
 * BindingNodeクラスは、1つのバインディング対象ノード（ElementやTextなど）に対する
 * バインディング処理の基底クラスです。
 *
 * 主な役割:
 * - ノード・プロパティ名・フィルタ・デコレータ・バインディング情報の保持
 * - バインディング値の更新（update）、値の割り当て（assignValue）のインターフェース提供
 * - 複数バインド内容（bindContents）の管理
 * - サブクラスでassignValueやupdateElementsを実装し、各種ノード・プロパティごとのバインディング処理を拡張
 *
 * 設計ポイント:
 * - assignValue, updateElementsは未実装（サブクラスでオーバーライド必須）
 * - isSelectElement, value, filteredValue, isForなどはサブクラスで用途に応じて拡張
 * - フィルタやデコレータ、バインド内容の管理も柔軟に対応
 */
export class BindingNode implements IBindingNode {
  #binding: IBinding;
  #node: Node;
  #name: string;
  #filters: Filters;
  #decorates: string[];
  #bindContents: Set<IBindContent> = new Set<IBindContent>();
  get node(): Node {
    return this.#node;
  }
  get name(): string {
    return this.#name;
  }
  get subName(): string {
    return this.#name;
  }
  get binding(): IBinding {
    return this.#binding;
  }
  get decorates(): string[] {
    return this.#decorates;
  }
  get filters(): Filters {
    return this.#filters;
  }
  get bindContents(): Set<IBindContent> {
    return this.#bindContents;
  }
  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    this.#binding = binding;
    this.#node = node;
    this.#name = name;
    this.#filters = filters;
    this.#decorates = decorates;
  }
  init():void {
    // サブクラスで初期化処理を実装可能
  }
  update(): void {
    this.assignValue(this.binding.bindingState.filteredValue);
  }
  assignValue(value: any): void {
    raiseError(`BindingNode: assignValue not implemented`);
  }
  updateElements(listIndexes: IListIndex2[], values: any[]) {
    raiseError(`BindingNode: updateElements not implemented`);
  }
  notifyRedraw(refs: IStatePropertyRef[]): void {
    // サブクラスで親子関係を考慮してバインディングの更新を通知する実装が可能
  }
  applyChangeForList(state:IReadonlyStateProxy, listIndexResults: IListIndexResults, updatedBinds: Set<IBinding>): void {
    raiseError(`BindingNode: applyChangeForList not implemented`);
  }
  applyChange(state: IReadonlyStateProxy, updatedBinds: Set<IBinding>): void {
    if (!updatedBinds.has(this.binding)) return;
    const filteredValue = this.binding.bindingState.getFilteredValue(state);
    this.assignValue(filteredValue);
    updatedBinds.add(this.binding);
  }

  get isSelectElement(): boolean {
    return this.node instanceof HTMLSelectElement;
  }
  get value():any {
    return null;
  }
  get filteredValue():any {
    return null;
  }
  get isFor(): boolean {
    return false;
  }
}