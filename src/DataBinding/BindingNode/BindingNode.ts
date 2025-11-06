import { Filters } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { IReadonlyStateProxy } from "../../StateClass/types";
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IRenderer } from "../../Updater/types";
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
  #bindContents: IBindContent[] = [];
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
  get bindContents(): IBindContent[] {
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
  assignValue(value: any): void {
    raiseError({
      code: 'BIND-301',
      message: 'Not implemented',
      context: { where: 'BindingNode.assignValue', name: this.name },
      docsUrl: '/docs/error-codes.md#bind',
    });
  }
  updateElements(listIndexes: IListIndex[], values: any[]) {
    raiseError({
      code: 'BIND-301',
      message: 'Not implemented',
      context: { where: 'BindingNode.updateElements', name: this.name },
      docsUrl: '/docs/error-codes.md#bind',
    });
  }
  notifyRedraw(refs: IStatePropertyRef[]): void {
    // サブクラスで親子関係を考慮してバインディングの更新を通知する実装が可能
  }
  applyChange(renderer: IRenderer): void {
    const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState, renderer.readonlyHandler);
    this.assignValue(filteredValue);
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

  get isBlock(): boolean {
    return false;
  }
}